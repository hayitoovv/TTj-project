from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from secrets import token_hex

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Booking,
    BookingStatus,
    Contract,
    Currency,
    House,
    HouseStatus,
    NotificationType,
    Payment,
    PaymentGateway,
    PaymentPurpose,
    PaymentStatus,
    User,
    UserRole,
)
from app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingFeeEstimate,
    BookingListFilter,
    BookingListItem,
    ContractRead,
)
from app.schemas.common import PaginatedResponse
from app.services.notification import notify

# ---- tuning ----
MAX_ADVANCE_DAYS = 2  # "Faqat 2 kun oldin bron qilish mumkin"
MAX_RENTAL_DAYS = 365  # "Uzoq muddatli bron ❌"
PLATFORM_FEE_PERCENT = Decimal("1.5")
SERVICE_FEE_UZS = Decimal("5000")
SERVICE_FEE_USD = Decimal("0.50")


class BookingError(HTTPException):
    def __init__(self, msg: str, code: str = "booking_error", http_status: int = 400):
        super().__init__(http_status, {"code": code, "message": msg})


# ---------- helpers ----------
def _q(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _service_fee(currency: Currency) -> Decimal:
    return SERVICE_FEE_UZS if currency == Currency.UZS else SERVICE_FEE_USD


def _calculate_fees(monthly_price: Decimal, days: int, currency: Currency) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    months = Decimal(days) / Decimal(30)
    total_rent = _q(monthly_price * months)
    platform_fee = _q(total_rent * PLATFORM_FEE_PERCENT / Decimal(100))
    service_fee = _service_fee(currency)
    total_amount = _q(total_rent + platform_fee + service_fee)
    return total_rent, platform_fee, service_fee, total_amount


def estimate_fee(monthly_price: Decimal, start: date, end: date, currency: Currency) -> BookingFeeEstimate:
    days = (end - start).days
    total_rent, platform_fee, service_fee, total = _calculate_fees(monthly_price, days, currency)
    return BookingFeeEstimate(
        days=days,
        monthly_price=monthly_price,
        currency=currency,
        total_rent=total_rent,
        platform_fee=platform_fee,
        service_fee=service_fee,
        total_amount=total,
    )


def _generate_contract_number() -> str:
    return f"TTJ-{datetime.utcnow().year}-{token_hex(4).upper()}"


async def _has_overlap(
    session: AsyncSession, house_id: int, start: date, end: date, exclude_id: int | None = None
) -> bool:
    active_states = (BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE)
    stmt = select(Booking.id).where(
        Booking.house_id == house_id,
        Booking.status.in_(active_states),
        Booking.start_date < end,
        Booking.end_date > start,
    )
    if exclude_id is not None:
        stmt = stmt.where(Booking.id != exclude_id)
    result = await session.execute(stmt.limit(1))
    return result.scalar_one_or_none() is not None


async def _has_active_for_house(
    session: AsyncSession, house_id: int, exclude_id: int | None = None
) -> bool:
    """True if the house has any currently-ACTIVE booking."""
    stmt = select(Booking.id).where(
        Booking.house_id == house_id,
        Booking.status == BookingStatus.ACTIVE,
    )
    if exclude_id is not None:
        stmt = stmt.where(Booking.id != exclude_id)
    result = await session.execute(stmt.limit(1))
    return result.scalar_one_or_none() is not None


async def _release_house_if_free(session: AsyncSession, house_id: int) -> None:
    """If no ACTIVE bookings remain on the house, flip RENTED back to APPROVED."""
    if await _has_active_for_house(session, house_id):
        return
    house = await session.get(House, house_id)
    if house and house.status == HouseStatus.RENTED:
        house.status = HouseStatus.APPROVED


async def _auto_cancel_others(
    session: AsyncSession, house_id: int, winner_booking_id: int
) -> None:
    """Cancel all other PENDING/CONFIRMED bookings on the house and notify students.

    Called when one booking is paid → house becomes RENTED, so other unfulfilled
    bookings can't proceed.
    """
    blocked = (BookingStatus.PENDING, BookingStatus.CONFIRMED)
    stmt = (
        select(Booking)
        .options(selectinload(Booking.house))
        .where(
            Booking.house_id == house_id,
            Booking.id != winner_booking_id,
            Booking.status.in_(blocked),
        )
    )
    others = (await session.execute(stmt)).scalars().all()
    now = datetime.utcnow()
    for b in others:
        b.status = BookingStatus.CANCELLED
        b.cancelled_at = now
        b.cancellation_reason = "[system] Uy boshqa talabaga ijaraga olindi"
        house_title = b.house.title if b.house else "Uy"
        await notify(
            session,
            b.student_id,
            type=NotificationType.BOOKING,
            title="Bron bekor qilindi",
            body=(
                f"«{house_title}» — afsuski, uy boshqa talabaga ijaraga olindi. "
                f"Bron avtomatik bekor qilindi."
            ),
            data={"booking_id": b.id, "action": "auto_cancelled"},
        )


async def _load_booking(session: AsyncSession, booking_id: int) -> Booking:
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.house).selectinload(House.photos),
            selectinload(Booking.house).selectinload(House.landlord),
            selectinload(Booking.student),
            selectinload(Booking.contract),
        )
        .where(Booking.id == booking_id)
    )
    booking = (await session.execute(stmt)).scalar_one_or_none()
    if not booking:
        raise BookingError("Booking not found", code="not_found", http_status=404)
    if await _maybe_end_booking(session, booking):
        await session.commit()
    return booking


