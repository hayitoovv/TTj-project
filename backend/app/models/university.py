from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import CuratorGroup, CuratorProfile, StudentProfile


class University(Base, TimestampMixin):
    __tablename__ = "universities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    short_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hemis_code: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    region: Mapped[str | None] = mapped_column(String(128), nullable=True)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)

    students: Mapped[list[StudentProfile]] = relationship(back_populates="university")
    curators: Mapped[list[CuratorProfile]] = relationship(back_populates="university")
    curator_groups: Mapped[list[CuratorGroup]] = relationship(back_populates="university")
