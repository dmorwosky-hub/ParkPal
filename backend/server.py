from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware
from database import db, client
from emergentintegrations.payments.stripe.checkout import StripeCheckout
import os
import logging
from datetime import datetime, timezone, timedelta

from routes.auth import router as auth_router
from routes.spots import router as spots_router
from routes.bookings import router as bookings_router
from routes.notifications import router as notifications_router
from routes.violations import router as violations_router
from routes.promotions import router as promotions_router
from routes.stats import router as stats_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

app = FastAPI(title="Park-Pal API", version="1.0.0")

# Include all routers
app.include_router(auth_router)
app.include_router(spots_router)
app.include_router(bookings_router)
app.include_router(notifications_router)
app.include_router(violations_router)
app.include_router(promotions_router)
app.include_router(stats_router)


# Stripe Webhook (kept at root level)
@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")

    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, signature)

        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            booking = await db.bookings.find_one({"stripe_session_id": session_id}, {"_id": 0})

            if booking and booking["status"] == "pending":
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

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/api/")
async def root():
    return {"message": "Park-Pal API", "version": "1.0.0"}


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
