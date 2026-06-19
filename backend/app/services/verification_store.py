"""
SMS verification code storage.

In production: Redis (TTL=5 min, attempt counter).
Here we provide a Redis-backed implementation that falls back to an in-memory dict
for dev when Redis is unavailable. Same interface either way.
"""
from __future__ import annotations

import asyncio
import logging
import time

try:
    import redis.asyncio as redis_async
except Exception:  # pragma: no cover
    redis_async = None  # type: ignore

from app.core.config import settings

logger = logging.getLogger(__name__)

CODE_TTL_SECONDS = 5 * 60
MAX_ATTEMPTS = 5


class VerificationStore:
    def __init__(self) -> None:
        self._redis = None
        self._memory: dict[str, tuple[str, float, int]] = {}
        self._lock = asyncio.Lock()

    async def _get_redis(self):
        if redis_async is None:
            return None
        if self._redis is not None:
            return self._redis
        try:
            self._redis = redis_async.from_url(settings.REDIS_URL, decode_responses=True)
            await self._redis.ping()
            return self._redis
        except Exception as exc:
            logger.warning("Redis unavailable, using in-memory store: %s", exc)
            self._redis = None
            return None

    @staticmethod
    def _code_key(phone: str) -> str:
        return f"verify:code:{phone}"

    @staticmethod
    def _attempts_key(phone: str) -> str:
        return f"verify:attempts:{phone}"

    async def save_code(self, phone: str, code: str) -> None:
        r = await self._get_redis()
        if r:
            await r.setex(self._code_key(phone), CODE_TTL_SECONDS, code)
            await r.delete(self._attempts_key(phone))
            return
        async with self._lock:
            self._memory[phone] = (code, time.time() + CODE_TTL_SECONDS, 0)

    async def verify(self, phone: str, code: str) -> bool:
        r = await self._get_redis()
        if r:
            stored = await r.get(self._code_key(phone))
            if stored is None:
                return False
            attempts = await r.incr(self._attempts_key(phone))
            await r.expire(self._attempts_key(phone), CODE_TTL_SECONDS)
            if attempts > MAX_ATTEMPTS:
                await r.delete(self._code_key(phone))
                return False
            if stored == code:
                await r.delete(self._code_key(phone), self._attempts_key(phone))
                return True
            return False

        async with self._lock:
            entry = self._memory.get(phone)
            if not entry:
                return False
            stored, expires_at, attempts = entry
            if time.time() > expires_at or attempts >= MAX_ATTEMPTS:
                self._memory.pop(phone, None)
                return False
            if stored == code:
                self._memory.pop(phone, None)
                return True
            self._memory[phone] = (stored, expires_at, attempts + 1)
            return False


verification_store = VerificationStore()
