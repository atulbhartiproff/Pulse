from datetime import UTC, date, datetime, time, timedelta

from sqlmodel import Session, select

from app.models import DailySummary, Track, TrackAnalysis, User


class DailySummaryService:
    """Aggregates listening behavior without drawing conclusions about the listener."""

    def upsert_for_date(
        self, session: Session, user: User, summary_date: date
    ) -> DailySummary:
        day_start = datetime.combine(summary_date, time.min, tzinfo=UTC)
        day_end = day_start + timedelta(days=1)
        rows = session.exec(
            select(Track, TrackAnalysis)
            .join(TrackAnalysis, isouter=True)
            .where(
                Track.user_id == user.id,
                Track.played_at >= day_start,
                Track.played_at < day_end,
            )
        ).all()
        totals = self._totals(rows)
        summary = session.exec(
            select(DailySummary).where(
                DailySummary.user_id == user.id,
                DailySummary.date == summary_date,
            )
        ).first()
        values = {
            "total_minutes": totals["total_minutes"],
            "happy_minutes": totals["happy_minutes"],
            "sad_minutes": totals["sad_minutes"],
            "calm_minutes": totals["calm_minutes"],
            "energetic_minutes": totals["energetic_minutes"],
            "dominant_mood": totals["dominant_mood"],
        }
        if summary:
            summary.sqlmodel_update(values)
        else:
            summary = DailySummary(user_id=user.id, date=summary_date, **values)
        session.add(summary)
        return summary

    @staticmethod
    def _totals(rows: list[tuple[Track, TrackAnalysis | None]]) -> dict[str, float | str]:
        mood_minutes = {
            "happy_minutes": 0.0,
            "sad_minutes": 0.0,
            "calm_minutes": 0.0,
            "energetic_minutes": 0.0,
        }
        total_minutes = 0.0
        for track, analysis in rows:
            minutes = track.duration_ms / 60_000
            total_minutes += minutes
            if analysis:
                bucket = {
                    "uplifting": "happy_minutes",
                    "low-key": "sad_minutes",
                    "calm": "calm_minutes",
                    "balanced": "calm_minutes",
                    "energetic": "energetic_minutes",
                }.get(analysis.mood)
                if bucket:
                    mood_minutes[bucket] += minutes

        dominant_mood = "unclassified"
        if any(mood_minutes.values()):
            dominant_mood = max(mood_minutes, key=mood_minutes.__getitem__).removesuffix(
                "_minutes"
            )
        return {
            "total_minutes": round(total_minutes, 2),
            "happy_minutes": round(mood_minutes["happy_minutes"], 2),
            "sad_minutes": round(mood_minutes["sad_minutes"], 2),
            "calm_minutes": round(mood_minutes["calm_minutes"], 2),
            "energetic_minutes": round(mood_minutes["energetic_minutes"], 2),
            "dominant_mood": dominant_mood,
        }


daily_summary_service = DailySummaryService()
