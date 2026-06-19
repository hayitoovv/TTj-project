from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class HemisStudent:
    hemis_id: str
    full_name: str
    first_name: str
    last_name: str
    phone: str | None
    university_name: str
    university_code: str | None
    faculty: str | None
    course: int | None
    group_name: str | None
    gender: str | None


class HemisClient:
    """
    HEMIS integratsiya klienti.
    Real HEMIS API ga ulanish uchun HEMIS_API_URL + token kerak.
    Hozircha dev uchun mock ishlaydi.
    """

    def __init__(self) -> None:
        self.mock_mode = not (settings.HEMIS_API_URL and settings.HEMIS_API_TOKEN)

    async def authenticate(self, login: str, password: str) -> HemisStudent | None:
        if self.mock_mode:
            return self._mock_authenticate(login, password)

        async with httpx.AsyncClient(timeout=20) as client:
            try:
                resp = await client.post(
                    f"{settings.HEMIS_API_URL}/auth/login",
                    json={"login": login, "password": password},
                    headers={"Authorization": f"Bearer {settings.HEMIS_API_TOKEN}"},
                )
                if resp.status_code != 200:
                    logger.warning("HEMIS auth failed: %s", resp.status_code)
                    return None
                data = resp.json().get("data", {})
                return self._map_student(data)
            except httpx.HTTPError as exc:
                logger.exception("HEMIS request failed", exc_info=exc)
                return None

    @staticmethod
    def _mock_authenticate(login: str, password: str) -> HemisStudent | None:
        if password != "test1234":
            return None
        return HemisStudent(
            hemis_id=f"HEMIS-{login}",
            full_name="Test Student",
            first_name="Test",
            last_name="Student",
            phone=None,
            university_name="Toshkent Axborot Texnologiyalari Universiteti",
            university_code="TUIT",
            faculty="Kompyuter injiniringi",
            course=2,
            group_name=f"{login[-4:]}-23",
            gender="male",
        )

    @staticmethod
    def _map_student(data: dict) -> HemisStudent:
        full_name = data.get("full_name", "")
        parts = full_name.split(" ", 1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""
        return HemisStudent(
            hemis_id=str(data.get("student_id_number", "")),
            full_name=full_name,
            first_name=data.get("first_name", first_name),
            last_name=data.get("second_name", last_name),
            phone=data.get("phone"),
            university_name=data.get("university", {}).get("name", ""),
            university_code=data.get("university", {}).get("code"),
            faculty=data.get("faculty", {}).get("name"),
            course=int(data["level"]["code"]) if data.get("level", {}).get("code") else None,
            group_name=data.get("group", {}).get("name"),
            gender=data.get("gender", {}).get("code"),
        )


hemis_client = HemisClient()
