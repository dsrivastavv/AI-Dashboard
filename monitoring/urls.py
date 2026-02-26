from django.urls import path

from . import views

app_name = "monitoring"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("access-denied/", views.access_denied, name="access_denied"),
    path("api/metrics/latest/", views.api_metrics_latest, name="api_metrics_latest"),
    path("api/metrics/history/", views.api_metrics_history, name="api_metrics_history"),
]
