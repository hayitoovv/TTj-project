from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    CuratorProfile,
    LandlordProfile,
    StudentProfile,
    User,
    UserRole,
)
from app.schemas.user import (
    CuratorProfileUpdate,
    LandlordProfileUpdate,
    StudentProfileUpdate,
    UserResponse,
    UserUpdate,
)


async def _load_user_full(session: AsyncSession, user_id: int) -> User:
    stmt = (
        select(User)
        .options(
            selectinload(User.student_profile),
            selectinload(User.landlord_profile),
            selectinload(User.curator_profile),
            selectinload(User.admin_profile),
        )
        .where(User.id == user_id)
    )
    user = (await session.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "User not found"},
        )
    return user


async def update_me(
    session: AsyncSession, user: User, payload: UserUpdate
) -> UserResponse:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    await session.commit()
    fresh = await _load_user_full(session, user.id)
    return UserResponse.model_validate(fresh)


async def update_student_profile(
    session: AsyncSession, user: User, payload: StudentProfileUpdate
) -> UserResponse:
    if user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "role_mismatch", "message": "Not a student"},
        )

    # Get profile (load via dedicated query to avoid relationship lazy-load)
    stmt = select(StudentProfile).where(StudentProfile.user_id == user.id)
    profile = (await session.execute(stmt)).scalar_one_or_none()
    if not profile:
        profile = StudentProfile(user_id=user.id)
        session.add(profile)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)

    await session.commit()
    fresh = await _load_user_full(session, user.id)
    return UserResponse.model_validate(fresh)


async def update_landlord_profile(
    session: AsyncSession, user: User, payload: LandlordProfileUpdate
) -> UserResponse:
    if user.role != UserRole.LANDLORD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "role_mismatch", "message": "Not a landlord"},
        )

    stmt = select(LandlordProfile).where(LandlordProfile.user_id == user.id)
    profile = (await session.execute(stmt)).scalar_one_or_none()
    if not profile:
        profile = LandlordProfile(user_id=user.id)
        session.add(profile)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)

    await session.commit()
    fresh = await _load_user_full(session, user.id)
    return UserResponse.model_validate(fresh)


async def update_curator_profile(
    session: AsyncSession, user: User, payload: CuratorProfileUpdate
) -> UserResponse:
    if user.role != UserRole.CURATOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "role_mismatch", "message": "Not a curator"},
        )

    stmt = select(CuratorProfile).where(CuratorProfile.user_id == user.id)
    profile = (await session.execute(stmt)).scalar_one_or_none()
    if not profile:
        profile = CuratorProfile(user_id=user.id)
        session.add(profile)

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)

    await session.commit()
    fresh = await _load_user_full(session, user.id)
    return UserResponse.model_validate(fresh)