async def _maybe_end_booking(session: AsyncSession, booking: Booking) -> bool:
    """If booking is ACTIVE and end_date has passed, transition to ENDED.

    Notifies both parties so they can leave reviews.
    Returns True if state changed (caller commits).
    """
    if booking.status != BookingStatus.ACTIVE:
        return False
    if booking.end_date >= date.today():
        return False

    booking.status = BookingStatus.ENDED
    # Release the house for new bookings
    await _release_house_if_free(session, booking.house_id)

    house_title = booking.house.title if booking.house else "Uy"
    student = booking.student
    student_name = (
        f"{student.first_name or ''} {student.last_name or ''}".strip() or "Talaba"
        if student
        else "Talaba"
    )

    # Notify student — can write review for house + landlord
    await notify(
        session,
        booking.student_id,
        type=NotificationType.BOOKING,
        title="Ijara tugadi",
        body=(
            f"«{house_title}» ijarangiz tugadi. Tajribangiz haqida uy va uy egasiga "
            f"sharh qoldiring!"
        ),
        data={"booking_id": booking.id, "action": "ended"},
    )

    # Notify landlord — can write review for student
    if booking.house:
        await notify(
            session,
            booking.house.landlord_id,
            type=NotificationType.BOOKING,
            title="Ijara tugadi",
            body=(
                f"«{house_title}» — {student_name} bilan ijara tugadi. "
                f"Talaba haqida sharh yozishingiz mumkin."
            ),
            data={"booking_id": booking.id, "action": "ended"},
        )

    return True


def _check_access(booking: Booking, viewer: User) -> tuple[bool, bool]:
    """Return (is_student_owner, is_landlord_owner). Raises if viewer has no access."""
    is_student = viewer.id == booking.student_id
    is_landlord = booking.house and viewer.id == booking.house.landlord_id
    is_admin = viewer.role == UserRole.ADMIN
    if not (is_student or is_landlord or is_admin):
        raise BookingError("Access denied", code="forbidden", http_status=403)
    return is_student, is_landlord


# ---------- presenters ----------
def _main_photo_url(house: House | None) -> str | None:
    if not house or not house.photos:
        return None
    main = next((p for p in house.photos if p.is_main), None)
    return (main or house.photos[0]).url


def _student_display_name(student: User | None) -> str | None:
    if not student:
        return None
    name = f"{student.first_name or ''} {student.last_name or ''}".strip()
    return name or None


def _to_list_item(b: Booking) -> BookingListItem:
    return BookingListItem(
        id=b.id,
        house_id=b.house_id,
        house_title=b.house.title if b.house else None,
        house_address=b.house.address if b.house else None,
        house_photo=_main_photo_url(b.house),
        student_id=b.student_id,
        student_name=_student_display_name(b.student),
        start_date=b.start_date,
        end_date=b.end_date,
        monthly_price=b.monthly_price,
        currency=b.currency,
        total_amount=b.total_amount,
        status=b.status,
        confirmed_at=b.confirmed_at,
        created_at=b.created_at,
    )


