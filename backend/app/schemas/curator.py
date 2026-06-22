from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingStatus, ComplaintStatus, Currency, Gender


class StudentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    is_blocked: bool
    is_verified: bool
    created_at: datetime

    # Student profile
    hemis_id: str | None = None
    university_id: int | None = None
    university_name: str | None = None
    university_short: str | None = None
    faculty: str | None = None
    course: int | None = None
    group_name: str | None = None

    # Live stats
    active_bookings_count: int = 0
    total_bookings_count: int = 0
    open_complaints_count: int = 0


class StudentListFilter(BaseModel):
    university_id: int | None = None
    course: int | None = None
    is_blocked: bool | None = None
    q: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class LandlordListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    email: str | None = None
    is_blocked: bool
    is_verified: bool
    created_at: datetime

    is_pro: bool = False
    is_verified_landlord: bool = False
    houses_count: int = 0
    active_bookings_count: int = 0
    open_complaints_count: int = 0


class LandlordListFilter(BaseModel):
    is_pro: bool | None = None
    is_verified_landlord: bool | None = None
    is_blocked: bool | None = None
    q: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class StudentBookingSummary(BaseModel):
    id: int
    house_id: int
    house_title: str | None = None
    house_region: str | None = None
    start_date: date
    end_date: date
    monthly_price: Decimal
    currency: Currency
    status: BookingStatus
    created_at: datetime


class StudentComplaintSummary(BaseModel):
    id: int
    subject: str
    status: ComplaintStatus
    created_at: datetime
    resolved_at: datetime | None = None


class CurrentLandlordInfo(BaseModel):
    """Landlord of the student's currently active rental."""
    id: int
    first_name: str | None = None
    last_name: str | None = None
    phone: str
    avatar_url: str | None = None
    is_pro: bool = False
    house_id: int
    house_title: str | None = None
    booking_id: int
    booking_start_date: date
    booking_end_date: date


class StudentDetail(BaseModel):
    id: int
    phone: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    is_blocked: bool
    is_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime

    # Academic
    hemis_id: str | None = None
    university_id: int | None = None
    university_name: str | None = None
    university_short: str | None = None
    faculty: str | None = None
    course: int | None = None
    group_name: str | None = None
    gender: Gender | None = None
    birth_date: date | None = None

    # Stats
    active_bookings_count: int = 0
    total_bookings_count: int = 0
    open_complaints_count: int = 0
    total_complaints_count: int = 0
    total_spent: Decimal = Decimal(0)

    bookings: list[StudentBookingSummary] = []
    complaints: list[StudentComplaintSummary] = []
    current_landlord: CurrentLandlordInfo | None = None
