from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.models import User
from app.schemas.subscription import (
    SubscriptionPurchase,
    SubscriptionRead,
    SubscriptionStatusResponse,
)
from app.services import subscription as subscription_service

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/status", response_model=SubscriptionStatusResponse)
async def subscription_status(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await subscription_service.get_status(session, user)


@router.get("/me", response_model=list[SubscriptionRead])
async def list_my_subscriptions(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await subscription_service.list_my_subscriptions(session, user)


@router.post("/purchase", response_model=SubscriptionRead, status_code=status.HTTP_201_CREATED)
async def purchase(
    payload: SubscriptionPurchase,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await subscription_service.purchase_subscription(session, user, payload)


@router.post("/{subscription_id}/cancel", response_model=SubscriptionRead)
async def cancel(
    subscription_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    return await subscription_service.cancel_subscription(session, user, subscription_id)
