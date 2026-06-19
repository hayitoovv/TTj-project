from __future__ import annotations

import logging
import secrets
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class SMSClient:
    """
    Eskiz.uz SMS client.
    In development (no ESKIZ_EMAIL set), runs in mock mode and logs the SMS.
    """

    BASE_URL = "https://notify.eskiz.uz/api"

    def __init__(self) -> None:
        self._token: str | None = None
        self._token_obtained_at: datetime | None = None
        self.mock_mode = not (settings.ESKIZ_EMAIL and settings.ESKIZ_PASSWORD)

    async def _get_token(self) -> str:
        if self._token:
            return self._token
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.BASE_URL}/auth/login",
                data={"email": settings.ESKIZ_EMAIL, "password": settings.ESKIZ_PASSWORD},
            )
            resp.raise_for_status()
            data = resp.json()
            self._token = data["data"]["token"]
            self._token_obtained_at = datetime.utcnow()
            return self._token

    async def send(self, phone: str, message: str) -> bool:
        if self.mock_mode:
            logger.warning("[SMS MOCK] to=%s message=%s", phone, message)
            return True

        phone_digits = phone.lstrip("+")
        token = await self._get_token()
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{self.BASE_URL}/message/sms/send",
                headers={"Authorization": f"Bearer {token}"},
                data={"mobile_phone": phone_digits, "message": message, "from": settings.ESKIZ_FROM},
            )
            if resp.status_code >= 400:
                logger.error("Eskiz SMS failed: %s %s", resp.status_code, resp.text)
                return False
            return True

    async def send_verification_code(self, phone: str, code: str) -> bool:
        message = f"TTJ Platforma tasdiqlash kodi: {code}. Kod 5 daqiqa amal qiladi."
        return await self.send(phone, message)


def generate_code(length: int = 6) -> str:
    return "".join(str(secrets.randbelow(10)) for _ in range(length))


sms_client = SMSClient()
