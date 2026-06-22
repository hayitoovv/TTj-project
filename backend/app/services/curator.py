from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from datetime import datetime, timezone

from app.models import (
    Booking,
    BookingStatus,
    Complaint,
    ComplaintStatus,
    House,
    LandlordProfile,
    Payment,
    PaymentStatus,
    StudentProfile,
    University,
    User,
    UserRole,
)
from app.models.enums import SubscriptionStatus
from app.models.subscription import Subscription
from app.schemas.common import PaginatedResponse
from app.schemas.curator import (
    CurrentLandlordInfo,
    LandlordListFilter,
    LandlordListItem,
    StudentBookingSummary,
    StudentComplaintSummary,
    StudentDetail,
    StudentListFilter,
    StudentListItem,
)


async def list_students(
    session: AsyncSession, filters: StudentListFilter
) -> PaginatedResponse[StudentListItem]:
    # Subqueries for counts
    active_bookings_subq = (
        select(
            Booking.student_id,
            func.count(Booking.id).label("cnt"),
        )
        .where(Booking.status == BookingStatus.ACTIVE)
        .group_by(Booking.student_id)
        .subquery()
    )

    total_bookings_subq = (
        select(
            Booking.student_id,
            func.count(Booking.id).label("cnt"),
        )
        .group_by(Booking.student_id)
        .subquery()
    )

    open_complaints_subq = (
        select(
            Complaint.reporter_id.label("user_id"),
            func.count(Complaint.id).label("cnt"),
        )
        .where(Complaint.status.in_((ComplaintStatus.NEW, ComplaintStatus.PROCESSING)))
        .group_by(Complaint.reporter_id)
        .subquery()
    )

    stmt = (
        select(
            User,
            StudentProfile,
            University,
            func.coalesce(active_bookings_subq.c.cnt, 0).label("active_bookings"),
            func.coalesce(total_bookings_subq.c.cnt, 0).label("total_bookings"),
            func.coalesce(open_complaints_subq.c.cnt, 0).label("open_complaints"),
        )
        .select_from(User)
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .outerjoin(University, University.id == StudentProfile.university_id)
        .outerjoin(active_bookings_subq, active_bookings_subq.c.student_id == User.id)
        .outerjoin(total_bookings_subq, total_bookings_subq.c.student_id == User.id)
        .outerjoin(open_complaints_subq, open_complaints_subq.c.user_id == User.id)
        .where(User.role == UserRole.STUDENT)
    )

    if filters.university_id is not None:
        stmt = stmt.where(StudentProfile.university_id == filters.university_id)
    if filters.course is not None:
        stmt = stmt.where(StudentProfile.course == filters.course)
    if filters.is_blocked is not None:
        stmt = stmt.where(User.is_blocked.is_(filters.is_blocked))
    if filters.q:
        like = f"%{filters.q}%"
        stmt = stmt.where(
            or_(
                User.phone.ilike(like),
                User.first_name.ilike(like),
                User.last_name.ilike(like),
                StudentProfile.hemis_id.ilike(like),
                StudentProfile.group_name.ilike(like),
            )
        )

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    # Sort and paginate
    stmt = stmt.order_by(User.created_at.desc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    rows = (await session.execute(stmt)).all()
    items: list[StudentListItem] = []
    for u, sp, uni, active_b, total_b, open_c in rows:
        items.append(
            StudentListItem(
                id=u.id,
                phone=u.phone,
                first_name=u.first_name,
                last_name=u.last_name,
                avatar_url=u.avatar_url,
                is_blocked=u.is_blocked,
                is_verified=u.is_verified,
                created_at=u.created_at,
                hemis_id=sp.hemis_id if sp else None,
                university_id=sp.university_id if sp else None,
                university_name=uni.name if uni else None,
                university_short=uni.short_name if uni else None,
                faculty=sp.faculty if sp else None,
                course=sp.course if sp else None,
                group_name=sp.group_name if sp else None,
                active_bookings_count=active_b,
                total_bookings_count=total_b,
                open_complaints_count=open_c,
            )
        )

    pages = (total + filters.page_size - 1) // filters.page_size if total else 0
    return PaginatedResponse[StudentListItem](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )


async def get_student(session: AsyncSession, student_id: int) -> StudentDetail:
    """Detailed view: full profile + recent bookings + complaints + lifetime spend."""
    stmt = (
        select(User)
        .options(
            selectinload(User.student_profile).selectinload(StudentProfile.university),
        )
        .where(User.id == student_id, User.role == UserRole.STUDENT)
    )
    user = (await session.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "Student not found"},
        )
    sp = user.student_profile
    uni = sp.university if sp else None

    # Bookings (latest 20)
    bookings_stmt = (
        select(Booking, House.title, House.region)
        .join(House, House.id == Booking.house_id)
        .where(Booking.student_id == user.id)
        .order_by(Booking.created_at.desc())
        .limit(20)
    )
    booking_rows = (await session.execute(bookings_stmt)).all()
    bookings = [
        StudentBookingSummary(
            id=b.id,
            house_id=b.house_id,
            house_title=title,
            house_region=region,
            start_date=b.start_date,
            end_date=b.end_date,
            monthly_price=b.monthly_price,
            currency=b.currency,
            status=b.status,
            created_at=b.created_at,
        )
        for b, title, region in booking_rows
    ]

    # Booking counts
    counts_stmt = select(
        func.count(Booking.id).label("total"),
        func.sum(case((Booking.status == BookingStatus.ACTIVE, 1), else_=0)).label("active"),
    ).where(Booking.student_id == user.id)
    counts = (await session.execute(counts_stmt)).one()

    # Total spent (completed payments)
    spent_stmt = (
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.user_id == user.id, Payment.status == PaymentStatus.COMPLETED)
    )
    total_spent = (await session.execute(spent_stmt)).scalar_one() or Decimal(0)

    # Complaints
    complaints_stmt = (
        select(Complaint)
        .where(Complaint.reporter_id == user.id)
        .order_by(Complaint.created_at.desc())
        .limit(20)
    )
    complaint_rows = (await session.execute(complaints_stmt)).scalars().all()
    complaints = [
        StudentComplaintSummary(
            id=c.id,
            subject=c.subject,
            status=c.status,
            created_at=c.created_at,
            resolved_at=c.resolved_at,
        )
        for c in complaint_rows
    ]
    open_count = sum(1 for c in complaint_rows if c.status in (ComplaintStatus.NEW, ComplaintStatus.PROCESSING))

    # Current landlord (from active booking)
    current_landlord = await _current_landlord(session, user.id)

    return StudentDetail(
        id=user.id,
        phone=user.phone,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        avatar_url=user.avatar_url,
        is_blocked=user.is_blocked,
        is_verified=user.is_verified,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        hemis_id=sp.hemis_id if sp else None,
        university_id=sp.university_id if sp else None,
        university_name=uni.name if uni else None,
        university_short=uni.short_name if uni else None,
        faculty=sp.faculty if sp else None,
        course=sp.course if sp else None,
        group_name=sp.group_name if sp else None,
        gender=sp.gender if sp else None,
        birth_date=sp.birth_date if sp else None,
        active_bookings_count=int(counts.active or 0),
        total_bookings_count=int(counts.total or 0),
        open_complaints_count=open_count,
        total_complaints_count=len(complaint_rows),
        total_spent=Decimal(total_spent),
        bookings=bookings,
        complaints=complaints,
        current_landlord=current_landlord,
    )


