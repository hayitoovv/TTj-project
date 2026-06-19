from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification, NotificationType, User
from app.schemas.common import PaginatedResponse
from app.schemas.notification import (
    NotificationListFilter,
    NotificationRead,
    UnreadCountResponse,
)


async def notify(
    session: AsyncSession,
    user_id: int,
    *,
    type: NotificationType,
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
) -> Notification:
    """Create a notification (caller must commit)."""
    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        data=data,
    )
    session.add(n)
    return n


async def notify_many(
    session: AsyncSession,
    user_ids: list[int],
    *,
    type: NotificationType,
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
) -> None:
    for uid in user_ids:
        await notify(session, uid, type=type, title=title, body=body, data=data)


async def list_notifications(
    session: AsyncSession, user: User, filters: NotificationListFilter
) -> PaginatedResponse[NotificationRead]:
    stmt = select(Notification).where(Notification.user_id == user.id)
    if filters.is_read is not None:
        stmt = stmt.where(Notification.is_read.is_(filters.is_read))
    if filters.type is not None:
        stmt = stmt.where(Notification.type == filters.type)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(Notification.created_at.desc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    items = (await session.execute(stmt)).scalars().all()
    pages = (total + filters.page_size - 1) // filters.page_size if total else 0

    return PaginatedResponse[NotificationRead](
        items=[NotificationRead.model_validate(n) for n in items],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        pages=pages,
    )


async def get_unread_count(session: AsyncSession, user: User) -> UnreadCountResponse:
    stmt = select(func.count()).select_from(
        select(Notification.id)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .subquery()
    )
    count = (await session.execute(stmt)).scalar_one()
    return UnreadCountResponse(unread=count)


async def mark_read(session: AsyncSession, user: User, notification_id: int) -> None:
    n = await session.get(Notification, notification_id)
    if not n or n.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "Notification not found"},
        )
    if not n.is_read:
        n.is_read = True
        n.read_at = datetime.utcnow()
        await session.commit()


async def mark_all_read(session: AsyncSession, user: User) -> int:
    stmt = (
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=datetime.utcnow())
    )
    res = await session.execute(stmt)
    await session.commit()
    return res.rowcount or 0
