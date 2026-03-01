from __future__ import annotations

from functools import lru_cache

from allauth.core.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.shortcuts import redirect


def normalize_email(email: str | None) -> str:
    return (email or "").strip().lower()


@lru_cache(maxsize=1)
def _cached_allowlists() -> tuple[set[str], set[str]]:
    allowed_emails = set(getattr(settings, "GOOGLE_ALLOWED_EMAILS", set()) or set())
    allowed_domains = set(getattr(settings, "GOOGLE_ALLOWED_DOMAINS", set()) or set())
    return (
        {normalize_email(email) for email in allowed_emails if normalize_email(email)},
        {normalize_email(domain).lstrip("@") for domain in allowed_domains if normalize_email(domain)},
    )


def get_allowed_google_emails() -> set[str]:
    return set(_cached_allowlists()[0])


def get_allowed_google_domains() -> set[str]:
    return set(_cached_allowlists()[1])


def is_google_email_allowlisted(email: str | None) -> bool:
    normalized = normalize_email(email)
    if not normalized:
        return False

    allowed_emails, allowed_domains = _cached_allowlists()
    if not allowed_emails and not allowed_domains:
        # Secure default: if no allowlist is configured, block access.
        return False

    if normalized in allowed_emails:
        return True

    if "@" not in normalized:
        return False

    domain = normalized.rsplit("@", 1)[1]
    return domain in allowed_domains


def _extract_social_email(sociallogin) -> str:
    # allauth normalizes different providers into user/email_addresses.
    email = normalize_email(getattr(sociallogin.user, "email", None))
    if email:
        return email
    for email_address in getattr(sociallogin, "email_addresses", []) or []:
        email = normalize_email(getattr(email_address, "email", None))
        if email:
            return email
    return ""


def _is_email_verified(sociallogin, email: str) -> bool:
    normalized = normalize_email(email)
    if not normalized:
        return False
    for email_address in getattr(sociallogin, "email_addresses", []) or []:
        if normalize_email(getattr(email_address, "email", None)) == normalized:
            return bool(getattr(email_address, "verified", False))
    # Some providers may only populate user.email; Google usually returns verified email.
    return True


class GoogleAllowlistSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Allow only explicitly configured Google accounts/domains."""

    def _enforce_google_allowlist(self, request, sociallogin) -> None:
        account = getattr(sociallogin, "account", None)
        provider = getattr(account, "provider", "")
        if provider != "google":
            return

        email = _extract_social_email(sociallogin)
        if not email:
            raise ImmediateHttpResponse(redirect(settings.FRONTEND_ACCESS_DENIED_URL))

        if not _is_email_verified(sociallogin, email):
            raise ImmediateHttpResponse(redirect(settings.FRONTEND_ACCESS_DENIED_URL))

        if not is_google_email_allowlisted(email):
            raise ImmediateHttpResponse(redirect(settings.FRONTEND_ACCESS_DENIED_URL))

    def pre_social_login(self, request, sociallogin):
        self._enforce_google_allowlist(request, sociallogin)
        return super().pre_social_login(request, sociallogin)

    def is_open_for_signup(self, request, sociallogin):
        self._enforce_google_allowlist(request, sociallogin)
        return super().is_open_for_signup(request, sociallogin)
