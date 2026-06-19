from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    get_session,
    require_admin,
    require_landlord,
)
from app.core.security import decode_token
from app.models import User
from app.schemas.common import PaginatedResponse
from app.schemas.house import (
    HouseCreate,
    HouseDetail,
    HouseFilter,
    HouseListItem,
    HousePhotoCreate,
    HousePhotoRead,
    HouseRejectRequest,
    HouseUpdate,
)
from app.services import house as house_service

router = APIRouter(prefix="/houses", tags=["houses"])

optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    if not credentials or credentials.scheme.lower() != "bearer":
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError, TypeError):
        return None
    return await session.get(User, user_id)


@router.get("", response_model=PaginatedResponse[HouseListItem])
async def list_houses(
    filters: HouseFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    viewer: User | None = Depends(get_optional_user),
):
    return await house_service.list_houses(session, filters, viewer=viewer)


@router.get("/mine", response_model=PaginatedResponse[HouseListItem])
async def list_my_houses(
    filters: HouseFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    return await house_service.list_houses(session, filters, only_landlord_id=landlord.id)


@router.post("", response_model=HouseDetail, status_code=status.HTTP_201_CREATED)
async def create_house(
    payload: HouseCreate,
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    return await house_service.create_house(session, landlord, payload)


@router.get("/{house_id}", response_model=HouseDetail)
async def get_house(
    house_id: int,
    session: AsyncSession = Depends(get_session),
    viewer: User | None = Depends(get_optional_user),
):
    return await house_service.get_house(session, house_id, viewer=viewer)


@router.patch("/{house_id}", response_model=HouseDetail)
async def update_house(
    house_id: int,
    payload: HouseUpdate,
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    return await house_service.update_house(session, house_id, landlord, payload)


@router.delete("/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_house(
    house_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await house_service.delete_house(session, house_id, user)


# ---------- photos ----------
@router.post("/{house_id}/photos", response_model=list[HousePhotoRead], status_code=status.HTTP_201_CREATED)
async def add_photos(
    house_id: int,
    photos: list[HousePhotoCreate],
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    return await house_service.add_photos(session, house_id, landlord, photos)


@router.delete("/{house_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    house_id: int,
    photo_id: int,
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    await house_service.delete_photo(session, house_id, photo_id, landlord)


# ---------- admin moderation ----------
@router.post("/{house_id}/approve", response_model=HouseDetail)
async def approve_house(
    house_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    return await house_service.approve_house(session, house_id)


@router.post("/{house_id}/reject", response_model=HouseDetail)
async def reject_house(
    house_id: int,
    payload: HouseRejectRequest,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    return await house_service.reject_house(session, house_id, payload.reason)
