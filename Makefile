.PHONY: help build up down logs clean migrate db back front

help:
	@echo "Full stack (Docker):"
	@echo "  make build    - Build Docker images"
	@echo "  make up       - Start all services (postgres + backend + frontend)"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - View logs"
	@echo "  make clean    - Remove everything (incl. volumes)"
	@echo "  make migrate  - Re-run SQL migrations against the running db"
	@echo ""
	@echo "Local dev (postgres in Docker, apps local):"
	@echo "  make db       - Start ONLY postgres in Docker"
	@echo "  make back     - Run backend locally with Air (needs backend/.env)"
	@echo "  make front    - Run frontend locally (npm run dev)"

build:
	docker compose build

up:
	docker compose up -d
	@echo "✓ Frontend: http://localhost:3000"
	@echo "✓ Backend:  http://localhost:3001"

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v
	docker system prune -f

migrate:
	@for file in backend/migrations/*.sql; do \
		docker compose exec -T postgres psql -U postgres -d local_events_db < $$file; \
	done
	@echo "✓ Migrations complete"

# --- Local dev workflow: postgres in Docker, backend (Air) + frontend local ---
db:
	docker compose up -d postgres
@echo "✓ Postgres: localhost:5432 (db: local_events_db)"

back:
	cd backend && air

front:
	cd frontend && npm run dev
