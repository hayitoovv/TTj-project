from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: NotificationType
    title: str
    body: str
    data: dict[str, Any] | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime


class NotificationListFilter(BaseModel):
    is_read: bool | None = None
    type: NotificationType | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class UnreadCountResponse(BaseModel):
    unread: int
