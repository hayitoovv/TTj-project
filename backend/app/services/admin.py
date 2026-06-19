from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Blacklist,
    Booking,
    BookingStatus,
    House,
    HouseStatus,
    NotificationType,
    Payment,
    PaymentStatus,
    User,
    UserRole,
)
from app.schemas.admin import (
    DashboardStats,
    UserAdminListFilter,
    UserAdminRead,
)
from app.schemas.common import PaginatedResponse
from app.services.notification import notify


async def get_dashboard_stats(session: AsyncSession) -> DashboardStats:
    """Aggregate platform-wide statistics."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # User counts
    user_counts = await session.execute(
        select(
            func.count(User.id).label("total"),
            func.sum(case((User.role == UserRole.STUDENT, 1), else_=0)).label("students"),
            func.sum(case((User.role == UserRole.LANDLORD, 1), else_=0)).label("landlords"),
            func.sum(case((User.role == UserRole.CURATOR, 1), else_=0)).label("curators"),
            func.sum(case((User.is_blocked.is_(True), 1), else_=0)).label("blocked"),
            func.sum(case((User.created_at >= month_start, 1), else_=0)).label("new_this_month"),
        )
    )
    u = user_counts.one()

    # House counts
    house_counts = await session.execute(
        select(
            func.count(House.id).label("total"),
            func.sum(case((House.status == HouseStatus.PENDING, 1), else_=0)).label("pending"),
            func.sum(case((House.status == HouseStatus.APPROVED, 1), else_=0)).label("approved"),
            func.sum(case((House.status == HouseStatus.REJECTED, 1), else_=0)).label("rejected"),
        )
    )
    h = house_counts.one()

    # Booking counts
    booking_counts = await session.execute(
        select(
            func.count(Booking.id).label("total"),
            func.sum(case((Booking.status == BookingStatus.PENDING, 1), else_=0)).label("pending"),
            func.sum(case((Booking.status == BookingStatus.ACTIVE, 1), else_=0)).label("active"),
            func.sum(case((Booking.status == BookingStatus.ENDED, 1), else_=0)).label("ended"),
            func.sum(case((Booking.created_at >= month_start, 1), else_=0)).label("new_this_month"),
        )
    )
    b = booking_counts.one()

    # Revenue from completed payments
    revenue_query = await session.execute(
        select(
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
            func.coalesce(
                func.sum(
                    case((Payment.paid_at >= month_start, Payment.amount), else_=0)
                ),
                0,
            ).label("this_month"),
        ).where(Payment.status == PaymentStatus.COMPLETED)
    )
    r = revenue_query.one()

    # Platform fee from active/ended bookings
    fee_query = await session.execute(
        select(func.coalesce(func.sum(Booking.platform_fee), 0)).where(
            Booking.status.in_(
                [BookingStatus.ACTIVE, BookingStatus.ENDED, BookingStatus.CONFIRMED]
            )
        )
    )
    platform_fee = fee_query.scalar() or Decimal(0)

    return DashboardStats(
        total_users=u.total or 0,
        total_students=u.students or 0,
        total_landlords=u.landlords or 0,
        total_curators=u.curators or 0,
        blocked_users=u.blocked or 0,
        new_users_this_month=u.new_this_month or 0,
        total_houses=h.total or 0,
        pending_houses=h.pending or 0,
        approved_houses=h.approved or 0,
        rejected_houses=h.rejected or 0,
        total_bookings=b.total or 0,
        pending_bookings=b.pending or 0,
        active_bookings=b.active or 0,
        ended_bookings=b.ended or 0,
        new_bookings_this_month=b.new_this_month or 0,
        total_revenue=Decimal(r.total),
        total_platform_fee=Decimal(platform_fee),
        revenue_this_month=Decimal(r.this_month),
    )


async def list_users(
    session: AsyncSession, filters: UserAdminListFilter
) -> PaginatedResponse[UserAdminRead]:
    stmt = select(User)

    if filters.role is not None:
        stmt = stmt.where(User.role == filters.role)
    if filters.is_blocked is not None:
        stmt = stmt.where(User.is_blocked.is_(filters.is_blocked))
    if filters.is_verified is not None:
        stmt = stmt.where(User.is_verified.is_(filters.is_verified))
    if filters.q:
        like = f"%{filters.q}%"
        stmt = stmt.where(
            or_(
                User.phone.ilike(like),
                User.first_name.ilike(like),
                User.last_name.ilike(like),
                User.email.ilike(like),
            )
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(User.created_at.desc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    items = (await session.execute(stmt)).scalars().all()
    pages = (total + filters.page_size - 1) // filters.page_size if total else 0

    return PaginatedResponse[UserAdminRead](
        items=[UserAdminRead.model_validate(u) for u in items],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        pages=pages,
    )


async def block_user(
    session: AsyncSession, user_id: int, blocked_by: User, reason: str
) -> UserAdminRead:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "User not found"},
        )
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "cant_block_admin", "message": "Cannot block admin"},
        )

    user.is_blocked = True

    # Add to blacklist
    bl = Blacklist(user_id=user.id, blocked_by_id=blocked_by.id, reason=reason)
    session.add(bl)

    # Notify blocked user
    await notify(
        session,
        user.id,
        type=NotificationType.SYSTEM,
        title="Akkauntingiz bloklandi",
        body=f"Sizning akkauntingiz bloklandi. Sabab: {reason}. Admin bilan bog'laning.",
        data={"action": "blocked"},
    )

    await session.commit()
    return UserAdminRead.model_validate(user)


async def unblock_user(session: AsyncSession, user_id: int) -> UserAdminRead:
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "User not found"},
        )

    user.is_blocked = False

    # Remove from blacklist
    bl_stmt = select(Blacklist).where(Blacklist.user_id == user.id)
    bl = (await session.execute(bl_stmt)).scalar_one_or_none()
    if bl:
        await session.delete(bl)

    # Notify
    await notify(
        session,
        user.id,
        type=NotificationType.SYSTEM,
        title="Akkauntingiz tiklandi ✅",
        body="Sizning akkauntingiz qayta faol holatga keltirildi. Tizimdan foydalanishingiz mumkin.",
        data={"action": "unblocked"},
    )

    await session.commit()
    return UserAdminRead.model_validate(user)
