from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.core.security import decode_token
from app.models import User
from app.schemas.common import PaginatedResponse
from app.schemas.review import ReviewCreate, ReviewListFilter, ReviewRead
from app.services import review as review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])

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


@router.get("", response_model=PaginatedResponse[ReviewRead])
async def list_reviews(
    filters: ReviewListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    viewer: User | None = Depends(get_optional_user),
):
    return await review_service.list_reviews(session, filters, viewer=viewer)


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await review_service.create_review(session, user, payload)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    await review_service.delete_review(session, review_id, user)
