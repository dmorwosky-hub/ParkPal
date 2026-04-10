from fastapi import APIRouter, Depends
from typing import List
from models import NotificationResponse
from utils import get_current_user
from database import db
from fastapi import HTTPException

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@router.patch("/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"success": True}