async def _current_landlord(
    session: AsyncSession, student_id: int
) -> CurrentLandlordInfo | None:
    """Find landlord of student's currently active rental. Falls back to most recent confirmed."""
    now = datetime.now(timezone.utc)

    # Prefer ACTIVE; fall back to CONFIRMED (move-in soon)
    for booking_status in (BookingStatus.ACTIVE, BookingStatus.CONFIRMED):
        stmt = (
            select(Booking, House, User)
            .join(House, House.id == Booking.house_id)
            .join(User, User.id == House.landlord_id)
            .where(Booking.student_id == student_id, Booking.status == booking_status)
            .order_by(Booking.created_at.desc())
            .limit(1)
        )
        row = (await session.execute(stmt)).first()
        if row:
            booking, house, landlord = row
            # Check landlord PRO status
            pro_stmt = select(Subscription.id).where(
                Subscription.user_id == landlord.id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.ends_at > now,
            ).limit(1)
            is_pro = (await session.execute(pro_stmt)).scalar_one_or_none() is not None

            return CurrentLandlordInfo(
                id=landlord.id,
                first_name=landlord.first_name,
                last_name=landlord.last_name,
                phone=landlord.phone,
                avatar_url=landlord.avatar_url,
                is_pro=is_pro,
                house_id=house.id,
                house_title=house.title,
                booking_id=booking.id,
                booking_start_date=booking.start_date,
                booking_end_date=booking.end_date,
            )
    return None


