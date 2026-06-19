from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    get_session,
    require_landlord,
    require_student,
)
from pydantic import BaseModel

from app.models import PaymentGateway, User
from app.schemas.booking import (
    BookingCancel,
    BookingCreate,
    BookingDetail,
    BookingFeeEstimate,
    BookingListFilter,
    BookingListItem,
)


class BookingPayRequest(BaseModel):
    gateway: PaymentGateway = PaymentGateway.CLICK
from app.schemas.common import PaginatedResponse
from app.services import booking as booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=PaginatedResponse[BookingListItem])
async def list_bookings(
    filters: BookingListFilter = Depends(),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await booking_service.list_bookings(session, user, filters)


@router.post("", response_model=BookingDetail, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreate,
    session: AsyncSession = Depends(get_session),
    student: User = Depends(require_student),
):
    return await booking_service.create_booking(session, student, payload)


@router.get("/estimate", response_model=BookingFeeEstimate)
async def estimate_booking_fee(
    house_id: int,
    start_date: date,
    end_date: date,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return await booking_service.estimate_fee_for_house(session, house_id, start_date, end_date)


@router.get("/{booking_id}", response_model=BookingDetail)
async def get_booking(
    booking_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await booking_service.get_booking(session, booking_id, user)


@router.post("/{booking_id}/confirm", response_model=BookingDetail)
async def confirm_booking(
    booking_id: int,
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    return await booking_service.confirm_booking(session, booking_id, landlord)


@router.post("/{booking_id}/reject", response_model=BookingDetail)
async def reject_booking(
    booking_id: int,
    payload: BookingCancel,
    session: AsyncSession = Depends(get_session),
    landlord: User = Depends(require_landlord),
):
    return await booking_service.reject_booking(session, booking_id, landlord, payload.reason)


@router.post("/{booking_id}/cancel", response_model=BookingDetail)
async def cancel_booking(
    booking_id: int,
    payload: BookingCancel,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await booking_service.cancel_booking(session, booking_id, user, payload.reason)


@router.post("/{booking_id}/accept-contract", response_model=BookingDetail)
async def accept_contract(
    booking_id: int,
    session: AsyncSession = Depends(get_session),
    student: User = Depends(require_student),
):
    return await booking_service.accept_contract(session, booking_id, student)


@router.post("/{booking_id}/pay", response_model=BookingDetail)
async def pay_booking(
    booking_id: int,
    payload: BookingPayRequest,
    session: AsyncSession = Depends(get_session),
    student: User = Depends(require_student),
):
    return await booking_service.pay_booking(session, booking_id, student, payload.gateway)
