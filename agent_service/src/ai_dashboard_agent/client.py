from __future__ import annotations

from urllib.parse import urljoin

import requests


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
    response = client.post(
        build_ingest_url(host, server_slug),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Monitoring-Token": token,
        },
        json={"sample": sample, "agent": agent},
        timeout=timeout,
        verify=verify,
    )
    try:
        data = response.json()
    except ValueError:
        response.raise_for_status()
        raise RuntimeError("Server returned a non-JSON response")
    if not response.ok or data.get("ok") is False:
        message = data.get("error") or f"HTTP {response.status_code}"
        raise RuntimeError(message)
    return data