async def list_landlords(
    session: AsyncSession, filters: LandlordListFilter
) -> PaginatedResponse[LandlordListItem]:
    """List landlords (for curator panel — to start chats, view problem owners)."""
    now = datetime.now(timezone.utc)

    houses_sq = (
        select(House.landlord_id, func.count(House.id).label("cnt"))
        .group_by(House.landlord_id)
        .subquery()
    )
    active_bookings_sq = (
        select(House.landlord_id, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.house_id == House.id)
        .where(Booking.status == BookingStatus.ACTIVE)
        .group_by(House.landlord_id)
        .subquery()
    )
    complaints_sq = (
        select(
            Complaint.against_user_id.label("uid"),
            func.count(Complaint.id).label("cnt"),
        )
        .where(Complaint.status.in_((ComplaintStatus.NEW, ComplaintStatus.PROCESSING)))
        .group_by(Complaint.against_user_id)
        .subquery()
    )

    is_pro_expr = case(
        (
            LandlordProfile.is_pro.is_(True)
            & (LandlordProfile.pro_until.is_(None) | (LandlordProfile.pro_until > now)),
            True,
        ),
        else_=False,
    ).label("is_pro_active")

    stmt = (
        select(
            User,
            LandlordProfile,
            is_pro_expr,
            func.coalesce(houses_sq.c.cnt, 0).label("houses_count"),
            func.coalesce(active_bookings_sq.c.cnt, 0).label("active_bookings_count"),
            func.coalesce(complaints_sq.c.cnt, 0).label("open_complaints_count"),
        )
        .select_from(User)
        .outerjoin(LandlordProfile, LandlordProfile.user_id == User.id)
        .outerjoin(houses_sq, houses_sq.c.landlord_id == User.id)
        .outerjoin(active_bookings_sq, active_bookings_sq.c.landlord_id == User.id)
        .outerjoin(complaints_sq, complaints_sq.c.uid == User.id)
        .where(User.role == UserRole.LANDLORD)
    )

    if filters.is_pro is True:
        stmt = stmt.where(
            LandlordProfile.is_pro.is_(True),
            or_(LandlordProfile.pro_until.is_(None), LandlordProfile.pro_until > now),
        )
    elif filters.is_pro is False:
        stmt = stmt.where(
            or_(
                LandlordProfile.is_pro.is_(False),
                LandlordProfile.is_pro.is_(None),
                LandlordProfile.pro_until <= now,
            )
        )
    if filters.is_verified_landlord is not None:
        stmt = stmt.where(LandlordProfile.is_verified_landlord.is_(filters.is_verified_landlord))
    if filters.is_blocked is not None:
        stmt = stmt.where(User.is_blocked.is_(filters.is_blocked))
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

    rows = (await session.execute(stmt)).all()
    items: list[LandlordListItem] = []
    for u, lp, is_pro_active, houses_count, active_bookings, open_complaints in rows:
        items.append(
            LandlordListItem(
                id=u.id,
                phone=u.phone,
                first_name=u.first_name,
                last_name=u.last_name,
                email=u.email,
                avatar_url=u.avatar_url,
                is_blocked=u.is_blocked,
                is_verified=u.is_verified,
                created_at=u.created_at,
                is_pro=bool(is_pro_active),
                is_verified_landlord=lp.is_verified_landlord if lp else False,
                houses_count=int(houses_count or 0),
                active_bookings_count=int(active_bookings or 0),
                open_complaints_count=int(open_complaints or 0),
            )
        )

    pages = (total + filters.page_size - 1) // filters.page_size if total else 0
    return PaginatedResponse[LandlordListItem](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )
