from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Favorite, House, HouseStatus, User
from app.schemas.common import PaginatedResponse
from app.schemas.house import HouseFilter, HouseListItem
from app.services import house as house_service


async def add_favorite(session: AsyncSession, user: User, house_id: int) -> None:
    house = await session.get(House, house_id)
    if not house:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "House not found"},
        )

    fav = Favorite(user_id=user.id, house_id=house_id)
    session.add(fav)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        # Already favorited — silently OK


async def remove_favorite(session: AsyncSession, user: User, house_id: int) -> None:
    await session.execute(
        delete(Favorite).where(
            Favorite.user_id == user.id, Favorite.house_id == house_id
        )
    )
    await session.commit()


async def list_favorite_ids(session: AsyncSession, user: User) -> set[int]:
    stmt = select(Favorite.house_id).where(Favorite.user_id == user.id)
    rows = (await session.execute(stmt)).scalars().all()
    return set(rows)


async def list_favorites(
    session: AsyncSession, user: User, filters: HouseFilter
) -> PaginatedResponse[HouseListItem]:
    """List houses favorited by user (uses house_service.list_houses with favorite ids)."""
    fav_ids = await list_favorite_ids(session, user)
    if not fav_ids:
        return PaginatedResponse[HouseListItem](
            items=[],
            total=0,
            page=filters.page,
            page_size=filters.page_size,
            pages=0,
        )

    # Query favorited houses — include both bookable (APPROVED) and currently
    # rented (RENTED) so users keep visibility of their saves through a tenant
    # cycle. Hide pending/rejected/inactive (admin-only states).
    from sqlalchemy import func

    visible = (HouseStatus.APPROVED, HouseStatus.RENTED)
    stmt = (
        select(House)
        .options(selectinload(House.photos))
        .where(House.id.in_(fav_ids), House.status.in_(visible))
    )

    from sqlalchemy import func as _f
    count_stmt = select(_f.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(House.created_at.desc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)
    houses = (await session.execute(stmt)).scalars().unique().all()
    items = [house_service._to_list_item(h) for h in houses]
    # Mark all as favorited
    for item in items:
        item.is_favorited = True
    pages = (total + filters.page_size - 1) // filters.page_size if total else 0
    return PaginatedResponse[HouseListItem](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )
