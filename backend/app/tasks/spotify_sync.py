from sqlmodel import Session

from app.core.celery_app import celery_app
from app.core.db import engine
from app.services.spotify_sync_job import spotify_sync_job


@celery_app.task(name="app.tasks.spotify_sync.sync_all_spotify_users")
def sync_all_spotify_users() -> dict[str, int]:
    """Run the periodic Spotify history synchronization job."""
    with Session(engine) as session:
        return spotify_sync_job.run(session)
