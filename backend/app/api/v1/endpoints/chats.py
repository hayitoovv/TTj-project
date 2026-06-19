from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_session
from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.core.ws_manager import manager
from app.models import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageOut,
    ChatRoomCreate,
    ChatRoomOut,
)
from app.services import chat as chat_service

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("/rooms", response_model=list[ChatRoomOut])
async def list_my_rooms(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await chat_service.list_rooms(session, user)


@router.post("/rooms", response_model=ChatRoomOut, status_code=status.HTTP_201_CREATED)
async def create_or_get_room(
    payload: ChatRoomCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    room = await chat_service.create_or_get_room(
        session,
        user,
        peer_id=payload.peer_id,
        booking_id=payload.booking_id,
        initial_message=payload.initial_message,
    )
    return await chat_service.get_room(session, user, room.id)


@router.get("/rooms/{room_id}", response_model=ChatRoomOut)
async def get_room_detail(
    room_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await chat_service.get_room(session, user, room_id)


@router.get("/rooms/{room_id}/messages", response_model=list[ChatMessageOut])
async def list_messages(
    room_id: int,
    before_id: int | None = Query(None, ge=1),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await chat_service.get_messages(session, user, room_id, before_id=before_id, limit=limit)


@router.post(
    "/rooms/{room_id}/messages",
    response_model=ChatMessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def post_message(
    room_id: int,
    payload: ChatMessageCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    msg, _ = await chat_service.send_message(
        session, user, room_id, payload.content, payload.attachment_url
    )
    out = ChatMessageOut.model_validate(msg)
    await manager.broadcast(room_id, {"type": "message", "data": out.model_dump(mode="json")})
    return out


@router.post("/rooms/{room_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    room_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await chat_service.mark_room_read(session, user, room_id)
    await manager.broadcast(room_id, {"type": "read", "data": {"user_id": user.id}})


@router.get("/unread-count")
async def total_unread(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return {"unread": await chat_service.total_unread(session, user)}


async def _resolve_user(token: str) -> User | None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None
    async with AsyncSessionLocal() as session:
        stmt = (
            select(User)
            .options(
                selectinload(User.student_profile),
                selectinload(User.landlord_profile),
                selectinload(User.curator_profile),
                selectinload(User.admin_profile),
            )
            .where(User.id == user_id)
        )
        user = (await session.execute(stmt)).scalar_one_or_none()
        if not user or not user.is_active or user.is_blocked:
            return None
        return user


@router.websocket("/ws/{room_id}")
async def chat_ws(websocket: WebSocket, room_id: int, token: str = Query(...)):
    user = await _resolve_user(token)
    if user is None:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as session:
        try:
            await chat_service.ensure_member(session, user, room_id)
        except Exception:
            await websocket.close(code=4403)
            return

    await manager.connect(websocket, room_id, user.id)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                continue

            kind = payload.get("type")
            if kind == "message":
                content = (payload.get("content") or "").strip()
                if not content:
                    continue
                attachment = payload.get("attachment_url")
                async with AsyncSessionLocal() as session:
                    msg, _ = await chat_service.send_message(
                        session, user, room_id, content, attachment
                    )
                    out = ChatMessageOut.model_validate(msg)
                await manager.broadcast(
                    room_id,
                    {"type": "message", "data": out.model_dump(mode="json")},
                )
            elif kind == "typing":
                await manager.broadcast(
                    room_id,
                    {"type": "typing", "data": {"user_id": user.id}},
                    exclude=websocket,
                )
            elif kind == "read":
                async with AsyncSessionLocal() as session:
                    await chat_service.mark_room_read(session, user, room_id)
                await manager.broadcast(
                    room_id,
                    {"type": "read", "data": {"user_id": user.id}},
                )
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(websocket)
