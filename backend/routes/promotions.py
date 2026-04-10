from fastapi import APIRouter, Depends, HTTPException, Request
from models import PromotionCreate, PromotionCheckoutResponse
from utils import get_current_user, create_notification
from database import db
import os
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

PROMOTION_PACKAGES = {
    "1_day": {"days": 1, "price": 5.00, "label": "24 Hours"},
    "3_days": {"days": 3, "price": 12.00, "label": "3 Days"},
    "7_days": {"days": 7, "price": 20.00, "label": "7 Days"}
}

router = APIRouter(prefix="/api/promotions", tags=["promotions"])


@router.get("/packages")
async def get_promotion_packages():
    return {
        "packages": [
            {"id": "1_day", "days": 1, "price": 5.00, "label": "24 Hours", "description": "Perfect for single events"},
            {"id": "3_days", "days": 3, "price": 12.00, "label": "3 Days", "description": "Great for weekend events"},
            {"id": "7_days", "days": 7, "price": 20.00, "label": "7 Days", "description": "Best value for busy weeks"}
        ]
    }


@router.post("/checkout", response_model=PromotionCheckoutResponse)
async def create_promotion_checkout(
    promo_data: PromotionCreate,
    request: Request,
    user: dict = Depends(get_current_user)
):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can promote spots")

    spot = await db.parking_spots.find_one({"id": promo_data.spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if promo_data.package not in PROMOTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid promotion package")

    package = PROMOTION_PACKAGES[promo_data.package]
    amount = package["price"]

    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    origin_url = promo_data.origin_url.rstrip('/')
    success_url = f"{origin_url}/host/dashboard?promo_success=true&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/host/dashboard"

    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "spot_id": promo_data.spot_id,
            "host_id": user["id"],
            "package": promo_data.package,
            "days": str(package["days"]),
            "type": "spot_promotion"
        }
    )

    session = await stripe_checkout.create_checkout_session(checkout_request)

    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "spot_id": promo_data.spot_id,
        "user_id": user["id"],
        "amount": amount,
        "currency": "usd",
        "payment_status": "initiated",
        "type": "promotion",
        "metadata": checkout_request.metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)

    return PromotionCheckoutResponse(
        checkout_url=session.url,
        session_id=session.session_id,
        spot_id=promo_data.spot_id
    )


@router.get("/status/{session_id}")
async def check_promotion_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)

    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "type": "promotion"},
        {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "payment_status": status.payment_status,
            "status": status.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    if status.payment_status == "paid":
        spot = await db.parking_spots.find_one({"id": transaction["spot_id"]}, {"_id": 0})
        days = int(transaction["metadata"].get("days", 1))

        if spot.get("is_promoted") and spot.get("promotion_expires"):
            current_expires = datetime.fromisoformat(spot["promotion_expires"])
            if current_expires > datetime.now(timezone.utc):
                new_expires = current_expires + timedelta(days=days)
            else:
                new_expires = datetime.now(timezone.utc) + timedelta(days=days)
        else:
            new_expires = datetime.now(timezone.utc) + timedelta(days=days)

        await db.parking_spots.update_one(
            {"id": transaction["spot_id"]},
            {"$set": {
                "is_promoted": True,
                "promotion_expires": new_expires.isoformat()
            }}
        )

        await create_notification(
            user["id"],
            "Spot Promoted!",
            f"Your spot at {spot['address']} is now featured for {days} day(s)!",
            "promotion"
        )

    return {
        "payment_status": status.payment_status,
        "status": status.status,
        "spot_id": transaction["spot_id"]
    }
