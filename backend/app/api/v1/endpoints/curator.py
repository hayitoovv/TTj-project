from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.curator import (
    LandlordListFilter,
    LandlordListItem,
    StudentDetail,
    StudentListFilter,
    StudentListItem,
)
from app.services import curator as curator_service


def require_curator_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.CURATOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "forbidden", "message": "Curator or admin only"},
        )
    return user


router = APIRouter(
    prefix="/curator",
    tags=["curator"],
    dependencies=[Depends(require_curator_or_admin)],
)


@router.get("/students", response_model=PaginatedResponse[StudentListItem])
async def list_students(
    filters: StudentListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
):
    return await curator_service.list_students(session, filters)


@router.get("/students/{student_id}", response_model=StudentDetail)
async def get_student(
    student_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await curator_service.get_student(session, student_id)


@router.get("/landlords", response_model=PaginatedResponse[LandlordListItem])
async def list_landlords(
    filters: LandlordListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
):
    return await curator_service.list_landlords(session, filters)
