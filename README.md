# Park-Pal — Peer-to-Peer Parking Marketplace

A hyper-local, peer-to-peer parking marketplace that connects homeowners (Hosts) with drivers (Guests). Hosts rent out their driveways, Guests find and book affordable parking near events and busy areas.

## Live Demo

**Demo Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Host | demo.host@parkpal.com | demo123456 |
| Guest | demo.guest@parkpal.com | demo123456 |

## Features

### For Guests (Drivers)
- Interactive map with real-time available spots (Leaflet/OpenStreetMap)
- Search & filter by location and price
- 2-tap checkout via Stripe
- Get Directions (opens Google Maps / Apple Maps)
- Booking history with stats dashboard
- In-app notifications

### For Hosts (Homeowners)
- List parking spots with map location picker
- Set hourly & event rates
- Toggle availability on/off instantly
- Auto-off timer (auto-deactivate after X hours)
- Earnings dashboard with monthly chart
- Promote spots for featured placement ($5-$20)
- Report violations for overstaying vehicles
- Delete spots

### Platform
- JWT authentication with role-based access (Host/Guest)
- Stripe payment processing (85/15 revenue split)
- Real-time polling for map updates
- Responsive design (mobile + desktop)
- Terms of Service & Privacy Policy pages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS, Shadcn/UI, Leaflet, Recharts, Framer Motion |
| Backend | FastAPI (Python), modular router architecture |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (bcrypt password hashing, 7-day tokens) |
| Payments | Stripe Checkout |

## Project Structure

```
backend/
  server.py            # Main FastAPI entry point
  database.py          # MongoDB connection
  models.py            # Pydantic models
  utils.py             # Auth helpers, JWT, notifications
  seed_demo.py         # Demo data seeder
  routes/
    auth.py            # Register, Login, Me
    spots.py           # Spot CRUD, toggle, delete
    bookings.py        # Checkout, history, status
    notifications.py   # Notification management
    violations.py      # Violation reporting
    promotions.py      # Promotion packages & checkout
    stats.py           # Dashboard stats & earnings

frontend/
  src/
    App.js             # Routes & auth guards
    context/AuthContext.js
    pages/
      LandingPage.js
      LoginPage.js
      RegisterPage.js
      GuestDashboard.js    # Map + booking
      HostDashboard.js     # Spot management + earnings
      AddSpotPage.js       # Location picker
      BookingHistoryPage.js
      BookingSuccess.js
      TermsPage.js
      PrivacyPage.js
      NotFoundPage.js      # Custom 404
    components/ui/         # Shadcn components
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Get JWT token
- `GET /api/auth/me` — Current user info

### Spots
- `POST /api/spots` — Create spot (Host)
- `GET /api/spots` — List active spots (public)
- `GET /api/spots/my` — Host's spots
- `PATCH /api/spots/:id` — Update pricing/settings
- `POST /api/spots/:id/toggle` — Toggle active
- `DELETE /api/spots/:id` — Delete spot

### Bookings
- `POST /api/bookings/checkout` — Stripe checkout
- `GET /api/bookings/status/:session_id` — Payment status
- `GET /api/bookings/my` — User's bookings
- `GET /api/bookings/history` — Enriched booking history
- `GET /api/bookings/active/host` — Active bookings for host

### Stats
- `GET /api/stats/host` — Host earnings & metrics
- `GET /api/stats/guest` — Guest spending & metrics

### Promotions
- `GET /api/promotions/packages` — Available packages
- `POST /api/promotions/checkout` — Purchase promotion

### Other
- `GET /api/notifications` — User notifications
- `POST /api/violations/report` — Report violation

## Revenue Model

- **Booking fees:** 15% platform fee on each booking (Host gets 85%)
- **Promotions:** $5 (24h), $12 (3 days), $20 (7 days) for featured spot placement

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed_demo.py  # Optional: load demo data
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

### Environment Variables

**backend/.env**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=parkpal
CORS_ORIGINS=*
STRIPE_API_KEY=sk_test_your_stripe_key
JWT_SECRET=your_jwt_secret
```

**frontend/.env**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## License

Proprietary. All rights reserved.
