from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models import Message, SpotifyConnectionStatus, User
from app.services.spotify import SpotifyOAuthError, spotify_oauth

router = APIRouter(prefix="/spotify", tags=["spotify"])


def settings_redirect(result: str) -> RedirectResponse:
    query = urlencode({"spotify": result})
    return RedirectResponse(url=f"{settings.FRONTEND_HOST}/settings?{query}")


@router.get("/authorize")
def authorize_spotify(current_user: CurrentUser) -> RedirectResponse:
    """Redirect an authenticated Pulse user to Spotify's consent screen."""
    try:
        return RedirectResponse(url=spotify_oauth.authorization_url(current_user.id))
    except SpotifyOAuthError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Spotify connection is not configured",
        ) from error


@router.get("/callback")
def spotify_callback(
    session: SessionDep,
    state: str,
    code: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    """Validate the OAuth callback and store the resulting Spotify credentials."""
    try:
        user_id = spotify_oauth.user_id_from_state(state)
    except SpotifyOAuthError as oauth_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired Spotify authorization request",
        ) from oauth_error

    if error or not code:
        return settings_redirect("denied")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        token_data = spotify_oauth.exchange_code(code)
        profile = spotify_oauth.fetch_current_user(token_data.access_token)
    except SpotifyOAuthError:
        return settings_redirect("failed")

    existing_connection = session.exec(
        select(User).where(User.spotify_id == profile.id, User.id != user.id)
    ).first()
    if existing_connection:
        return settings_redirect("already_connected")

    user.spotify_id = profile.id
    user.spotify_access_token = token_data.access_token
    user.spotify_refresh_token = token_data.refresh_token
    user.spotify_token_expires_at = datetime.now(UTC) + timedelta(
        seconds=token_data.expires_in
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return settings_redirect("already_connected")

    return settings_redirect("connected")


@router.get("/status", response_model=SpotifyConnectionStatus)
def get_connection_status(current_user: CurrentUser) -> SpotifyConnectionStatus:
    """Return the current user's Spotify connection state without exposing tokens."""
    return SpotifyConnectionStatus(
        connected=bool(current_user.spotify_id and current_user.spotify_refresh_token),
        spotify_id=current_user.spotify_id,
        last_sync=current_user.last_sync,
    )


@router.delete("/connection", response_model=Message)
def disconnect_spotify(
    session: SessionDep, current_user: CurrentUser
) -> Message:
    """Remove the user's stored Spotify credentials and connection metadata."""
    current_user.spotify_id = None
    current_user.spotify_access_token = None
    current_user.spotify_refresh_token = None
    current_user.spotify_token_expires_at = None
    current_user.last_sync = None
    session.add(current_user)
    session.commit()
    return Message(message="Spotify disconnected successfully")
