from fastapi import APIRouter, Depends, HTTPException
from utils import get_current_user
from database import db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/host")
async def get_host_stats(user: dict = Depends(get_current_user)):
    """Get comprehensive stats for the host dashboard."""
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can view this")

    spots = await db.parking_spots.find({"host_id": user["id"]}, {"_id": 0}).to_list(100)
    spot_ids = [s["id"] for s in spots]

    # All bookings for host spots
    all_bookings = await db.bookings.find(
        {"spot_id": {"$in": spot_ids}},
        {"_id": 0}
    ).to_list(500)

    confirmed_bookings = [b for b in all_bookings if b.get("payment_status") == "paid"]
    active_bookings = [b for b in all_bookings if b.get("status") == "confirmed"]

    total_earnings = sum(b.get("host_payout", 0) for b in confirmed_bookings)
    total_platform_fees = sum(b.get("platform_fee", 0) for b in confirmed_bookings)
    total_revenue = sum(b.get("total_amount", 0) for b in confirmed_bookings)

    # Violations
    violations = await db.violations.find(
        {"host_id": user["id"]},
        {"_id": 0}
    ).to_list(100)

    # Promotion stats
    promoted_count = len([s for s in spots if s.get("is_promoted")])

    # Bookings by month (last 6 months)
    monthly_earnings = {}
    for b in confirmed_bookings:
        month_key = b.get("created_at", "")[:7]  # YYYY-MM
        if month_key:
            monthly_earnings[month_key] = monthly_earnings.get(month_key, 0) + b.get("host_payout", 0)

    # Sort monthly data
    sorted_months = sorted(monthly_earnings.items(), key=lambda x: x[0])[-6:]

    return {
        "total_spots": len(spots),
        "active_spots": len([s for s in spots if s.get("is_active")]),
        "promoted_spots": promoted_count,
        "total_bookings": len(confirmed_bookings),
        "active_bookings": len(active_bookings),
        "total_earnings": round(total_earnings, 2),
        "total_revenue": round(total_revenue, 2),
        "total_platform_fees": round(total_platform_fees, 2),
        "total_violations": len(violations),
        "monthly_earnings": [
            {"month": m, "earnings": round(e, 2)} for m, e in sorted_months
        ]
    }


@router.get("/guest")
async def get_guest_stats(user: dict = Depends(get_current_user)):
    """Get stats for the guest dashboard."""
    if user["role"] != "guest":
        raise HTTPException(status_code=403, detail="Only guests can view this")

    bookings = await db.bookings.find(
        {"guest_id": user["id"]},
        {"_id": 0}
    ).to_list(200)

    confirmed = [b for b in bookings if b.get("payment_status") == "paid"]
    active = [b for b in bookings if b.get("status") == "confirmed"]

    total_spent = sum(b.get("total_amount", 0) for b in confirmed)
    total_hours = sum(b.get("hours", 0) for b in confirmed)

    return {
        "total_bookings": len(confirmed),
        "active_bookings": len(active),
        "total_spent": round(total_spent, 2),
        "total_hours_parked": total_hours
    }
