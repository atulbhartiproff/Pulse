from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models import User


def test_get_spotify_status_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/spotify/status")

    assert response.status_code == 401


def test_get_spotify_status_for_disconnected_user(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/spotify/status", headers=normal_user_token_headers
    )

    assert response.status_code == 200
    assert response.json() == {
        "connected": False,
        "spotify_id": None,
        "last_sync": None,
    }


def test_disconnect_spotify_clears_credentials(
    client: TestClient,
    db: Session,
    normal_user_token_headers: dict[str, str],
) -> None:
    user = db.exec(select(User).where(User.email == settings.EMAIL_TEST_USER)).one()
    user.spotify_id = "spotify-user-123"
    user.spotify_access_token = "access-token"
    user.spotify_refresh_token = "refresh-token"
    user.last_sync = datetime(2026, 7, 12, tzinfo=UTC)
    db.add(user)
    db.commit()

    response = client.delete(
        f"{settings.API_V1_STR}/spotify/connection", headers=normal_user_token_headers
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Spotify disconnected successfully"}
    db.refresh(user)
    assert user.spotify_id is None
    assert user.spotify_access_token is None
    assert user.spotify_refresh_token is None
    assert user.spotify_token_expires_at is None
    assert user.last_sync is None
