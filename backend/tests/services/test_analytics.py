from datetime import UTC, date, datetime
from uuid import uuid4

from pytest import MonkeyPatch
from sqlmodel import Session

from app.models import DailySummary, Track, User
from app.services.analytics import analytics_service
from app.services.analytics_cache import analytics_cache


def test_dashboard_returns_listening_aggregates_without_redis(
    db: Session, monkeypatch: MonkeyPatch
) -> None:
    user = User(
        email=f"analytics-{uuid4()}@example.com", hashed_password="hashed-password"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(
        DailySummary(
            user_id=user.id,
            date=date(2026, 7, 12),
            total_minutes=42,
            energetic_minutes=20,
            dominant_mood="energetic",
            ai_summary="Music listening was concentrated in the afternoon.",
        )
    )
    db.add(
        Track(
            spotify_track_id="analytics-track",
            user_id=user.id,
            artist="Top Artist",
            album="Album",
            track_name="Top Song",
            duration_ms=180000,
            played_at=datetime(2026, 7, 12, 10, tzinfo=UTC),
        )
    )
    db.commit()
    monkeypatch.setattr(analytics_cache, "version_for_user", lambda _: 1)
    monkeypatch.setattr(analytics_cache, "get", lambda _: None)
    monkeypatch.setattr(analytics_cache, "set", lambda *args: None)

    dashboard = analytics_service.dashboard(
        db, user, now=datetime(2026, 7, 12, 12, tzinfo=UTC)
    )

    assert dashboard.today
    assert dashboard.today.total_minutes == 42
    assert dashboard.top_artist
    assert dashboard.top_artist.name == "Top Artist"
    assert dashboard.top_song
    assert dashboard.top_song.name == "Top Song"
    assert dashboard.latest_ai_insight == "Music listening was concentrated in the afternoon."


def test_history_paginates_tracks(db: Session) -> None:
    user = User(
        email=f"analytics-history-{uuid4()}@example.com",
        hashed_password="hashed-password",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    for index in range(2):
        db.add(
            Track(
                spotify_track_id=f"history-track-{index}",
                user_id=user.id,
                artist="Artist",
                album="Album",
                track_name=f"Song {index}",
                duration_ms=180000,
                played_at=datetime(2026, 7, 12, 10 + index, tzinfo=UTC),
            )
        )
    db.commit()

    history = analytics_service.history(db, user, date(2026, 7, 12), skip=0, limit=1)

    assert history.count == 2
    assert len(history.tracks) == 1
    assert history.tracks[0].track_name == "Song 1"
