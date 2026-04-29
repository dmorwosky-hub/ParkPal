from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from models import ParkingSpotCreate, ParkingSpotUpdate, ParkingSpotResponse
from utils import get_current_user
from database import db
import uuid
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/spots", tags=["spots"])

# Price suggestion lookup by zip code prefix (first 3 digits → density zone)
PRICE_ZONES = {
    # Major metro dense zones (first 3 digits of zip)
    "100": 25, "101": 22, "102": 20, "103": 18, "104": 16,  # NYC
    "941": 22, "940": 20, "942": 18, "943": 16, "944": 14,  # SF Bay Area
    "900": 20, "901": 18, "902": 16, "903": 14,              # LA
    "606": 18, "607": 16, "608": 14,                          # Chicago
    "770": 16, "772": 15, "773": 14,                          # Houston
    "852": 16, "853": 15,                                     # Phoenix
    "191": 18, "192": 16, "193": 15,                          # Philadelphia
    "782": 16, "784": 14,                                     # San Antonio
    "752": 16, "750": 15, "751": 14,                          # Dallas
    "302": 15, "303": 14,                                     # San Jose / Atlanta
}


@router.get("/price-suggestion")
async def get_price_suggestion(zip_code: str):
    """Suggest an hourly rate based on zip code density."""
    prefix3 = zip_code[:3] if len(zip_code) >= 3 else zip_code
    suggested = PRICE_ZONES.get(prefix3)
    if not suggested:
        # Default tiering by first digit
        first_digit = zip_code[0] if zip_code else "5"
        defaults = {"0": 18, "1": 16, "2": 14, "3": 13, "4": 12, "5": 10, "6": 12, "7": 11, "8": 12, "9": 15}
        suggested = defaults.get(first_digit, 12)

    zone = "high-density" if suggested >= 18 else ("medium-density" if suggested >= 14 else "standard")
    return {
        "zip_code": zip_code,
        "suggested_rate": suggested,
        "suggested_min": max(1, round(suggested * 0.7)),
        "suggested_max": round(suggested * 1.5),
        "suggested_hourly_rate": suggested,
        "suggested_event_rate": round(suggested * 2.5),
        "suggested_monthly": round(suggested * 22 * 8),
        "suggested_monthly_rate": round(suggested * 22 * 8),
        "demand_level": zone,
        "zone": zone,
        "reasoning": f"ZIP {zip_code[:3]}xx area · {zone.replace('-', ' ')} parking market",
    }


@router.post("", response_model=ParkingSpotResponse)
async def create_parking_spot(spot_data: ParkingSpotCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can create parking spots")

    spot_id = str(uuid.uuid4())
    spot_doc = {
        "id": spot_id,
        "host_id": user["id"],
        "host_name": user["full_name"],
        "address": spot_data.address,
        "city": spot_data.city,
        "state": spot_data.state,
        "zip_code": spot_data.zip_code,
        "latitude": spot_data.latitude,
        "longitude": spot_data.longitude,
        "hourly_rate": spot_data.hourly_rate,
        "event_rate": spot_data.event_rate,
        "description": spot_data.description,
        "is_active": False,
        "auto_off_time": None,
        "is_promoted": False,
        "promotion_expires": None,
        "has_monthly_lease": spot_data.has_monthly_lease,
        "monthly_rate": spot_data.monthly_rate,
        "lease_schedule": spot_data.lease_schedule,
        "is_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.parking_spots.insert_one(spot_doc)
    return ParkingSpotResponse(**{k: v for k, v in spot_doc.items() if k != "_id"})


@router.get("", response_model=List[ParkingSpotResponse])
async def get_available_spots(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance: float = 10.0,
    max_price: Optional[float] = None
):
    query = {"is_active": True}
    if max_price:
        query["hourly_rate"] = {"$lte": max_price}

    now = datetime.now(timezone.utc)
    spots = await db.parking_spots.find(query, {"_id": 0}).to_list(100)

    active_spots = []
    promoted_spots = []
    for spot in spots:
        if spot.get("auto_off_time"):
            auto_off = datetime.fromisoformat(spot["auto_off_time"])
            if now >= auto_off:
                await db.parking_spots.update_one(
                    {"id": spot["id"]},
                    {"$set": {"is_active": False, "auto_off_time": None}}
                )
                continue

        if spot.get("is_promoted") and spot.get("promotion_expires"):
            promo_expires = datetime.fromisoformat(spot["promotion_expires"])
            if now >= promo_expires:
                await db.parking_spots.update_one(
                    {"id": spot["id"]},
                    {"$set": {"is_promoted": False, "promotion_expires": None}}
                )
                spot["is_promoted"] = False
                spot["promotion_expires"] = None

        spot_response = ParkingSpotResponse(**spot)
        if spot.get("is_promoted"):
            promoted_spots.append(spot_response)
        else:
            active_spots.append(spot_response)

    return promoted_spots + active_spots


@router.get("/my", response_model=List[ParkingSpotResponse])
async def get_my_spots(user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can view their spots")
    spots = await db.parking_spots.find({"host_id": user["id"]}, {"_id": 0}).to_list(100)
    return [ParkingSpotResponse(**spot) for spot in spots]


@router.get("/{spot_id}", response_model=ParkingSpotResponse)
async def get_spot(spot_id: str):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return ParkingSpotResponse(**spot)


@router.patch("/{spot_id}", response_model=ParkingSpotResponse)
async def update_spot(spot_id: str, update_data: ParkingSpotUpdate, user: dict = Depends(get_current_user)):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if "auto_off_hours" in update_dict:
        hours = update_dict.pop("auto_off_hours")
        if hours and hours > 0:
            update_dict["auto_off_time"] = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
        else:
            update_dict["auto_off_time"] = None

    if update_dict:
        await db.parking_spots.update_one({"id": spot_id}, {"$set": update_dict})

    updated_spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    return ParkingSpotResponse(**updated_spot)


@router.post("/{spot_id}/toggle", response_model=ParkingSpotResponse)
async def toggle_spot_active(spot_id: str, user: dict = Depends(get_current_user)):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_status = not spot["is_active"]
    update_data = {"is_active": new_status}
    if not new_status:
        update_data["auto_off_time"] = None

    await db.parking_spots.update_one({"id": spot_id}, {"$set": update_data})
    updated_spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    return ParkingSpotResponse(**updated_spot)


@router.delete("/{spot_id}")
async def delete_spot(spot_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can delete spots")

    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check for active bookings
    active_booking = await db.bookings.find_one({
        "spot_id": spot_id,
        "status": "confirmed"
    })
    if active_booking:
        raise HTTPException(status_code=400, detail="Cannot delete spot with active bookings")

    await db.parking_spots.delete_one({"id": spot_id})
    return {"success": True, "message": "Spot deleted"}
