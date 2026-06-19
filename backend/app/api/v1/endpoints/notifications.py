from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import User
from app.schemas.common import PaginatedResponse
from app.schemas.notification import (
    NotificationListFilter,
    NotificationRead,
    UnreadCountResponse,
)
from app.services import notification as notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=PaginatedResponse[NotificationRead])
async def list_notifications(
    filters: NotificationListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await notification_service.list_notifications(session, user, filters)


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await notification_service.get_unread_count(session, user)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await notification_service.mark_read(session, user, notification_id)


@router.post("/mark-all-read")
async def mark_all_read(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    n = await notification_service.mark_all_read(session, user)
    return {"updated": n}
