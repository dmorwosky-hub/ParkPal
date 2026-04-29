# Park-Pal — Peer-to-Peer Parking Marketplace

A hyper-local, peer-to-peer parking marketplace connecting homeowners (Hosts) with drivers (Guests). Hosts rent out their driveways; Guests find and book affordable parking near events and busy areas. Built with React 19 + FastAPI + MongoDB and deployed on Replit.

---

## Demo Credentials

| Role  | Email                    | Password     |
|-------|--------------------------|--------------|
| Admin | admin@parkpal.com        | admin123456  |
| Host  | demo.host@parkpal.com    | demo123456   |
| Guest | demo.guest@parkpal.com   | demo123456   |

---

## Features

### For Guests (Drivers)
- Interactive map with real-time available parking spots (Leaflet / OpenStreetMap)
- Search & filter by location and price
- 2-tap Stripe checkout with Apple Pay / Google Pay hints
- **Commuter Subscriptions** — recurring monthly parking passes for regular spots
- **Demand Pin Requests** — drop a pin on the map to request a spot in any area; upvote existing requests
- **15-Minute Parking Warning** — automatic in-app banner 15 minutes before a booking expires with an extend-stay prompt
- Get Directions (opens Google Maps / Apple Maps)
- Booking history with stats dashboard
- In-app notification centre with colour-coded alert types

### For Hosts (Homeowners)
- List parking spots with map location picker
- **AI Price Suggestion Engine** — enter a ZIP code and get demand-aware Min / Optimal / Max rate recommendations
- **Monthly Lease Toggle** — offer long-term monthly leases with a custom rate and schedule alongside hourly bookings
- **QR Code Parking Sign Generator** — one-click printable PDF sign (blueprint style) with QR code that links directly to the spot's booking page
- Set hourly & event rates; toggle availability on/off instantly
- Auto-off timer (auto-deactivate after X hours)
- Earnings dashboard with monthly chart
- Promote spots for featured placement ($5 / $12 / $20 packages)
- Report violations for overstaying vehicles

### For Admins
- **Demand Heatmap** — Leaflet map showing all community demand-pin requests as orange heat circles, with a top-requests leaderboard
- **CSV Data Export** — one-click download of all platform data (spots, bookings, users) for analysis
- User, spot, and booking management overview

### Platform
- JWT authentication with role-based access (Host / Guest / Admin)
- Stripe payment processing with 85/15 revenue split
- **Progressive Web App (PWA)** — installable on iOS & Android, offline-ready service worker, custom splash screen
- **Blueprint Landing Page Animations** — Framer Motion SVG path-draw animations on the hero section
- Real-time polling for map & notification updates
- Responsive design (mobile + desktop)
- Terms of Service & Privacy Policy pages

---

## Tech Stack

| Layer      | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React 19, Tailwind CSS, Shadcn/UI, Leaflet, Recharts, Framer Motion, qrcode |
| Backend    | FastAPI (Python 3.12), modular router architecture, uvicorn                |
| Database   | MongoDB (Motor async driver)                                               |
| Auth       | JWT (bcrypt password hashing, 7-day tokens)                                |
| Payments   | Stripe Checkout (one-time + recurring subscriptions)                       |
| Deployment | Replit Autoscale — FastAPI serves both API and compiled React build        |

---

## Project Structure

```
backend/
  server.py              # FastAPI entry point, CORS, notification watchdog, static file serving
  database.py            # MongoDB connection (Motor)
  models.py              # Pydantic models (spots, bookings, users, demand pins, subscriptions)
  utils.py               # JWT helpers, password hashing, notification creator
  seed_demo.py           # Demo data seeder
  routes/
    auth.py              # Register, Login, Me
    spots.py             # Spot CRUD, toggle, delete, price suggestion
    bookings.py          # Checkout, history, status, monthly lease bookings
    notifications.py     # Notification management
    violations.py        # Violation reporting
    promotions.py        # Promotion packages & checkout
    stats.py             # Dashboard stats & earnings
    admin.py             # Admin CSV export, demand pins overview
    demand_pins.py       # Community demand pin CRUD & upvotes
    subscriptions.py     # Stripe recurring subscription management
    stripe_connect.py    # Stripe Connect onboarding
    verification.py      # Spot verification workflow

frontend/
  public/
    manifest.json        # PWA manifest (shortcuts, icons, theme)
    sw.js                # Service worker (offline caching)
  src/
    App.js               # Routes & role-based auth guards
    context/
      AuthContext.js     # JWT auth state, login/logout
    pages/
      LandingPage.js     # Blueprint SVG animations (Framer Motion)
      LoginPage.js
      RegisterPage.js
      GuestDashboard.js  # Map, booking, demand pins, 15-min warning, subscriptions
      HostDashboard.js   # Spot management, QR sign generator, earnings
      AddSpotPage.js     # Location picker, price suggestion engine, monthly lease toggle
      AdminDashboard.js  # Demand heatmap, CSV export, platform stats
      BookingHistoryPage.js
      BookingSuccess.js
      TermsPage.js
      PrivacyPage.js
      NotFoundPage.js
    components/ui/       # Shadcn/UI components
```

