from django.urls import path

from . import views

app_name = "monitoring"

urlpatterns = [
    path("", views.api_root, name="api_root"),
    path("api/servers/", views.api_servers, name="api_servers"),
    path("api/metrics/latest/", views.api_metrics_latest, name="api_metrics_latest"),
    path("api/metrics/history/", views.api_metrics_history, name="api_metrics_history"),
    path(
        "api/ingest/servers/<slug:server_slug>/metrics/",
        views.api_ingest_server_metrics,
        name="api_ingest_server_metrics",
    ),
]
