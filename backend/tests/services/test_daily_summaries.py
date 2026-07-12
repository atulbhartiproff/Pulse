from datetime import UTC, date, datetime
from uuid import uuid4

from sqlmodel import Session

from app.models import Track, TrackAnalysis, User
from app.services.daily_summaries import daily_summary_service


def test_upsert_for_date_aggregates_music_characteristics(db: Session) -> None:
    user = User(
        email=f"daily-summary-{uuid4()}@example.com", hashed_password="hashed-password"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    first_track = Track(
        spotify_track_id="daily-track-1",
        user_id=user.id,
        artist="Artist",
        album="Album",
        track_name="Energetic track",
        duration_ms=180000,
        played_at=datetime(2026, 7, 12, 9, tzinfo=UTC),
    )
    second_track = Track(
        spotify_track_id="daily-track-2",
        user_id=user.id,
        artist="Artist",
        album="Album",
        track_name="Unclassified track",
        duration_ms=120000,
        played_at=datetime(2026, 7, 12, 10, tzinfo=UTC),
    )
    db.add_all([first_track, second_track])
    db.commit()
    db.refresh(first_track)
    db.add(
        TrackAnalysis(
            track_id=first_track.id,
            mood="energetic",
            energy=0.8,
            valence=0.5,
            danceability=0.7,
            tempo=128,
            confidence=0.9,
        )
    )
    db.commit()

    summary = daily_summary_service.upsert_for_date(db, user, date(2026, 7, 12))
    db.commit()
    db.refresh(summary)

    assert summary.total_minutes == 5
    assert summary.energetic_minutes == 3
    assert summary.calm_minutes == 0
    assert summary.dominant_mood == "energetic"


def test_upsert_for_date_preserves_ai_summary(db: Session) -> None:
    user = User(
        email=f"daily-summary-ai-{uuid4()}@example.com", hashed_password="hashed-password"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    summary_date = date(2026, 7, 12)
    summary = daily_summary_service.upsert_for_date(db, user, summary_date)
    summary.ai_summary = "Listening was concentrated in the afternoon."
    db.add(summary)
    db.commit()

    refreshed_summary = daily_summary_service.upsert_for_date(db, user, summary_date)
    db.commit()
    db.refresh(refreshed_summary)

    assert refreshed_summary.ai_summary == "Listening was concentrated in the afternoon."
