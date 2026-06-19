from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from secrets import token_hex

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Currency,
    LandlordProfile,
    NotificationType,
    Payment,
    PaymentPurpose,
    PaymentStatus,
    Subscription,
    SubscriptionPeriod,
    SubscriptionPlan,
    SubscriptionStatus,
    User,
    UserRole,
)
from app.schemas.subscription import (
    PLAN_PRICES_UZS,
    SubscriptionPurchase,
    SubscriptionRead,
    SubscriptionStatusResponse,
)
from app.services.notification import notify


def _allowed_plan_for_role(role: UserRole) -> set[SubscriptionPlan]:
    if role == UserRole.STUDENT:
        return {SubscriptionPlan.STUDENT_PRO}
    if role == UserRole.LANDLORD:
        return {SubscriptionPlan.LANDLORD_PRO}
    return set()


async def get_active_subscription(
    session: AsyncSession, user_id: int
) -> Subscription | None:
    stmt = (
        select(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.ends_at > datetime.utcnow(),
        )
        .order_by(Subscription.ends_at.desc())
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_status(session: AsyncSession, user: User) -> SubscriptionStatusResponse:
    sub = await get_active_subscription(session, user.id)
    if not sub:
        return SubscriptionStatusResponse(is_pro=False)
    days = max(0, (sub.ends_at.replace(tzinfo=None) - datetime.utcnow()).days)
    return SubscriptionStatusResponse(
        is_pro=True,
        plan=sub.plan,
        ends_at=sub.ends_at,
        days_remaining=days,
    )


async def purchase_subscription(
    session: AsyncSession, user: User, payload: SubscriptionPurchase
) -> SubscriptionRead:
    allowed = _allowed_plan_for_role(user.role)
    if payload.plan not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "plan_role_mismatch",
                "message": f"Sizning rolingiz uchun bu tarif mavjud emas. Mavjud: {sorted([p.value for p in allowed])}",
            },
        )

    price = PLAN_PRICES_UZS.get((payload.plan, payload.period))
    if price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "unknown_plan", "message": "Plan/period combination not supported"},
        )

    now = datetime.utcnow()
    days = 30 if payload.period == SubscriptionPeriod.MONTHLY else 365
    ends = now + timedelta(days=days)

    sub = Subscription(
        user_id=user.id,
        plan=payload.plan,
        period=payload.period,
        status=SubscriptionStatus.ACTIVE,
        amount=Decimal(price),
        currency=Currency.UZS,
        starts_at=now,
        ends_at=ends,
        auto_renew=payload.auto_renew,
    )
    session.add(sub)
    await session.flush()

    # Mock payment record
    pay = Payment(
        user_id=user.id,
        subscription_id=sub.id,
        purpose=PaymentPurpose.SUBSCRIPTION,
        amount=Decimal(price),
        currency=Currency.UZS,
        gateway=payload.gateway,
        status=PaymentStatus.COMPLETED,
        gateway_transaction_id=f"MOCK-SUB-{token_hex(8).upper()}",
        paid_at=now,
    )
    session.add(pay)

    # If landlord, also update profile for fast lookups + compatibility
    if user.role == UserRole.LANDLORD:
        prof_stmt = select(LandlordProfile).where(LandlordProfile.user_id == user.id)
        profile = (await session.execute(prof_stmt)).scalar_one_or_none()
        if profile:
            profile.is_pro = True
            profile.pro_until = ends

    # Notify
    plan_label = {
        SubscriptionPlan.STUDENT_PRO: "Talaba PRO",
        SubscriptionPlan.LANDLORD_PRO: "Uy egasi PRO",
        SubscriptionPlan.UNIVERSITY_PRO: "Universitet PRO",
    }.get(payload.plan, payload.plan.value)
    period_label = "1 oy" if payload.period == SubscriptionPeriod.MONTHLY else "1 yil"
    await notify(
        session,
        user.id,
        type=NotificationType.PAYMENT,
        title="PRO obuna faollashtirildi 🎉",
        body=f"{plan_label} ({period_label}) muvaffaqiyatli faollashtirildi. Tugash: {ends.strftime('%d.%m.%Y')}",
        data={"subscription_id": sub.id, "plan": payload.plan.value},
    )

    await session.commit()
    return SubscriptionRead.model_validate(sub)


async def cancel_subscription(
    session: AsyncSession, user: User, subscription_id: int
) -> SubscriptionRead:
    sub = await session.get(Subscription, subscription_id)
    if not sub or sub.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "Subscription not found"},
        )
    if sub.status != SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "bad_status", "message": "Only active can be cancelled"},
        )
    sub.status = SubscriptionStatus.CANCELLED
    sub.cancelled_at = datetime.utcnow()

    # Disable landlord profile pro
    if user.role == UserRole.LANDLORD:
        prof_stmt = select(LandlordProfile).where(LandlordProfile.user_id == user.id)
        profile = (await session.execute(prof_stmt)).scalar_one_or_none()
        if profile:
            profile.is_pro = False
            profile.pro_until = None

    await session.commit()
    return SubscriptionRead.model_validate(sub)


async def list_my_subscriptions(
    session: AsyncSession, user: User
) -> list[SubscriptionRead]:
    stmt = (
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
    )
    items = (await session.execute(stmt)).scalars().all()
    return [SubscriptionRead.model_validate(s) for s in items]
