from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from utils import get_current_user
from database import db
from storage import get_object
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_EMAILS = ["admin@parkpal.com"]


async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("email") not in ADMIN_EMAILS and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/dashboard")
async def admin_dashboard(user: dict = Depends(require_admin)):
    """Main admin dashboard stats."""
    total_users = await db.users.count_documents({})
    hosts = await db.users.count_documents({"role": "host"})
    guests = await db.users.count_documents({"role": "guest"})
    blocked_users = await db.users.count_documents({"is_blocked": True})

    total_spots = await db.parking_spots.count_documents({})
    active_spots = await db.parking_spots.count_documents({"is_active": True})
    verified_spots = await db.parking_spots.count_documents({"is_verified": True})

    all_bookings = await db.bookings.find({}, {"_id": 0}).to_list(1000)
    paid_bookings = [b for b in all_bookings if b.get("payment_status") == "paid"]
    active_bookings = [b for b in all_bookings if b.get("status") == "confirmed"]

    total_revenue = sum(b.get("total_amount", 0) for b in paid_bookings)
    total_platform_fees = sum(b.get("platform_fee", 0) for b in paid_bookings)
    total_host_payouts = sum(b.get("host_payout", 0) for b in paid_bookings)

    # Monthly revenue
    monthly = {}
    for b in paid_bookings:
        m = b.get("created_at", "")[:7]
        if m:
            if m not in monthly:
                monthly[m] = {"revenue": 0, "fees": 0, "bookings": 0}
            monthly[m]["revenue"] += b.get("total_amount", 0)
            monthly[m]["fees"] += b.get("platform_fee", 0)
            monthly[m]["bookings"] += 1
    monthly_data = [{"month": k, **v} for k, v in sorted(monthly.items())[-12:]]

    # Violations
    total_violations = await db.violations.count_documents({})
    open_violations = await db.violations.count_documents({"status": "reported"})

    # Promotions revenue
    promo_txns = await db.payment_transactions.find({"type": "promotion", "payment_status": "paid"}, {"_id": 0}).to_list(500)
    promo_revenue = sum(t.get("amount", 0) for t in promo_txns)

    return {
        "users": {"total": total_users, "hosts": hosts, "guests": guests, "blocked": blocked_users},
        "spots": {"total": total_spots, "active": active_spots, "verified": verified_spots},
        "bookings": {"total": len(paid_bookings), "active": len(active_bookings), "all_time": len(all_bookings)},
        "revenue": {
            "total": round(total_revenue, 2),
            "platform_fees": round(total_platform_fees, 2),
            "host_payouts": round(total_host_payouts, 2),
            "promotion_revenue": round(promo_revenue, 2)
        },
        "violations": {"total": total_violations, "open": open_violations},
        "monthly": monthly_data
    }


@router.get("/users")
async def list_users(user: dict = Depends(require_admin), role: str = Query(None), page: int = 1, limit: int = 50):
    query = {}
    if role:
        query["role"] = role
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)

    # Enrich with stats
    for u in users:
        if u["role"] == "host":
            u["spot_count"] = await db.parking_spots.count_documents({"host_id": u["id"]})
            u["stripe_connected"] = bool(u.get("stripe_account_id"))
        else:
            u["booking_count"] = await db.bookings.count_documents({"guest_id": u["id"], "payment_status": "paid"})

    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.post("/users/{user_id}/block")
