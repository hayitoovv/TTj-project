from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import User
from app.schemas.common import PaginatedResponse
from app.schemas.house import HouseFilter, HouseListItem
from app.services import favorite as favorite_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=PaginatedResponse[HouseListItem])
async def list_my_favorites(
    filters: HouseFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await favorite_service.list_favorites(session, user, filters)


@router.post("/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_favorite(
    house_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await favorite_service.add_favorite(session, user, house_id)


@router.delete("/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    house_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await favorite_service.remove_favorite(session, user, house_id)
