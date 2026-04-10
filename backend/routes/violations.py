from fastapi import APIRouter, Depends, HTTPException
from models import ViolationReport
from utils import get_current_user, create_notification
from database import db
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/violations", tags=["violations"])


@router.post("/report")
async def report_violation(report: ViolationReport, user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can report violations")

    booking = await db.bookings.find_one({"id": report.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    spot = await db.parking_spots.find_one({"id": booking["spot_id"]}, {"_id": 0})
    if not spot or spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    violation_doc = {
        "id": str(uuid.uuid4()),
        "booking_id": report.booking_id,
        "host_id": user["id"],
        "guest_id": booking["guest_id"],
        "reason": report.reason,
        "status": "reported",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.violations.insert_one(violation_doc)

    await create_notification(
        booking["guest_id"],
        "Violation Reported",
        f"A violation has been reported for your booking. Reason: {report.reason}",
        "violation"
    )

    return {"success": True, "violation_id": violation_doc["id"]}
