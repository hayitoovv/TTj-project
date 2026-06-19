from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator

from app.models.enums import UserRole


UZ_PHONE_RE = re.compile(r"^\+998\d{9}$")


def normalize_phone(phone: str) -> str:
    """Accepts +998XXXXXXXXX, 998XXXXXXXXX, 8XXXXXXXXX -> +998XXXXXXXXX"""
    phone = re.sub(r"[\s\-()]", "", phone)
    if phone.startswith("+"):
        pass
    elif phone.startswith("998"):
        phone = "+" + phone
    elif len(phone) == 9:
        phone = "+998" + phone
    if not UZ_PHONE_RE.match(phone):
        raise ValueError("Phone must be Uzbek number: +998XXXXXXXXX")
    return phone


class RegisterRequest(BaseModel):
    phone: str
    password: str = Field(min_length=6, max_length=128)
    role: UserRole
    first_name: str | None = Field(None, max_length=128)
    last_name: str | None = Field(None, max_length=128)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)

    @field_validator("role")
    @classmethod
    def disallow_admin_register(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("Admin cannot be registered publicly")
        return v


class VerifyPhoneRequest(BaseModel):
    phone: str
    code: str = Field(min_length=4, max_length=8)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)


class ResendCodeRequest(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_phone(v)


class HemisLoginRequest(BaseModel):
    hemis_login: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RegisterResponse(BaseModel):
    phone: str
    message: str = "SMS code sent. Please verify."
    code_sent: bool = True
    dev_code: str | None = None
