from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    Currency,
    PaymentGateway,
    SubscriptionPeriod,
    SubscriptionPlan,
    SubscriptionStatus,
)


PLAN_PRICES_UZS: dict[tuple[SubscriptionPlan, SubscriptionPeriod], int] = {
    (SubscriptionPlan.STUDENT_PRO, SubscriptionPeriod.MONTHLY): 49_000,
    (SubscriptionPlan.STUDENT_PRO, SubscriptionPeriod.YEARLY): 490_000,  # 2 oy bepul
    (SubscriptionPlan.LANDLORD_PRO, SubscriptionPeriod.MONTHLY): 79_000,
    (SubscriptionPlan.LANDLORD_PRO, SubscriptionPeriod.YEARLY): 790_000,
    (SubscriptionPlan.UNIVERSITY_PRO, SubscriptionPeriod.MONTHLY): 990_000,
    (SubscriptionPlan.UNIVERSITY_PRO, SubscriptionPeriod.YEARLY): 9_900_000,
}


class SubscriptionPurchase(BaseModel):
    plan: SubscriptionPlan
    period: SubscriptionPeriod = SubscriptionPeriod.MONTHLY
    gateway: PaymentGateway = PaymentGateway.CLICK
    auto_renew: bool = False


class SubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan: SubscriptionPlan
    period: SubscriptionPeriod
    status: SubscriptionStatus
    amount: Decimal
    currency: Currency
    starts_at: datetime
    ends_at: datetime
    cancelled_at: datetime | None = None
    auto_renew: bool
    created_at: datetime


class SubscriptionStatusResponse(BaseModel):
    is_pro: bool
    plan: SubscriptionPlan | None = None
    ends_at: datetime | None = None
    days_remaining: int | None = None