async def block_user(user_id: str, user: dict = Depends(require_admin)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = not target.get("is_blocked", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": new_status}})
    return {"success": True, "is_blocked": new_status}


@router.post("/users/{user_id}/verify")
async def verify_user(user_id: str, user: dict = Depends(require_admin)):
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one({"id": user_id}, {"$set": {"is_verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True}


@router.get("/violations")
async def list_violations(user: dict = Depends(require_admin), status: str = Query(None)):
    query = {}
    if status:
        query["status"] = status
    violations = await db.violations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

    # Enrich with booking and user details
    for v in violations:
        booking = await db.bookings.find_one({"id": v.get("booking_id")}, {"_id": 0})
        if booking:
            v["booking"] = {k: booking[k] for k in ["license_plate", "vehicle_make", "vehicle_model", "guest_name", "total_amount", "spot_id"] if k in booking}
        host = await db.users.find_one({"id": v.get("host_id")}, {"_id": 0, "password_hash": 0})
        if host:
            v["host_name"] = host.get("full_name")

    return {"violations": violations}


@router.post("/violations/{violation_id}/resolve")
async def resolve_violation(violation_id: str, user: dict = Depends(require_admin)):
    v = await db.violations.find_one({"id": violation_id})
    if not v:
        raise HTTPException(status_code=404, detail="Violation not found")
    await db.violations.update_one(
        {"id": violation_id},
        {"$set": {"status": "resolved", "resolved_by": user["id"], "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


@router.get("/spots/pending-verification")
async def pending_verification(user: dict = Depends(require_admin)):
    spots = await db.parking_spots.find(
        {"verification_status": "pending"},
        {"_id": 0}
    ).to_list(100)
    for s in spots:
        host = await db.users.find_one({"id": s.get("host_id")}, {"_id": 0, "password_hash": 0})
        if host:
            s["host_name"] = host.get("full_name")
            s["host_email"] = host.get("email")
    return {"spots": spots}


@router.post("/spots/{spot_id}/verify")
async def verify_spot(spot_id: str, user: dict = Depends(require_admin)):
    spot = await db.parking_spots.find_one({"id": spot_id})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    await db.parking_spots.update_one(
        {"id": spot_id},
        {"$set": {"is_verified": True, "verification_status": "approved", "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    from utils import create_notification
    await create_notification(spot["host_id"], "Spot Verified!", f"Your spot at {spot['address']} has been verified.", "verification")
    return {"success": True}


@router.post("/spots/{spot_id}/reject")
async def reject_spot(spot_id: str, user: dict = Depends(require_admin)):
    spot = await db.parking_spots.find_one({"id": spot_id})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    await db.parking_spots.update_one(
        {"id": spot_id},
        {"$set": {"is_verified": False, "verification_status": "rejected"}}
    )
    return {"success": True}


@router.get("/system-health")
async def system_health(user: dict = Depends(require_admin)):
    """System health check for handover."""
    checks = {}

    # MongoDB
    try:
        await db.command("ping")
        checks["mongodb"] = {"status": "active", "message": "Connected"}
    except Exception as e:
        checks["mongodb"] = {"status": "error", "message": str(e)}

    # Stripe
    import os
    stripe_key = os.environ.get("STRIPE_API_KEY")
    checks["stripe"] = {
        "status": "active" if stripe_key and stripe_key.startswith("sk_") else "inactive",
        "message": f"Key configured ({'test' if 'test' in (stripe_key or '') else 'live'} mode)" if stripe_key else "No key set",
        "mode": "test" if "test" in (stripe_key or "") else "live"
    }

    # Object Storage
    try:
        from storage import init_storage
        init_storage()
        checks["object_storage"] = {"status": "active", "message": "Connected"}
    except Exception as e:
        checks["object_storage"] = {"status": "error", "message": str(e)}

    # Maps (Leaflet/CARTO - always available)
    checks["maps"] = {"status": "active", "message": "CARTO Dark tiles (no API key required)"}

    # DB stats
    collections = await db.list_collection_names()
    db_stats = {}
    for c in collections:
        db_stats[c] = await db[c].count_documents({})

    return {
        "integrations": checks,
        "database": db_stats,
        "environment": {
            "stripe_mode": "test" if "test" in (stripe_key or "") else "live",
            "has_emergent_key": bool(os.environ.get("EMERGENT_LLM_KEY")),
        },
        "handover_guide": {
            "steps": [
                "1. Replace STRIPE_API_KEY in backend/.env with your live Stripe key",
                "2. Set up Stripe Connect on your Stripe dashboard for host payouts",
                "3. Update MONGO_URL if migrating to a new database",
                "4. Change JWT_SECRET to a new random string",
                "5. Update admin email in backend/routes/admin.py ADMIN_EMAILS list",
                "6. Set CORS_ORIGINS in backend/.env to your production domain",
                "7. Run 'python seed_demo.py' to populate demo data (optional)",
                "8. Deploy via your preferred hosting (Vercel, Railway, etc.)"
            ]
        }
    }


@router.get("/files/{path:path}")
async def serve_file(path: str, auth: str = Query(None), user: dict = Depends(require_admin)):
    """Serve uploaded files (verification photos etc)."""
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))
