from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    amenities,
    auth,
    bookings,
    chats,
    complaints,
    curator,
    favorites,
    health,
    houses,
    notifications,
    reviews,
    subscriptions,
    universities,
    uploads,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(houses.router)
api_router.include_router(amenities.router)
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(notifications.router)
api_router.include_router(complaints.router)
api_router.include_router(curator.router)
api_router.include_router(favorites.router)
api_router.include_router(subscriptions.router)
api_router.include_router(uploads.router)
api_router.include_router(chats.router)
api_router.include_router(universities.router)
api_router.include_router(admin.router)
