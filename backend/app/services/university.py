from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StudentProfile, University
from app.schemas.common import PaginatedResponse
from app.schemas.university import (
    UniversityCreate,
    UniversityListFilter,
    UniversityRead,
    UniversityUpdate,
)


async def list_universities(
    session: AsyncSession, filters: UniversityListFilter
) -> PaginatedResponse[UniversityRead]:
    student_count_sq = (
        select(
            StudentProfile.university_id.label("uid"),
            func.count(StudentProfile.id).label("cnt"),
        )
        .group_by(StudentProfile.university_id)
        .subquery()
    )

    stmt = (
        select(University, func.coalesce(student_count_sq.c.cnt, 0).label("student_count"))
        .outerjoin(student_count_sq, student_count_sq.c.uid == University.id)
    )

    if filters.q:
        like = f"%{filters.q}%"
        stmt = stmt.where(
            or_(
                University.name.ilike(like),
                University.short_name.ilike(like),
                University.hemis_code.ilike(like),
            )
        )
    if filters.region:
        stmt = stmt.where(University.region == filters.region)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(University.name.asc())
    offset = (filters.page - 1) * filters.page_size
    stmt = stmt.offset(offset).limit(filters.page_size)

    rows = (await session.execute(stmt)).all()
    items = []
    for uni, student_count in rows:
        item = UniversityRead.model_validate(uni)
        item.student_count = int(student_count)
        items.append(item)

    pages = (total + filters.page_size - 1) // filters.page_size if total else 0
    return PaginatedResponse[UniversityRead](
        items=items, total=total, page=filters.page, page_size=filters.page_size, pages=pages
    )


async def get_university(session: AsyncSession, university_id: int) -> UniversityRead:
    uni = await session.get(University, university_id)
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "University not found"},
        )
    count_stmt = select(func.count(StudentProfile.id)).where(
        StudentProfile.university_id == university_id
    )
    student_count = int((await session.execute(count_stmt)).scalar_one() or 0)
    result = UniversityRead.model_validate(uni)
    result.student_count = student_count
    return result


async def create_university(
    session: AsyncSession, payload: UniversityCreate
) -> UniversityRead:
    existing_name = await session.execute(
        select(University).where(University.name == payload.name)
    )
    if existing_name.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "duplicate_name", "message": "University with this name already exists"},
        )
    if payload.hemis_code:
        existing_code = await session.execute(
            select(University).where(University.hemis_code == payload.hemis_code)
        )
        if existing_code.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "duplicate_hemis", "message": "HEMIS code already in use"},
            )

    uni = University(**payload.model_dump(exclude_none=True))
    session.add(uni)
    await session.commit()
    await session.refresh(uni)
    result = UniversityRead.model_validate(uni)
    result.student_count = 0
    return result


async def update_university(
    session: AsyncSession, university_id: int, payload: UniversityUpdate
) -> UniversityRead:
    uni = await session.get(University, university_id)
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "University not found"},
        )

    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] != uni.name:
        existing = await session.execute(
            select(University).where(
                University.name == data["name"], University.id != university_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "duplicate_name", "message": "Name already in use"},
            )
    if "hemis_code" in data and data["hemis_code"] and data["hemis_code"] != uni.hemis_code:
        existing = await session.execute(
            select(University).where(
                University.hemis_code == data["hemis_code"], University.id != university_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "duplicate_hemis", "message": "HEMIS code already in use"},
            )

    for k, v in data.items():
        setattr(uni, k, v)
    await session.commit()
    await session.refresh(uni)
    return await get_university(session, university_id)


async def delete_university(session: AsyncSession, university_id: int) -> None:
    uni = await session.get(University, university_id)
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "not_found", "message": "University not found"},
        )
    count_stmt = select(func.count(StudentProfile.id)).where(
        StudentProfile.university_id == university_id
    )
    student_count = int((await session.execute(count_stmt)).scalar_one() or 0)
    if student_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "has_students",
                "message": f"Cannot delete: {student_count} students linked",
            },
        )
    await session.delete(uni)
    await session.commit()