def _to_detail(b: Booking) -> BookingDetail:
    landlord = b.house.landlord if b.house else None
    landlord_name = (
        f"{landlord.first_name or ''} {landlord.last_name or ''}".strip() or "Uy egasi"
        if landlord
        else None
    )
    return BookingDetail(
        id=b.id,
        house_id=b.house_id,
        house_title=b.house.title if b.house else None,
        house_address=b.house.address if b.house else None,
        house_photo=_main_photo_url(b.house),
        student_id=b.student_id,
        student_name=_student_display_name(b.student),
        start_date=b.start_date,
        end_date=b.end_date,
        monthly_price=b.monthly_price,
        currency=b.currency,
        total_amount=b.total_amount,
        status=b.status,
        confirmed_at=b.confirmed_at,
        created_at=b.created_at,
        platform_fee=b.platform_fee,
        service_fee=b.service_fee,
        cancellation_reason=b.cancellation_reason,
        cancelled_at=b.cancelled_at,
        contract=ContractRead.model_validate(b.contract) if b.contract else None,
        landlord_id=b.house.landlord_id if b.house else None,
        landlord_name=landlord_name,
    )


# ---------- mutations ----------
async def create_booking(session: AsyncSession, student: User, payload: BookingCreate) -> BookingDetail:
    house = (
        await session.execute(
            select(House)
            .options(selectinload(House.photos), selectinload(House.landlord))
            .where(House.id == payload.house_id)
        )
    ).scalar_one_or_none()
    if not house:
        raise BookingError("House not found", code="house_not_found", http_status=404)
    if house.status != HouseStatus.APPROVED:
        raise BookingError("House is not available for booking", code="house_unavailable")
    if house.landlord_id == student.id:
        raise BookingError("You cannot book your own house", code="own_house")

    today = date.today()
    if payload.start_date < today:
        raise BookingError("Start date is in the past", code="past_date")
    advance_days = (payload.start_date - today).days
    if advance_days > MAX_ADVANCE_DAYS:
        raise BookingError(
            f"Siz faqat {MAX_ADVANCE_DAYS} kun oldin bron qilishingiz mumkin",
            code="advance_limit",
        )
    rental_days = (payload.end_date - payload.start_date).days
    if rental_days > MAX_RENTAL_DAYS:
        raise BookingError(
            f"Uzoq muddatli bron mumkin emas (max {MAX_RENTAL_DAYS} kun)",
            code="too_long",
        )
    if rental_days < 1:
        raise BookingError("Minimal ijara davri 1 kun", code="too_short")

    if await _has_overlap(session, house.id, payload.start_date, payload.end_date):
        raise BookingError(
            "Bu sanalar uchun uy allaqachon band qilingan",
            code="conflict",
            http_status=status.HTTP_409_CONFLICT,
        )

    total_rent, platform_fee, service_fee, total_amount = _calculate_fees(
        house.price_per_month, rental_days, house.currency
    )

    booking = Booking(
        student_id=student.id,
        house_id=house.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        monthly_price=house.price_per_month,
        currency=house.currency,
        total_amount=total_amount,
        platform_fee=platform_fee,
        service_fee=service_fee,
        status=BookingStatus.PENDING,
    )
    session.add(booking)
    await session.flush()

    contract = Contract(
        booking_id=booking.id,
        contract_number=_generate_contract_number(),
    )
    session.add(contract)

    student_name = (
        f"{student.first_name or ''} {student.last_name or ''}".strip() or "Talaba"
    )
    await notify(
        session,
        house.landlord_id,
        type=NotificationType.BOOKING,
        title="Yangi bron so'rovi",
        body=f"{student_name} sizning «{house.title}» uyingizni bron qildi. Tasdiqlashingiz kerak.",
        data={"booking_id": booking.id, "action": "created"},
    )

    await session.commit()
    fresh = await _load_booking(session, booking.id)
    return _to_detail(fresh)


