from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(..., pattern="^(host|guest)$")
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
    is_promoted: bool = False
    promotion_expires: Optional[str] = None
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


class BookingHistoryItem(BaseModel):
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
    spot_address: Optional[str] = None
    spot_city: Optional[str] = None
    spot_state: Optional[str] = None


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


class PromotionCreate(BaseModel):
    spot_id: str
    package: str = Field(..., pattern="^(1_day|3_days|7_days)$")
    origin_url: str


class PromotionCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str
    spot_id: str
