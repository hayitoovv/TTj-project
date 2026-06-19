from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import get_current_user
from app.models import User
from app.services.upload import save_image

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    subdir: str = "houses",
    user: User = Depends(get_current_user),
):
    return await save_image(file, subdir=subdir)
