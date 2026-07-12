import logging

from sqlmodel import Session, select

from app.models import User
from app.services.spotify import SpotifyOAuthError
from app.services.spotify_history import spotify_history_sync_service

logger = logging.getLogger(__name__)


class SpotifySyncJob:
    """Synchronize every connected user's listening history without failing the batch."""

    def run(self, session: Session) -> dict[str, int]:
        users = session.exec(
            select(User).where(User.spotify_refresh_token.is_not(None))
        ).all()
        synchronized_users = 0
        imported_tracks = 0
        failed_users = 0

        for user in users:
            try:
                imported_tracks += spotify_history_sync_service.sync_user(session, user)
                synchronized_users += 1
            except SpotifyOAuthError:
                failed_users += 1
                logger.warning("Spotify sync failed for user_id=%s", user.id)

        return {
            "synchronized_users": synchronized_users,
            "imported_tracks": imported_tracks,
            "failed_users": failed_users,
        }


spotify_sync_job = SpotifySyncJob()
