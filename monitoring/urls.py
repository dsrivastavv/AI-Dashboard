from django.urls import path

from . import views

app_name = "monitoring"

urlpatterns = [
    path("", views.api_root, name="api_root"),
    path("api/servers/", views.api_servers, name="api_servers"),
    path("api/servers/register/", views.api_register_server, name="api_register_server"),
    path("api/metrics/latest/", views.api_metrics_latest, name="api_metrics_latest"),
    path("api/metrics/history/", views.api_metrics_history, name="api_metrics_history"),
    path("api/notifications/", views.api_notifications, name="api_notifications"),
    path("api/notifications/mark-read/", views.api_notifications_mark_read, name="api_notifications_mark_read"),
    path(
        "api/ingest/servers/<slug:server_slug>/metrics/",
        views.api_ingest_server_metrics,
        name="api_ingest_server_metrics",
    ),
    # Credential-based auth
    path("api/auth/login/", views.api_auth_login, name="api_auth_login"),
    path("api/auth/register/", views.api_auth_register, name="api_auth_register"),
    path("api/auth/forgot-password/", views.api_auth_forgot_password, name="api_auth_forgot_password"),
]
