from datetime import UTC, datetime, timedelta
from unittest.mock import Mock

from pytest import MonkeyPatch, raises
from sqlmodel import Session

from app.models import User
from app.services.spotify import SpotifyOAuthError, SpotifyRefreshedTokenData, spotify_oauth
from app.services.spotify_tokens import spotify_token_refresh_service


def test_get_valid_access_token_skips_refresh_for_fresh_token(
    monkeypatch: MonkeyPatch,
) -> None:
    user = User(
        email="fresh-token@example.com",
        hashed_password="hashed-password",
        spotify_access_token="fresh-access-token",
        spotify_refresh_token="refresh-token",
        spotify_token_expires_at=datetime.now(UTC) + timedelta(hours=1),
    )
    session = Mock(spec=Session)
    refresh_access_token = Mock()
    monkeypatch.setattr(spotify_oauth, "refresh_access_token", refresh_access_token)

    access_token = spotify_token_refresh_service.get_valid_access_token(session, user)

    assert access_token == "fresh-access-token"
    refresh_access_token.assert_not_called()
    session.commit.assert_not_called()


def test_get_valid_access_token_refreshes_and_preserves_refresh_token(
    monkeypatch: MonkeyPatch,
) -> None:
    now = datetime(2026, 7, 12, tzinfo=UTC)
    user = User(
        email="expired-token@example.com",
        hashed_password="hashed-password",
        spotify_access_token="expired-access-token",
        spotify_refresh_token="existing-refresh-token",
        spotify_token_expires_at=now,
    )
    session = Mock(spec=Session)

    def mock_refresh_access_token(_: str) -> SpotifyRefreshedTokenData:
        return SpotifyRefreshedTokenData(
            access_token="refreshed-access-token", expires_in=3600
        )

    monkeypatch.setattr(
        spotify_oauth,
        "refresh_access_token",
        mock_refresh_access_token,
    )

    access_token = spotify_token_refresh_service.get_valid_access_token(
        session, user, now=now
    )

    assert access_token == "refreshed-access-token"
    assert user.spotify_refresh_token == "existing-refresh-token"
    assert user.spotify_token_expires_at == now + timedelta(hours=1)
    session.add.assert_called_once_with(user)
    session.commit.assert_called_once()


def test_get_valid_access_token_requires_refresh_token() -> None:
    user = User(email="unconnected@example.com", hashed_password="hashed-password")
    session = Mock(spec=Session)

    with raises(SpotifyOAuthError, match="no Spotify refresh token"):
        spotify_token_refresh_service.get_valid_access_token(session, user)
