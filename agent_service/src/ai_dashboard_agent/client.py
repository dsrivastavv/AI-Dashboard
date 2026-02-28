from __future__ import annotations

from urllib.parse import urljoin

import requests
import logging

logger = logging.getLogger(__name__)


def build_ingest_url(host: str, server_slug: str) -> str:
    base = host.rstrip("/") + "/"
    path = f"api/ingest/servers/{server_slug}/metrics/"
    return urljoin(base, path)


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
