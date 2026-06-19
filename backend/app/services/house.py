from __future__ import annotations

import math
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, case, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Amenity,
    House,
    HousePhoto,
    HouseStatus,
    LandlordProfile,
    NotificationType,
    User,
    UserRole,
    house_amenity,
)
from app.schemas.common import PaginatedResponse
from app.services.notification import notify
from app.schemas.house import (
    HouseCreate,
    HouseDetail,
    HouseFilter,
    HouseListItem,
    HousePhotoCreate,
    HousePhotoRead,
    HouseUpdate,
)

FREE_LISTINGS_LIMIT = 5
EARTH_RADIUS_KM = 6371.0


class HouseError(HTTPException):
    def __init__(self, msg: str, code: str = "house_error", http_status: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=http_status, detail={"code": code, "message": msg})


# ---------- helpers ----------
def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    dlat = lat2r - lat1r
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1r) * math.cos(lat2r) * math.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def _bounding_box(lat: float, lng: float, radius_km: float) -> tuple[float, float, float, float]:
    delta_lat = radius_km / 111.0
    delta_lng = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))
    return lat - delta_lat, lat + delta_lat, lng - delta_lng, lng + delta_lng


def _main_photo_url(house: House) -> str | None:
    if not house.photos:
        return None
    main = next((p for p in house.photos if p.is_main), None)
    return (main or house.photos[0]).url


async def _load_house(session: AsyncSession, house_id: int, *, with_landlord: bool = False) -> House:
    stmt = (
        select(House)
        .options(
            selectinload(House.photos),
            selectinload(House.amenities),
        )
        .where(House.id == house_id)
    )
    if with_landlord:
        stmt = stmt.options(selectinload(House.landlord))
    house = (await session.execute(stmt)).scalar_one_or_none()
    if not house:
        raise HouseError("House not found", code="not_found", http_status=status.HTTP_404_NOT_FOUND)
    return house


