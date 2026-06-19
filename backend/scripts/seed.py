"""
Seed script for TTJ Platforma demo data.

Run inside the backend container:
    docker compose exec backend python -m scripts.seed
"""
from __future__ import annotations

import asyncio
import sys
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select, text

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import (
    AdminProfile,
    Amenity,
    Booking,
    BookingStatus,
    Contract,
    Currency,
    House,
    HousePhoto,
    HouseStatus,
    LandlordProfile,
    Review,
    ReviewTargetType,
    StudentProfile,
    University,
    User,
    UserRole,
    house_amenity,
)


# Helper: Unsplash apartment photos
def img(seed: str, w: int = 800) -> str:
    return f"https://picsum.photos/seed/{seed}/{w}/{int(w * 0.66)}"


UNIVERSITIES = [
    {
        "name": "Toshkent Axborot Texnologiyalari Universiteti",
        "short_name": "TUIT",
        "hemis_code": "TUIT",
        "region": "Toshkent shahri",
        "address": "Amir Temur shoh ko'chasi 108",
        "latitude": 41.3411,
        "longitude": 69.2860,
    },
    {
        "name": "INHA University in Tashkent",
        "short_name": "INHA",
        "hemis_code": "INHA",
        "region": "Toshkent shahri",
        "address": "Ziyolilar ko'chasi 9",
        "latitude": 41.3232,
        "longitude": 69.3478,
    },
    {
        "name": "O'zbekiston Milliy Universiteti",
        "short_name": "O'zMU",
        "hemis_code": "NUUz",
        "region": "Toshkent shahri",
        "address": "Universitet ko'chasi 4",
        "latitude": 41.3479,
        "longitude": 69.2055,
    },
    {
        "name": "Toshkent Davlat Iqtisodiyot Universiteti",
        "short_name": "TDIU",
        "hemis_code": "TSUE",
        "region": "Toshkent shahri",
        "address": "Islom Karimov ko'chasi 49",
        "latitude": 41.2950,
        "longitude": 69.2720,
    },
    {
        "name": "Westminster International University in Tashkent",
        "short_name": "WIUT",
        "hemis_code": "WIUT",
        "region": "Toshkent shahri",
        "address": "Istiqbol ko'chasi 12",
        "latitude": 41.3110,
        "longitude": 69.2790,
    },
]

AMENITIES = [
    ("Wi-Fi", "wifi", "internet"),
    ("Konditsioner", "snowflake", "comfort"),
    ("Avtomobil joyi", "car", "comfort"),
    ("Kir mashinasi", "washing-machine", "appliance"),
    ("Muzlatgich", "refrigerator", "appliance"),
    ("Televizor", "tv", "appliance"),
    ("Mebel bilan", "armchair", "furniture"),
    ("Issiq suv", "shower", "comfort"),
    ("Tabiiy gaz", "flame", "utilities"),
    ("Balkon", "home", "comfort"),
    ("Lift", "arrow-up", "comfort"),
    ("Domofon", "shield", "safety"),
    ("Mikroto'lqinli pech", "microwave", "appliance"),
    ("Yashash xonasi", "sofa", "furniture"),
]

LANDLORDS = [
    {"phone": "+998901111101", "first_name": "Akmal", "last_name": "Karimov"},
    {"phone": "+998901111102", "first_name": "Dilshod", "last_name": "Yusupov"},
    {"phone": "+998901111103", "first_name": "Sevara", "last_name": "Mamatova"},
]

