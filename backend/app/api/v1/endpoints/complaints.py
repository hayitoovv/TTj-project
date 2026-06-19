from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintListFilter,
    ComplaintRead,
    ComplaintResolve,
)
from app.services import complaint as complaint_service

router = APIRouter(prefix="/complaints", tags=["complaints"])


def require_curator_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.CURATOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden", "message": "Curator or admin only"},
        )
    return user


@router.get("", response_model=PaginatedResponse[ComplaintRead])
async def list_complaints(
    filters: ComplaintListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await complaint_service.list_complaints(session, user, filters)


@router.post("", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await complaint_service.create_complaint(session, user, payload)


@router.get("/{complaint_id}", response_model=ComplaintRead)
async def get_complaint(
    complaint_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await complaint_service.get_complaint(session, complaint_id, user)


@router.post("/{complaint_id}/process", response_model=ComplaintRead)
async def process_complaint(
    complaint_id: int,
    session: AsyncSession = Depends(get_session),
    curator: User = Depends(require_curator_or_admin),
):
    return await complaint_service.process_complaint(session, complaint_id, curator)


@router.post("/{complaint_id}/resolve", response_model=ComplaintRead)
async def resolve_complaint(
    complaint_id: int,
    payload: ComplaintResolve,
    session: AsyncSession = Depends(get_session),
    curator: User = Depends(require_curator_or_admin),
):
    return await complaint_service.resolve_complaint(
        session, complaint_id, curator, payload.resolution
    )
