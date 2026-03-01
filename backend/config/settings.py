"""Django settings for the AI workload system health dashboard."""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

# ── Environment / Modes ─────────────────────────────────────────────────────
ENV = os.environ.get("DJANGO_ENV", "debug").strip().lower()
IS_PRODUCTION = ENV == "production"

def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-r4vk3g$@-dr(y&v=&iv57!1eox_l6_6!&1q=7(sxku27*w&fp0")
if IS_PRODUCTION and SECRET_KEY.startswith("django-insecure"):
    raise ValueError("DJANGO_SECRET_KEY must be set when DJANGO_ENV=production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = _env_flag("DJANGO_DEBUG", default=not IS_PRODUCTION)

_allowed_hosts_raw = os.environ.get("DJANGO_ALLOWED_HOSTS")
if _allowed_hosts_raw:
    ALLOWED_HOSTS = [item.strip() for item in _allowed_hosts_raw.split(",") if item.strip()]
elif DEBUG:
    ALLOWED_HOSTS = ["127.0.0.1", "localhost", "testserver"]
else:
    ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'monitoring',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = os.environ.get('DJANGO_TIME_ZONE', 'UTC')

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Include the built React frontend if it exists (after `npm run build`)
_FRONTEND_DIST = REPO_ROOT / 'frontend' / 'dist'
if _FRONTEND_DIST.exists():
    STATICFILES_DIRS = [BASE_DIR / 'static', _FRONTEND_DIST]

STATIC_ROOT = Path(os.environ.get("DJANGO_STATIC_ROOT", BASE_DIR / "staticfiles"))
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}


def _csv_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(',') if item.strip()]


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
SITE_ID = int(os.environ.get('DJANGO_SITE_ID', '1'))

# ── Cache (used for rate limiting) ────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'ai-dashboard',
    }
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

FRONTEND_APP_URL = os.environ.get('FRONTEND_APP_URL', 'http://127.0.0.1:3000').rstrip('/')
FRONTEND_DASHBOARD_URL = os.environ.get('FRONTEND_DASHBOARD_URL', f'{FRONTEND_APP_URL}/dashboard').strip()
FRONTEND_ACCESS_DENIED_URL = os.environ.get(
    'FRONTEND_ACCESS_DENIED_URL',
    f'{FRONTEND_APP_URL}/dashboard?access_denied=1',
).strip()

LOGIN_URL = '/accounts/google/login/'
LOGIN_REDIRECT_URL = FRONTEND_DASHBOARD_URL
LOGOUT_REDIRECT_URL = FRONTEND_DASHBOARD_URL

# allauth account settings: Google OAuth is the intended path for dashboard access.
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = False
ACCOUNT_LOGOUT_ON_GET = True
ACCOUNT_ADAPTER = 'allauth.account.adapter.DefaultAccountAdapter'

SOCIALACCOUNT_LOGIN_ON_GET = True
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_ADAPTER = 'monitoring.auth.GoogleAllowlistSocialAccountAdapter'

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '').strip()
GOOGLE_ALLOWED_EMAILS = set(email.lower() for email in _csv_list(os.environ.get('GOOGLE_ALLOWED_EMAILS', '')))
GOOGLE_ALLOWED_DOMAINS = set(domain.lower() for domain in _csv_list(os.environ.get('GOOGLE_ALLOWED_DOMAINS', '')))

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['openid', 'email', 'profile'],
        'AUTH_PARAMS': {'access_type': 'online', 'prompt': 'select_account'},
        'APP': {
            'client_id': GOOGLE_CLIENT_ID,
            'secret': GOOGLE_CLIENT_SECRET,
            'key': '',
        },
    }
}


MONITORING_DISKS = _csv_list(os.environ.get('MONITORING_DISKS', ''))
MONITORING_DEFAULT_HISTORY_MINUTES = int(os.environ.get('MONITORING_DEFAULT_HISTORY_MINUTES', '60'))
MONITORING_MAX_HISTORY_MINUTES = int(os.environ.get('MONITORING_MAX_HISTORY_MINUTES', '1440'))
MONITORING_RETENTION_DAYS = int(os.environ.get('MONITORING_RETENTION_DAYS', '14'))

# ── Security hardening (production defaults) ───────────────────────────────
SESSION_COOKIE_SECURE = _env_flag("DJANGO_SESSION_COOKIE_SECURE", IS_PRODUCTION)
CSRF_COOKIE_SECURE = _env_flag("DJANGO_CSRF_COOKIE_SECURE", IS_PRODUCTION)
SECURE_SSL_REDIRECT = _env_flag("DJANGO_SECURE_SSL_REDIRECT", IS_PRODUCTION)
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000" if IS_PRODUCTION else "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_flag("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", IS_PRODUCTION)
SECURE_HSTS_PRELOAD = _env_flag("DJANGO_SECURE_HSTS_PRELOAD", IS_PRODUCTION)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') if _env_flag("DJANGO_SECURE_BEHIND_PROXY") else None

# Prevent MIME-type sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# Referrer policy
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Cross-origin isolation: keeps third-party pages from reusing this browsing context
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# Cookie SameSite (Lax: safe for OAuth redirects, blocks most CSRF)
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
# JS must be able to read the CSRF cookie for AJAX requests
CSRF_COOKIE_HTTPONLY = False

# Cap upload body size to 5 MB (protects the ingest endpoint)
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

CSRF_TRUSTED_ORIGINS = _csv_list(os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", ""))

# ── Logging ────────────────────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
    'loggers': {
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
