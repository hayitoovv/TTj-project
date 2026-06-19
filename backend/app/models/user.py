from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import Gender, UserRole

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.chat import ChatMessage
    from app.models.house import House
    from app.models.notification import Notification
    from app.models.review import Complaint, Review
    from app.models.subscription import Subscription
    from app.models.university import University


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), nullable=False, index=True)

    first_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student_profile: Mapped[StudentProfile | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    landlord_profile: Mapped[LandlordProfile | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    curator_profile: Mapped[CuratorProfile | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    admin_profile: Mapped[AdminProfile | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )

    houses: Mapped[list[House]] = relationship(
        back_populates="landlord", foreign_keys="House.landlord_id"
    )
    bookings: Mapped[list[Booking]] = relationship(
        back_populates="student", foreign_keys="Booking.student_id"
    )
    sent_messages: Mapped[list[ChatMessage]] = relationship(
        back_populates="sender", foreign_keys="ChatMessage.sender_id"
    )
    reviews_given: Mapped[list[Review]] = relationship(
        back_populates="reviewer", foreign_keys="Review.reviewer_id"
    )
    complaints_reported: Mapped[list[Complaint]] = relationship(
        back_populates="reporter", foreign_keys="Complaint.reporter_id"
    )
    notifications: Mapped[list[Notification]] = relationship(back_populates="user")
    subscriptions: Mapped[list[Subscription]] = relationship(back_populates="user")


class StudentProfile(Base, TimestampMixin):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    hemis_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)
    university_id: Mapped[int | None] = mapped_column(ForeignKey("universities.id"), nullable=True)
    faculty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    course: Mapped[int | None] = mapped_column(nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    gender: Mapped[Gender | None] = mapped_column(SAEnum(Gender, name="gender"), nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped[User] = relationship(back_populates="student_profile")
    university: Mapped[University | None] = relationship(back_populates="students")


class LandlordProfile(Base, TimestampMixin):
    __tablename__ = "landlord_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    passport_series: Mapped[str | None] = mapped_column(String(16), nullable=True)
    passport_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pinfl: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)

    is_pro: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pro_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    free_listings_used: Mapped[int] = mapped_column(default=0, nullable=False)
    is_verified_landlord: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="landlord_profile")


class CuratorProfile(Base, TimestampMixin):
    __tablename__ = "curator_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    university_id: Mapped[int | None] = mapped_column(ForeignKey("universities.id"), nullable=True)
    position: Mapped[str | None] = mapped_column(String(128), nullable=True)

    user: Mapped[User] = relationship(back_populates="curator_profile")
    university: Mapped[University | None] = relationship(back_populates="curators")
    assigned_groups: Mapped[list[CuratorGroup]] = relationship(
        back_populates="curator", cascade="all, delete-orphan"
    )


class CuratorGroup(Base, TimestampMixin):
    __tablename__ = "curator_groups"
    __table_args__ = (
        UniqueConstraint("curator_id", "university_id", "group_name", name="uq_curator_group"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    curator_id: Mapped[int] = mapped_column(ForeignKey("curator_profiles.id", ondelete="CASCADE"))
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id"))
    faculty: Mapped[str | None] = mapped_column(String(255), nullable=True)
    course: Mapped[int | None] = mapped_column(nullable=True)
    group_name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    curator: Mapped[CuratorProfile] = relationship(back_populates="assigned_groups")
    university: Mapped[University] = relationship(back_populates="curator_groups")


class AdminProfile(Base, TimestampMixin):
    __tablename__ = "admin_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    permissions: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    user: Mapped[User] = relationship(back_populates="admin_profile")
