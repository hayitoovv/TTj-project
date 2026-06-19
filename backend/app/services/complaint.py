from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Complaint,
    ComplaintAgainstType,
    ComplaintStatus,
    House,
    NotificationType,
    User,
    UserRole,
)
from app.schemas.common import PaginatedResponse
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintListFilter,
    ComplaintRead,
    ReporterInfo,
)
from app.services.notification import notify


class ComplaintError(HTTPException):
    def __init__(self, msg: str, code: str = "complaint_error", http_status: int = 400):
        super().__init__(http_status, {"code": code, "message": msg})


async def _to_read(session: AsyncSession, c: Complaint) -> ComplaintRead:
    # Light context
    house_title = None
    if c.against_house_id:
        house = await session.get(House, c.against_house_id)
        house_title = house.title if house else None

    target_user_name = None
    if c.against_user_id:
        u = await session.get(User, c.against_user_id)
        if u:
            target_user_name = (
                f"{u.first_name or ''} {u.last_name or ''}".strip() or u.phone
            )

    return ComplaintRead(
        id=c.id,
        against_type=c.against_type,
        target_user_id=c.against_user_id,
        house_id=c.against_house_id,
        booking_id=c.booking_id,
        subject=c.subject,
        description=c.description,
        status=c.status,
        resolution=c.resolution_note,
        assigned_curator_id=c.assigned_curator_id,
        resolved_at=c.resolved_at,
        created_at=c.created_at,
        reporter=ReporterInfo(
            id=c.reporter.id,
            first_name=c.reporter.first_name,
            last_name=c.reporter.last_name,
            avatar_url=c.reporter.avatar_url,
            role=c.reporter.role,
            phone=c.reporter.phone,
        ),
        house_title=house_title,
        target_user_name=target_user_name,
    )


async def create_complaint(
    session: AsyncSession, reporter: User, payload: ComplaintCreate
) -> ComplaintRead:
    c = Complaint(
        reporter_id=reporter.id,
        against_type=payload.against_type,
        against_user_id=payload.target_user_id,
        against_house_id=payload.house_id,
        booking_id=payload.booking_id,
        subject=payload.subject,
        description=payload.description,
        status=ComplaintStatus.NEW,
    )
    session.add(c)
    await session.flush()

    # Notify all curators (simple approach — all curators see new complaints)
    curators_stmt = select(User.id).where(User.role == UserRole.CURATOR, User.is_active.is_(True))
    curator_ids = (await session.execute(curators_stmt)).scalars().all()
    reporter_name = (
        f"{reporter.first_name or ''} {reporter.last_name or ''}".strip() or reporter.phone
    )
    for cid in curator_ids:
        await notify(
            session,
            cid,
            type=NotificationType.COMPLAINT,
            title="Yangi shikoyat",
            body=f"{reporter_name}: «{payload.subject[:60]}»",
            data={"complaint_id": c.id, "action": "created"},
        )

    await session.commit()
    fresh = (
        await session.execute(
            select(Complaint).options(selectinload(Complaint.reporter)).where(Complaint.id == c.id)
        )
    ).scalar_one()
    return await _to_read(session, fresh)


async def list_complaints(
    session: AsyncSession, viewer: User, filters: ComplaintListFilter
) -> PaginatedResponse[ComplaintRead]:
    stmt = select(Complaint).options(selectinload(Complaint.reporter))

    if viewer.role == UserRole.STUDENT or viewer.role == UserRole.LANDLORD:
        stmt = stmt.where(Complaint.reporter_id == viewer.id)
    # Curator and admin see all

    if filters.status is not None:
        stmt = stmt.where(Complaint.status == filters.status)
    if filters.against_type is not None:
        stmt = stmt.where(Complaint.against_type == filters.against_type)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    # Sort: NEW first, then PROCESSING, then RESOLVED; newest within each
    stmt = stmt.order_by(
        Complaint.status.asc(),
        Complaint.created_at.desc(),
    )
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    items_rows = (await session.execute(stmt)).scalars().all()
    items = [await _to_read(session, c) for c in items_rows]
    pages = (total + filters.page_size - 1) // filters.page_size if total else 0

    return PaginatedResponse[ComplaintRead](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )


async def get_complaint(session: AsyncSession, complaint_id: int, viewer: User) -> ComplaintRead:
    c = (
        await session.execute(
            select(Complaint)
            .options(selectinload(Complaint.reporter))
            .where(Complaint.id == complaint_id)
        )
    ).scalar_one_or_none()
    if not c:
        raise ComplaintError("Not found", code="not_found", http_status=404)

    # Access check
    if viewer.role in (UserRole.STUDENT, UserRole.LANDLORD) and c.reporter_id != viewer.id:
        raise ComplaintError("Forbidden", code="forbidden", http_status=403)

    return await _to_read(session, c)


async def process_complaint(
    session: AsyncSession, complaint_id: int, curator: User
) -> ComplaintRead:
    c = await _load(session, complaint_id)
    if c.status == ComplaintStatus.RESOLVED:
        raise ComplaintError("Already resolved", code="already_resolved")
    c.status = ComplaintStatus.PROCESSING
    c.assigned_curator_id = curator.id

    await notify(
        session,
        c.reporter_id,
        type=NotificationType.COMPLAINT,
        title="Shikoyatingiz ko'rib chiqilmoqda",
        body=f"«{c.subject[:60]}» — kurator ishni boshladi.",
        data={"complaint_id": c.id, "action": "processing"},
    )
    await session.commit()
    return await _to_read(session, c)


async def resolve_complaint(
    session: AsyncSession, complaint_id: int, curator: User, resolution: str
) -> ComplaintRead:
    c = await _load(session, complaint_id)
    if c.status == ComplaintStatus.RESOLVED:
        raise ComplaintError("Already resolved", code="already_resolved")
    c.status = ComplaintStatus.RESOLVED
    c.resolution_note = resolution
    c.resolved_at = datetime.utcnow()
    if not c.assigned_curator_id:
        c.assigned_curator_id = curator.id

    await notify(
        session,
        c.reporter_id,
        type=NotificationType.COMPLAINT,
        title="Shikoyatingiz hal qilindi ✅",
        body=f"«{c.subject[:60]}» — javob: {resolution[:120]}",
        data={"complaint_id": c.id, "action": "resolved"},
    )
    await session.commit()
    return await _to_read(session, c)


async def _load(session: AsyncSession, complaint_id: int) -> Complaint:
    c = (
        await session.execute(
            select(Complaint)
            .options(selectinload(Complaint.reporter))
            .where(Complaint.id == complaint_id)
        )
    ).scalar_one_or_none()
    if not c:
        raise ComplaintError("Not found", code="not_found", http_status=404)
    return c
