.PHONY: dev-frontend dev-backend up down logs

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && go run cmd/api/main.go
