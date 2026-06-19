from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, require_admin
from app.models import User
from app.schemas.house import AmenityCreate, AmenityRead
from app.services import amenity as amenity_service

router = APIRouter(prefix="/amenities", tags=["amenities"])


@router.get("", response_model=list[AmenityRead])
async def list_amenities(session: AsyncSession = Depends(get_session)):
    return await amenity_service.list_amenities(session)


@router.post("", response_model=AmenityRead, status_code=status.HTTP_201_CREATED)
async def create_amenity(
    payload: AmenityCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    return await amenity_service.create_amenity(session, payload)


@router.delete("/{amenity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_amenity(
    amenity_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
):
    await amenity_service.delete_amenity(session, amenity_id)
