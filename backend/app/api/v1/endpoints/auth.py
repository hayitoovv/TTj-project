from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.core.config import settings
from app.models import User
from app.schemas.auth import (
    HemisLoginRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResendCodeRequest,
    TokenResponse,
    VerifyPhoneRequest,
)
from app.schemas.user import (
    CuratorProfileUpdate,
    LandlordProfileUpdate,
    StudentProfileUpdate,
    UserResponse,
    UserUpdate,
)
from app.services import auth as auth_service
from app.services import profile as profile_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)):
    return await auth_service.register_user(session, payload)


@router.post("/verify", response_model=TokenResponse)
async def verify_phone(payload: VerifyPhoneRequest, session: AsyncSession = Depends(get_session)):
    return await auth_service.verify_phone(session, payload.phone, payload.code)


@router.post("/resend-code")
async def resend_code(payload: ResendCodeRequest):
    dev_code = await auth_service.resend_code(payload.phone)
    return {"message": "Code sent", "dev_code": dev_code if settings.DEBUG else None}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)):
    return await auth_service.login_with_password(session, payload)


@router.post("/login/hemis", response_model=TokenResponse)
async def login_hemis(payload: HemisLoginRequest, session: AsyncSession = Depends(get_session)):
    return await auth_service.login_with_hemis(session, payload)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshTokenRequest, session: AsyncSession = Depends(get_session)):
    return await auth_service.refresh_tokens(session, payload.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await profile_service.update_me(session, user, payload)


@router.patch("/me/student", response_model=UserResponse)
async def update_student_profile(
    payload: StudentProfileUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await profile_service.update_student_profile(session, user, payload)


@router.patch("/me/landlord", response_model=UserResponse)
async def update_landlord_profile(
    payload: LandlordProfileUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await profile_service.update_landlord_profile(session, user, payload)


@router.patch("/me/curator", response_model=UserResponse)
async def update_curator_profile(
    payload: CuratorProfileUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await profile_service.update_curator_profile(session, user, payload)
