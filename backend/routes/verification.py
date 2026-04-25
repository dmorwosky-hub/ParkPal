from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from utils import get_current_user
from database import db
from storage import upload_file, get_object
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/verification", tags=["verification"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload-photo")
async def upload_verification_photo(
    spot_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can verify spots")

    spot = await db.parking_spots.find_one({"id": spot_id, "host_id": user["id"]}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images allowed")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    result = upload_file(user["id"], file.filename, data, file.content_type)

    file_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["storage_path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "user_id": user["id"],
        "spot_id": spot_id,
        "type": "verification_photo",
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)

    # Update spot with verification photo and set pending status
    await db.parking_spots.update_one(
        {"id": spot_id},
        {"$set": {
            "verification_photo_path": result["storage_path"],
            "verification_status": "pending",
            "verification_submitted_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    return {
        "success": True,
        "file_id": file_doc["id"],
        "storage_path": result["storage_path"],
        "status": "pending"
    }


@router.get("/photo/{spot_id}")
async def get_verification_photo(spot_id: str, user: dict = Depends(get_current_user)):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    path = spot.get("verification_photo_path")
    if not path:
        raise HTTPException(status_code=404, detail="No verification photo")

    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Photo not found")

    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))


@router.get("/status/{spot_id}")
async def get_verification_status(spot_id: str, user: dict = Depends(get_current_user)):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    return {
        "is_verified": spot.get("is_verified", False),
        "verification_status": spot.get("verification_status", "none"),
        "has_photo": bool(spot.get("verification_photo_path"))
    }