# (region, district, address, lat, lng) — Tashkent neighborhoods
HOUSES = [
    {
        "title": "Yangi qurilgan 2 xonali, TUIT yaqinida",
        "description": "Zamonaviy ta'mirlangan 2 xonali kvartira, mebel va texnika bilan jihozlangan. TUIT'gacha 5 daqiqalik piyoda yo'l. Wi-Fi, konditsioner, kir mashinasi mavjud. Ideal talabalar uchun.",
        "region": "Toshkent shahri",
        "district": "Yunusobod",
        "address": "Amir Temur shoh ko'chasi 110",
        "latitude": 41.3425,
        "longitude": 69.2890,
        "rooms": 2,
        "area_sqm": "55",
        "max_tenants": 3,
        "floor": 4,
        "total_floors": 9,
        "price_per_month": "2500000",
        "deposit_amount": "2500000",
        "is_top": True,
        "amenities": [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11],
        "landlord": 0,
        "photo_seeds": ["apt1a", "apt1b", "apt1c", "apt1d"],
    },
    {
        "title": "1 xonali, Olmazor (INHA yaqin)",
        "description": "INHA Universitetiga 10 daqiqalik mashinada borish. Yangi mebel, internet bepul, konditsioner.",
        "region": "Toshkent shahri",
        "district": "Olmazor",
        "address": "Olmazor tumani, Yangi Bog' ko'chasi 23",
        "latitude": 41.3251,
        "longitude": 69.3380,
        "rooms": 1,
        "area_sqm": "32",
        "max_tenants": 2,
        "floor": 6,
        "total_floors": 12,
        "price_per_month": "1800000",
        "deposit_amount": "1800000",
        "amenities": [0, 1, 4, 6, 7, 10],
        "landlord": 1,
        "photo_seeds": ["apt2a", "apt2b", "apt2c"],
    },
    {
        "title": "3 xonali oilaviy uy, Mirzo Ulug'bek",
        "description": "Keng oilaviy kvartira, ikki balkonli, hovli ko'rinishi. To'liq jihozlangan. 2 ta yotoqxona, katta mehmonxona.",
        "region": "Toshkent shahri",
        "district": "Mirzo Ulug'bek",
        "address": "Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li 78",
        "latitude": 41.3287,
        "longitude": 69.3145,
        "rooms": 3,
        "area_sqm": "78",
        "max_tenants": 5,
        "floor": 3,
        "total_floors": 5,
        "price_per_month": "3500000",
        "deposit_amount": "3500000",
        "amenities": [0, 1, 3, 4, 5, 6, 7, 8, 9, 13],
        "landlord": 0,
        "photo_seeds": ["apt3a", "apt3b", "apt3c", "apt3d"],
    },
    {
        "title": "1 xonali studio, Chilonzor",
        "description": "Yangi remont, hech kim yashamagan. Talabalarga maxsus arzon narx. Wi-Fi va kommunal xizmatlar narxga kiritilgan.",
        "region": "Toshkent shahri",
        "district": "Chilonzor",
        "address": "Chilonzor 5, 12-uy",
        "latitude": 41.2755,
        "longitude": 69.2034,
        "rooms": 1,
        "area_sqm": "28",
        "max_tenants": 2,
        "floor": 2,
        "total_floors": 4,
        "price_per_month": "1500000",
        "deposit_amount": "1500000",
        "amenities": [0, 4, 6, 7],
        "landlord": 2,
        "photo_seeds": ["apt4a", "apt4b"],
    },
    {
        "title": "2 xonali, Yakkasaroy markaz",
        "description": "Markazning eng qulay joyida. Metro yaqin (3 daqiqa). Restoran va do'konlar yaqin. Yangi mebel.",
        "region": "Toshkent shahri",
        "district": "Yakkasaroy",
        "address": "Shota Rustaveli ko'chasi 56",
        "latitude": 41.2856,
        "longitude": 69.2410,
        "rooms": 2,
        "area_sqm": "48",
        "max_tenants": 3,
        "floor": 5,
        "total_floors": 9,
        "price_per_month": "2800000",
        "deposit_amount": "2800000",
        "is_top": True,
        "amenities": [0, 1, 2, 3, 4, 5, 6, 7, 10, 11],
        "landlord": 1,
        "photo_seeds": ["apt5a", "apt5b", "apt5c"],
    },
    {
        "title": "Arzon 1 xonali, Sergeli",
        "description": "Talabalar uchun maxsus arzon narx. Hammasi mavjud. TIIAME yaqin.",
        "region": "Toshkent shahri",
        "district": "Sergeli",
        "address": "Sergeli 7, Talabalar yo'lagi 4",
        "latitude": 41.2280,
        "longitude": 69.2103,
        "rooms": 1,
        "area_sqm": "30",
        "max_tenants": 2,
        "floor": 1,
        "total_floors": 5,
        "price_per_month": "1200000",
        "deposit_amount": "1200000",
        "amenities": [0, 4, 6, 7, 8],
        "landlord": 2,
        "photo_seeds": ["apt6a", "apt6b"],
    },
    {
        "title": "Premium 4 xonali, Mirobod",
        "description": "Yashash uchun mukammal joy. Old jihatlar va ta'mir 2025-yilda. Lift, parking, qo'riqlanadigan hudud.",
        "region": "Toshkent shahri",
        "district": "Mirobod",
        "address": "Mirobod tumani, Sayilgoh ko'chasi 14",
        "latitude": 41.2960,
        "longitude": 69.2820,
        "rooms": 4,
        "area_sqm": "110",
        "max_tenants": 6,
        "floor": 7,
        "total_floors": 16,
        "price_per_month": "4500000",
        "deposit_amount": "4500000",
        "is_top": True,
        "amenities": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        "landlord": 0,
        "photo_seeds": ["apt7a", "apt7b", "apt7c", "apt7d", "apt7e"],
    },
    {
        "title": "2 xonali, Yashnobod",
        "description": "Tinch mahalla, bog' yaqinida. To'liq jihozlangan. Talabalarga moslashtirilgan.",
        "region": "Toshkent shahri",
        "district": "Yashnobod",
        "address": "Yashnobod tumani, Yangi hayot 18",
        "latitude": 41.3050,
        "longitude": 69.3320,
        "rooms": 2,
        "area_sqm": "52",
        "max_tenants": 3,
        "floor": 3,
        "total_floors": 5,
        "price_per_month": "2200000",
        "deposit_amount": "2200000",
        "amenities": [0, 1, 4, 5, 6, 7, 9],
        "landlord": 1,
        "photo_seeds": ["apt8a", "apt8b", "apt8c"],
    },
    {
        "title": "Yangi kvartira, Yunusobod",
        "description": "Tasdiqlangan, hozirgina tayyor. Ko'k osmon manzarali balkon. Internet va kabel TV bepul.",
        "region": "Toshkent shahri",
        "district": "Yunusobod",
        "address": "Yunusobod tumani, Bog'ishamol ko'chasi 33",
        "latitude": 41.3500,
        "longitude": 69.2950,
        "rooms": 2,
        "area_sqm": "54",
        "max_tenants": 3,
        "floor": 8,
        "total_floors": 12,
        "price_per_month": "2600000",
        "deposit_amount": "2600000",
        "amenities": [0, 1, 4, 5, 6, 7, 9, 10, 11],
        "landlord": 2,
        "photo_seeds": ["apt9a", "apt9b", "apt9c"],
    },
]


