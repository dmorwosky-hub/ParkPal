from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from models import BookingCreate, BookingResponse, BookingHistoryItem, CheckoutResponse
from utils import get_current_user, create_notification
from database import db
import os
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("/checkout", response_model=CheckoutResponse)
async def create_booking_checkout(
    booking_data: BookingCreate,
    request: Request,
    user: dict = Depends(get_current_user)
):
    if user["role"] != "guest":
        raise HTTPException(status_code=403, detail="Only guests can book spots")

    spot = await db.parking_spots.find_one({"id": booking_data.spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if not spot["is_active"]:
        raise HTTPException(status_code=400, detail="Spot is not available")

    if booking_data.use_event_rate and spot.get("event_rate"):
        total_amount = float(spot["event_rate"])
    else:
        total_amount = float(spot["hourly_rate"]) * booking_data.hours

    platform_fee = round(total_amount * 0.15, 2)
    host_payout = round(total_amount * 0.85, 2)

    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "spot_id": spot["id"],
        "spot_address": spot["address"],
        "host_id": spot["host_id"],
        "guest_id": user["id"],
        "guest_name": user["full_name"],
        "license_plate": booking_data.license_plate.upper(),
        "vehicle_make": booking_data.vehicle_make,
        "vehicle_model": booking_data.vehicle_model,
        "hours": booking_data.hours,
        "total_amount": total_amount,
        "platform_fee": platform_fee,
        "host_payout": host_payout,
        "status": "pending",
        "payment_status": "pending",
        "start_time": None,
        "end_time": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)

    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    origin_url = booking_data.origin_url.rstrip('/')
    success_url = f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}&booking_id={booking_id}"
    cancel_url = f"{origin_url}/guest/dashboard"

    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": booking_id,
            "guest_id": user["id"],
            "spot_id": spot["id"],
            "type": "parking_booking"
        }
    )

    session = await stripe_checkout.create_checkout_session(checkout_request)

    transaction_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "booking_id": booking_id,
        "user_id": user["id"],
        "amount": total_amount,
        "currency": "usd",
        "payment_status": "initiated",
        "metadata": checkout_request.metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)

    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"stripe_session_id": session.session_id}}
    )

    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.session_id,
        booking_id=booking_id
    )


@router.get("/status/{session_id}")
async def check_payment_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)

    booking = await db.bookings.find_one({"stripe_session_id": session_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "payment_status": status.payment_status,
            "status": status.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    if status.payment_status == "paid" and booking["status"] == "pending":
        start_time = datetime.now(timezone.utc)
        end_time = start_time + timedelta(hours=booking["hours"])

        await db.bookings.update_one(
            {"id": booking["id"]},
            {"$set": {
                "status": "confirmed",
                "payment_status": "paid",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }}
        )

        await db.parking_spots.update_one(
            {"id": booking["spot_id"]},
            {"$set": {"is_active": False}}
        )

        spot = await db.parking_spots.find_one({"id": booking["spot_id"]}, {"_id": 0})
        await create_notification(
            spot["host_id"],
            "Spot Booked!",
            f"Your spot at {spot['address']} has been booked by {booking['guest_name']}. Vehicle: {booking['vehicle_make']} {booking['vehicle_model']} ({booking['license_plate']})",
            "booking"
        )

    return {
        "payment_status": status.payment_status,
        "status": status.status,
        "booking_id": booking["id"]
    }


@router.get("/my", response_model=List[BookingResponse])
async def get_my_bookings(user: dict = Depends(get_current_user)):
    if user["role"] == "guest":
        bookings = await db.bookings.find({"guest_id": user["id"]}, {"_id": 0}).to_list(100)
    else:
        spots = await db.parking_spots.find({"host_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
        spot_ids = [s["id"] for s in spots]
        bookings = await db.bookings.find({"spot_id": {"$in": spot_ids}}, {"_id": 0}).to_list(100)

    return [BookingResponse(**{k: v for k, v in b.items() if k in BookingResponse.model_fields}) for b in bookings]


@router.get("/history", response_model=List[BookingHistoryItem])
async def get_booking_history(user: dict = Depends(get_current_user)):
    """Get booking history with spot details for the current user."""
    if user["role"] == "guest":
        bookings = await db.bookings.find(
            {"guest_id": user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
    else:
        spots = await db.parking_spots.find({"host_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
        spot_ids = [s["id"] for s in spots]
        bookings = await db.bookings.find(
            {"spot_id": {"$in": spot_ids}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)

    # Enrich with spot details
    result = []
    for b in bookings:
        spot = await db.parking_spots.find_one({"id": b.get("spot_id")}, {"_id": 0})
        item = {k: v for k, v in b.items() if k in BookingHistoryItem.model_fields}
        if spot:
            item["spot_address"] = spot.get("address")
            item["spot_city"] = spot.get("city")
            item["spot_state"] = spot.get("state")
        else:
            item.setdefault("spot_address", b.get("spot_address"))
        result.append(BookingHistoryItem(**item))

    return result


@router.get("/active/host", response_model=List[BookingResponse])
async def get_active_host_bookings(user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can view this")

    spots = await db.parking_spots.find({"host_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
    spot_ids = [s["id"] for s in spots]

    bookings = await db.bookings.find({
        "spot_id": {"$in": spot_ids},
        "status": "confirmed"
    }, {"_id": 0}).to_list(100)

    return [BookingResponse(**{k: v for k, v in b.items() if k in BookingResponse.model_fields}) for b in bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingResponse(**{k: v for k, v in booking.items() if k in BookingResponse.model_fields})
