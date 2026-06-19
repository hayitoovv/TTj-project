from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ComplaintAgainstType, ComplaintStatus, ReviewTargetType

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.house import House
    from app.models.user import User


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating_range"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    target_type: Mapped[ReviewTargetType] = mapped_column(
        SAEnum(ReviewTargetType, name="review_target_type"), nullable=False
    )
    house_id: Mapped[int | None] = mapped_column(
        ForeignKey("houses.id", ondelete="CASCADE"), nullable=True, index=True
    )
    target_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    booking: Mapped[Booking] = relationship(back_populates="reviews")
    reviewer: Mapped[User] = relationship(back_populates="reviews_given", foreign_keys=[reviewer_id])
    house: Mapped[House | None] = relationship(back_populates="reviews", foreign_keys=[house_id])
    target_user: Mapped[User | None] = relationship(foreign_keys=[target_user_id])


class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    against_type: Mapped[ComplaintAgainstType] = mapped_column(
        SAEnum(ComplaintAgainstType, name="complaint_against_type"), nullable=False
    )
    against_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    against_house_id: Mapped[int | None] = mapped_column(
        ForeignKey("houses.id", ondelete="CASCADE"), nullable=True
    )
    booking_id: Mapped[int | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True
    )

    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[ComplaintStatus] = mapped_column(
        SAEnum(ComplaintStatus, name="complaint_status"),
        default=ComplaintStatus.NEW,
        nullable=False,
        index=True,
    )
    assigned_curator_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reporter: Mapped[User] = relationship(
        back_populates="complaints_reported", foreign_keys=[reporter_id]
    )
    against_user: Mapped[User | None] = relationship(foreign_keys=[against_user_id])
    assigned_curator: Mapped[User | None] = relationship(foreign_keys=[assigned_curator_id])
