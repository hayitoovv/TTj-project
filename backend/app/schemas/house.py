from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import Currency, HouseStatus


# ---------- Amenity ----------
class AmenityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    icon: str | None = None
    category: str | None = None


class AmenityCreate(BaseModel):
    name: str = Field(max_length=128)
    icon: str | None = Field(None, max_length=64)
    category: str | None = Field(None, max_length=64)


# ---------- House photo ----------
class HousePhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    order_num: int
    is_main: bool


class HousePhotoCreate(BaseModel):
    url: str = Field(max_length=512)
    order_num: int = 0
    is_main: bool = False


# ---------- House input ----------
class HouseBase(BaseModel):
    title: str = Field(max_length=255)
    description: str | None = None

    region: str | None = Field(None, max_length=128)
    district: str | None = Field(None, max_length=128)
    address: str = Field(max_length=512)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    rooms: int = Field(ge=1, le=20)
    area_sqm: Decimal | None = Field(None, ge=0)
    max_tenants: int | None = Field(None, ge=1, le=50)
    floor: int | None = Field(None, ge=0, le=200)
    total_floors: int | None = Field(None, ge=1, le=200)

    price_per_month: Decimal = Field(ge=0)
    currency: Currency = Currency.UZS
    deposit_amount: Decimal | None = Field(None, ge=0)


class HouseCreate(HouseBase):
    amenity_ids: list[int] = Field(default_factory=list)
    photo_urls: list[str] = Field(default_factory=list, max_length=20)


class HouseUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    region: str | None = Field(None, max_length=128)
    district: str | None = Field(None, max_length=128)
    address: str | None = Field(None, max_length=512)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    rooms: int | None = Field(None, ge=1, le=20)
    area_sqm: Decimal | None = Field(None, ge=0)
    max_tenants: int | None = Field(None, ge=1, le=50)
    floor: int | None = None
    total_floors: int | None = None
    price_per_month: Decimal | None = Field(None, ge=0)
    currency: Currency | None = None
    deposit_amount: Decimal | None = Field(None, ge=0)
    amenity_ids: list[int] | None = None


class HouseRejectRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1024)


# ---------- House output ----------
class HouseListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    region: str | None = None
    district: str | None = None
    address: str
    latitude: float
    longitude: float
    rooms: int
    area_sqm: Decimal | None = None
    price_per_month: Decimal
    currency: Currency
    status: HouseStatus
    is_top: bool
    views_count: int
    average_rating: Decimal
    reviews_count: int
    main_photo: str | None = None
    distance_km: float | None = None
    is_favorited: bool = False
    created_at: datetime


class HouseDetail(HouseListItem):
    description: str | None = None
    max_tenants: int | None = None
    floor: int | None = None
    total_floors: int | None = None
    deposit_amount: Decimal | None = None

    landlord_id: int
    landlord_name: str | None = None
    landlord_avatar: str | None = None
    landlord_phone: str | None = None  # only set for PRO viewers (or the landlord themselves)
    landlord_is_pro: bool = False

    photos: list[HousePhotoRead] = []
    amenities: list[AmenityRead] = []


# ---------- Filter ----------
HouseSort = Literal[
    "created_desc",
    "created_asc",
    "price_asc",
    "price_desc",
    "rating_desc",
    "views_desc",
]


class HouseFilter(BaseModel):
    q: str | None = Field(None, max_length=255)
    region: str | None = Field(None, max_length=128)
    district: str | None = Field(None, max_length=128)

    min_price: Decimal | None = Field(None, ge=0)
    max_price: Decimal | None = Field(None, ge=0)
    currency: Currency | None = None
    rooms: int | None = Field(None, ge=1, le=20)
    amenity_ids: list[int] | None = None

    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    radius_km: float | None = Field(None, gt=0, le=100)

    sort: HouseSort = "created_desc"
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

    @model_validator(mode="after")
    def _check_price_range(self):
        if self.min_price and self.max_price and self.min_price > self.max_price:
            raise ValueError("min_price cannot be greater than max_price")
        return self

    @model_validator(mode="after")
    def _check_geo(self):
        geo_parts = [self.latitude, self.longitude, self.radius_km]
        if any(p is not None for p in geo_parts) and not all(p is not None for p in geo_parts):
            raise ValueError("latitude, longitude and radius_km must all be provided together")
        return self