async def _get_landlord_profile(session: AsyncSession, user_id: int) -> LandlordProfile:
    stmt = select(LandlordProfile).where(LandlordProfile.user_id == user_id)
    profile = (await session.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HouseError("Landlord profile missing", code="no_profile", http_status=status.HTTP_400_BAD_REQUEST)
    return profile


def _is_pro_active(profile: LandlordProfile) -> bool:
    if not profile.is_pro:
        return False
    return profile.pro_until is None or profile.pro_until > datetime.utcnow()


async def _set_amenities(session: AsyncSession, house: House, amenity_ids: list[int]) -> None:
    # Always clear existing first
    await session.execute(delete(house_amenity).where(house_amenity.c.house_id == house.id))
    if not amenity_ids:
        return
    # Validate amenity_ids exist
    stmt = select(Amenity.id).where(Amenity.id.in_(amenity_ids))
    found_ids = set((await session.execute(stmt)).scalars().all())
    missing = set(amenity_ids) - found_ids
    if missing:
        raise HouseError(f"Unknown amenity ids: {sorted(missing)}", code="bad_amenity")
    # Direct M2M insert (avoids async lazy-load issue)
    for amen_id in amenity_ids:
        await session.execute(
            house_amenity.insert().values(house_id=house.id, amenity_id=amen_id)
        )


def _to_list_item(house: House, distance_km: float | None = None) -> HouseListItem:
    return HouseListItem(
        id=house.id,
        title=house.title,
        region=house.region,
        district=house.district,
        address=house.address,
        latitude=house.latitude,
        longitude=house.longitude,
        rooms=house.rooms,
        area_sqm=house.area_sqm,
        price_per_month=house.price_per_month,
        currency=house.currency,
        status=house.status,
        is_top=house.is_top,
        views_count=house.views_count,
        average_rating=house.average_rating,
        reviews_count=house.reviews_count,
        main_photo=_main_photo_url(house),
        distance_km=distance_km,
        created_at=house.created_at,
    )


def _to_detail(house: House) -> HouseDetail:
    landlord_name = None
    landlord_avatar = None
    if house.landlord:
        first = house.landlord.first_name or ""
        last = house.landlord.last_name or ""
        landlord_name = (first + " " + last).strip() or None
        landlord_avatar = house.landlord.avatar_url

    return HouseDetail(
        id=house.id,
        title=house.title,
        description=house.description,
        region=house.region,
        district=house.district,
        address=house.address,
        latitude=house.latitude,
        longitude=house.longitude,
        rooms=house.rooms,
        area_sqm=house.area_sqm,
        max_tenants=house.max_tenants,
        floor=house.floor,
        total_floors=house.total_floors,
        price_per_month=house.price_per_month,
        currency=house.currency,
        deposit_amount=house.deposit_amount,
        status=house.status,
        is_top=house.is_top,
        views_count=house.views_count,
        average_rating=house.average_rating,
        reviews_count=house.reviews_count,
        main_photo=_main_photo_url(house),
        created_at=house.created_at,
        landlord_id=house.landlord_id,
        landlord_name=landlord_name,
        landlord_avatar=landlord_avatar,
        photos=[HousePhotoRead.model_validate(p) for p in house.photos],
        amenities=[a for a in house.amenities],
    )


# ---------- public / landlord queries ----------
async def list_houses(
    session: AsyncSession,
    filters: HouseFilter,
    *,
    viewer: User | None = None,
    only_landlord_id: int | None = None,
) -> PaginatedResponse[HouseListItem]:
    stmt = select(House).options(selectinload(House.photos))

    if only_landlord_id is not None:
        stmt = stmt.where(House.landlord_id == only_landlord_id)
    elif viewer and viewer.role == UserRole.ADMIN:
        pass
    else:
        stmt = stmt.where(House.status == HouseStatus.APPROVED)

    if filters.q:
        like = f"%{filters.q.lower()}%"
        stmt = stmt.where(
            or_(func.lower(House.title).like(like), func.lower(House.address).like(like))
        )
    if filters.region:
        stmt = stmt.where(House.region == filters.region)
    if filters.district:
        stmt = stmt.where(House.district == filters.district)
    if filters.min_price is not None:
        stmt = stmt.where(House.price_per_month >= filters.min_price)
    if filters.max_price is not None:
        stmt = stmt.where(House.price_per_month <= filters.max_price)
    if filters.currency is not None:
        stmt = stmt.where(House.currency == filters.currency)
    if filters.rooms is not None:
        stmt = stmt.where(House.rooms == filters.rooms)

    if filters.amenity_ids:
        amenity_sub = (
            select(house_amenity.c.house_id)
            .where(house_amenity.c.amenity_id.in_(filters.amenity_ids))
            .group_by(house_amenity.c.house_id)
            .having(func.count(house_amenity.c.amenity_id) == len(set(filters.amenity_ids)))
        )
        stmt = stmt.where(House.id.in_(amenity_sub))

    bbox = None
    if filters.latitude is not None:
        bbox = _bounding_box(filters.latitude, filters.longitude, filters.radius_km)
        min_lat, max_lat, min_lng, max_lng = bbox
        stmt = stmt.where(
            and_(
                House.latitude.between(min_lat, max_lat),
                House.longitude.between(min_lng, max_lng),
            )
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    top_order = case((House.is_top.is_(True), 0), else_=1)
    # For default sort, smart ranking: TOP first, then by rating, then newest
    if filters.sort == "created_desc":
        stmt = stmt.order_by(
            top_order,
            House.average_rating.desc(),
            House.reviews_count.desc(),
            House.created_at.desc(),
        )
    else:
        order_map = {
            "created_asc": House.created_at.asc(),
            "price_asc": House.price_per_month.asc(),
            "price_desc": House.price_per_month.desc(),
            "rating_desc": (House.average_rating.desc(), House.reviews_count.desc()),
            "views_desc": House.views_count.desc(),
        }
        sort_clause = order_map.get(filters.sort, House.created_at.desc())
        if isinstance(sort_clause, tuple):
            stmt = stmt.order_by(top_order, *sort_clause)
        else:
            stmt = stmt.order_by(top_order, sort_clause)

    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    houses = (await session.execute(stmt)).scalars().unique().all()

    # Get viewer's favorited IDs (single query)
    fav_ids: set[int] = set()
    if viewer is not None and houses:
        from app.models import Favorite
        fav_stmt = select(Favorite.house_id).where(
            Favorite.user_id == viewer.id,
            Favorite.house_id.in_([h.id for h in houses]),
        )
        fav_ids = set((await session.execute(fav_stmt)).scalars().all())

    items: list[HouseListItem] = []
    for h in houses:
        distance = None
        if filters.latitude is not None:
            distance = round(
                _haversine_km(filters.latitude, filters.longitude, h.latitude, h.longitude), 3
            )
            if distance > filters.radius_km:
                continue
        item = _to_list_item(h, distance)
        item.is_favorited = h.id in fav_ids
        items.append(item)

    pages = (total + filters.page_size - 1) // filters.page_size if total else 0
    return PaginatedResponse[HouseListItem](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )


async def get_house(session: AsyncSession, house_id: int, *, viewer: User | None = None) -> HouseDetail:
    house = await _load_house(session, house_id, with_landlord=True)

    is_landlord_owner = viewer and viewer.id == house.landlord_id
    is_admin = viewer and viewer.role == UserRole.ADMIN
    if house.status != HouseStatus.APPROVED and not (is_landlord_owner or is_admin):
        raise HouseError("House not found", code="not_found", http_status=status.HTTP_404_NOT_FOUND)

    if not is_landlord_owner and not is_admin:
        house.views_count += 1
        await session.commit()

    detail = _to_detail(house)
    if viewer:
        from app.models import Favorite
        fav_stmt = select(Favorite.id).where(
            Favorite.user_id == viewer.id, Favorite.house_id == house.id
        )
        detail.is_favorited = (
            (await session.execute(fav_stmt.limit(1))).scalar_one_or_none() is not None
        )
    return detail


# ---------- landlord mutations ----------
async def create_house(session: AsyncSession, landlord: User, payload: HouseCreate) -> HouseDetail:
    profile = await _get_landlord_profile(session, landlord.id)
    if not _is_pro_active(profile) and profile.free_listings_used >= FREE_LISTINGS_LIMIT:
        raise HouseError(
            f"Free listing limit reached ({FREE_LISTINGS_LIMIT}). Upgrade to PRO to add more.",
            code="limit_reached",
            http_status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    house = House(
        landlord_id=landlord.id,
        title=payload.title,
        description=payload.description,
        region=payload.region,
        district=payload.district,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        rooms=payload.rooms,
        area_sqm=payload.area_sqm,
        max_tenants=payload.max_tenants,
        floor=payload.floor,
        total_floors=payload.total_floors,
        price_per_month=payload.price_per_month,
        currency=payload.currency,
        deposit_amount=payload.deposit_amount,
        status=HouseStatus.PENDING,
    )
    session.add(house)
    await session.flush()

    await _set_amenities(session, house, payload.amenity_ids)

    for idx, url in enumerate(payload.photo_urls):
        session.add(HousePhoto(house_id=house.id, url=url, order_num=idx, is_main=(idx == 0)))

    if not _is_pro_active(profile):
        profile.free_listings_used += 1

    await session.commit()
    fresh = await _load_house(session, house.id, with_landlord=True)
    return _to_detail(fresh)


async def update_house(
    session: AsyncSession, house_id: int, landlord: User, payload: HouseUpdate
) -> HouseDetail:
    house = await _load_house(session, house_id, with_landlord=True)
    if house.landlord_id != landlord.id:
        raise HouseError("Not your house", code="forbidden", http_status=status.HTTP_403_FORBIDDEN)

    data = payload.model_dump(exclude_unset=True)
    amenity_ids = data.pop("amenity_ids", None)
    for field, value in data.items():
        setattr(house, field, value)

    if amenity_ids is not None:
        await _set_amenities(session, house, amenity_ids)

    significant_fields = {"address", "latitude", "longitude", "price_per_month", "rooms"}
    if significant_fields & data.keys() and house.status in (HouseStatus.APPROVED, HouseStatus.REJECTED):
        house.status = HouseStatus.PENDING
        house.rejection_reason = None

    await session.commit()
    fresh = await _load_house(session, house_id, with_landlord=True)
    return _to_detail(fresh)


async def delete_house(session: AsyncSession, house_id: int, landlord: User) -> None:
    house = await _load_house(session, house_id)
    if house.landlord_id != landlord.id and landlord.role != UserRole.ADMIN:
        raise HouseError("Not your house", code="forbidden", http_status=status.HTTP_403_FORBIDDEN)
    await session.delete(house)
    await session.commit()


# ---------- photos ----------
async def add_photos(
    session: AsyncSession, house_id: int, landlord: User, photos: list[HousePhotoCreate]
) -> list[HousePhotoRead]:
    house = await _load_house(session, house_id)
    if house.landlord_id != landlord.id:
        raise HouseError("Not your house", code="forbidden", http_status=status.HTTP_403_FORBIDDEN)

    has_main = any(p.is_main for p in house.photos)
    existing_count = len(house.photos)

    new_photos: list[HousePhoto] = []
    for i, photo in enumerate(photos):
        if photo.is_main:
            for p in house.photos:
                p.is_main = False
            for np in new_photos:
                np.is_main = False
            has_main = True
        elif not has_main and i == 0:
            photo.is_main = True
            has_main = True
        new_photos.append(
            HousePhoto(
                house_id=house.id,
                url=photo.url,
                order_num=existing_count + i if photo.order_num == 0 else photo.order_num,
                is_main=photo.is_main,
            )
        )
    session.add_all(new_photos)
    await session.commit()
    for np in new_photos:
        await session.refresh(np)
    return [HousePhotoRead.model_validate(p) for p in new_photos]


async def delete_photo(session: AsyncSession, house_id: int, photo_id: int, landlord: User) -> None:
    house = await _load_house(session, house_id)
    if house.landlord_id != landlord.id:
        raise HouseError("Not your house", code="forbidden", http_status=status.HTTP_403_FORBIDDEN)

    photo = next((p for p in house.photos if p.id == photo_id), None)
    if not photo:
        raise HouseError("Photo not found", code="not_found", http_status=status.HTTP_404_NOT_FOUND)

    was_main = photo.is_main
    await session.delete(photo)
    await session.flush()

    if was_main:
        remaining = [p for p in house.photos if p.id != photo_id]
        if remaining:
            remaining[0].is_main = True
    await session.commit()


# ---------- admin moderation ----------
async def approve_house(session: AsyncSession, house_id: int) -> HouseDetail:
    house = await _load_house(session, house_id, with_landlord=True)
    house.status = HouseStatus.APPROVED
    house.rejection_reason = None
    await notify(
        session,
        house.landlord_id,
        type=NotificationType.SYSTEM,
        title="E'lon tasdiqlandi ✅",
        body=f"«{house.title}» e'loni admin tomonidan tasdiqlandi va endi talabalar uchun ko'rinadi.",
        data={"house_id": house.id, "action": "approved"},
    )
    await session.commit()
    return _to_detail(house)


async def reject_house(session: AsyncSession, house_id: int, reason: str) -> HouseDetail:
    house = await _load_house(session, house_id, with_landlord=True)
    house.status = HouseStatus.REJECTED
    house.rejection_reason = reason
    await notify(
        session,
        house.landlord_id,
        type=NotificationType.SYSTEM,
        title="E'lon rad etildi",
        body=f"«{house.title}» e'loni rad etildi. Sabab: {reason}. E'lonni tahrirlab qayta yuborishingiz mumkin.",
        data={"house_id": house.id, "action": "rejected", "reason": reason},
    )
    await session.commit()
    return _to_detail(house)