---

## API Endpoints

### Auth
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/auth/register    | Create account        |
| POST   | /api/auth/login       | Get JWT token         |
| GET    | /api/auth/me          | Current user info     |

### Spots
| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| POST   | /api/spots                      | Create spot (Host)                 |
| GET    | /api/spots                      | List active spots (public)         |
| GET    | /api/spots/my                   | Host's own spots                   |
| GET    | /api/spots/price-suggestion     | AI rate suggestion by ZIP code     |
| PATCH  | /api/spots/:id                  | Update pricing / settings          |
| POST   | /api/spots/:id/toggle           | Toggle active/inactive             |
| DELETE | /api/spots/:id                  | Delete spot                        |

### Bookings
| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| POST   | /api/bookings/checkout          | Stripe one-time checkout           |
| GET    | /api/bookings/status/:id        | Payment status                     |
| GET    | /api/bookings/my                | User's bookings                    |
| GET    | /api/bookings/history           | Enriched booking history           |
| GET    | /api/bookings/active/host       | Active bookings for host           |

### Demand Pins
| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | /api/demand-pins                | All demand pin requests            |
| POST   | /api/demand-pins                | Create a demand pin                |
| POST   | /api/demand-pins/:id/upvote     | Upvote a demand pin                |

### Subscriptions
| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| POST   | /api/subscriptions/create       | Create Stripe recurring subscription |
| GET    | /api/subscriptions/my           | User's active subscriptions        |
| POST   | /api/subscriptions/:id/cancel   | Cancel subscription                |

### Stats
| Method | Endpoint          | Description                  |
|--------|-------------------|------------------------------|
| GET    | /api/stats/host   | Host earnings & metrics      |
| GET    | /api/stats/guest  | Guest spending & metrics     |

### Admin (requires admin role)
| Method | Endpoint                   | Description                    |
|--------|----------------------------|--------------------------------|
| GET    | /api/admin/export          | Download all platform data CSV |
| GET    | /api/admin/demand-pins     | All demand pins overview       |

### Other
| Method | Endpoint                   | Description               |
|--------|----------------------------|---------------------------|
| GET    | /api/notifications         | User notifications        |
| POST   | /api/violations/report     | Report a violation        |
| GET    | /api/promotions/packages   | Available promo packages  |
| POST   | /api/promotions/checkout   | Purchase promotion        |

---

## Revenue Model

| Stream        | Detail                                                         |
|---------------|----------------------------------------------------------------|
| Booking fees  | 15% platform fee per booking (Host receives 85%)              |
| Subscriptions | Monthly recurring passes; platform takes 15% of monthly rate  |
| Promotions    | $5 (24 h), $12 (3 days), $20 (7 days) featured placement      |

---

## Local Development

### Prerequisites
- Python 3.12+
- Node.js 20+ / Yarn
- MongoDB 6+

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed_demo.py          # Optional: seed demo data
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
yarn install
yarn start                   # Dev server on port 5000
```

### Environment Variables

**backend** (set in shell or `.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=parkpal
JWT_SECRET=your_jwt_secret_here
STRIPE_API_KEY=sk_test_your_stripe_key
CORS_ORIGINS=*
```

**frontend** (`.env`):
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## Production Deployment

The app is deployed on **Replit Autoscale**. The build pipeline:

1. **Build step** — compiles the React app into `frontend/build/`
2. **Run step** — starts MongoDB and uvicorn; FastAPI serves both the `/api/*` routes and the compiled React static files from a single port (8000)

```bash
# Build
cd frontend && CI=false REACT_APP_BACKEND_URL='' yarn build

# Run (start.sh)
mongod --dbpath /tmp/mongodb/data --fork
uvicorn server:app --host 0.0.0.0 --port 8000
```

---

## License

Proprietary. All rights reserved.
