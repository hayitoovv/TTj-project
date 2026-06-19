from __future__ import annotations

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Booking,
    BookingStatus,
    House,
    NotificationType,
    Review,
    ReviewTargetType,
    User,
    UserRole,
)
from app.schemas.common import PaginatedResponse
from app.schemas.review import (
    ReviewCreate,
    ReviewListFilter,
    ReviewRead,
    ReviewerInfo,
)
from app.services.notification import notify


class ReviewError(HTTPException):
    def __init__(self, msg: str, code: str = "review_error", http_status: int = 400):
        super().__init__(http_status, {"code": code, "message": msg})


def _to_read(review: Review) -> ReviewRead:
    reviewer = review.reviewer
    return ReviewRead(
        id=review.id,
        booking_id=review.booking_id,
        target_type=review.target_type,
        house_id=review.house_id,
        target_user_id=review.target_user_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        reviewer=ReviewerInfo(
            id=reviewer.id,
            first_name=reviewer.first_name,
            last_name=reviewer.last_name,
            avatar_url=reviewer.avatar_url,
            role=reviewer.role,
        ),
    )


async def _update_house_rating(session: AsyncSession, house_id: int) -> None:
    stmt = select(func.avg(Review.rating), func.count(Review.id)).where(
        Review.house_id == house_id,
        Review.target_type == ReviewTargetType.HOUSE,
    )
    avg, count = (await session.execute(stmt)).one()
    house = await session.get(House, house_id)
    if house:
        house.average_rating = round(float(avg or 0), 2)
        house.reviews_count = count or 0


async def create_review(
    session: AsyncSession, reviewer: User, payload: ReviewCreate
) -> ReviewRead:
    # Load booking with house
    stmt = (
        select(Booking)
        .options(selectinload(Booking.house))
        .where(Booking.id == payload.booking_id)
    )
    booking = (await session.execute(stmt)).scalar_one_or_none()
    if not booking:
        raise ReviewError("Booking not found", code="not_found", http_status=404)

    # Validate booking ended
    today = date.today()
    is_ended = booking.status == BookingStatus.ENDED or (
        booking.end_date < today and booking.status == BookingStatus.ACTIVE
    )
    if not is_ended:
        raise ReviewError(
            "Faqat ijara tugagandan keyin sharh yoziladi", code="not_ended"
        )

    # Validate reviewer participates in booking
    is_student = booking.student_id == reviewer.id
    is_landlord = booking.house and booking.house.landlord_id == reviewer.id
    if not (is_student or is_landlord):
        raise ReviewError("Not your booking", code="forbidden", http_status=403)

    # Role-specific validation
    if payload.target_type == ReviewTargetType.HOUSE:
        if not is_student:
            raise ReviewError("Only student can review house", code="role_mismatch")
        if payload.house_id != booking.house_id:
            raise ReviewError("house_id must match booking", code="bad_target")
    else:  # USER target
        if is_student:
            # Student → landlord
            if payload.target_user_id != booking.house.landlord_id:
                raise ReviewError(
                    "Student can review only the landlord", code="bad_target"
                )
        else:
            # Landlord → student
            if payload.target_user_id != booking.student_id:
                raise ReviewError(
                    "Landlord can review only the student", code="bad_target"
                )

    # Prevent duplicate review for same (booking, target)
    dup_stmt = select(Review.id).where(
        Review.booking_id == payload.booking_id,
        Review.reviewer_id == reviewer.id,
        Review.target_type == payload.target_type,
    )
    if payload.target_type == ReviewTargetType.HOUSE:
        dup_stmt = dup_stmt.where(Review.house_id == payload.house_id)
    else:
        dup_stmt = dup_stmt.where(Review.target_user_id == payload.target_user_id)
    if (await session.execute(dup_stmt.limit(1))).scalar_one_or_none():
        raise ReviewError(
            "Bu bron uchun siz allaqachon sharh yozgansiz", code="duplicate", http_status=409
        )

    review = Review(
        booking_id=payload.booking_id,
        reviewer_id=reviewer.id,
        target_type=payload.target_type,
        house_id=payload.house_id,
        target_user_id=payload.target_user_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    session.add(review)
    await session.flush()

    if payload.target_type == ReviewTargetType.HOUSE and payload.house_id:
        await _update_house_rating(session, payload.house_id)

    # Notify target user
    reviewer_name = (
        f"{reviewer.first_name or ''} {reviewer.last_name or ''}".strip() or "Foydalanuvchi"
    )
    rating_label = "⭐" * payload.rating
    if payload.target_type == ReviewTargetType.HOUSE and booking.house:
        await notify(
            session,
            booking.house.landlord_id,
            type=NotificationType.REVIEW,
            title=f"Yangi sharh ({rating_label})",
            body=f"{reviewer_name} «{booking.house.title}» uyingizga {payload.rating} yulduz baho qoldirdi.",
            data={"review_id": review.id, "house_id": booking.house_id, "rating": payload.rating},
        )
    elif payload.target_type == ReviewTargetType.USER and payload.target_user_id:
        await notify(
            session,
            payload.target_user_id,
            type=NotificationType.REVIEW,
            title=f"Yangi sharh ({rating_label})",
            body=f"{reviewer_name} sizga {payload.rating} yulduz baho qoldirdi.",
            data={"review_id": review.id, "rating": payload.rating},
        )

    await session.commit()

    # Reload with reviewer relation
    refreshed = (
        await session.execute(
            select(Review)
            .options(selectinload(Review.reviewer))
            .where(Review.id == review.id)
        )
    ).scalar_one()
    return _to_read(refreshed)


async def list_reviews(
    session: AsyncSession,
    filters: ReviewListFilter,
    *,
    viewer: User | None = None,
) -> PaginatedResponse[ReviewRead]:
    stmt = select(Review).options(selectinload(Review.reviewer))

    if filters.house_id is not None:
        stmt = stmt.where(
            Review.house_id == filters.house_id,
            Review.target_type == ReviewTargetType.HOUSE,
        )
    if filters.target_user_id is not None:
        stmt = stmt.where(
            Review.target_user_id == filters.target_user_id,
            Review.target_type == ReviewTargetType.USER,
        )
    if filters.reviewer_id is not None:
        stmt = stmt.where(Review.reviewer_id == filters.reviewer_id)
    if filters.booking_id is not None:
        stmt = stmt.where(Review.booking_id == filters.booking_id)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(Review.created_at.desc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    items = (await session.execute(stmt)).scalars().unique().all()
    pages = (total + filters.page_size - 1) // filters.page_size if total else 0

    return PaginatedResponse[ReviewRead](
        items=[_to_read(r) for r in items],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        pages=pages,
    )


async def delete_review(session: AsyncSession, review_id: int, user: User) -> None:
    review = await session.get(Review, review_id)
    if not review:
        raise ReviewError("Review not found", code="not_found", http_status=404)
    if review.reviewer_id != user.id and user.role != UserRole.ADMIN:
        raise ReviewError("Not your review", code="forbidden", http_status=403)

    house_id = review.house_id if review.target_type == ReviewTargetType.HOUSE else None
    await session.delete(review)
    await session.flush()
    if house_id:
        await _update_house_rating(session, house_id)
    await session.commit()
