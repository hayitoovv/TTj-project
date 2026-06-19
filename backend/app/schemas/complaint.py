from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ComplaintAgainstType, ComplaintStatus, UserRole


class ReporterInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    role: UserRole
    phone: str


class ComplaintCreate(BaseModel):
    against_type: ComplaintAgainstType
    target_user_id: int | None = None
    house_id: int | None = None
    booking_id: int | None = None
    subject: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=4000)

    @model_validator(mode="after")
    def _check_target(self):
        if self.against_type == ComplaintAgainstType.USER and not self.target_user_id:
            raise ValueError("target_user_id required for USER complaints")
        if self.against_type == ComplaintAgainstType.HOUSE and not self.house_id:
            raise ValueError("house_id required for HOUSE complaints")
        return self


class ComplaintResolve(BaseModel):
    resolution: str = Field(min_length=3, max_length=2000)


class ComplaintRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    against_type: ComplaintAgainstType
    target_user_id: int | None = None
    house_id: int | None = None
    booking_id: int | None = None
    subject: str
    description: str
    status: ComplaintStatus
    resolution: str | None = None
    assigned_curator_id: int | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    reporter: ReporterInfo

    # Light context
    house_title: str | None = None
    target_user_name: str | None = None


class ComplaintListFilter(BaseModel):
    status: ComplaintStatus | None = None
    against_type: ComplaintAgainstType | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
