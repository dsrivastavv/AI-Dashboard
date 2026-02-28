web: gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${GUNICORN_WORKERS:-3} --threads 2 --timeout 120 --access-logfile - --error-logfile -
