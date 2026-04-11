"""
Park-Pal Demo Data Seed Script
Run this to populate the database with sample data for demo/showcase purposes.
Usage: python seed_demo.py
"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import bcrypt
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


def hash_pw(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


async def seed():
    print("Seeding Park-Pal demo data...")

    # Demo Host
    host_id = str(uuid.uuid4())
    host = {
        "id": host_id,
        "email": "demo.host@parkpal.com",
        "full_name": "Sarah Mitchell",
        "role": "host",
        "password_hash": hash_pw("demo123456"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Demo Guest
    guest_id = str(uuid.uuid4())
    guest = {
        "id": guest_id,
        "email": "demo.guest@parkpal.com",
        "full_name": "James Rivera",
        "role": "guest",
        "password_hash": hash_pw("demo123456"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Check if demo users already exist
    existing_host = await db.users.find_one({"email": host["email"]})
    existing_guest = await db.users.find_one({"email": guest["email"]})

    if not existing_host:
        await db.users.insert_one(host)
        print(f"  Created host: {host['email']}")
    else:
        host_id = existing_host["id"]
        print(f"  Host already exists: {host['email']}")

    if not existing_guest:
        await db.users.insert_one(guest)
        print(f"  Created guest: {guest['email']}")
    else:
        guest_id = existing_guest["id"]
        print(f"  Guest already exists: {guest['email']}")

    # Demo Parking Spots (LA area)
    spots_data = [
        {
            "address": "742 Evergreen Terrace",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90012",
            "latitude": 34.0625,
            "longitude": -118.2450,
            "hourly_rate": 5.00,
            "event_rate": 15.00,
            "description": "Spacious covered driveway, 5 min walk to Dodger Stadium. Fits SUVs and trucks.",
            "is_active": True,
        },
        {
            "address": "1600 Vine Street",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90028",
            "latitude": 34.0985,
            "longitude": -118.3267,
            "hourly_rate": 8.00,
            "event_rate": 25.00,
            "description": "Hollywood hotspot parking. Gated driveway, secure and well-lit. Near Walk of Fame.",
            "is_active": True,
        },
        {
            "address": "321 Ocean Avenue",
            "city": "Santa Monica",
            "state": "CA",
            "zip_code": "90401",
            "latitude": 34.0195,
            "longitude": -118.4912,
            "hourly_rate": 6.50,
            "event_rate": 20.00,
            "description": "2 blocks from the beach! Private driveway with shade. Perfect for beach days.",
            "is_active": True,
        },
        {
            "address": "555 Figueroa Street",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90071",
            "latitude": 34.0530,
            "longitude": -118.2580,
            "hourly_rate": 10.00,
            "event_rate": 30.00,
            "description": "Downtown LA parking near Staples Center. Great for Lakers/Clippers games and concerts.",
            "is_active": True,
            "is_promoted": True,
            "promotion_expires": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        },
        {
            "address": "8500 Beverly Blvd",
            "city": "West Hollywood",
            "state": "CA",
            "zip_code": "90048",
            "latitude": 34.0764,
            "longitude": -118.3730,
            "hourly_rate": 7.00,
            "event_rate": None,
            "description": "Residential neighborhood parking near The Grove shopping center.",
            "is_active": True,
        },
        {
            "address": "200 N Spring Street",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90012",
            "latitude": 34.0545,
            "longitude": -118.2435,
            "hourly_rate": 4.00,
            "event_rate": 12.00,
            "description": "Near City Hall and Grand Park. Quiet residential street. Easy access.",
            "is_active": False,
        },
    ]

    # Only seed spots if none exist for demo host
    existing_spots = await db.parking_spots.find({"host_id": host_id}).to_list(100)
    if len(existing_spots) == 0:
        for s in spots_data:
            spot_doc = {
                "id": str(uuid.uuid4()),
                "host_id": host_id,
                "host_name": "Sarah Mitchell",
                **s,
                "auto_off_time": None,
                "is_promoted": s.get("is_promoted", False),
                "promotion_expires": s.get("promotion_expires", None),
                "created_at": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
            }
            await db.parking_spots.insert_one(spot_doc)
        print(f"  Created {len(spots_data)} demo parking spots")
    else:
        print(f"  Demo spots already exist ({len(existing_spots)} spots)")

    # Demo bookings (past completed ones for history)
    existing_bookings = await db.bookings.find({"guest_id": guest_id}).to_list(100)
    if len(existing_bookings) == 0:
        spots = await db.parking_spots.find({"host_id": host_id, "is_active": True}, {"_id": 0}).to_list(5)
        for i, spot in enumerate(spots[:3]):
            days_ago = (i + 1) * 5
            start = datetime.now(timezone.utc) - timedelta(days=days_ago)
            hours = [2, 4, 3][i]
            end = start + timedelta(hours=hours)
            total = spot["hourly_rate"] * hours

            booking_doc = {
                "id": str(uuid.uuid4()),
                "spot_id": spot["id"],
                "spot_address": spot["address"],
                "host_id": host_id,
                "guest_id": guest_id,
                "guest_name": "James Rivera",
                "license_plate": ["ABC 1234", "XYZ 5678", "DEF 9012"][i],
                "vehicle_make": ["Toyota", "Honda", "Tesla"][i],
                "vehicle_model": ["Camry", "Civic", "Model 3"][i],
                "hours": hours,
                "total_amount": total,
                "platform_fee": round(total * 0.15, 2),
                "host_payout": round(total * 0.85, 2),
                "status": "confirmed",
                "payment_status": "paid",
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
                "stripe_session_id": f"demo_session_{i}",
                "created_at": start.isoformat()
            }
            await db.bookings.insert_one(booking_doc)
        print(f"  Created 3 demo bookings")

        # Notification for host
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": host_id,
            "title": "Welcome to Park-Pal!",
            "message": "Your account is set up. Add your first parking spot to start earning.",
            "type": "system",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": guest_id,
            "title": "Welcome to Park-Pal!",
            "message": "Find and book parking spots near your destination in seconds.",
            "type": "system",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print("  Created welcome notifications")
    else:
        print(f"  Demo bookings already exist ({len(existing_bookings)} bookings)")

    print("\nDemo data seeded successfully!")
    print("\n--- Demo Credentials ---")
    print("Host:  demo.host@parkpal.com  / demo123456")
    print("Guest: demo.guest@parkpal.com / demo123456")


if __name__ == "__main__":
    asyncio.run(seed())