async def confirm_booking(session: AsyncSession, booking_id: int, landlord: User) -> BookingDetail:
    booking = await _load_booking(session, booking_id)
    if not booking.house or booking.house.landlord_id != landlord.id:
        raise BookingError("Not your house", code="forbidden", http_status=403)
    if booking.status != BookingStatus.PENDING:
        raise BookingError(
            f"Cannot confirm booking in status {booking.status.value}", code="bad_status"
        )

    booking.status = BookingStatus.CONFIRMED
    booking.confirmed_at = datetime.utcnow()
    if booking.contract:
        booking.contract.landlord_accepted_at = datetime.utcnow()

    house_title = booking.house.title if booking.house else "Uy"
    await notify(
        session,
        booking.student_id,
        type=NotificationType.BOOKING,
        title="Bron tasdiqlandi 🎉",
        body=f"«{house_title}» uchun bronni uy egasi tasdiqladi. Endi shartnomani qabul qilib to'lov qilishingiz mumkin.",
        data={"booking_id": booking.id, "action": "confirmed"},
    )

    await session.commit()
    return _to_detail(booking)


async def reject_booking(
    session: AsyncSession, booking_id: int, landlord: User, reason: str
) -> BookingDetail:
    booking = await _load_booking(session, booking_id)
    if not booking.house or booking.house.landlord_id != landlord.id:
        raise BookingError("Not your house", code="forbidden", http_status=403)
    if booking.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
        raise BookingError("Cannot reject this booking", code="bad_status")

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.utcnow()
    booking.cancellation_reason = f"[landlord rejected] {reason}"

    house_title = booking.house.title if booking.house else "Uy"
    await notify(
        session,
        booking.student_id,
        type=NotificationType.BOOKING,
        title="Bron rad etildi",
        body=f"«{house_title}» uy egasi bronni rad etdi. Sabab: {reason}",
        data={"booking_id": booking.id, "action": "rejected", "reason": reason},
    )

    await session.commit()
    return _to_detail(booking)


async def cancel_booking(
    session: AsyncSession, booking_id: int, user: User, reason: str
) -> BookingDetail:
    booking = await _load_booking(session, booking_id)
    is_student, is_landlord = _check_access(booking, user)

    if booking.status in (BookingStatus.ENDED, BookingStatus.CANCELLED, BookingStatus.REFUNDED):
        raise BookingError("Booking is already finalized", code="already_finalized")
    if booking.status == BookingStatus.ACTIVE:
        raise BookingError(
            "Active booking can only be cancelled via refund process",
            code="active_needs_refund",
        )

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.utcnow()
    by = "student" if is_student else ("landlord" if is_landlord else "admin")
    booking.cancellation_reason = f"[{by}] {reason}"

    # Notify the OTHER party
    house_title = booking.house.title if booking.house else "Uy"
    notify_target = (
        booking.house.landlord_id if is_student and booking.house else booking.student_id
    )
    await notify(
        session,
        notify_target,
        type=NotificationType.BOOKING,
        title="Bron bekor qilindi",
        body=f"«{house_title}» uchun bron bekor qilindi. Sabab: {reason}",
        data={"booking_id": booking.id, "action": "cancelled", "by": by},
    )

    await session.commit()
    return _to_detail(booking)


async def accept_contract(session: AsyncSession, booking_id: int, student: User) -> BookingDetail:
    booking = await _load_booking(session, booking_id)
    if booking.student_id != student.id:
        raise BookingError("Not your booking", code="forbidden", http_status=403)
    if booking.status != BookingStatus.CONFIRMED:
        raise BookingError(
            "Contract can be accepted only for confirmed bookings", code="bad_status"
        )
    if not booking.contract:
        raise BookingError("No contract to accept", code="no_contract")
    if booking.contract.student_accepted_at:
        raise BookingError("Contract already accepted", code="already_accepted")

    booking.contract.student_accepted_at = datetime.utcnow()

    house_title = booking.house.title if booking.house else "Uy"
    student_name = (
        f"{student.first_name or ''} {student.last_name or ''}".strip() or "Talaba"
    )
    if booking.house:
        await notify(
            session,
            booking.house.landlord_id,
            type=NotificationType.BOOKING,
            title="Shartnoma qabul qilindi",
            body=f"{student_name} «{house_title}» uchun shartnomani qabul qildi. To'lov amalga oshirilishi kutiladi.",
            data={"booking_id": booking.id, "action": "contract_accepted"},
        )

    await session.commit()
    return _to_detail(booking)


