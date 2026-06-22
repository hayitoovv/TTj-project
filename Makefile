.PHONY: help up down build logs ps shell migrate seed ssl restart

COMPOSE := docker compose -f docker-compose.prod.yml

help:
	@echo "TTJ Platforma — production commands"
	@echo ""
	@echo "  make up         — start all services"
	@echo "  make down       — stop all services"
	@echo "  make build      — rebuild containers (frontend + backend)"
	@echo "  make restart    — pull latest code and rebuild"
	@echo "  make logs       — tail logs (Ctrl-C to exit)"
	@echo "  make ps         — list running containers"
	@echo "  make shell      — open shell in backend container"
	@echo "  make migrate    — run database migrations"
	@echo "  make seed       — seed demo data"
	@echo "  make ssl        — initial SSL certificate setup"

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

restart:
	git pull
	$(COMPOSE) up -d --build

logs:
	$(COMPOSE) logs -f --tail=100

ps:
	$(COMPOSE) ps

shell:
	$(COMPOSE) exec backend bash

migrate:
	$(COMPOSE) exec backend alembic upgrade head

seed:
	$(COMPOSE) exec backend python -m scripts.seed

ssl:
	chmod +x scripts/init-ssl.sh && ./scripts/init-ssl.sh
