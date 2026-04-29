# Park-Pal — Peer-to-Peer Parking Marketplace

## Project Overview

Park-Pal is a peer-to-peer parking marketplace that connects homeowners (Hosts) who have unused driveway space with drivers (Guests) seeking affordable parking near events or busy areas.

## Architecture

- **Frontend**: React 19 + CRA/CRACO + Tailwind CSS + Shadcn/UI (port 5000)
- **Backend**: FastAPI + Python 3.12 (port 8000)
- **Database**: MongoDB (local, port 27017)
- **Maps**: Leaflet / React-Leaflet with CartoDB Dark Matter tiles
- **Payments**: Stripe (via local `emergentintegrations` stub)

## Project Structure

```
/
├── backend/               # FastAPI backend
│   ├── routes/            # Modular API routes
│   ├── emergentintegrations/  # Local Stripe checkout stub
│   ├── server.py          # Main FastAPI app
│   ├── database.py        # MongoDB connection
│   ├── models.py          # Pydantic models
│   ├── utils.py           # Auth utilities
│   ├── storage.py         # Object storage (S3/emergent)
│   ├── start_backend.sh   # Backend startup script (starts MongoDB + uvicorn)
│   └── requirements.txt
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/         # App pages
│   │   ├── components/    # UI components (shadcn/ui)
│   │   ├── context/       # Auth context
│   │   └── hooks/         # Custom hooks
│   ├── craco.config.js    # CRACO config (proxies /api to port 8000)
│   ├── .env               # Frontend env (PORT=5000, HOST=0.0.0.0)
│   └── package.json
└── start.sh               # Combined startup script
```

## Running the Application

### Development

Two workflows run:
1. **Backend** — runs `bash start_backend.sh` (starts MongoDB + FastAPI on port 8000)
2. **Start application** — runs `craco start` on port 5000, proxies `/api` to port 8000

### Environment Variables

- `MONGO_URL` = `mongodb://localhost:27017`
- `DB_NAME` = `parkpal`
- `JWT_SECRET` = (set in shared env)
- `REACT_APP_BACKEND_URL` = `""` (empty, same-origin proxy)
- `STRIPE_API_KEY` = (required for payments, set as secret)

## Key Features

- Interactive map for finding parking spots
- Role-based dashboards (Host / Guest / Admin)
- Stripe payment integration (85/15 revenue split)
- Spot promotion feature
- PWA support
- JWT authentication

## Notes

- `emergentintegrations` package is replaced with a local stub in `backend/emergentintegrations/` that wraps the Stripe SDK directly
- MongoDB runs locally; data persists in `/tmp/mongodb/data`
- The `storage.py` module uses an external object store for file uploads; it degrades gracefully if unavailable
- Admin user seeded at startup: `admin@parkpal.com` / `admin123456`
