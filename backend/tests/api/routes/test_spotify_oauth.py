from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient
from pydantic import HttpUrl, SecretStr
from pytest import MonkeyPatch
from sqlmodel import Session, select

from app.core.config import settings
from app.models import User
from app.services.spotify import SpotifyProfile, SpotifyTokenData, spotify_oauth


def configure_spotify(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "SPOTIFY_CLIENT_ID", "spotify-client-id")
    monkeypatch.setattr(settings, "SPOTIFY_CLIENT_SECRET", SecretStr("spotify-secret"))
    monkeypatch.setattr(
        settings,
        "SPOTIFY_REDIRECT_URI",
        HttpUrl("http://testserver/api/v1/spotify/callback"),
    )


def mocked_exchange_code(_: str) -> SpotifyTokenData:
    return SpotifyTokenData(
        access_token="spotify-access-token",
        refresh_token="spotify-refresh-token",
        expires_in=3600,
    )


def mocked_fetch_current_user(_: str) -> SpotifyProfile:
    return SpotifyProfile(id="spotify-user-123")


def test_authorize_spotify_returns_url(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    monkeypatch: MonkeyPatch,
) -> None:
    configure_spotify(monkeypatch)

    response = client.get(
        f"{settings.API_V1_STR}/spotify/authorize",
        headers=normal_user_token_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    authorization_url = data["authorization_url"]
    assert authorization_url.startswith(
        "https://accounts.spotify.com/authorize?"
    )
    query = parse_qs(urlparse(authorization_url).query)
    assert query["client_id"] == ["spotify-client-id"]
    assert query["response_type"] == ["code"]
    assert query["scope"] == ["user-read-recently-played"]
    assert query["state"]


def test_spotify_callback_persists_connection(
    client: TestClient,
    db: Session,
    normal_user_token_headers: dict[str, str],
    monkeypatch: MonkeyPatch,
) -> None:
    configure_spotify(monkeypatch)
    authorization_response = client.get(
        f"{settings.API_V1_STR}/spotify/authorize",
        headers=normal_user_token_headers,
    )
    assert authorization_response.status_code == 200
    auth_url = authorization_response.json()["authorization_url"]
    state = parse_qs(urlparse(auth_url).query)["state"][0]
    monkeypatch.setattr(spotify_oauth, "exchange_code", mocked_exchange_code)
    monkeypatch.setattr(
        spotify_oauth, "fetch_current_user", mocked_fetch_current_user
    )

    response = client.get(
        f"{settings.API_V1_STR}/spotify/callback?code=authorization-code&state={state}",
        follow_redirects=False,
    )

    assert response.status_code == 307
    assert response.headers["location"].endswith("/settings?spotify=connected")
    user = db.exec(select(User).where(User.email == settings.EMAIL_TEST_USER)).one()
    assert user.spotify_id == "spotify-user-123"
    assert user.spotify_access_token == "spotify-access-token"
    assert user.spotify_refresh_token == "spotify-refresh-token"
    assert user.spotify_token_expires_at is not None
    user.spotify_id = None
    user.spotify_access_token = None
    user.spotify_refresh_token = None
    user.spotify_token_expires_at = None
    db.add(user)
    db.commit()


def test_spotify_callback_rejects_duplicate_account(
    client: TestClient,
    db: Session,
    normal_user_token_headers: dict[str, str],
    monkeypatch: MonkeyPatch,
) -> None:
    configure_spotify(monkeypatch)
    connected_user = User(
        email="spotify-owner@example.com",
        hashed_password="hashed-password",
        spotify_id="spotify-user-123",
    )
    db.add(connected_user)
    db.commit()
    authorization_response = client.get(
        f"{settings.API_V1_STR}/spotify/authorize",
        headers=normal_user_token_headers,
    )
    assert authorization_response.status_code == 200
    auth_url = authorization_response.json()["authorization_url"]
    state = parse_qs(urlparse(auth_url).query)["state"][0]
    monkeypatch.setattr(spotify_oauth, "exchange_code", mocked_exchange_code)
    monkeypatch.setattr(
        spotify_oauth, "fetch_current_user", mocked_fetch_current_user
    )

    response = client.get(
        f"{settings.API_V1_STR}/spotify/callback?code=authorization-code&state={state}",
        follow_redirects=False,
    )

    assert response.status_code == 307
    assert response.headers["location"].endswith(
        "/settings?spotify=already_connected"
    )
