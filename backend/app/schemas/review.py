from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ReviewTargetType, UserRole


class ReviewerInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    role: UserRole


class ReviewCreate(BaseModel):
    booking_id: int
    target_type: ReviewTargetType
    house_id: int | None = None
    target_user_id: int | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)

    @model_validator(mode="after")
    def _check_target(self):
        if self.target_type == ReviewTargetType.HOUSE and not self.house_id:
            raise ValueError("house_id is required for house reviews")
        if self.target_type == ReviewTargetType.USER and not self.target_user_id:
            raise ValueError("target_user_id is required for user reviews")
        return self


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    target_type: ReviewTargetType
    house_id: int | None = None
    target_user_id: int | None = None
    rating: int
    comment: str | None = None
    created_at: datetime
    reviewer: ReviewerInfo


class ReviewListFilter(BaseModel):
    house_id: int | None = None
    target_user_id: int | None = None
    reviewer_id: int | None = None
    booking_id: int | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
