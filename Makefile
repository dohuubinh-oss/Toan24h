.PHONY: help build up down restart logs ps test-backend test-frontend clean

# Variables
DC=docker-compose

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build all docker images
	$(DC) build

up: ## Start all services in background
	$(DC) up -d

down: ## Stop and remove all containers
	$(DC) down

restart: ## Restart all services
	$(DC) down && $(DC) up -d

logs: ## Show logs from all services
	$(DC) logs -f

ps: ## List running containers
	$(DC) ps

test-backend: ## Run backend unit tests
	docker exec -it exam_model_backend go test ./...

test-frontend: ## Run frontend lint and tests
	docker exec -it exam_model_frontend npm run lint

clean: ## Clean up all temporary files and docker volumes
	$(DC) down -v
	rm -rf frontend/.next backend/main
