from fastapi import APIRouter, Depends, HTTPException, Request
from utils import get_current_user, create_notification
from database import db
import os
import uuid
import stripe
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")


class MonthlyLeaseCreate(BaseModel):
    spot_id: str
    license_plate: str
    vehicle_make: str
    vehicle_model: str
    origin_url: str


class MonthlyLeaseCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    subscription_id: str


class MonthlyLeaseOfferCreate(BaseModel):
    monthly_rate: float
    schedule: Optional[str] = "M-F 8AM-5PM"
    description: Optional[str] = None


@router.post("/offer/{spot_id}")
async def set_monthly_lease_offer(
    spot_id: str,
    offer: MonthlyLeaseOfferCreate,
    user: dict = Depends(get_current_user)
):
    """Host enables monthly lease option for their spot."""
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can set lease offers")

    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.parking_spots.update_one(
        {"id": spot_id},
        {"$set": {
            "monthly_rate": offer.monthly_rate,
            "lease_schedule": offer.schedule,
            "lease_description": offer.description,
            "has_monthly_lease": True
        }}
    )
    return {"success": True, "monthly_rate": offer.monthly_rate}


@router.delete("/offer/{spot_id}")
async def remove_monthly_lease_offer(spot_id: str, user: dict = Depends(get_current_user)):
    """Host disables monthly lease option."""
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.parking_spots.update_one(
        {"id": spot_id},
        {"$set": {"has_monthly_lease": False, "monthly_rate": None}}
    )
    return {"success": True}


@router.post("/checkout")
async def create_lease_checkout(
    lease_data: MonthlyLeaseCreate,
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Guest initiates monthly lease checkout via Stripe."""
    if user["role"] != "guest":
        raise HTTPException(status_code=403, detail="Only guests can lease spots")

    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    spot = await db.parking_spots.find_one({"id": lease_data.spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not spot.get("has_monthly_lease") or not spot.get("monthly_rate"):
        raise HTTPException(status_code=400, detail="This spot does not offer monthly leases")

    stripe.api_key = STRIPE_API_KEY
    monthly_rate_cents = int(spot["monthly_rate"] * 100)

    sub_id = str(uuid.uuid4())
    origin_url = lease_data.origin_url.rstrip("/")

    try:
        price = stripe.Price.create(
            unit_amount=monthly_rate_cents,
            currency="usd",
            recurring={"interval": "month"},
            product_data={"name": f"Monthly Parking Lease – {spot['address']}"},
        )

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": price.id, "quantity": 1}],
            success_url=f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}&sub_id={sub_id}&type=lease",
            cancel_url=f"{origin_url}/guest/dashboard",
            metadata={
                "subscription_id": sub_id,
                "spot_id": spot["id"],
                "guest_id": user["id"],
                "type": "monthly_lease"
            },
            customer_email=user["email"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    sub_doc = {
        "id": sub_id,
        "spot_id": spot["id"],
        "spot_address": spot["address"],
        "host_id": spot["host_id"],
        "guest_id": user["id"],
        "guest_name": user["full_name"],
        "license_plate": lease_data.license_plate.upper(),
        "vehicle_make": lease_data.vehicle_make,
        "vehicle_model": lease_data.vehicle_model,
        "monthly_rate": spot["monthly_rate"],
        "schedule": spot.get("lease_schedule", "M-F 8AM-5PM"),
        "status": "pending",
        "payment_status": "pending",
        "stripe_session_id": session.id,
        "stripe_subscription_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(sub_doc)

    return {"checkout_url": session.url, "session_id": session.id, "subscription_id": sub_id}


@router.get("/my")
async def get_my_subscriptions(user: dict = Depends(get_current_user)):
    """Get subscriptions for current user."""
    if user["role"] == "guest":
        subs = await db.subscriptions.find({"guest_id": user["id"]}, {"_id": 0}).to_list(50)
    else:
        spots = await db.parking_spots.find({"host_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
        spot_ids = [s["id"] for s in spots]
        subs = await db.subscriptions.find({"spot_id": {"$in": spot_ids}}, {"_id": 0}).to_list(100)
    return {"subscriptions": subs}


@router.post("/{sub_id}/cancel")
async def cancel_subscription(sub_id: str, user: dict = Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if sub["guest_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if sub.get("stripe_subscription_id") and STRIPE_API_KEY:
        try:
            stripe.api_key = STRIPE_API_KEY
            stripe.Subscription.cancel(sub["stripe_subscription_id"])
        except Exception:
            pass

    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}
