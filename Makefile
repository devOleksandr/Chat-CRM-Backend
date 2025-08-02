# ========= LOCAL DEVELOPMENT =========
rebuild_local: down build up generate migrate seed
rebuild_ubuntu_server: down build up generate migrate seed
rebuild_local_clean: down build up migrate_reset seed

# ========= STAGING (PROD FILE) =========
rebuild_stage: down_stage build_stage up_stage migrate_stage seed_stage

# ========= PRODUCTION (SAFE) =========
rebuild_prod: down_prod build_prod up_prod migrate_prod seed_prod

# ========= BASE COMMANDS =========
up:
	docker compose --env-file .env up -d

down:
	docker compose --env-file .env down --volumes --remove-orphans

build:
	docker compose --env-file .env build

migrate:
	@echo "Running migrations..."
	docker compose --env-file .env exec -T api npx prisma migrate deploy --schema=prisma/schema.prisma

migrate_reset:
	@echo "⚠️ Resetting database and all migrations..."
	docker compose --env-file .env exec -T api npx prisma migrate reset --force --schema=prisma/schema.prisma

generate:
	@echo "Generating Prisma client..."
	docker compose --env-file .env exec -T api npx prisma generate

seed:
	@echo "Seeding database with initial admin user..."
	docker compose --env-file .env exec -T api npx prisma db seed

# ========= STAGING COMMANDS =========
up_stage:
	docker compose -f docker-compose.prod.yml --env-file .env up -d

down_stage:
	docker compose -f docker-compose.prod.yml --env-file .env down --volumes --remove-orphans

build_stage:
	docker compose -f docker-compose.prod.yml --env-file .env build

migrate_stage:
	@echo "Running staging migrations..."
	docker compose -f docker-compose.prod.yml --env-file .env exec -T api sh -c "sleep 10 && npx prisma migrate deploy --schema=prisma/schema.prisma"

seed_stage:
	@echo "Seeding staging database..."
	docker compose -f docker-compose.prod.yml --env-file .env exec -T api npx prisma db seed

# ========= PRODUCTION COMMANDS =========
up_prod:
	docker compose -f docker-compose.prod.yml --env-file .env up -d

down_prod:
	docker compose -f docker-compose.prod.yml --env-file .env down --remove-orphans

build_prod:
	docker compose -f docker-compose.prod.yml --env-file .env build

migrate_prod:
	@echo "Running production migrations..."
	docker compose -f docker-compose.prod.yml --env-file .env run --rm api npx prisma migrate deploy --schema=prisma/schema.prisma

seed_prod:
	@echo "Seeding production database..."
	docker compose -f docker-compose.prod.yml --env-file .env run --rm api npx prisma db seed

# ========= HELPER COMMANDS =========
d_node_install_ubuntu_user:
	echo "Installing node dependencies for Ubuntu user..." && \
	docker run --rm -it \
		-v `pwd`:/app \
		-w /app \
		--user $$(id -u ubuntu):$$(id -g ubuntu) \
		node:24 bash -ci " \
		    npm ci \
		"

d_node_install_local_user:
	echo "Installing node dependencies for local user..." && \
	docker run --rm -it \
		-v `pwd`:/app \
		-w /app \
		node:24 bash -ci " \
		    npm ci \
		"

# ========= UTILITIES =========
logs:
	docker compose --env-file .env logs -f

logs_stage:
	docker compose -f docker-compose.prod.yml --env-file .env logs -f

status:
	docker compose --env-file .env ps

status_stage:
	docker compose -f docker-compose.prod.yml --env-file .env ps

# ========= DATABASE UTILITIES =========
db_reset:
	@echo "⚠️ Resetting database..."
	docker compose --env-file .env exec -T api npx prisma migrate reset --force

db_studio:
	@echo "Opening Prisma Studio..."
	docker compose --env-file .env exec -T api npx prisma studio

# ========= HELP =========
help:
	@echo "💻 LOCAL DEVELOPMENT:"
	@echo "  make rebuild_local       - Full local rebuild (standard)"
	@echo "  make rebuild_local_clean - Clean rebuild (reset DB)"
	@echo "  make rebuild_ubuntu_server - Ubuntu server rebuild"
	@echo ""
	@echo "🧪 STAGING:"
	@echo "  make rebuild_stage       - Full staging rebuild"
	@echo ""
	@echo "🚀 PRODUCTION:"
	@echo "  make rebuild_prod        - Full production rebuild"
	@echo ""
	@echo "🔧 DATABASE:"
	@echo "  make migrate_reset       - Reset all migrations"
	@echo "  make generate            - Generate Prisma client"
	@echo "  make db_reset            - Reset database"
	@echo "  make db_studio           - Open Prisma Studio"
	@echo ""
	@echo "🔍 UTILITIES:"
	@echo "  make logs                - Show local logs"
	@echo "  make logs_stage          - Show staging logs"
	@echo "  make status              - Check local status"
	@echo "  make status_stage        - Check staging status"
