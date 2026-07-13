import json
from functools import lru_cache
from typing import Any
from uuid import UUID

import redis

from app.core.config import settings


class AnalyticsCache:
    """Best-effort Redis cache for analytics reads."""

    @staticmethod
    @lru_cache
    def _client() -> redis.Redis:
        return redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=0.2,
            socket_timeout=0.2,
        )

    def version_for_user(self, user_id: UUID) -> int:
        try:
            value = self._client().get(self._version_key(user_id))
            return int(value) if value else 1
        except (redis.RedisError, ValueError):
            return 1

    def get(self, key: str) -> dict[str, Any] | None:
        try:
            value = self._client().get(key)
            return json.loads(value) if value else None
        except (redis.RedisError, json.JSONDecodeError):
            return None

    def set(self, key: str, value: dict[str, Any], ttl_seconds: int = 300) -> None:
        try:
            self._client().setex(key, ttl_seconds, json.dumps(value))
        except (redis.RedisError, TypeError):
            return

    def invalidate_user(self, user_id: UUID) -> None:
        try:
            self._client().incr(self._version_key(user_id))
        except redis.RedisError:
            return

    @staticmethod
    def _version_key(user_id: UUID) -> str:
        return f"pulse:analytics:version:{user_id}"


analytics_cache = AnalyticsCache()
