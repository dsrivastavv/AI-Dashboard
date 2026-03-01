from __future__ import annotations

from urllib.parse import urljoin

import requests
import logging

logger = logging.getLogger(__name__)


# ── URL helpers ───────────────────────────────────────────────────────────────

def _build_url(host: str, path: str) -> str:
    base = host.rstrip("/") + "/"
    return urljoin(base, path)


def build_ingest_url(host: str, server_slug: str) -> str:
    return _build_url(host, f"api/ingest/servers/{server_slug}/metrics/")


def build_enroll_url(host: str) -> str:
    return _build_url(host, "api/agent/enroll/")


# ── Enrollment ────────────────────────────────────────────────────────────────

class EnrollmentError(Exception):
    """Raised when the server rejects an enrollment attempt."""

    def __init__(self, message: str, status_code: int = 0) -> None:
        super().__init__(message)
        self.status_code = status_code


def enroll(
    *,
    host: str,
    username: str,
    password: str,
    machine_id: str,
    hostname: str,
    agent_user: str = "",
    platform_info: str = "",
    agent_version: str = "",
    timeout: float = 10.0,
    verify: bool = True,
    session: requests.Session | None = None,
) -> dict:
    """Authenticate with the dashboard and obtain an ingest token for this machine.

    Returns the full enrollment response dict which includes ``server_slug``,
    ``ingest_token``, and ``server`` metadata.

    Raises :class:`EnrollmentError` on authentication/authorisation failures.
    Raises :class:`RuntimeError` on network or unexpected server errors.
    """
    client = session or requests.Session()
    url = build_enroll_url(host)
    payload = {
        "username": username,
        "password": password,
        "machine_id": machine_id,
        "hostname": hostname,
        "agent_user": agent_user,
        "platform": platform_info,
        "agent_version": agent_version,
    }
    try:
        response = client.post(
            url,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
            verify=verify,
        )
    except requests.RequestException as exc:
        logger.error("Enrollment request to %s failed: %s", url, exc)
        raise RuntimeError(f"Enrollment request failed: {exc}") from exc

    try:
        data = response.json()
    except ValueError:
        response.raise_for_status()
        raise RuntimeError("Server returned a non-JSON response during enrollment")

    if response.status_code in (401, 403):
        message = data.get("error") or f"HTTP {response.status_code}"
        raise EnrollmentError(message, status_code=response.status_code)

    if not response.ok or data.get("ok") is False:
        message = data.get("error") or f"HTTP {response.status_code}"
        logger.warning("Enrollment failed: %s", message)
        raise RuntimeError(f"Enrollment failed: {message}")

    logger.info("Enrollment successful: server_slug=%s", data.get("server_slug"))
    return data


# ── Metric ingest ─────────────────────────────────────────────────────────────

class IngestAuthError(Exception):
    """Raised when the ingest endpoint returns 401 (token expired/invalid)."""


def post_sample(
    *,
    host: str,
    server_slug: str,
    token: str,
    sample: dict,
    agent: dict,
    timeout: float = 5.0,
    verify: bool = True,
    session: requests.Session | None = None,
) -> dict:
    client = session or requests.Session()
    url = build_ingest_url(host, server_slug)
    try:
        response = client.post(
            url,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Monitoring-Token": token,
            },
            json={"sample": sample, "agent": agent},
            timeout=timeout,
            verify=verify,
        )
    except requests.RequestException as exc:
        logger.error("HTTP request to %s failed: %s", url, exc)
        raise RuntimeError(f"Request failed: {exc}") from exc

    if response.status_code == 401:
        raise IngestAuthError("Ingest token rejected (401) – re-enrollment required")

    try:
        data = response.json()
    except ValueError:
        response.raise_for_status()
        raise RuntimeError("Server returned a non-JSON response")
    if not response.ok or data.get("ok") is False:
        message = data.get("error") or f"HTTP {response.status_code}"
        logger.warning("Server responded with error: %s", message)
        raise RuntimeError(message)
    logger.debug("Posted sample successfully: status=%s", response.status_code)
    return data
