# VietRide X — Bus Ticket Booking System

Full-stack bus ticket booking application built with **FastAPI** (Python) and **React 19** (Vite).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL |
| **Frontend** | React 19, Vite 6, React Router 7, Lucide Icons |
| **Auth** | JWT (HS256), bcrypt, access + refresh tokens |
| **AI** | Google Gemini 1.5 Flash (Vietnamese chatbot) |
| **Payment** | VietQR code (MB Bank / BIDV) |

## Features

### 👤 User
- Register / Login / Profile management
- Search trips by origin, destination, date
- Interactive seat map with real-time availability
- Book tickets with 15-minute payment window
- View booking history / My Tickets
- AI chatbot (Vietnamese) for route info & support

### 🔧 Admin
- **Dashboard:** Revenue stats, booking status breakdown, summary cards
- **Manage trips:** CRUD with route & operator assignment
- **Manage users:** Roles & permissions (`trips:view`, `trips:manage`, `users:manage`)
- **View:** Routes, operators, cities

### 🤖 Automation
- Daily trips auto-generated for 14 days ahead on startup (`TRIP_TEMPLATES`)
- Old trips auto-cleaned (skips trips with existing bookings)
- Optimistic concurrency control prevents double-booking
- CamelCase JSON serialization throughout

## Project Structure

```
CNPM/
├── backend/                    # FastAPI REST API
│   ├── app/
│   │   ├── main.py            # Entry point, CORS, exception handlers
│   │   ├── lifespan.py        # Startup: tables, seed, generate trips
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic Settings (.env)
│   │   │   ├── database.py    # Async SQLAlchemy engine
│   │   │   └── seed.py        # Seed data + TRIP_TEMPLATES + trip generator
│   │   ├── models/            # 6 ORM models (cities, operators, routes, trips, users, bookings)
│   │   ├── schemas/           # Pydantic v2 DTOs (camelCase via CamelModel)
│   │   ├── routers/           # 7 routers, 28 endpoints
│   │   └── services/          # Business logic (auth, trip, booking, dashboard, AI)
│   ├── alembic/               # Database migrations
│   ├── requirements.txt
│   └── pyproject.toml
│
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── App.jsx        # Home: search + results + lookup
│   │   │   ├── BookingPage.jsx # Seat selection + confirmation
│   │   │   ├── PaymentModal.jsx # VietQR payment simulation
│   │   │   ├── AdminPage.jsx  # Full admin CRUD + revenue dashboard
│   │   │   ├── AIChatbot.jsx  # Gemini chatbot
│   │   │   └── ...
│   │   ├── api.js             # Fetch client with auth interceptor
│   │   ├── auth.js            # Token helpers
│   │   ├── utils.js           # currency(), timeText(), todayInput(), getSeatList()
│   │   ├── styles.css         # Full responsive CSS
│   │   └── main.jsx           # Router setup
│   ├── index.html
│   ├── vite.config.js         # Dev proxy /api → localhost:8000
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md
```

## Database Schema

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  cities  │────▶│  routes  │◀────│   trips  │
└──────────┘     │(origin / │     ├──────────┤
                 │ dest FK) │     │ version  │ ← Optimistic lock
┌──────────┐     └──────────┘     │ price    │
│operators│──────────────────────▶│ seats    │
└──────────┘                      └────┬─────┘
                                       │
┌──────────┐     ┌──────────┐          │
│  users   │────▶│ bookings │◀─────────┘
│(role +   │     │(status,  │
│ perms)   │     │ code,    │
└──────────┘     │ seats)   │
                 └──────────┘
```

## Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 12+

### Backend

```bash
cd backend

# Virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Environment (edit with your credentials)
cp .env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

**Required `.env` fields:**
- `DATABASE_URL` — PostgreSQL async (`postgresql+asyncpg://...`)
- `ALEMBIC_DATABASE_URL` — PostgreSQL sync (`postgresql+psycopg2://...`)
- `SECRET_KEY` — JWT signing key
- `CORS_ORIGINS` — Frontend URLs (e.g. `http://localhost:5173`)
- `GEMINI_API_KEY` — (optional) Google Gemini API key

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, proxies `/api` to backend.

## API Endpoints (28 total)

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cities` | List all cities |
| GET | `/api/dashboard` | Dashboard metrics |
| GET | `/api/trips/search` | Search trips (origin, destination, date) |
| GET | `/api/trips/{id}` | Trip details |
| GET | `/api/routes/popular` | Popular routes with prices |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user profile |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/auth/change-password` | Change password |

### Booking (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookings/{id}` | Get booking |
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/{id}/pay` | Pay booking |
| POST | `/api/bookings/{id}/cancel` | Cancel booking |
| GET | `/api/bookings/lookup` | Search bookings |
| GET | `/api/my-bookings` | Current user's bookings |

### AI (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/chat` | Chat with AI assistant |

### Admin (Permission required)
| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/api/admin/users` | `users:manage` |
| PUT/DELETE | `/api/admin/users/{id}` | `users:manage` |
| GET/POST | `/api/admin/trips` | `trips:view` / `trips:manage` |
| PUT/DELETE | `/api/admin/trips/{id}` | `trips:manage` |
| GET | `/api/admin/routes` | `routes:view` |
| GET | `/api/admin/operators` | `routes:view` |
| GET | `/api/admin/cities` | `routes:view` |
| GET | `/api/admin/stats` | `trips:view` |

## Key Architecture Decisions

- **Optimistic locking** on `Trip.version` — prevents race conditions on seat booking
- **TRIP_TEMPLATES** — 15 recurring trip templates auto-generate daily trips for 14 days ahead on each startup
- **CamelCase JSON** — `CamelModel` base schema auto-converts snake_case ↔ camelCase
- **Async-first** — FastAPI + asyncpg + SQLAlchemy async for non-blocking DB operations
- **Centralized bank info** — Payment QR and bank details read from single `bankInfo` object

## Environment Variables

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
ALEMBIC_DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
GEMINI_API_KEY=                          # optional, for AI chat
```

## License

CNPM Project — 2026
