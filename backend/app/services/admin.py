from __future__ import annotations

from datetime import datetime, timedelta, timezone
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
    LandlordProfile,
    NotificationType,
    Payment,
    PaymentStatus,
    StudentProfile,
    Subscription,
    SubscriptionStatus,
    University,
    User,
    UserRole,
)
from app.schemas.admin import (
    AnalyticsOverview,
    DashboardStats,
    HousePoint,
    RevenuePoint,
    SignupPoint,
    TopRegion,
    TopUniversity,
    UserAdminListFilter,
    UserAdminRead,
)
from app.schemas.common import PaginatedResponse
from app.services.notification import notify

MONTH_LABELS_UZ = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"]


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


def _months_back(n: int) -> list[tuple[str, str, datetime, datetime]]:
    """Return list of (month_key, label, start, end) for last n months (oldest first)."""
    now = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    buckets = []
    cur = now
    for _ in range(n):
        # Next month boundary
        if cur.month == 12:
            nxt = cur.replace(year=cur.year + 1, month=1)
        else:
            nxt = cur.replace(month=cur.month + 1)
        buckets.append((f"{cur.year}-{cur.month:02d}", MONTH_LABELS_UZ[cur.month - 1], cur, nxt))
        # Go back one month
        if cur.month == 1:
            cur = cur.replace(year=cur.year - 1, month=12)
        else:
            cur = cur.replace(month=cur.month - 1)
    return list(reversed(buckets))


async def get_analytics_overview(session: AsyncSession) -> AnalyticsOverview:
    """6-month trends + top universities + top regions + PRO landlord counts."""
    buckets = _months_back(6)
    start_of_range = buckets[0][2]

    # Revenue trend (completed payments)
    revenue_stmt = (
        select(
            func.to_char(Payment.paid_at, "YYYY-MM").label("month"),
            func.coalesce(func.sum(Payment.amount), 0).label("revenue"),
            func.count(Payment.id).label("bookings"),
        )
        .where(
            Payment.status == PaymentStatus.COMPLETED,
            Payment.paid_at >= start_of_range,
        )
        .group_by("month")
    )
    rev_rows = {r.month: r for r in (await session.execute(revenue_stmt)).all()}

    # Platform fee by month from active+ended bookings
    fee_stmt = (
        select(
            func.to_char(Booking.confirmed_at, "YYYY-MM").label("month"),
            func.coalesce(func.sum(Booking.platform_fee), 0).label("fee"),
        )
        .where(
            Booking.status.in_(
                (BookingStatus.ACTIVE, BookingStatus.ENDED, BookingStatus.CONFIRMED)
            ),
            Booking.confirmed_at >= start_of_range,
        )
        .group_by("month")
    )
    fee_rows = {r.month: r.fee for r in (await session.execute(fee_stmt)).all()}

    revenue_trend = [
        RevenuePoint(
            month=key,
            label=label,
            revenue=Decimal(rev_rows[key].revenue) if key in rev_rows else Decimal(0),
            bookings=int(rev_rows[key].bookings) if key in rev_rows else 0,
            platform_fee=Decimal(fee_rows.get(key, 0)),
        )
        for key, label, _, _ in buckets
    ]

    # Signups by role
    signups_stmt = (
        select(
            func.to_char(User.created_at, "YYYY-MM").label("month"),
            User.role,
            func.count(User.id).label("cnt"),
        )
        .where(User.created_at >= start_of_range)
        .group_by("month", User.role)
    )
    signups_raw = (await session.execute(signups_stmt)).all()
    by_month_role: dict[str, dict[UserRole, int]] = {}
    for r in signups_raw:
        by_month_role.setdefault(r.month, {})[r.role] = r.cnt

    signup_trend = []
    for key, label, _, _ in buckets:
        m = by_month_role.get(key, {})
        students = int(m.get(UserRole.STUDENT, 0))
        landlords = int(m.get(UserRole.LANDLORD, 0))
        curators = int(m.get(UserRole.CURATOR, 0))
        signup_trend.append(
            SignupPoint(
                month=key,
                label=label,
                students=students,
                landlords=landlords,
                curators=curators,
                total=students + landlords + curators,
            )
        )

    # Houses by status per month
    houses_stmt = (
        select(
            func.to_char(House.created_at, "YYYY-MM").label("month"),
            func.count(House.id).label("created"),
            func.sum(case((House.status == HouseStatus.APPROVED, 1), else_=0)).label("approved"),
            func.sum(case((House.status == HouseStatus.REJECTED, 1), else_=0)).label("rejected"),
        )
        .where(House.created_at >= start_of_range)
        .group_by("month")
    )
    house_rows = {r.month: r for r in (await session.execute(houses_stmt)).all()}
    house_trend = [
        HousePoint(
            month=key,
            label=label,
            created=int(house_rows[key].created) if key in house_rows else 0,
            approved=int(house_rows[key].approved or 0) if key in house_rows else 0,
            rejected=int(house_rows[key].rejected or 0) if key in house_rows else 0,
        )
        for key, label, _, _ in buckets
    ]

    # Top 5 universities by student count
    uni_stmt = (
        select(
            University.id,
            University.name,
            University.short_name,
            func.count(StudentProfile.id).label("cnt"),
        )
        .join(StudentProfile, StudentProfile.university_id == University.id)
        .group_by(University.id, University.name, University.short_name)
        .order_by(func.count(StudentProfile.id).desc())
        .limit(5)
    )
    top_universities = [
        TopUniversity(
            university_id=row.id,
            name=row.name,
            short_name=row.short_name,
            student_count=row.cnt,
        )
        for row in (await session.execute(uni_stmt)).all()
    ]

    # Top 5 regions
    region_stmt = (
        select(
            House.region,
            func.count(House.id).label("house_count"),
        )
        .where(House.region.isnot(None))
        .group_by(House.region)
        .order_by(func.count(House.id).desc())
        .limit(5)
    )
    region_rows = (await session.execute(region_stmt)).all()
    booking_counts_stmt = (
        select(House.region, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.house_id == House.id)
        .where(House.region.in_([r.region for r in region_rows]))
        .group_by(House.region)
    )
    booking_by_region = {
        r.region: int(r.cnt) for r in (await session.execute(booking_counts_stmt)).all()
    }
    top_regions = [
        TopRegion(
            region=r.region,
            house_count=int(r.house_count),
            booking_count=booking_by_region.get(r.region, 0),
        )
        for r in region_rows
    ]

    # Average booking amount
    avg_stmt = select(func.coalesce(func.avg(Booking.total_amount), 0))
    avg_amount = (await session.execute(avg_stmt)).scalar_one() or Decimal(0)

    # PRO landlords (currently active)
    now = datetime.now(timezone.utc)
    pro_landlords_stmt = select(func.count(LandlordProfile.id)).where(
        LandlordProfile.is_pro.is_(True),
        or_(LandlordProfile.pro_until.is_(None), LandlordProfile.pro_until > now),
    )
    pro_landlords = int((await session.execute(pro_landlords_stmt)).scalar_one() or 0)

    active_sub_stmt = select(func.count(Subscription.id)).where(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.ends_at > now,
    )
    active_subs = int((await session.execute(active_sub_stmt)).scalar_one() or 0)

    return AnalyticsOverview(
        revenue_trend=revenue_trend,
        signup_trend=signup_trend,
        house_trend=house_trend,
        top_universities=top_universities,
        top_regions=top_regions,
        avg_booking_amount=Decimal(avg_amount),
        pro_landlords_count=pro_landlords,
        active_pro_subscriptions=active_subs,
    )


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
