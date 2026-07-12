from datetime import UTC, datetime, timedelta

from sqlmodel import Session

from app.core.config import settings
from app.models import User
from app.services.spotify import SpotifyOAuthError, spotify_oauth


class SpotifyTokenRefreshService:
    """Keeps stored Spotify access tokens valid for server-side integrations."""

    def get_valid_access_token(
        self,
        session: Session,
        user: User,
        now: datetime | None = None,
    ) -> str:
        current_time = now or datetime.now(UTC)
        if not user.spotify_refresh_token:
            raise SpotifyOAuthError("User has no Spotify refresh token")

        refresh_after = current_time + timedelta(
            seconds=settings.SPOTIFY_TOKEN_REFRESH_LEEWAY_SECONDS
        )
        if (
            user.spotify_access_token
            and user.spotify_token_expires_at
            and user.spotify_token_expires_at > refresh_after
        ):
            return user.spotify_access_token

        refreshed_token = spotify_oauth.refresh_access_token(user.spotify_refresh_token)
        user.spotify_access_token = refreshed_token.access_token
        user.spotify_token_expires_at = current_time + timedelta(
            seconds=refreshed_token.expires_in
        )
        if refreshed_token.refresh_token:
            user.spotify_refresh_token = refreshed_token.refresh_token
        session.add(user)
        session.commit()
        session.refresh(user)
        return refreshed_token.access_token


spotify_token_refresh_service = SpotifyTokenRefreshService()
