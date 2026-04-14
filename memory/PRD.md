# Park-Pal PRD (Product Requirements Document)

## Original Problem Statement
A hyper-local, peer-to-peer parking marketplace that allows homeowners (Hosts) to rent out their driveways to drivers (Guests) looking for event or daily parking.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Leaflet Maps + Recharts
- **Backend**: FastAPI (modular routers) + MongoDB + JWT Auth
- **Payments**: Stripe via emergentintegrations library (85/15 split for bookings)
- **Real-time**: MongoDB polling (30s intervals)

## Backend Structure (Refactored)
```
backend/
  server.py          - Main app entry, CORS, webhook
  database.py        - MongoDB connection
  models.py          - All Pydantic models
  utils.py           - Auth helpers, JWT, notifications
  routes/
    auth.py          - Register, Login, Me
    spots.py         - Spot CRUD, toggle, delete
    bookings.py      - Checkout, history, status
    notifications.py - CRUD notifications
    violations.py    - Report violations
    promotions.py    - Promotion packages & checkout
    stats.py         - Host & guest dashboard stats
```

## User Personas

### Host (Homeowner)
- Wants to monetize unused driveway space
- Needs simple controls to activate/deactivate availability
- Requires visibility into who's parking and when
- Can promote spots for increased visibility
- Earnings dashboard with monthly chart

### Guest (Driver)
- Looking for convenient, affordable parking near events/busy areas
- Needs quick booking process (2-tap)
- Wants directions to parking spot
- Can view booking history with stats

## Core Requirements

### Must Have (P0) - ALL COMPLETED
- [x] User registration with role selection (Host/Guest)
- [x] JWT authentication
- [x] Host: Create parking spot with location picker
- [x] Host: Toggle spot active/inactive
- [x] Host: Set hourly and event rates
- [x] Host: Set auto-off timer
- [x] Host: View authorized vehicles
- [x] Host: Report violations
- [x] Host: Delete spots
- [x] Guest: Interactive map with available spots
- [x] Guest: Search and filter spots
- [x] Guest: Book spot with vehicle details
- [x] Guest: Stripe payment integration
- [x] Guest: Get directions to spot
- [x] Notification system
- [x] Promote Your Spot feature
- [x] Guest Booking History page with stats
- [x] Host Earnings Dashboard with chart

### Should Have (P1)
- [ ] Email notifications (SendGrid/Resend)
- [ ] 15-minute expiry warning notification
- [ ] Reviews and ratings system

### Nice to Have (P2)
- [ ] Favorites/saved spots
- [ ] Recurring bookings
- [ ] Mobile app (React Native)
- [ ] WebSocket real-time updates (currently polling)
- [ ] Google Maps API (currently Leaflet/OSM)

## What's Been Implemented

### Phase 1: Core MVP
- User authentication (register/login)
- Parking spot CRUD operations
- Booking flow with Stripe payments
- Notification system
- Violation reporting

### Phase 2: Promote Your Spot Feature
- Promotion Packages: 24 Hours ($5), 3 Days ($12), 7 Days ($20)
- Backend endpoints for packages, checkout, status
- Purple star badge on promoted spots
- Promoted spots appear first in search results
- Glowing purple markers on map

### Phase 3: Dashboard Enhancements & Code Quality (Feb 2026)
- **Backend Refactored** into modular routers (auth, spots, bookings, notifications, violations, promotions, stats)
- **Host Earnings Dashboard** with monthly bar chart (Recharts)
- **Guest Booking History Page** with stats cards, filters, and enriched spot details
- **Host Stats API** (total earnings, bookings, monthly breakdown)
- **Guest Stats API** (total spent, hours parked, booking count)
- **Delete Spot** functionality for hosts
- **My Bookings** navigation in guest header
- **Trust & Safety pages**: Terms of Service (`/terms`) and Privacy Policy (`/privacy`)
- **Custom 404 page** with branded "Spot Not Found" message
- **Demo data seeder** (`seed_demo.py`) — 6 spots, 3 bookings, 2 demo users
- **SEO meta tags** (Open Graph, Twitter Cards, keywords)
- **FAQ section** on landing page (6 questions)
- **Stats bar** on landing page (85% payout, 2-tap checkout, etc.)
- **Professional README.md** for Flippa buyers
- **N+1 query fix** in booking history (batched spot lookups)
- **Custom favicon** with Park-Pal logo (user-provided)
- **Title override** via React to bypass Emergent script injection
- **PWA (Progressive Web App)** — installable on mobile/desktop via "Add to Home Screen"
  - Service worker with network-first caching strategy
  - Web app manifest with 8 icon sizes (72-512px)
  - Install prompt banner for mobile users
  - Apple mobile web app meta tags
- Copyright year dynamic
- All tests passing (22/22 backend, 100% frontend)
- Deployment validated and production-ready

### Database Collections
- `users` - User accounts
- `parking_spots` - Parking spot listings (with is_promoted, promotion_expires)
- `bookings` - Booking records (with spot_address for history)
- `payment_transactions` - Stripe transactions (bookings + promotions)
- `notifications` - User notifications
- `violations` - Violation reports

## Key API Endpoints
- `POST /api/auth/register` & `/api/auth/login`
- `GET /api/auth/me`
- `GET /api/spots` & `POST /api/spots`
- `GET /api/spots/my` & `GET /api/spots/{id}`
- `PATCH /api/spots/{id}` & `POST /api/spots/{id}/toggle`
- `DELETE /api/spots/{id}`
- `POST /api/bookings/checkout` & `GET /api/bookings/status/{session_id}`
- `GET /api/bookings/my` & `GET /api/bookings/history`
- `GET /api/bookings/active/host` & `GET /api/bookings/{id}`
- `GET /api/stats/host` & `GET /api/stats/guest`
- `GET /api/notifications` & `PATCH /api/notifications/{id}/read`
- `POST /api/violations/report`
- `GET /api/promotions/packages` & `POST /api/promotions/checkout`

## Prioritized Backlog

### P1 - High Priority
1. Email notification integration (SendGrid/Resend)
2. 15-min expiry countdown notification
3. Reviews and ratings

### P2 - Medium Priority
1. Saved/favorite spots
2. Host payout tracking
3. WebSocket migration for real-time updates
4. Google Maps API integration (optional)
