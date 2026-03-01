from __future__ import annotations

from datetime import timedelta
from typing import Iterable

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from monitoring.models import MonitoredServer, Notification


def _should_cooldown(server: MonitoredServer | None, code: str, window_minutes: int) -> bool:
    if not code:
        return False
    cutoff = timezone.now() - timedelta(minutes=window_minutes)
    qs = Notification.objects.filter(code=code, created_at__gte=cutoff)
    if server:
        qs = qs.filter(server=server)
    return qs.exists()


def create_notification(
    *,
    level: str,
    title: str,
    message: str = "",
    code: str = "",
    server: MonitoredServer | None = None,
    cooldown_minutes: int = 10,
    email: bool = True,
) -> Notification | None:
    if cooldown_minutes and _should_cooldown(server, code, cooldown_minutes):
        return None

    note = Notification.objects.create(
        server=server,
        level=level,
        code=code[:64],
        title=title[:128],
        message=message[:512],
    )

    if email:
        recipients: Iterable[str] = getattr(settings, "NOTIFICATION_EMAILS", []) or []
        if recipients:
            try:
                send_mail(
                    subject=title,
                    message=message or title,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                    recipient_list=list(recipients),
                    fail_silently=True,
                )
            except Exception:
                pass

    return note
