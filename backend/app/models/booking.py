from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import BookingStatus, Currency

if TYPE_CHECKING:
    from app.models.house import House
    from app.models.payment import Payment
    from app.models.review import Review
    from app.models.user import User


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    house_id: Mapped[int] = mapped_column(ForeignKey("houses.id", ondelete="CASCADE"), index=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    monthly_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[Currency] = mapped_column(
        SAEnum(Currency, name="currency"), default=Currency.UZS, nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    platform_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    service_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="booking_status"),
        default=BookingStatus.PENDING,
        nullable=False,
        index=True,
    )
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student: Mapped[User] = relationship(back_populates="bookings", foreign_keys=[student_id])
    house: Mapped[House] = relationship(back_populates="bookings")
    contract: Mapped[Contract | None] = relationship(
        back_populates="booking", cascade="all, delete-orphan", uselist=False
    )
    payments: Mapped[list[Payment]] = relationship(back_populates="booking")
    reviews: Mapped[list[Review]] = relationship(back_populates="booking")


class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), unique=True
    )
    contract_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    pdf_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    terms_version: Mapped[str] = mapped_column(String(32), default="1.0", nullable=False)
    student_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    landlord_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    booking: Mapped[Booking] = relationship(back_populates="contract")
