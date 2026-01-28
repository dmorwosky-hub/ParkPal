# Park-Pal PRD (Product Requirements Document)

## Original Problem Statement
A hyper-local, peer-to-peer parking marketplace that allows homeowners (Hosts) to rent out their driveways to drivers (Guests) looking for event or daily parking.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Leaflet Maps
- **Backend**: FastAPI + MongoDB + JWT Auth
- **Payments**: Stripe via emergentintegrations library (85/15 split)
- **Real-time**: MongoDB polling (30s intervals)

## User Personas

### Host (Homeowner)
- Wants to monetize unused driveway space
- Needs simple controls to activate/deactivate availability
- Requires visibility into who's parking and when

### Guest (Driver)
- Looking for convenient, affordable parking near events/busy areas
- Needs quick booking process (2-tap)
- Wants directions to parking spot

## Core Requirements

### Must Have (P0)
- [x] User registration with role selection (Host/Guest)
- [x] JWT authentication
- [x] Host: Create parking spot with location picker
- [x] Host: Toggle spot active/inactive
- [x] Host: Set hourly and event rates
- [x] Host: Set auto-off timer
- [x] Host: View authorized vehicles
- [x] Host: Report violations
- [x] Guest: Interactive map with available spots
- [x] Guest: Search and filter spots
- [x] Guest: Book spot with vehicle details
- [x] Guest: Stripe payment integration
- [x] Guest: Get directions to spot
- [x] Notification system

### Should Have (P1)
- [ ] Guest booking history view
- [ ] Host earnings dashboard
- [ ] Email notifications
- [ ] 15-minute expiry warning notification

### Nice to Have (P2)
- [ ] Reviews and ratings system
- [ ] Favorites/saved spots
- [ ] Recurring bookings
- [ ] Mobile app (React Native)

## What's Been Implemented (December 2024)

### Backend API Endpoints
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user
- `/api/spots` - CRUD for parking spots
- `/api/spots/{id}/toggle` - Toggle spot active status
- `/api/bookings/checkout` - Create Stripe checkout
- `/api/bookings/status/{session_id}` - Check payment status
- `/api/bookings/my` - Get user's bookings
- `/api/bookings/active/host` - Get host's active bookings
- `/api/notifications` - Get/update notifications
- `/api/violations/report` - Report parking violation
- `/api/webhook/stripe` - Stripe webhook handler

### Frontend Pages
- Landing page with hero and features
- Login/Register with role selection
- Guest Dashboard with Leaflet map
- Host Dashboard with spot management
- Add Spot page with location picker
- Booking Success page

### Database Collections
- `users` - User accounts
- `parking_spots` - Parking spot listings
- `bookings` - Booking records
- `payment_transactions` - Stripe transactions
- `notifications` - User notifications
- `violations` - Violation reports

## Prioritized Backlog

### P0 - Remaining Critical Items
- All P0 items completed ✅

### P1 - High Priority
1. Booking history page for guests
2. Host earnings summary dashboard
3. Email notification integration (SendGrid/Resend)
4. 15-min expiry countdown notification

### P2 - Medium Priority
1. Reviews and ratings
2. Saved/favorite spots
3. Host payout tracking

## Next Tasks
1. Add booking history view for guests
2. Implement host earnings dashboard
3. Add email notifications for booking confirmations
4. Add 15-minute expiry warning notification system