TABLES_TO_RESET = [
    "chat_messages",
    "chat_room_participants",
    "chat_rooms",
    "complaints",
    "reviews",
    "house_amenity",
    "house_photos",
    "payments",
    "subscriptions",
    "contracts",
    "bookings",
    "houses",
    "amenities",
    "blacklist",
    "notifications",
    "curator_groups",
    "curator_profiles",
    "student_profiles",
    "landlord_profiles",
    "admin_profiles",
    "users",
    "universities",
]


async def reset_db(db):
    print("🧹 Resetting all data tables...")
    for tbl in TABLES_TO_RESET:
        await db.execute(text(f'TRUNCATE TABLE "{tbl}" RESTART IDENTITY CASCADE'))
    await db.commit()
    print("✅ Tables truncated")


async def seed():
    reset = "--reset" in sys.argv or True  # always reset for dev convenience

    async with AsyncSessionLocal() as db:
        if reset:
            await reset_db(db)
        else:
            existing = (await db.execute(select(House.id).limit(1))).scalar_one_or_none()
            if existing:
                print("⚠️  Database already seeded, skipping. Use --reset to re-seed.")
                return

        # --- Universities ---
        unis = [University(**u) for u in UNIVERSITIES]
        db.add_all(unis)
        await db.flush()
        print(f"✅ {len(unis)} universities created")

        # --- Amenities ---
        amenities = [Amenity(name=n, icon=i, category=c) for n, i, c in AMENITIES]
        db.add_all(amenities)
        await db.flush()
        print(f"✅ {len(amenities)} amenities created")

        # --- Admin user ---
        admin = User(
            phone="+998901111100",
            password_hash=hash_password("admin1234"),
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="TTJ",
            is_verified=True,
            phone_verified_at=datetime.utcnow(),
        )
        db.add(admin)
        await db.flush()
        db.add(AdminProfile(user_id=admin.id, is_super_admin=True))
        print(f"✅ Admin user created: {admin.phone} / admin1234")

        # --- Landlord users ---
        landlord_users: list[User] = []
        for data in LANDLORDS:
            u = User(
                phone=data["phone"],
                password_hash=hash_password("test1234"),
                role=UserRole.LANDLORD,
                first_name=data["first_name"],
                last_name=data["last_name"],
                is_verified=True,
                phone_verified_at=datetime.utcnow(),
            )
            db.add(u)
            landlord_users.append(u)
        await db.flush()
        for u in landlord_users:
            db.add(LandlordProfile(user_id=u.id, is_verified_landlord=True))
        await db.flush()
        print(f"✅ {len(landlord_users)} landlords created (parol: test1234)")

        # --- Demo student ---
        student = User(
            phone="+998901111200",
            password_hash=hash_password("test1234"),
            role=UserRole.STUDENT,
            first_name="Behruz",
            last_name="Toxirov",
            is_verified=True,
            phone_verified_at=datetime.utcnow(),
        )
        db.add(student)
        await db.flush()
        db.add(
            StudentProfile(
                user_id=student.id,
                hemis_id="HEMIS-DEMO-001",
                university_id=unis[0].id,
                faculty="Kompyuter injiniringi",
                course=2,
                group_name="113-23",
            )
        )
        print(f"✅ Demo student: {student.phone} / test1234")

        # --- Houses ---
        for h in HOUSES:
            house = House(
                landlord_id=landlord_users[h["landlord"]].id,
                title=h["title"],
                description=h["description"],
                region=h["region"],
                district=h["district"],
                address=h["address"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                rooms=h["rooms"],
                area_sqm=Decimal(h["area_sqm"]),
                max_tenants=h["max_tenants"],
                floor=h["floor"],
                total_floors=h["total_floors"],
                price_per_month=Decimal(h["price_per_month"]),
                currency=Currency.UZS,
                deposit_amount=Decimal(h["deposit_amount"]),
                status=HouseStatus.APPROVED,
                is_top=h.get("is_top", False),
            )
            db.add(house)
            await db.flush()

            # Photos
            for idx, seed in enumerate(h["photo_seeds"]):
                db.add(
                    HousePhoto(
                        house_id=house.id,
                        url=img(seed),
                        order_num=idx,
                        is_main=(idx == 0),
                    )
                )

            # Amenities — direct M2M insert (avoids async lazy-load issue)
            for amen_idx in h["amenities"]:
                await db.execute(
                    house_amenity.insert().values(
                        house_id=house.id, amenity_id=amenities[amen_idx].id
                    )
                )

        await db.commit()
        print(f"✅ {len(HOUSES)} houses created with photos & amenities")

        # --- Reviews & ended bookings (demo) ---
        from datetime import date, timedelta
        from secrets import token_hex

        # Create extra demo students for variety in reviews
        extra_students_data = [
            ("+998901111201", "Madina", "Aliyeva"),
            ("+998901111202", "Sherzod", "Komilov"),
            ("+998901111203", "Nilufar", "Rasulova"),
            ("+998901111204", "Jasur", "Bekmurodov"),
        ]
        extra_students: list[User] = []
        for phone, fn, ln in extra_students_data:
            u = User(
                phone=phone,
                password_hash=hash_password("test1234"),
                role=UserRole.STUDENT,
                first_name=fn,
                last_name=ln,
                is_verified=True,
                phone_verified_at=datetime.utcnow(),
            )
            db.add(u)
            extra_students.append(u)
        await db.flush()
        for u in extra_students:
            db.add(StudentProfile(user_id=u.id, university_id=unis[0].id, course=2, group_name="113-23"))
        await db.flush()

        # Get all houses just created
        all_houses = (await db.execute(select(House))).scalars().all()
        all_students = [student] + extra_students

        # House -> rating distribution (average 3.5 - 5.0)
        # Format: (house_idx, [(student_idx, rating, comment)])
        review_plan = [
            # House 0 — TUIT zamonaviy uy (TOP) — top rated
            (0, [
                (0, 5, "Ajoyib uy! TUIT'ga juda yaqin, hammasi ishlaydi. Tavsiya etaman."),
                (1, 5, "Yangi mebel, toza, internet tez. 1 yil yashadim — muammo yo'q."),
                (2, 4, "Yaxshi joy, faqat qish vaqtida ozgina sovuq edi."),
            ]),
            # House 4 — Yakkasaroy markaz (TOP) — top rated
            (4, [
                (0, 5, "Markazda metro yaqinida — boribo'lmaganlar uchun ideal."),
                (3, 5, "Yangi remont, hamma narsa bor. 5 yulduz!"),
                (2, 4, "Yaxshi, lekin biroz shovqinli ko'cha."),
            ]),
            # House 6 — Premium 4 xonali Mirobod (TOP) — highest rated
            (6, [
                (1, 5, "Premium darajada! Pa'sibe lift, parking, qo'riq."),
                (3, 5, "Oilam bilan yashash uchun ideal."),
                (4, 5, "Hamma narsa kutilgandek va undan ham yaxshiroq."),
            ]),
            # House 1 — INHA yaqin — good rating
            (1, [
                (0, 4, "INHA'ga yaqin, narxi qulay. Tinch joy."),
                (2, 4, "Yaxshi, lekin mebel eski."),
            ]),
            # House 2 — 3 xonali oilaviy — okay rating
            (2, [
                (1, 4, "Keng kvartira, oila uchun yaxshi."),
                (3, 3, "Yashash mumkin, lekin remont kerak."),
            ]),
            # House 7 — Yashnobod — okay
            (7, [
                (2, 4, "Tinch mahalla, shahar markazidan biroz uzoq."),
            ]),
            # Houses 3, 5, 8 — no reviews (newcomers)
        ]

        review_count = 0
        for house_idx, reviews in review_plan:
            if house_idx >= len(all_houses):
                continue
            house = all_houses[house_idx]
            for stud_idx, rating, comment in reviews:
                if stud_idx >= len(all_students):
                    continue
                stud = all_students[stud_idx]

                # Create ended booking (in the past)
                start = date.today() - timedelta(days=180 + stud_idx * 10)
                end = date.today() - timedelta(days=10 + stud_idx * 5)
                booking = Booking(
                    student_id=stud.id,
                    house_id=house.id,
                    start_date=start,
                    end_date=end,
                    monthly_price=house.price_per_month,
                    currency=Currency.UZS,
                    total_amount=house.price_per_month * 6,
                    platform_fee=house.price_per_month * 6 * Decimal("0.015"),
                    service_fee=Decimal("5000"),
                    status=BookingStatus.ENDED,
                    confirmed_at=datetime.utcnow() - timedelta(days=190),
                )
                db.add(booking)
                await db.flush()

                contract = Contract(
                    booking_id=booking.id,
                    contract_number=f"TTJ-2024-{token_hex(4).upper()}",
                    student_accepted_at=datetime.utcnow() - timedelta(days=189),
                    landlord_accepted_at=datetime.utcnow() - timedelta(days=189),
                )
                db.add(contract)

                # House review
                db.add(Review(
                    booking_id=booking.id,
                    reviewer_id=stud.id,
                    target_type=ReviewTargetType.HOUSE,
                    house_id=house.id,
                    rating=rating,
                    comment=comment,
                ))
                review_count += 1

            # Update house rating cache
            ratings = [r for _, r, _ in reviews]
            if ratings:
                house.average_rating = round(sum(ratings) / len(ratings), 2)
                house.reviews_count = len(ratings)

        await db.commit()
        print(f"✅ {review_count} reviews + ended bookings created across {len(review_plan)} houses")

        print("\n🎉 Seed complete!")
        print("\nLogin credentials:")
        print("  Admin:      +998901111100 / admin1234")
        print("  Landlord 1: +998901111101 / test1234")
        print("  Landlord 2: +998901111102 / test1234")
        print("  Landlord 3: +998901111103 / test1234")
        print("  Student:    +998901111200 / test1234")
        print("  Extra students: +998901111201..204 / test1234")


if __name__ == "__main__":
    asyncio.run(seed())
