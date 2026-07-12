from unittest.mock import Mock

from pytest import MonkeyPatch
from sqlmodel import Session

from app.models import User
from app.services.spotify import SpotifyOAuthError
from app.services.spotify_history import spotify_history_sync_service
from app.services.spotify_sync_job import spotify_sync_job


def test_sync_job_syncs_connected_users_and_isolates_failures(
    db: Session, monkeypatch: MonkeyPatch
) -> None:
    connected_user = User(
        email="sync-job-connected@example.com",
        hashed_password="hashed-password",
        spotify_refresh_token="refresh-token",
    )
    failing_user = User(
        email="sync-job-failing@example.com",
        hashed_password="hashed-password",
        spotify_refresh_token="refresh-token",
    )
    disconnected_user = User(
        email="sync-job-disconnected@example.com",
        hashed_password="hashed-password",
    )
    db.add_all([connected_user, failing_user, disconnected_user])
    db.commit()
    sync_user = Mock(side_effect=[3, SpotifyOAuthError("Spotify unavailable")])
    monkeypatch.setattr(spotify_history_sync_service, "sync_user", sync_user)

    result = spotify_sync_job.run(db)

    assert result == {
        "synchronized_users": 1,
        "imported_tracks": 3,
        "failed_users": 1,
    }
    assert sync_user.call_count == 2
