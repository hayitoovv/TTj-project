from __future__ import annotations

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Booking,
    BookingStatus,
    Complaint,
    ComplaintStatus,
    StudentProfile,
    University,
    User,
    UserRole,
)
from app.schemas.common import PaginatedResponse
from app.schemas.curator import StudentListFilter, StudentListItem


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
