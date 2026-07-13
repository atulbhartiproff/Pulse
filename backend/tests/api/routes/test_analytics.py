from fastapi.testclient import TestClient

from app.core.config import settings


def test_get_dashboard_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/analytics/dashboard")

    assert response.status_code == 401


def test_get_history_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/analytics/history/2026-07-12")

    assert response.status_code == 401
