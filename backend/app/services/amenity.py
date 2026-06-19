from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Amenity
from app.schemas.house import AmenityCreate, AmenityRead


async def list_amenities(session: AsyncSession) -> list[AmenityRead]:
    stmt = select(Amenity).order_by(Amenity.category.nulls_last(), Amenity.name)
    amenities = (await session.execute(stmt)).scalars().all()
    return [AmenityRead.model_validate(a) for a in amenities]


async def create_amenity(session: AsyncSession, payload: AmenityCreate) -> AmenityRead:
    amenity = Amenity(name=payload.name, icon=payload.icon, category=payload.category)
    session.add(amenity)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "amenity_exists", "message": f"Amenity '{payload.name}' already exists"},
        ) from exc
    await session.refresh(amenity)
    return AmenityRead.model_validate(amenity)


async def delete_amenity(session: AsyncSession, amenity_id: int) -> None:
    amenity = await session.get(Amenity, amenity_id)
    if not amenity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "Amenity not found"},
        )
    await session.delete(amenity)
    await session.commit()
