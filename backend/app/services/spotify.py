import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode
from uuid import UUID

import httpx
import jwt
from pydantic import BaseModel, ValidationError

from app.core.config import settings

SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_PROFILE_URL = "https://api.spotify.com/v1/me"
SPOTIFY_SCOPES = ("user-read-recently-played",)


class SpotifyOAuthError(Exception):
    """Raised when Spotify OAuth cannot be completed safely."""


class SpotifyTokenData(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int


class SpotifyRefreshedTokenData(BaseModel):
    access_token: str
    expires_in: int
    refresh_token: str | None = None


class SpotifyProfile(BaseModel):
    id: str


class SpotifyArtist(BaseModel):
    name: str


class SpotifyAlbum(BaseModel):
    name: str


class SpotifyTrack(BaseModel):
    id: str
    name: str
    duration_ms: int
    artists: list[SpotifyArtist]
    album: SpotifyAlbum


class SpotifyRecentlyPlayedItem(BaseModel):
    played_at: datetime
    track: SpotifyTrack


class SpotifyRecentlyPlayedResponse(BaseModel):
    items: list[SpotifyRecentlyPlayedItem]


class SpotifyOAuthService:
    def is_configured(self) -> bool:
        return bool(
            settings.SPOTIFY_CLIENT_ID
            and settings.SPOTIFY_CLIENT_SECRET
            and settings.SPOTIFY_REDIRECT_URI
        )

    def authorization_url(self, user_id: UUID) -> str:
        client_id, _, redirect_uri = self._configuration()
        parameters = {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": " ".join(SPOTIFY_SCOPES),
            "state": self.create_state(user_id),
        }
        return f"{SPOTIFY_AUTHORIZE_URL}?{urlencode(parameters)}"

    def create_state(self, user_id: UUID) -> str:
        expires_at = datetime.now(UTC) + timedelta(
            minutes=settings.SPOTIFY_OAUTH_STATE_EXPIRE_MINUTES
        )
        return jwt.encode(
            {
                "sub": str(user_id),
                "exp": expires_at,
                "nonce": secrets.token_urlsafe(32),
                "purpose": "spotify_oauth",
            },
            settings.SECRET_KEY,
            algorithm="HS256",
        )

    def user_id_from_state(self, state: str) -> UUID:
        try:
            payload = jwt.decode(state, settings.SECRET_KEY, algorithms=["HS256"])
            if payload.get("purpose") != "spotify_oauth":
                raise SpotifyOAuthError("Invalid OAuth state")
            return UUID(payload["sub"])
        except (jwt.PyJWTError, KeyError, ValueError) as error:
            raise SpotifyOAuthError("Invalid or expired OAuth state") from error

    def exchange_code(self, code: str) -> SpotifyTokenData:
        _, _, redirect_uri = self._configuration()
        response_data = self._post_token_request(
            {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            }
        )
        try:
            return SpotifyTokenData.model_validate(response_data)
        except ValidationError as error:
            raise SpotifyOAuthError("Spotify returned an invalid token response") from error

    def fetch_current_user(self, access_token: str) -> SpotifyProfile:
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    SPOTIFY_PROFILE_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                response.raise_for_status()
                response_data: Any = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise SpotifyOAuthError("Could not retrieve the Spotify profile") from error

        try:
            return SpotifyProfile.model_validate(response_data)
        except ValidationError as error:
            raise SpotifyOAuthError("Spotify returned an invalid profile response") from error

    def refresh_access_token(self, refresh_token: str) -> SpotifyRefreshedTokenData:
        response_data = self._post_token_request(
            {"grant_type": "refresh_token", "refresh_token": refresh_token}
        )
        try:
            return SpotifyRefreshedTokenData.model_validate(response_data)
        except ValidationError as error:
            raise SpotifyOAuthError("Spotify returned an invalid refresh response") from error

    def fetch_recently_played(
        self, access_token: str, after: datetime | None = None
    ) -> list[SpotifyRecentlyPlayedItem]:
        parameters = {"limit": "50"}
        if after:
            parameters["after"] = str(max(0, int(after.timestamp() * 1000) - 1))
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.get(
                    "https://api.spotify.com/v1/me/player/recently-played",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=parameters,
                )
                response.raise_for_status()
                response_data: Any = response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise SpotifyOAuthError("Could not retrieve recently played tracks") from error

        try:
            return SpotifyRecentlyPlayedResponse.model_validate(response_data).items
        except ValidationError as error:
            raise SpotifyOAuthError(
                "Spotify returned an invalid recently played response"
            ) from error

    def _post_token_request(self, data: dict[str, str]) -> Any:
        client_id, client_secret, _ = self._configuration()
        try:
            with httpx.Client(timeout=10.0) as client:
                response = client.post(
                    SPOTIFY_TOKEN_URL,
                    data=data,
                    auth=(client_id, client_secret),
                )
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise SpotifyOAuthError("Could not exchange the Spotify authorization code") from error

    def _configuration(self) -> tuple[str, str, str]:
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET
        redirect_uri = settings.SPOTIFY_REDIRECT_URI
        if not client_id or client_secret is None or redirect_uri is None:
            raise SpotifyOAuthError("Spotify OAuth is not configured")
        return client_id, client_secret.get_secret_value(), str(redirect_uri)


spotify_oauth = SpotifyOAuthService()
