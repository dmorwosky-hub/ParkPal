from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from utils import get_current_user
from database import db
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/api/demand-pins", tags=["demand-pins"])


class DemandPinCreate(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    note: Optional[str] = None
    desired_price_max: Optional[float] = None


class DemandPinResponse(BaseModel):
    id: str
    user_id: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    note: Optional[str] = None
    desired_price_max: Optional[float] = None
    upvotes: int = 0
    created_at: str


@router.post("", response_model=DemandPinResponse)
async def create_demand_pin(pin_data: DemandPinCreate, user: dict = Depends(get_current_user)):
    pin_id = str(uuid.uuid4())
    pin_doc = {
        "id": pin_id,
        "user_id": user["id"],
        "latitude": pin_data.latitude,
        "longitude": pin_data.longitude,
        "address": pin_data.address,
        "note": pin_data.note,
        "desired_price_max": pin_data.desired_price_max,
        "upvotes": 0,
        "upvoters": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.demand_pins.insert_one(pin_doc)
    return DemandPinResponse(**{k: v for k, v in pin_doc.items() if k not in ("_id", "upvoters")})


@router.get("", response_model=List[DemandPinResponse])
async def get_demand_pins(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
):
    pins = await db.demand_pins.find({}, {"_id": 0, "upvoters": 0}).to_list(500)
    return [DemandPinResponse(**p) for p in pins]


@router.post("/{pin_id}/upvote")
async def upvote_pin(pin_id: str, user: dict = Depends(get_current_user)):
    pin = await db.demand_pins.find_one({"id": pin_id})
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")

    upvoters = pin.get("upvoters", [])
    if user["id"] in upvoters:
        # Remove upvote
        upvoters.remove(user["id"])
        await db.demand_pins.update_one(
            {"id": pin_id},
            {"$set": {"upvotes": len(upvoters), "upvoters": upvoters}}
        )
        return {"upvoted": False, "upvotes": len(upvoters)}
    else:
        upvoters.append(user["id"])
        await db.demand_pins.update_one(
            {"id": pin_id},
            {"$set": {"upvotes": len(upvoters), "upvoters": upvoters}}
        )
        return {"upvoted": True, "upvotes": len(upvoters)}


@router.delete("/{pin_id}")
async def delete_pin(pin_id: str, user: dict = Depends(get_current_user)):
    pin = await db.demand_pins.find_one({"id": pin_id})
    if not pin:
        raise HTTPException(status_code=404, detail="Pin not found")
    if pin["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.demand_pins.delete_one({"id": pin_id})
    return {"success": True}
