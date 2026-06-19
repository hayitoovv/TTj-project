from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ChatRoomType, UserRole


class ChatParticipant(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    role: UserRole
    is_pro: bool = False


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    sender_id: int
    content: str
    attachment_url: str | None = None
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime


class ChatRoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: ChatRoomType
    booking_id: int | None = None
    last_message_at: datetime | None = None
    created_at: datetime
    participants: list[ChatParticipant] = []
    last_message: ChatMessageOut | None = None
    unread_count: int = 0


class ChatRoomCreate(BaseModel):
    peer_id: int = Field(..., description="The other user's ID")
    booking_id: int | None = None
    initial_message: str | None = Field(None, max_length=4000)


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    attachment_url: str | None = None


class WSIncoming(BaseModel):
    """Client -> server WS payload."""
    type: str = Field(..., description="message | typing | read")
    content: str | None = None
    attachment_url: str | None = None
