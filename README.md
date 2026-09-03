# LocalEvent Ethiopia 🎉

> A full-stack event discovery and ticketing platform for Ethiopia — built with a Go REST API (clean architecture), PostgreSQL, and a Next.js frontend.

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-316192?logo=postgresql)](https://www.postgresql.org/)

---

## Overview

LocalEvent closes the loop from **"I found an event"** to **"I have a ticket and I know where to go."** Visitors can browse, search, and filter events without an account; registered users can create and manage events, follow/bookmark, and buy tickets (free or paid via Chapa) with a mapped venue in the same flow.

## Features

- 🔎 Public discovery — search + filter by category, date, price (Free toggle), and map/location
- 🗺️ Interactive maps (Leaflet) for venue display and location picking
- 🔐 JWT auth with bcrypt, roles (`user` / `organizer` / `admin`), and forgot/reset password
- 👤 Profile & settings — edit details, change avatar (Cloudinary), and change password
- 🎫 Event CRUD with multi-image upload and a designated featured image
- 💳 Ticketing — free events confirm instantly; paid events go through Chapa
- 📱 QR tickets — downloadable **PDF ticket with a QR code**, plus an organizer **camera check-in scanner**
- 📊 Organizer dashboard — sales, expandable buyer list, attendance, and analytics charts
- 📤 Export buyers to **CSV / PDF**, and email reminders to attendees via SMTP
- 🛠️ Admin — dynamic category CRUD (soft-delete) and platform-wide analytics

## Tech Stack

**Backend** — Go 1.25, `gorilla/mux`, PostgreSQL (via `pgx`), JWT, Cloudinary, Chapa, SMTP. Clean architecture: `domain → usecase → repository → delivery`. Live reload with **Air**.

**Frontend** — Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query, Leaflet, `qrcode.react`, `jsPDF`, `html5-qrcode`.

---

## Project Structure

```
localEvents/
├── backend/                      # Go REST API (clean architecture)
│   ├── cmd/main.go               # Composition root
│   ├── config/                   # Env configuration
│   ├── domain/                   # Entities + interface files (repository/usecase/infrastructure)
│   ├── usecase/                  # Application/business logic
│   ├── repository/               # PostgreSQL implementations (+ dto/)
│   ├── delivery/
│   │   ├── controller/           # HTTP controllers (+ dto/)
│   │   └── route/                # Router
│   ├── infrastructure/           # database, chapa, cloudinary, mailer, middleware
│   ├── migrations/               # SQL schema, functions, seed
│   └── templates/                # Email templates
├── frontend/                     # Next.js app
│   └── src/
│       ├── app/                  # App Router pages
│       ├── components/           # UI components
│       └── lib/                  # api client, types, auth, hooks
├── docker-compose.yml
└── Makefile
```

---

## Prerequisites

- **Go 1.25+** and [**Air**](https://github.com/air-verse/air) for backend live reload — `go install github.com/air-verse/air@latest`
- **Node.js 18+**
- A **PostgreSQL** database — a free [Neon](https://neon.tech/) project is recommended (or local Postgres / the bundled Docker one)
- A [Cloudinary](https://cloudinary.com/) account (image uploads)
- A [Chapa](https://chapa.co/) account (payments)

## Configuration

**Backend** — `backend/.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Backend port (default `3001`) |
| `DATABASE_URL` | Postgres connection string (e.g. your Neon URL — keep `?sslmode=require`) |
| `JWT_SECRET` | Secret for signing JWTs (≥ 32 chars) |
| `APP_URL` / `FRONTEND_URL` | Backend and frontend base URLs |
| `CLOUDINARY_*` | Cloudinary credentials |
| `CHAPA_*` | Chapa keys and callback/return URLs |
| `SMTP_*` | Optional SMTP (attendee reminders, password reset). Falls back to logging if unset |

**Frontend** — `frontend/.env`:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | REST base the frontend calls (default `http://localhost:3001/api`) |

---

## Running (local dev)

The backend runs with **Air** (live reload); the frontend with `next dev`.

**1. Database** — set `DATABASE_URL` in `backend/.env` to your Neon project (or start the bundled Postgres with `make db`), then apply the migrations below.

**2. Backend** — live reload with Air:

```bash
cd backend
air            # or: make back
```

**3. Frontend** — in another terminal:

```bash
cd frontend
npm install
npm run dev    # or: make front
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:3001

> The full Docker stack is also available: `make up` (frontend + backend + Postgres), plus `make down`, `make logs`, `make clean`.

## Database Migrations

Migrations live in `backend/migrations/` and apply **in order**:

- `001_schema.sql` — tables and indexes
- `002_functions.sql` — triggers (slug, updated_at, ticket counters) and `get_nearby_events`
- `003_seed.sql` — default categories
- `004_ticket_checkin.sql` — QR check-in columns (`scanned_at`, `scanned_by`)
- `005_user_profile.sql` — profile `city` column

Apply each file with the Neon SQL Editor, or `psql`:

```bash
cd backend
psql "$DATABASE_URL" -f migrations/001_schema.sql
psql "$DATABASE_URL" -f migrations/002_functions.sql
psql "$DATABASE_URL" -f migrations/003_seed.sql
psql "$DATABASE_URL" -f migrations/004_ticket_checkin.sql
psql "$DATABASE_URL" -f migrations/005_user_profile.sql
```

### Create an admin

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@gmail.com', crypt('Test@123', gen_salt('bf', 10)), 'Admin', 'admin')
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash, role = 'admin';
```

---

## REST API

Base path: `/api`. Protected routes require `Authorization: Bearer <token>`.

**Auth**
- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- `PUT /auth/me` — update profile · `POST /auth/change-password`
- `POST /auth/forgot-password`, `POST /auth/reset-password`

**Events**
- `GET /events` — filters: `q`, `category_id`, `min_price`, `max_price`, `free`, `date_from`, `date_to`, `sort`, `order`, `limit`, `offset`
- `GET /events/nearby?lat&lng&radius`, `GET /events/mine`
- `GET /events/{idOrSlug}`, `POST /events`, `PUT /events/{id}`, `DELETE /events/{id}`
- `GET /events/{id}/buyers` — organizer/admin ticket-buyer list
- `POST /events/{id}/notify` — email an event's buyers (organizer/admin)

**Interactions**
- `POST|DELETE /events/{id}/bookmark`, `POST|DELETE /events/{id}/follow`, `GET /events/{id}/interactions`
- `GET /me/bookmarks`, `GET /me/follows`, `GET /me/tickets`

**Catalog** — `GET /categories`, `GET /tags`

**Uploads** — `POST /upload` (multipart), `DELETE /upload`

**Payments & check-in** — `POST /payments/initiate`, `POST /payments/verify`, `POST /webhook/chapa`, `POST /tickets/scan` (organizer/admin QR check-in)

**Admin** — `GET|POST /admin/categories`, `PUT|DELETE /admin/categories/{id}`, `PATCH /admin/categories/{id}/active`, `GET /admin/analytics`

---

## Testing

```bash
cd backend
go test ./...                                   # unit tests (repo tests skip without a DB)

# Repository integration tests against a real Postgres:
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/events_db go test ./repository/...
```

```bash
cd frontend
npm run build                                   # type-check + build
```

---

## License

MIT
