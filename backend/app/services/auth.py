from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.integrations.hemis import HemisStudent, hemis_client
from app.integrations.sms import generate_code, sms_client
from app.models import (
    AdminProfile,
    CuratorProfile,
    LandlordProfile,
    StudentProfile,
    University,
    User,
    UserRole,
)
from app.schemas.auth import (
    HemisLoginRequest,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.services.verification_store import verification_store


class AuthError(HTTPException):
    def __init__(self, detail: str, code: str = "auth_error") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": code, "message": detail})


async def _get_user_by_phone(session: AsyncSession, phone: str) -> User | None:
    stmt = (
        select(User)
        .options(
            selectinload(User.student_profile),
            selectinload(User.landlord_profile),
            selectinload(User.curator_profile),
            selectinload(User.admin_profile),
        )
        .where(User.phone == phone)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
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
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


def _issue_tokens(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, extra={"role": user.role.value}),
        refresh_token=create_refresh_token(user.id),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def register_user(session: AsyncSession, payload: RegisterRequest) -> RegisterResponse:
    existing = await _get_user_by_phone(session, payload.phone)
    if existing and existing.is_verified:
        raise AuthError("Phone already registered", code="phone_exists")

    if existing:
        existing.password_hash = hash_password(payload.password)
        existing.role = payload.role
        existing.first_name = payload.first_name
        existing.last_name = payload.last_name
        user = existing
    else:
        user = User(
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            role=payload.role,
            first_name=payload.first_name,
            last_name=payload.last_name,
            is_verified=False,
        )
        session.add(user)
        await session.flush()
        _attach_profile(session, user)

    code = generate_code(6)
    await verification_store.save_code(payload.phone, code)
    sent = await sms_client.send_verification_code(payload.phone, code)
    await session.commit()

    return RegisterResponse(
        phone=payload.phone,
        code_sent=sent,
        dev_code=code if settings.DEBUG else None,
    )


def _attach_profile(session: AsyncSession, user: User) -> None:
    if user.role == UserRole.STUDENT:
        session.add(StudentProfile(user_id=user.id))
    elif user.role == UserRole.LANDLORD:
        session.add(LandlordProfile(user_id=user.id))
    elif user.role == UserRole.CURATOR:
        session.add(CuratorProfile(user_id=user.id))
    elif user.role == UserRole.ADMIN:
        session.add(AdminProfile(user_id=user.id))


async def verify_phone(session: AsyncSession, phone: str, code: str) -> TokenResponse:
    is_valid = await verification_store.verify(phone, code)
    if not is_valid:
        raise AuthError("Invalid or expired code", code="invalid_code")

    user = await _get_user_by_phone(session, phone)
    if not user:
        raise AuthError("User not found", code="user_not_found")

    user.is_verified = True
    user.phone_verified_at = datetime.utcnow()
    user.last_login_at = datetime.utcnow()
    await session.commit()
    return _issue_tokens(user)


async def resend_code(phone: str) -> str | None:
    code = generate_code(6)
    await verification_store.save_code(phone, code)
    await sms_client.send_verification_code(phone, code)
    return code if settings.DEBUG else None


async def login_with_password(session: AsyncSession, payload: LoginRequest) -> TokenResponse:
    user = await _get_user_by_phone(session, payload.phone)
    if not user or not user.password_hash:
        raise AuthError("Invalid credentials", code="invalid_credentials")
    if user.is_blocked:
        raise AuthError("Account is blocked", code="blocked")
    if not user.is_verified:
        raise AuthError("Phone not verified", code="not_verified")
    if not verify_password(payload.password, user.password_hash):
        raise AuthError("Invalid credentials", code="invalid_credentials")

    user.last_login_at = datetime.utcnow()
    await session.commit()
    return _issue_tokens(user)


async def login_with_hemis(session: AsyncSession, payload: HemisLoginRequest) -> TokenResponse:
    student = await hemis_client.authenticate(payload.hemis_login, payload.password)
    if not student:
        raise AuthError("HEMIS credentials invalid", code="hemis_invalid")

    user = await _get_or_create_hemis_user(session, student)
    user.last_login_at = datetime.utcnow()
    await session.commit()
    return _issue_tokens(user)


async def _get_or_create_hemis_user(session: AsyncSession, student: HemisStudent) -> User:
    stmt = (
        select(StudentProfile)
        .options(selectinload(StudentProfile.user))
        .where(StudentProfile.hemis_id == student.hemis_id)
    )
    profile = (await session.execute(stmt)).scalar_one_or_none()

    university_id = await _ensure_university(session, student)

    if profile:
        profile.university_id = university_id
        profile.faculty = student.faculty
        profile.course = student.course
        profile.group_name = student.group_name
        return profile.user

    placeholder_phone = f"+998000{student.hemis_id[-7:].rjust(7, '0')}"
    user = User(
        phone=placeholder_phone,
        role=UserRole.STUDENT,
        first_name=student.first_name,
        last_name=student.last_name,
        is_verified=True,
        phone_verified_at=datetime.utcnow(),
    )
    session.add(user)
    await session.flush()
    session.add(
        StudentProfile(
            user_id=user.id,
            hemis_id=student.hemis_id,
            university_id=university_id,
            faculty=student.faculty,
            course=student.course,
            group_name=student.group_name,
        )
    )
    return user


async def _ensure_university(session: AsyncSession, student: HemisStudent) -> int | None:
    if not student.university_name:
        return None
    stmt = select(University).where(University.name == student.university_name)
    uni = (await session.execute(stmt)).scalar_one_or_none()
    if uni:
        return uni.id
    uni = University(
        name=student.university_name,
        short_name=student.university_code,
        hemis_code=student.university_code,
    )
    session.add(uni)
    await session.flush()
    return uni.id


async def refresh_tokens(session: AsyncSession, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise AuthError("Invalid refresh token", code="invalid_refresh")
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise AuthError("Invalid refresh token", code="invalid_refresh") from exc

    user = await _get_user_by_id(session, user_id)
    if not user or user.is_blocked or not user.is_active:
        raise AuthError("User not available", code="user_unavailable")
    return _issue_tokens(user)
