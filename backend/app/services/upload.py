from __future__ import annotations

import os
from pathlib import Path
from secrets import token_hex
from typing import Final

from fastapi import HTTPException, UploadFile, status

ALLOWED_IMAGE_MIME: Final = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
MAX_FILE_SIZE: Final = 10 * 1024 * 1024  # 10 MB
UPLOAD_DIR: Final = Path("/app/uploads")
PUBLIC_PREFIX: Final = "/uploads"


def _ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _extension_for(content_type: str, filename: str) -> str:
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    ext = mapping.get(content_type)
    if ext:
        return ext
    # fallback to original extension
    _, raw_ext = os.path.splitext(filename or "")
    return raw_ext.lower() or ".bin"


async def save_image(file: UploadFile, *, subdir: str = "houses") -> dict[str, str | int]:
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "bad_mime",
                "message": f"Faqat rasm fayllari: {sorted(ALLOWED_IMAGE_MIME)}",
            },
        )

    content = await file.read()
    size = len(content)
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "empty", "message": "Bo'sh fayl"},
        )
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "too_big",
                "message": f"Maksimal {MAX_FILE_SIZE // 1024 // 1024} MB",
            },
        )

    ext = _extension_for(file.content_type or "", file.filename or "")
    filename = f"{token_hex(16)}{ext}"
    dest_dir = UPLOAD_DIR / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / filename

    with dest.open("wb") as f:
        f.write(content)

    public_path = f"{PUBLIC_PREFIX}/{subdir}/{filename}"
    return {
        "url": public_path,  # relative — frontend prepends API base
        "filename": filename,
        "size": size,
        "content_type": file.content_type or "application/octet-stream",
    }


_ensure_upload_dir()
