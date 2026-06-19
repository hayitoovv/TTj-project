from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import Currency, HouseStatus

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.review import Review
    from app.models.user import User


house_amenity = Table(
    "house_amenity",
    Base.metadata,
    Column("house_id", Integer, ForeignKey("houses.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class Amenity(Base, TimestampMixin):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    houses: Mapped[list[House]] = relationship(secondary=house_amenity, back_populates="amenities")


class House(Base, TimestampMixin):
    __tablename__ = "houses"

    id: Mapped[int] = mapped_column(primary_key=True)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    region: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    district: Mapped[str | None] = mapped_column(String(128), nullable=True)
    address: Mapped[str] = mapped_column(String(512), nullable=False)
    latitude: Mapped[float] = mapped_column(nullable=False)
    longitude: Mapped[float] = mapped_column(nullable=False)

    rooms: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    area_sqm: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    max_tenants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[int | None] = mapped_column(Integer, nullable=True)

    price_per_month: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[Currency] = mapped_column(
        SAEnum(Currency, name="currency"), default=Currency.UZS, nullable=False
    )
    deposit_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    status: Mapped[HouseStatus] = mapped_column(
        SAEnum(HouseStatus, name="house_status"),
        default=HouseStatus.PENDING,
        nullable=False,
        index=True,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_top: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    top_until: Mapped[str | None] = mapped_column(String(64), nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0, nullable=False)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    landlord: Mapped[User] = relationship(back_populates="houses", foreign_keys=[landlord_id])
    photos: Mapped[list[HousePhoto]] = relationship(
        back_populates="house", cascade="all, delete-orphan", order_by="HousePhoto.order_num"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=house_amenity, back_populates="houses")
    bookings: Mapped[list[Booking]] = relationship(back_populates="house")
    reviews: Mapped[list[Review]] = relationship(
        back_populates="house",
        foreign_keys="Review.house_id",
    )


class HousePhoto(Base, TimestampMixin):
    __tablename__ = "house_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    house_id: Mapped[int] = mapped_column(ForeignKey("houses.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    order_num: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_main: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    house: Mapped[House] = relationship(back_populates="photos")
