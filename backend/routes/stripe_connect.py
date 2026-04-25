from fastapi import APIRouter, Depends, HTTPException, Request
from utils import get_current_user
from database import db
from datetime import datetime, timezone

router = APIRouter(prefix="/api/stripe-connect", tags=["stripe-connect"])


@router.get("/status")
async def connect_status(user: dict = Depends(get_current_user)):
    """Check if host has connected their Stripe account."""
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts")

    stripe_id = user.get("stripe_account_id")
    return {
        "connected": bool(stripe_id),
        "stripe_account_id": stripe_id,
        "onboarding_complete": user.get("stripe_onboarding_complete", False),
        "message": "Stripe Connect requires a live Stripe Platform account. Contact admin to set up." if not stripe_id else "Connected"
    }


@router.post("/init")
async def init_connect(request: Request, user: dict = Depends(get_current_user)):
    """
    Initialize Stripe Connect onboarding for a host.
    NOTE: Full implementation requires Stripe Connect Platform account.
    This endpoint creates the record and returns status.
    In production, this would create a Stripe Connect Account and return an onboarding URL.
    """
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts")

    if user.get("stripe_account_id"):
        return {"already_connected": True, "stripe_account_id": user["stripe_account_id"]}

    # Store intent — full Stripe Connect requires platform account
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "stripe_connect_requested": True,
            "stripe_connect_requested_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    return {
        "status": "pending",
        "message": "Stripe Connect onboarding requested. The platform admin will complete setup. In production, this redirects to Stripe's hosted onboarding page.",
        "setup_instructions": {
            "step_1": "Platform owner enables Stripe Connect on their Stripe Dashboard",
            "step_2": "Create connected account via stripe.Account.create()",
            "step_3": "Generate onboarding link via stripe.AccountLink.create()",
            "step_4": "Host completes onboarding on Stripe's hosted page",
            "step_5": "Webhook confirms onboarding, enable payouts"
        }
    }


@router.get("/payout-info")
async def payout_info(user: dict = Depends(get_current_user)):
    """Get payout information for the host."""
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts")

    # Calculate earnings
    spots = await db.parking_spots.find({"host_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
    spot_ids = [s["id"] for s in spots]

    bookings = await db.bookings.find(
        {"spot_id": {"$in": spot_ids}, "payment_status": "paid"},
        {"_id": 0}
    ).to_list(500)

    total_earned = sum(b.get("host_payout", 0) for b in bookings)
    pending = sum(b.get("host_payout", 0) for b in bookings if b.get("status") == "confirmed")

    return {
        "total_earned": round(total_earned, 2),
        "pending_payout": round(pending, 2),
        "completed_bookings": len(bookings),
        "stripe_connected": bool(user.get("stripe_account_id")),
        "payout_split": {"host": "85%", "platform": "15%"}
    }
