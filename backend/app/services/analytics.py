from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func
from sqlmodel import Session, select

from app.models import (
    AnalyticsDashboard,
    DailyHistoryPublic,
    DailySummary,
    DailySummaryPublic,
    ListeningRank,
    Track,
    TrackHistoryPublic,
    User,
)
from app.services.analytics_cache import analytics_cache


class AnalyticsService:
    """Read models for Pulse dashboard and listening-history screens."""

    def dashboard(
        self, session: Session, user: User, now: datetime | None = None
    ) -> AnalyticsDashboard:
        current_time = now or datetime.now(UTC)
        version = analytics_cache.version_for_user(user.id)
        cache_key = f"pulse:analytics:dashboard:{user.id}:{version}:{current_time.date()}"
        cached = analytics_cache.get(cache_key)
        if cached:
            return AnalyticsDashboard.model_validate(cached)

        today = current_time.date()
        weekly_start = today - timedelta(days=6)
        monthly_start = today - timedelta(days=29)
        dashboard = AnalyticsDashboard(
            today=self._summary_for_date(session, user, today),
            weekly_trend=self._summaries_since(session, user, weekly_start),
            monthly_trend=self._summaries_since(session, user, monthly_start),
            top_artist=self._top_artist(session, user, monthly_start),
            top_song=self._top_song(session, user, monthly_start),
            latest_ai_insight=self._latest_ai_insight(session, user),
        )
        analytics_cache.set(cache_key, dashboard.model_dump(mode="json"))
        return dashboard

    def history(
        self,
        session: Session,
        user: User,
        summary_date: date,
        skip: int,
        limit: int,
    ) -> DailyHistoryPublic:
        day_start = datetime.combine(summary_date, time.min, tzinfo=UTC)
        day_end = day_start + timedelta(days=1)
        base_statement = select(Track).where(
            Track.user_id == user.id,
            Track.played_at >= day_start,
            Track.played_at < day_end,
        )
        count = session.exec(
            select(func.count()).select_from(Track).where(
                Track.user_id == user.id,
                Track.played_at >= day_start,
                Track.played_at < day_end,
            )
        ).one()
        tracks = session.exec(
            base_statement.order_by(Track.played_at.desc()).offset(skip).limit(limit)
        ).all()
        return DailyHistoryPublic(
            summary=self._summary_for_date(session, user, summary_date),
            tracks=[TrackHistoryPublic.model_validate(track) for track in tracks],
            count=count,
        )

    @staticmethod
    def _summary_for_date(
        session: Session, user: User, summary_date: date
    ) -> DailySummaryPublic | None:
        summary = session.exec(
            select(DailySummary).where(
                DailySummary.user_id == user.id,
                DailySummary.date == summary_date,
            )
        ).first()
        return DailySummaryPublic.model_validate(summary) if summary else None

    @staticmethod
    def _summaries_since(
        session: Session, user: User, start_date: date
    ) -> list[DailySummaryPublic]:
        summaries = session.exec(
            select(DailySummary)
            .where(DailySummary.user_id == user.id, DailySummary.date >= start_date)
            .order_by(DailySummary.date)
        ).all()
        return [DailySummaryPublic.model_validate(summary) for summary in summaries]

    @staticmethod
    def _top_artist(
        session: Session, user: User, start_date: date
    ) -> ListeningRank | None:
        return AnalyticsService._top_rank(
            session, user, start_date, Track.artist
        )

    @staticmethod
    def _top_song(
        session: Session, user: User, start_date: date
    ) -> ListeningRank | None:
        return AnalyticsService._top_rank(
            session, user, start_date, Track.track_name
        )

    @staticmethod
    def _top_rank(
        session: Session, user: User, start_date: date, column
    ) -> ListeningRank | None:
        start_time = datetime.combine(start_date, time.min, tzinfo=UTC)
        row = session.exec(
            select(column, func.count(Track.id).label("play_count"))
            .where(Track.user_id == user.id, Track.played_at >= start_time)
            .group_by(column)
            .order_by(func.count(Track.id).desc(), column)
            .limit(1)
        ).first()
        return ListeningRank(name=row[0], play_count=row[1]) if row else None

    @staticmethod
    def _latest_ai_insight(session: Session, user: User) -> str | None:
        summary = session.exec(
            select(DailySummary)
            .where(DailySummary.user_id == user.id, DailySummary.ai_summary.is_not(None))
            .order_by(DailySummary.date.desc())
            .limit(1)
        ).first()
        return summary.ai_summary if summary else None


analytics_service = AnalyticsService()
