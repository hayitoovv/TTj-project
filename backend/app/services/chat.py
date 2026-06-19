from __future__ import annotations

from datetime import datetime
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    ChatMessage,
    ChatRoom,
    ChatRoomType,
    NotificationType,
    Subscription,
    SubscriptionStatus,
    User,
    UserRole,
    chat_room_participant,
)
from app.schemas.chat import (
    ChatMessageOut,
    ChatParticipant,
    ChatRoomOut,
)
from app.services.notification import notify

# Skrinshot spec: FREE = "Cheklangan chat" — max 1 active direct room.
# PRO = "Cheksiz chat" — unlimited.
FREE_CHAT_ROOMS_LIMIT = 1


async def _pro_user_ids(session: AsyncSession, user_ids: set[int]) -> set[int]:
    """Batch lookup: which of the given user_ids currently have an active PRO subscription."""
    if not user_ids:
        return set()
    stmt = select(Subscription.user_id).where(
        Subscription.user_id.in_(user_ids),
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.ends_at > datetime.utcnow(),
    )
    rows = (await session.execute(stmt)).scalars().all()
    return set(rows)


def _participant(user: User, pro_ids: set[int]) -> ChatParticipant:
    return ChatParticipant(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar_url=user.avatar_url,
        role=user.role,
        is_pro=user.id in pro_ids,
    )


def _room_type_for(a: UserRole, b: UserRole) -> ChatRoomType:
    roles = {a, b}
    if roles == {UserRole.STUDENT, UserRole.LANDLORD}:
        return ChatRoomType.STUDENT_LANDLORD
    if roles == {UserRole.STUDENT, UserRole.CURATOR}:
        return ChatRoomType.STUDENT_CURATOR
    if roles == {UserRole.LANDLORD, UserRole.CURATOR}:
        return ChatRoomType.LANDLORD_CURATOR
    return ChatRoomType.GROUP


async def _find_direct_room(
    session: AsyncSession, user_a_id: int, user_b_id: int
) -> ChatRoom | None:
    """Find existing 2-participant direct room between these users."""
    sub_a = (
        select(chat_room_participant.c.room_id)
        .where(chat_room_participant.c.user_id == user_a_id)
        .subquery()
    )
    sub_b = (
        select(chat_room_participant.c.room_id)
        .where(chat_room_participant.c.user_id == user_b_id)
        .subquery()
    )
    stmt = (
        select(ChatRoom)
        .options(selectinload(ChatRoom.participants))
        .where(ChatRoom.id.in_(select(sub_a.c.room_id)))
        .where(ChatRoom.id.in_(select(sub_b.c.room_id)))
    )
    rooms = (await session.execute(stmt)).scalars().all()
    for room in rooms:
        if len(room.participants) == 2:
            return room
    return None


async def create_or_get_room(
    session: AsyncSession,
    user: User,
    peer_id: int,
    booking_id: int | None = None,
    initial_message: str | None = None,
) -> ChatRoom:
    if peer_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_peer", "message": "Cannot chat with yourself"},
        )
    peer = await session.get(User, peer_id)
    if not peer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "user_not_found", "message": "Peer user not found"},
        )

    existing = await _find_direct_room(session, user.id, peer_id)
    if existing:
        if initial_message:
            await _insert_message(session, existing.id, user.id, initial_message)
            await session.commit()
        return existing

    # FREE users limited to FREE_CHAT_ROOMS_LIMIT distinct chat rooms. PRO unlimited.
    # Curators / admins exempt (their chats are platform-driven, not subscription gated).
    if user.role in (UserRole.STUDENT, UserRole.LANDLORD):
        from app.services.subscription import get_active_subscription

        sub = await get_active_subscription(session, user.id)
        if sub is None:
            count_stmt = (
                select(func.count())
                .select_from(chat_room_participant)
                .where(chat_room_participant.c.user_id == user.id)
            )
            existing_rooms = (await session.execute(count_stmt)).scalar_one() or 0
            if existing_rooms >= FREE_CHAT_ROOMS_LIMIT:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "code": "chat_limit_reached",
                        "message": (
                            f"Bepul rejada faqat {FREE_CHAT_ROOMS_LIMIT} ta suhbat ochish mumkin. "
                            "Cheksiz chat uchun PRO ga o'ting."
                        ),
                    },
                )

    room = ChatRoom(type=_room_type_for(user.role, peer.role), booking_id=booking_id)
    session.add(room)
    await session.flush()

    await session.execute(
        chat_room_participant.insert().values(
            [
                {"room_id": room.id, "user_id": user.id},
                {"room_id": room.id, "user_id": peer.id},
            ]
        )
    )

    if initial_message:
        await _insert_message(session, room.id, user.id, initial_message)

    await session.commit()
    return await _get_room_with_participants(session, room.id)


async def _get_room_with_participants(session: AsyncSession, room_id: int) -> ChatRoom:
    stmt = (
        select(ChatRoom)
        .options(selectinload(ChatRoom.participants))
        .where(ChatRoom.id == room_id)
    )
    room = (await session.execute(stmt)).scalar_one_or_none()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "Room not found"},
        )
    return room


async def ensure_member(session: AsyncSession, user: User, room_id: int) -> ChatRoom:
    stmt = (
        select(ChatRoom)
        .options(selectinload(ChatRoom.participants))
        .where(ChatRoom.id == room_id)
    )
    room = (await session.execute(stmt)).scalar_one_or_none()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "Room not found"},
        )
    if user.id not in {p.id for p in room.participants}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden", "message": "Not a participant"},
        )
    return room


