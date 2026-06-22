from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UniversityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    short_name: str | None = None
    hemis_code: str | None = None
    region: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime
    student_count: int = 0


class UniversityCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    short_name: str | None = Field(default=None, max_length=64)
    hemis_code: str | None = Field(default=None, max_length=32)
    region: str | None = Field(default=None, max_length=128)
    address: str | None = Field(default=None, max_length=512)
    latitude: float | None = None
    longitude: float | None = None


class UniversityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    short_name: str | None = Field(default=None, max_length=64)
    hemis_code: str | None = Field(default=None, max_length=32)
    region: str | None = Field(default=None, max_length=128)
    address: str | None = Field(default=None, max_length=512)
    latitude: float | None = None
    longitude: float | None = None


class UniversityListFilter(BaseModel):
    q: str | None = None
    region: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)
