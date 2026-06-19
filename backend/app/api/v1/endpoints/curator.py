from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.curator import StudentListFilter, StudentListItem
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
