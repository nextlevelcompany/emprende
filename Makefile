.PHONY: up down restart logs build test migrate

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

build:
	docker compose build

test-backend:
	cd backend && mvn test

test-frontend:
	cd frontend && npm test

test: test-backend test-frontend
