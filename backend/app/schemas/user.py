from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import Gender, UserRole


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    role: UserRole
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    email: EmailStr | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime


class StudentProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hemis_id: str | None = None
    university_id: int | None = None
    faculty: str | None = None
    course: int | None = None
    group_name: str | None = None
    gender: Gender | None = None
    birth_date: date | None = None


class LandlordProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    passport_series: str | None = None
    passport_number: str | None = None
    is_pro: bool = False
    pro_until: datetime | None = None
    free_listings_used: int = 0
    is_verified_landlord: bool = False


class CuratorProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    university_id: int | None = None
    position: str | None = None


class AdminProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    is_super_admin: bool = False


class UserResponse(UserBase):
    student_profile: StudentProfileRead | None = None
    landlord_profile: LandlordProfileRead | None = None
    curator_profile: CuratorProfileRead | None = None
    admin_profile: AdminProfileRead | None = None


class UserUpdate(BaseModel):
    first_name: str | None = Field(None, max_length=128)
    last_name: str | None = Field(None, max_length=128)
    email: EmailStr | None = None
    avatar_url: str | None = Field(None, max_length=512)


class StudentProfileUpdate(BaseModel):
    university_id: int | None = None
    faculty: str | None = Field(None, max_length=255)
    course: int | None = Field(None, ge=1, le=6)
    group_name: str | None = Field(None, max_length=64)
    gender: Gender | None = None
    birth_date: date | None = None


class LandlordProfileUpdate(BaseModel):
    passport_series: str | None = Field(None, max_length=16)
    passport_number: str | None = Field(None, max_length=32)
    pinfl: str | None = Field(None, max_length=32)


class CuratorProfileUpdate(BaseModel):
    university_id: int | None = None
    position: str | None = Field(None, max_length=128)
