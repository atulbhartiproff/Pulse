from datetime import timedelta

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "pulse",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.spotify_sync"],
)
celery_app.conf.update(
    timezone="UTC",
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    beat_schedule={
        "sync-spotify-listening-history": {
            "task": "app.tasks.spotify_sync.sync_all_spotify_users",
            "schedule": timedelta(hours=settings.SPOTIFY_SYNC_INTERVAL_HOURS),
        }
    },
)
