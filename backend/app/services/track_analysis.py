from pydantic import BaseModel, Field
from sqlmodel import Session

from app.models import Track, TrackAnalysis


class AudioFeatureVector(BaseModel):
    """Normalized music features supplied by an approved analysis provider."""

    energy: float = Field(ge=0, le=1)
    valence: float = Field(ge=0, le=1)
    danceability: float = Field(ge=0, le=1)
    tempo: float = Field(gt=0)
    confidence: float = Field(ge=0, le=1)


class TrackAnalysisService:
    """Stores music-feature analysis without making claims about the listener."""

    def record(
        self, session: Session, track: Track, features: AudioFeatureVector
    ) -> TrackAnalysis:
        analysis = session.get(TrackAnalysis, track.id)
        values = {
            "mood": self.classify_music_mood(features),
            "energy": features.energy,
            "valence": features.valence,
            "danceability": features.danceability,
            "tempo": features.tempo,
            "confidence": features.confidence,
        }
        if analysis:
            analysis.sqlmodel_update(values)
        else:
            analysis = TrackAnalysis(track_id=track.id, **values)
        session.add(analysis)
        session.commit()
        session.refresh(analysis)
        return analysis

    @staticmethod
    def classify_music_mood(features: AudioFeatureVector) -> str:
        if features.energy >= 0.7 and features.danceability >= 0.55:
            return "energetic"
        if features.energy <= 0.35 and features.valence <= 0.45:
            return "calm"
        if features.valence >= 0.65:
            return "uplifting"
        if features.valence <= 0.35:
            return "low-key"
        return "balanced"


track_analysis_service = TrackAnalysisService()
