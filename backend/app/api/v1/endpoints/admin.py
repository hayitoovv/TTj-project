from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, require_admin
from app.models import User
from app.schemas.admin import (
    AnalyticsOverview,
    BlockUserRequest,
    DashboardStats,
    UserAdminListFilter,
    UserAdminRead,
)
from app.schemas.common import PaginatedResponse
from app.schemas.house import HouseFilter, HouseListItem
from app.services import admin as admin_service
from app.services import house as house_service

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/stats", response_model=DashboardStats)
async def get_stats(session: AsyncSession = Depends(get_session)):
    return await admin_service.get_dashboard_stats(session)


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(session: AsyncSession = Depends(get_session)):
    return await admin_service.get_analytics_overview(session)


@router.get("/users", response_model=PaginatedResponse[UserAdminRead])
async def list_users(
    filters: UserAdminListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
):
    return await admin_service.list_users(session, filters)


@router.post("/users/{user_id}/block", response_model=UserAdminRead)
async def block_user(
    user_id: int,
    payload: BlockUserRequest,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    return await admin_service.block_user(session, user_id, admin, payload.reason)


@router.post("/users/{user_id}/unblock", response_model=UserAdminRead)
async def unblock_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await admin_service.unblock_user(session, user_id)


@router.get("/houses", response_model=PaginatedResponse[HouseListItem])
async def list_all_houses(
    filters: HouseFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Admin can see all houses regardless of status."""
    return await house_service.list_houses(session, filters, viewer=admin)
