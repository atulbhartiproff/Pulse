from datetime import UTC, datetime
from unittest.mock import Mock

from pytest import MonkeyPatch
from sqlmodel import Session, select

from app.models import Track, User
from app.services.spotify import (
    SpotifyAlbum,
    SpotifyArtist,
    SpotifyRecentlyPlayedItem,
    SpotifyTrack,
    spotify_oauth,
)
from app.services.spotify_history import spotify_history_sync_service
from app.services.spotify_tokens import spotify_token_refresh_service


def played_item(track_id: str, played_at: datetime) -> SpotifyRecentlyPlayedItem:
    return SpotifyRecentlyPlayedItem(
        played_at=played_at,
        track=SpotifyTrack(
            id=track_id,
            name="Track name",
            duration_ms=180000,
            artists=[SpotifyArtist(name="Artist One"), SpotifyArtist(name="Artist Two")],
            album=SpotifyAlbum(name="Album name"),
        ),
    )


def test_sync_user_persists_new_play_events(
    db: Session, monkeypatch: MonkeyPatch
) -> None:
    user = User(
        email="history-sync@example.com",
        hashed_password="hashed-password",
        spotify_access_token="access-token",
        spotify_refresh_token="refresh-token",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    sync_time = datetime(2026, 7, 12, 12, tzinfo=UTC)
    items = [
        played_item("spotify-track-1", datetime(2026, 7, 12, 10, tzinfo=UTC)),
        played_item("spotify-track-2", datetime(2026, 7, 12, 11, tzinfo=UTC)),
    ]
    monkeypatch.setattr(
        spotify_token_refresh_service,
        "get_valid_access_token",
        lambda session, syncing_user: "access-token",
    )
    monkeypatch.setattr(
        spotify_oauth,
        "fetch_recently_played",
        lambda access_token, after: items,
    )

    created_count = spotify_history_sync_service.sync_user(db, user, now=sync_time)

    tracks = db.exec(select(Track).where(Track.user_id == user.id)).all()
    assert created_count == 2
    assert len(tracks) == 2
    assert tracks[0].artist == "Artist One, Artist Two"
    assert user.last_sync == sync_time


def test_sync_user_skips_existing_play_event(
    db: Session, monkeypatch: MonkeyPatch
) -> None:
    played_at = datetime(2026, 7, 12, 10, tzinfo=UTC)
    user = User(
        email="history-deduplicate@example.com",
        hashed_password="hashed-password",
        spotify_access_token="access-token",
        spotify_refresh_token="refresh-token",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(
        Track(
            spotify_track_id="spotify-track-1",
            user_id=user.id,
            artist="Artist One",
            album="Album name",
            track_name="Track name",
            duration_ms=180000,
            played_at=played_at,
        )
    )
    db.commit()
    monkeypatch.setattr(
        spotify_token_refresh_service,
        "get_valid_access_token",
        Mock(return_value="access-token"),
    )
    monkeypatch.setattr(
        spotify_oauth,
        "fetch_recently_played",
        lambda access_token, after: [played_item("spotify-track-1", played_at)],
    )

    created_count = spotify_history_sync_service.sync_user(db, user)

    assert created_count == 0
    assert db.exec(select(Track).where(Track.user_id == user.id)).all()