async def list_rooms(session: AsyncSession, user: User) -> list[ChatRoomOut]:
    sub = (
        select(chat_room_participant.c.room_id)
        .where(chat_room_participant.c.user_id == user.id)
        .subquery()
    )
    stmt = (
        select(ChatRoom)
        .options(selectinload(ChatRoom.participants))
        .where(ChatRoom.id.in_(select(sub.c.room_id)))
        .order_by(ChatRoom.last_message_at.desc().nullslast(), ChatRoom.created_at.desc())
    )
    rooms: Sequence[ChatRoom] = (await session.execute(stmt)).scalars().all()

    all_user_ids: set[int] = set()
    for room in rooms:
        for p in room.participants:
            all_user_ids.add(p.id)
    pro_ids = await _pro_user_ids(session, all_user_ids)

    out: list[ChatRoomOut] = []
    for room in rooms:
        last_msg_stmt = (
            select(ChatMessage)
            .where(ChatMessage.room_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_msg = (await session.execute(last_msg_stmt)).scalar_one_or_none()

        unread_stmt = select(func.count()).select_from(
            select(ChatMessage.id)
            .where(
                ChatMessage.room_id == room.id,
                ChatMessage.sender_id != user.id,
                ChatMessage.is_read.is_(False),
            )
            .subquery()
        )
        unread = (await session.execute(unread_stmt)).scalar_one()

        out.append(
            ChatRoomOut(
                id=room.id,
                type=room.type,
                booking_id=room.booking_id,
                last_message_at=room.last_message_at,
                created_at=room.created_at,
                participants=[_participant(p, pro_ids) for p in room.participants],
                last_message=ChatMessageOut.model_validate(last_msg) if last_msg else None,
                unread_count=unread,
            )
        )
    return out


async def get_room(session: AsyncSession, user: User, room_id: int) -> ChatRoomOut:
    room = await ensure_member(session, user, room_id)
    pro_ids = await _pro_user_ids(session, {p.id for p in room.participants})
    return ChatRoomOut(
        id=room.id,
        type=room.type,
        booking_id=room.booking_id,
        last_message_at=room.last_message_at,
        created_at=room.created_at,
        participants=[_participant(p, pro_ids) for p in room.participants],
    )


async def get_messages(
    session: AsyncSession,
    user: User,
    room_id: int,
    before_id: int | None = None,
    limit: int = 50,
) -> list[ChatMessageOut]:
    await ensure_member(session, user, room_id)
    stmt = select(ChatMessage).where(ChatMessage.room_id == room_id)
    if before_id:
        stmt = stmt.where(ChatMessage.id < before_id)
    stmt = stmt.order_by(ChatMessage.id.desc()).limit(min(limit, 100))
    rows = (await session.execute(stmt)).scalars().all()
    return [ChatMessageOut.model_validate(m) for m in reversed(rows)]


async def _insert_message(
    session: AsyncSession,
    room_id: int,
    sender_id: int,
    content: str,
    attachment_url: str | None = None,
) -> ChatMessage:
    msg = ChatMessage(
        room_id=room_id,
        sender_id=sender_id,
        content=content.strip(),
        attachment_url=attachment_url,
    )
    session.add(msg)
    await session.flush()
    await session.execute(
        update(ChatRoom)
        .where(ChatRoom.id == room_id)
        .values(last_message_at=msg.created_at or datetime.utcnow())
    )
    return msg


async def send_message(
    session: AsyncSession,
    user: User,
    room_id: int,
    content: str,
    attachment_url: str | None = None,
    notify_recipients: bool = True,
) -> tuple[ChatMessage, list[int]]:
    """Returns (message, recipient_user_ids)."""
    room = await ensure_member(session, user, room_id)
    if not content or not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "empty_message", "message": "Message cannot be empty"},
        )

    msg = await _insert_message(session, room_id, user.id, content, attachment_url)
    recipients = [p.id for p in room.participants if p.id != user.id]

    if notify_recipients:
        preview = (content[:80] + "…") if len(content) > 80 else content
        sender_name = user.first_name or "Yangi xabar"
        for rid in recipients:
            await notify(
                session,
                rid,
                type=NotificationType.MESSAGE,
                title=f"{sender_name} sizga xabar yubordi",
                body=preview,
                data={"room_id": room_id, "message_id": msg.id},
            )

    await session.commit()
    await session.refresh(msg)
    return msg, recipients


async def mark_room_read(session: AsyncSession, user: User, room_id: int) -> int:
    await ensure_member(session, user, room_id)
    stmt = (
        update(ChatMessage)
        .where(
            ChatMessage.room_id == room_id,
            ChatMessage.sender_id != user.id,
            ChatMessage.is_read.is_(False),
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    res = await session.execute(stmt)
    await session.commit()
    return res.rowcount or 0


async def total_unread(session: AsyncSession, user: User) -> int:
    sub = (
        select(chat_room_participant.c.room_id)
        .where(chat_room_participant.c.user_id == user.id)
        .subquery()
    )
    stmt = select(func.count()).select_from(
        select(ChatMessage.id)
        .where(
            ChatMessage.room_id.in_(select(sub.c.room_id)),
            ChatMessage.sender_id != user.id,
            ChatMessage.is_read.is_(False),
        )
        .subquery()
    )
    return (await session.execute(stmt)).scalar_one()