async def pay_booking(
    session: AsyncSession,
    booking_id: int,
    student: User,
    gateway: PaymentGateway = PaymentGateway.CLICK,
) -> BookingDetail:
    """Mock payment: marks booking ACTIVE, records Payment, notifies landlord."""
    booking = await _load_booking(session, booking_id)
    if booking.student_id != student.id:
        raise BookingError("Not your booking", code="forbidden", http_status=403)
    if booking.status != BookingStatus.CONFIRMED:
        raise BookingError(
            "Booking must be confirmed before payment", code="bad_status"
        )
    if not booking.contract or not booking.contract.student_accepted_at:
        raise BookingError(
            "Avval shartnomani qabul qiling", code="contract_not_accepted"
        )

    # Race-safety: another student may have already paid for this house.
    if booking.house and booking.house.status != HouseStatus.APPROVED:
        raise BookingError(
            "Afsuski, bu uy boshqa talabaga ijaraga olindi",
            code="house_locked",
            http_status=status.HTTP_409_CONFLICT,
        )

    # Create payment record
    payment = Payment(
        user_id=student.id,
        booking_id=booking.id,
        purpose=PaymentPurpose.RENT,
        amount=booking.total_amount,
        currency=booking.currency,
        gateway=gateway,
        status=PaymentStatus.COMPLETED,
        gateway_transaction_id=f"MOCK-{token_hex(8).upper()}",
        paid_at=datetime.utcnow(),
    )
    session.add(payment)

    # Activate booking + lock the house (one tenant at a time)
    booking.status = BookingStatus.ACTIVE
    if booking.house:
        booking.house.status = HouseStatus.RENTED
        await _auto_cancel_others(session, booking.house_id, booking.id)

    # Notify landlord
    house_title = booking.house.title if booking.house else "Uy"
    student_name = (
        f"{student.first_name or ''} {student.last_name or ''}".strip() or "Talaba"
    )
    if booking.house:
        await notify(
            session,
            booking.house.landlord_id,
            type=NotificationType.PAYMENT,
            title="To'lov qabul qilindi 💰",
            body=f"{student_name} «{house_title}» uchun to'lov qildi. Ijara endi faol.",
            data={
                "booking_id": booking.id,
                "payment_id": payment.id,
                "amount": str(booking.total_amount),
                "gateway": gateway.value,
            },
        )

    await session.commit()
    fresh = await _load_booking(session, booking.id)
    return _to_detail(fresh)


# ---------- queries ----------
async def get_booking(session: AsyncSession, booking_id: int, viewer: User) -> BookingDetail:
    booking = await _load_booking(session, booking_id)
    _check_access(booking, viewer)
    return _to_detail(booking)


async def list_bookings(
    session: AsyncSession, viewer: User, filters: BookingListFilter
) -> PaginatedResponse[BookingListItem]:
    stmt = select(Booking).options(
        selectinload(Booking.house).selectinload(House.photos),
        selectinload(Booking.student),
    )

    if viewer.role == UserRole.STUDENT:
        stmt = stmt.where(Booking.student_id == viewer.id)
    elif viewer.role == UserRole.LANDLORD:
        stmt = stmt.join(House, Booking.house_id == House.id).where(House.landlord_id == viewer.id)
    # CURATOR / ADMIN: see all (curator scoping added later by group)

    if filters.status is not None:
        stmt = stmt.where(Booking.status == filters.status)
    if filters.house_id is not None:
        stmt = stmt.where(Booking.house_id == filters.house_id)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(Booking.created_at.desc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    bookings = (await session.execute(stmt)).scalars().unique().all()

    # Auto-end expired bookings
    any_changed = False
    for b in bookings:
        if await _maybe_end_booking(session, b):
            any_changed = True
    if any_changed:
        await session.commit()

    items = [_to_list_item(b) for b in bookings]
    pages = (total + filters.page_size - 1) // filters.page_size if total else 0
    return PaginatedResponse[BookingListItem](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )


async def estimate_fee_for_house(
    session: AsyncSession, house_id: int, start: date, end: date
) -> BookingFeeEstimate:
    house = await session.get(House, house_id)
    if not house:
        raise BookingError("House not found", code="not_found", http_status=404)
    if end <= start:
        raise BookingError("end_date must be after start_date", code="bad_dates")
    return estimate_fee(house.price_per_month, start, end, house.currency)
