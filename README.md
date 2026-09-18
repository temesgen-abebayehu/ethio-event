# LocalEvent Ethiopia 🎉

> Event discovery and ticketing platform for Ethiopia — Go REST API, PostgreSQL, Next.js web, and a React Native (Expo) mobile app.

[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-316192?logo=postgresql)](https://www.postgresql.org/)

## Features

- Public event discovery — search and filter by category, date, price, and location (maps)
- JWT auth with roles (`user` / `organizer` / `admin`) and password reset
- Event CRUD with image upload (Cloudinary) and a featured image
- Ticketing — free events confirm instantly; paid events via Chapa
- QR tickets with an organizer **camera check-in scanner**
- Organizer dashboard — sales, buyers, attendance, and analytics
- Admin — category management and platform analytics

## Tech Stack

- **Backend** — Go 1.25, `gorilla/mux`, PostgreSQL (`pgx`), JWT, Cloudinary, Chapa. Clean architecture, live reload via Air.
- **Web** — Next.js 14 (App Router), TypeScript, TailwindCSS, TanStack Query, Leaflet.
- **Mobile** — React Native + Expo SDK 57, Expo Router, TanStack Query, `expo-camera` (QR scan).

## Structure

```
localEvents/
├── backend/    # Go REST API (domain → usecase → repository → delivery)
├── frontend/   # Next.js web app
└── mobile/     # Expo React Native app
```

## Quick Start

Prerequisites: Go 1.25+ (with [Air](https://github.com/air-verse/air)), Node.js 18+, PostgreSQL (a [Neon](https://neon.tech/) project works), Cloudinary and Chapa accounts.

```bash
# 1. Backend — set backend/.env (DATABASE_URL, JWT_SECRET, CLOUDINARY_*, CHAPA_*), then:
cd backend && air              # http://localhost:3001

# 2. Web — set frontend/.env (NEXT_PUBLIC_API_URL), then:
cd frontend && npm install && npm run dev   # http://localhost:3000

# 3. Mobile — set mobile/.env (EXPO_PUBLIC_API_URL), then:
cd mobile && npm install && npm start        # scan the QR in Expo Go
```

> Full Docker stack: `make up` (web + backend + Postgres), `make down`, `make logs`.

## Testing

```bash
cd backend && go test ./...     # unit tests (repo tests skip without a DB)
cd frontend && npm run build    # type-check + build
```

## License

MIT
