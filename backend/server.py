from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'parkpal_secret_key')
JWT_ALGORITHM = "HS256"

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI(title="Park-Pal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(..., pattern="^(host|guest)$")

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ParkingSpotCreate(BaseModel):
    address: str
    city: str
    state: str
    zip_code: str
    latitude: float
    longitude: float
    hourly_rate: float
    event_rate: Optional[float] = None
    description: Optional[str] = None

class ParkingSpotUpdate(BaseModel):
    is_active: Optional[bool] = None
    hourly_rate: Optional[float] = None
    event_rate: Optional[float] = None
    auto_off_hours: Optional[int] = None
    description: Optional[str] = None

class ParkingSpotResponse(BaseModel):
    id: str
    host_id: str
    host_name: str
    address: str
    city: str
    state: str
    zip_code: str
    latitude: float
    longitude: float
    hourly_rate: float
    event_rate: Optional[float] = None
    description: Optional[str] = None
    is_active: bool
    auto_off_time: Optional[str] = None
    created_at: str

class BookingCreate(BaseModel):
    spot_id: str
    license_plate: str
    vehicle_make: str
    vehicle_model: str
    hours: int
    use_event_rate: bool = False
    origin_url: str

class BookingResponse(BaseModel):
    id: str
    spot_id: str
    guest_id: str
    guest_name: str
    license_plate: str
    vehicle_make: str
    vehicle_model: str
    hours: int
    total_amount: float
    platform_fee: float
    host_payout: float
    status: str
    payment_status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    created_at: str

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    booking_id: str

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

class ViolationReport(BaseModel):
    booking_id: str
    reason: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def create_notification(user_id: str, title: str, message: str, notif_type: str):
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, user_data.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=user["created_at"]
    )

# ==================== PARKING SPOTS ENDPOINTS ====================

@api_router.post("/spots", response_model=ParkingSpotResponse)
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.parking_spots.insert_one(spot_doc)
    
    return ParkingSpotResponse(**{k: v for k, v in spot_doc.items() if k != "_id"})

@api_router.get("/spots", response_model=List[ParkingSpotResponse])
async def get_available_spots(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance: float = 10.0,
    max_price: Optional[float] = None
):
    query = {"is_active": True}
    if max_price:
        query["hourly_rate"] = {"$lte": max_price}
    
    # Check auto-off times
    now = datetime.now(timezone.utc)
    spots = await db.parking_spots.find(query, {"_id": 0}).to_list(100)
    
    # Filter out spots past auto-off time
    active_spots = []
    for spot in spots:
        if spot.get("auto_off_time"):
            auto_off = datetime.fromisoformat(spot["auto_off_time"])
            if now >= auto_off:
                await db.parking_spots.update_one(
                    {"id": spot["id"]},
                    {"$set": {"is_active": False, "auto_off_time": None}}
                )
                continue
        active_spots.append(ParkingSpotResponse(**spot))
    
    return active_spots

@api_router.get("/spots/my", response_model=List[ParkingSpotResponse])
async def get_my_spots(user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can view their spots")
    
    spots = await db.parking_spots.find({"host_id": user["id"]}, {"_id": 0}).to_list(100)
    return [ParkingSpotResponse(**spot) for spot in spots]

@api_router.get("/spots/{spot_id}", response_model=ParkingSpotResponse)
async def get_spot(spot_id: str):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return ParkingSpotResponse(**spot)

@api_router.patch("/spots/{spot_id}", response_model=ParkingSpotResponse)
async def update_spot(spot_id: str, update_data: ParkingSpotUpdate, user: dict = Depends(get_current_user)):
    spot = await db.parking_spots.find_one({"id": spot_id}, {"_id": 0})
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    if spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Handle auto-off timer
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

@api_router.post("/spots/{spot_id}/toggle", response_model=ParkingSpotResponse)
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

# ==================== BOOKING ENDPOINTS ====================

@api_router.post("/bookings/checkout", response_model=CheckoutResponse)
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
    
    # Calculate pricing
    if booking_data.use_event_rate and spot.get("event_rate"):
        total_amount = float(spot["event_rate"])
    else:
        total_amount = float(spot["hourly_rate"]) * booking_data.hours
    
    platform_fee = round(total_amount * 0.15, 2)
    host_payout = round(total_amount * 0.85, 2)
    
    # Create booking record
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
    
    # Create Stripe checkout session
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
    
    # Create payment transaction record
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
    
    # Update booking with session id
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"stripe_session_id": session.session_id}}
    )
    
    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.session_id,
        booking_id=booking_id
    )

@api_router.get("/bookings/status/{session_id}")
async def check_payment_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Find booking by session id
    booking = await db.bookings.find_one({"stripe_session_id": session_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update payment transaction
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
        
        # Deactivate the spot
        await db.parking_spots.update_one(
            {"id": booking["spot_id"]},
            {"$set": {"is_active": False}}
        )
        
        # Notify host
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

@api_router.get("/bookings/my", response_model=List[BookingResponse])
async def get_my_bookings(user: dict = Depends(get_current_user)):
    if user["role"] == "guest":
        bookings = await db.bookings.find({"guest_id": user["id"]}, {"_id": 0}).to_list(100)
    else:
        # Host sees bookings for their spots
        spots = await db.parking_spots.find({"host_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
        spot_ids = [s["id"] for s in spots]
        bookings = await db.bookings.find({"spot_id": {"$in": spot_ids}}, {"_id": 0}).to_list(100)
    
    return [BookingResponse(**{k: v for k, v in b.items() if k in BookingResponse.model_fields}) for b in bookings]

@api_router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingResponse(**{k: v for k, v in booking.items() if k in BookingResponse.model_fields})

@api_router.get("/bookings/active/host", response_model=List[BookingResponse])
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

# ==================== NOTIFICATIONS ENDPOINTS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return [NotificationResponse(**n) for n in notifications]

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"success": True}

# ==================== VIOLATION REPORTING ====================

@api_router.post("/violations/report")
async def report_violation(report: ViolationReport, user: dict = Depends(get_current_user)):
    if user["role"] != "host":
        raise HTTPException(status_code=403, detail="Only hosts can report violations")
    
    booking = await db.bookings.find_one({"id": report.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify host owns the spot
    spot = await db.parking_spots.find_one({"id": booking["spot_id"]}, {"_id": 0})
    if not spot or spot["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create violation record
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
    
    # Notify guest
    await create_notification(
        booking["guest_id"],
        "Violation Reported",
        f"A violation has been reported for your booking. Reason: {report.reason}",
        "violation"
    )
    
    return {"success": True, "violation_id": violation_doc["id"]}

# ==================== STRIPE WEBHOOK ====================

@api_router.post("/webhook/stripe")
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

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "Park-Pal API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

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
