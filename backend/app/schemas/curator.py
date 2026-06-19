from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
