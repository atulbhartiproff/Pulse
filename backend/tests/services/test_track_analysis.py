from datetime import UTC, datetime
from uuid import uuid4

from sqlmodel import Session

from app.models import Track, User
from app.services.track_analysis import AudioFeatureVector, track_analysis_service


def create_track(db: Session) -> Track:
    user = User(
        email=f"analysis-{uuid4()}@example.com", hashed_password="hashed-password"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    track = Track(
        spotify_track_id="spotify-track-analysis",
        user_id=user.id,
        artist="Artist",
        album="Album",
        track_name="Track",
        duration_ms=180000,
        played_at=datetime(2026, 7, 12, tzinfo=UTC),
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


def test_record_creates_music_analysis(db: Session) -> None:
    track = create_track(db)

    analysis = track_analysis_service.record(
        db,
        track,
        AudioFeatureVector(
            energy=0.8,
            valence=0.55,
            danceability=0.7,
            tempo=128,
            confidence=0.9,
        ),
    )

    assert analysis.track_id == track.id
    assert analysis.mood == "energetic"
    assert analysis.tempo == 128


def test_record_updates_existing_analysis(db: Session) -> None:
    track = create_track(db)
    track_analysis_service.record(
        db,
        track,
        AudioFeatureVector(
            energy=0.2,
            valence=0.2,
            danceability=0.2,
            tempo=80,
            confidence=0.8,
        ),
    )

    analysis = track_analysis_service.record(
        db,
        track,
        AudioFeatureVector(
            energy=0.5,
            valence=0.8,
            danceability=0.4,
            tempo=100,
            confidence=0.95,
        ),
    )

    assert analysis.mood == "uplifting"
    assert analysis.confidence == 0.95
