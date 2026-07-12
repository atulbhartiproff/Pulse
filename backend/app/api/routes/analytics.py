from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.models import AnalyticsDashboard, DailyHistoryPublic
from app.services.analytics import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=AnalyticsDashboard)
def get_dashboard(session: SessionDep, current_user: CurrentUser) -> AnalyticsDashboard:
    """Return cached listening-pattern aggregates for the signed-in user."""
    return analytics_service.dashboard(session, current_user)


@router.get("/history/{summary_date}", response_model=DailyHistoryPublic)
def get_daily_history(
    session: SessionDep,
    current_user: CurrentUser,
    summary_date: date,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> DailyHistoryPublic:
    """Return a paginated day of plays and its listening-pattern summary."""
    return analytics_service.history(session, current_user, summary_date, skip, limit)
