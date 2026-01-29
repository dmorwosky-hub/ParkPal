# Park-Pal PRD (Product Requirements Document)

## Original Problem Statement
A hyper-local, peer-to-peer parking marketplace that allows homeowners (Hosts) to rent out their driveways to drivers (Guests) looking for event or daily parking.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Leaflet Maps
- **Backend**: FastAPI + MongoDB + JWT Auth
- **Payments**: Stripe via emergentintegrations library (85/15 split for bookings)
- **Real-time**: MongoDB polling (30s intervals)

## User Personas

### Host (Homeowner)
- Wants to monetize unused driveway space
- Needs simple controls to activate/deactivate availability
- Requires visibility into who's parking and when
- **NEW**: Can promote spots for increased visibility

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
- [x] **NEW: Promote Your Spot feature**

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

### Phase 1: Core MVP
- User authentication (register/login)
- Parking spot CRUD operations
- Booking flow with Stripe payments
- Notification system
- Violation reporting

### Phase 2: Promote Your Spot Feature (NEW)
- **Promotion Packages**:
  - 24 Hours: $5
  - 3 Days: $12
  - 7 Days: $20
- **Backend Endpoints**:
  - GET `/api/promotions/packages` - List available packages
  - POST `/api/promotions/checkout` - Create Stripe checkout
  - GET `/api/promotions/status/{session_id}` - Check payment status
- **Frontend Features**:
  - Host Dashboard shows "Promoted" stat card
  - "Promote This Spot" button on each spot card
  - Promotion dialog with package selection
  - Purple star badge on promoted spots
  - Promoted spots appear first in search results
  - Glowing purple markers on map for promoted spots

### Database Collections
- `users` - User accounts
- `parking_spots` - Parking spot listings (with is_promoted, promotion_expires)
- `bookings` - Booking records
- `payment_transactions` - Stripe transactions (now includes promotion type)
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
