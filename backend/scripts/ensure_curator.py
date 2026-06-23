"""
Idempotent script: ensure a demo curator account exists.

Unlike scripts.seed, this does NOT wipe existing data — safe to run on a
production database that is already seeded. Creates the curator user, its
CuratorProfile and an assigned group only if they don't already exist.

Run inside the backend container:
    docker compose -f docker-compose.prod.yml exec backend python -m scripts.ensure_curator
"""
from __future__ import annotations

import asyncio
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import (
    CuratorGroup,
    CuratorProfile,
    University,
    User,
    UserRole,
)

CURATOR_PHONE = "+998901111110"
CURATOR_PASSWORD = "test1234"
GROUP_NAME = "113-23"


async def ensure_curator() -> None:
    async with AsyncSessionLocal() as db:
        existing = (
            await db.execute(
                select(User)
                .options(selectinload(User.curator_profile))
                .where(User.phone == CURATOR_PHONE)
            )
        ).scalar_one_or_none()

        if existing:
            print(f"ℹ️  Curator already exists: {existing.phone}")
            # Make sure it has a profile (in case it was created another way)
            if existing.curator_profile is None:
                uni = (await db.execute(select(University).limit(1))).scalar_one_or_none()
                db.add(
                    CuratorProfile(
                        user_id=existing.id,
                        university_id=uni.id if uni else None,
                        position="Talabalar bilan ishlash bo'limi kuratori",
                    )
                )
                await db.commit()
                print("✅ Added missing CuratorProfile to existing curator")
            return

        uni = (await db.execute(select(University).limit(1))).scalar_one_or_none()

        curator = User(
            phone=CURATOR_PHONE,
            password_hash=hash_password(CURATOR_PASSWORD),
            role=UserRole.CURATOR,
            first_name="Dilshod",
            last_name="Karimov",
            is_verified=True,
            phone_verified_at=datetime.utcnow(),
        )
        db.add(curator)
        await db.flush()

        profile = CuratorProfile(
            user_id=curator.id,
            university_id=uni.id if uni else None,
            position="Talabalar bilan ishlash bo'limi kuratori",
        )
        db.add(profile)
        await db.flush()

        if uni:
            db.add(
                CuratorGroup(
                    curator_id=profile.id,
                    university_id=uni.id,
                    group_name=GROUP_NAME,
                )
            )

        await db.commit()
        print(f"✅ Curator created: {CURATOR_PHONE} / {CURATOR_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(ensure_curator())
