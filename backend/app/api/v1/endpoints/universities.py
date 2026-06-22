from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session, require_admin
from app.schemas.common import PaginatedResponse
from app.schemas.university import (
    UniversityCreate,
    UniversityListFilter,
    UniversityRead,
    UniversityUpdate,
)
from app.services import university as university_service

router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("", response_model=PaginatedResponse[UniversityRead])
async def list_universities(
    filters: UniversityListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
):
    """Public list — used during registration to pick university."""
    return await university_service.list_universities(session, filters)


@router.get("/{university_id}", response_model=UniversityRead)
async def get_university(
    university_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await university_service.get_university(session, university_id)


@router.post(
    "",
    response_model=UniversityRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_university(
    payload: UniversityCreate,
    session: AsyncSession = Depends(get_session),
):
    return await university_service.create_university(session, payload)


@router.patch(
    "/{university_id}",
    response_model=UniversityRead,
    dependencies=[Depends(require_admin)],
)
async def update_university(
    university_id: int,
    payload: UniversityUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await university_service.update_university(session, university_id, payload)


@router.delete(
    "/{university_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_university(
    university_id: int,
    session: AsyncSession = Depends(get_session),
):
    await university_service.delete_university(session, university_id)
