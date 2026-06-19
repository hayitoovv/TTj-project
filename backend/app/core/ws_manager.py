from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    """Tracks active WebSocket connections per chat room and per user."""

    def __init__(self) -> None:
        self._rooms: dict[int, set[WebSocket]] = defaultdict(set)
        self._sockets_meta: dict[WebSocket, tuple[int, int]] = {}  # ws -> (room_id, user_id)
        self._user_sockets: dict[int, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket, room_id: int, user_id: int) -> None:
        await ws.accept()
        async with self._lock:
            self._rooms[room_id].add(ws)
            self._user_sockets[user_id].add(ws)
            self._sockets_meta[ws] = (room_id, user_id)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            meta = self._sockets_meta.pop(ws, None)
            if meta is None:
                return
            room_id, user_id = meta
            self._rooms[room_id].discard(ws)
            if not self._rooms[room_id]:
                self._rooms.pop(room_id, None)
            self._user_sockets[user_id].discard(ws)
            if not self._user_sockets[user_id]:
                self._user_sockets.pop(user_id, None)

    async def broadcast(self, room_id: int, payload: dict[str, Any], *, exclude: WebSocket | None = None) -> None:
        sockets = list(self._rooms.get(room_id, set()))
        for ws in sockets:
            if ws is exclude:
                continue
            try:
                await ws.send_json(payload)
            except Exception:
                await self.disconnect(ws)

    def is_user_online_in_room(self, room_id: int, user_id: int) -> bool:
        for ws in self._rooms.get(room_id, set()):
            meta = self._sockets_meta.get(ws)
            if meta and meta[1] == user_id:
                return True
        return False


manager = ConnectionManager()
