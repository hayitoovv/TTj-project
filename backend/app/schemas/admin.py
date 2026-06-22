from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import UserRole


# ---------- Dashboard stats ----------
class DashboardStats(BaseModel):
    # Users
    total_users: int
    total_students: int
    total_landlords: int
    total_curators: int
    blocked_users: int
    new_users_this_month: int

    # Houses
    total_houses: int
    pending_houses: int
    approved_houses: int
    rejected_houses: int

    # Bookings
    total_bookings: int
    pending_bookings: int
    active_bookings: int
    ended_bookings: int
    new_bookings_this_month: int

    # Money
    total_revenue: Decimal
    total_platform_fee: Decimal
    revenue_this_month: Decimal


# ---------- Users management ----------
class UserAdminListFilter(BaseModel):
    role: UserRole | None = None
    is_blocked: bool | None = None
    is_verified: bool | None = None
    q: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class UserAdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    role: UserRole
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    is_blocked: bool
    phone_verified_at: datetime | None = None
    last_login_at: datetime | None = None
    created_at: datetime


class BlockUserRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1024)


# ---------- Analytics ----------
class MonthlyBucket(BaseModel):
    month: str  # "2026-01"
    label: str  # "Yan"


class RevenuePoint(MonthlyBucket):
    revenue: Decimal
    bookings: int
    platform_fee: Decimal


class SignupPoint(MonthlyBucket):
    students: int
    landlords: int
    curators: int
    total: int


class HousePoint(MonthlyBucket):
    created: int
    approved: int
    rejected: int


class TopUniversity(BaseModel):
    university_id: int
    name: str
    short_name: str | None = None
    student_count: int


class TopRegion(BaseModel):
    region: str
    house_count: int
    booking_count: int


class AnalyticsOverview(BaseModel):
    revenue_trend: list[RevenuePoint]
    signup_trend: list[SignupPoint]
    house_trend: list[HousePoint]
    top_universities: list[TopUniversity]
    top_regions: list[TopRegion]
    avg_booking_amount: Decimal
    pro_landlords_count: int
    active_pro_subscriptions: int
