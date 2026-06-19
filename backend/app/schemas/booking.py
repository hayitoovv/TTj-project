from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import BookingStatus, Currency


class BookingCreate(BaseModel):
    house_id: int
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def _check_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class BookingCancel(BaseModel):
    reason: str = Field(min_length=3, max_length=1024)


class BookingListFilter(BaseModel):
    status: BookingStatus | None = None
    house_id: int | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class ContractRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    contract_number: str
    pdf_url: str | None = None
    terms_version: str
    student_accepted_at: datetime | None = None
    landlord_accepted_at: datetime | None = None


class BookingListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    house_id: int
    house_title: str | None = None
    house_address: str | None = None
    house_photo: str | None = None

    student_id: int
    student_name: str | None = None

    start_date: date
    end_date: date
    monthly_price: Decimal
    currency: Currency
    total_amount: Decimal

    status: BookingStatus
    confirmed_at: datetime | None = None
    created_at: datetime


class BookingDetail(BookingListItem):
    platform_fee: Decimal
    service_fee: Decimal
    cancellation_reason: str | None = None
    cancelled_at: datetime | None = None
    contract: ContractRead | None = None
    landlord_id: int | None = None
    landlord_name: str | None = None


class BookingFeeEstimate(BaseModel):
    days: int
    monthly_price: Decimal
    currency: Currency
    total_rent: Decimal
    platform_fee: Decimal
    service_fee: Decimal
    total_amount: Decimal
