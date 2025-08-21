# ========================================
# CHAT CRM BACKEND - MAKEFILE
# ========================================

# ========= LOCAL DEVELOPMENT =========
rebuild_local: down build up migrate_dev migrate seed

# ========= COOLIFY DEPLOYMENT =========
coolify_build: build_coolify
coolify_deploy: build_coolify up_coolify
coolify_down: down_coolify

# ========= DATABASE ONLY =========
db_only: down_db up_db
db_with_pgadmin: down_db up_db_pgadmin

# ========= BASE COMMANDS =========
up:
	docker compose --env-file .env up -d

down:
	docker compose --env-file .env down --volumes --remove-orphans

down_db:
	docker compose --env-file .env stop postgres
	docker compose --env-file .env rm -f postgres

up_db:
	docker compose --env-file .env up postgres -d

up_db_pgadmin:
	docker compose -f docker-compose.db.yml --env-file .env up -d

down_db_pgadmin:
	docker compose -f docker-compose.db.yml --env-file .env down

build:
	docker compose --env-file .env build

migrate:
	@echo "Running migrations..."
	docker compose --env-file .env exec -T api npx prisma migrate deploy --schema=prisma/schema.prisma

migrate_dev:
	@echo "Creating new migration..."
	docker compose --env-file .env exec -T api npx prisma migrate dev --name auto-migration --schema=prisma/schema.prisma

migrate_reset:
	@echo "⚠️ Resetting database and all migrations..."
	docker compose --env-file .env exec -T api npx prisma migrate reset --force --schema=prisma/schema.prisma

generate:
	@echo "Generating Prisma client..."
	docker compose --env-file .env exec -T api npx prisma generate

seed:
	@echo "Seeding database with initial admin user..."
	docker compose --env-file .env exec -T api npx prisma db seed

# ========= COOLIFY COMMANDS =========
up_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env up -d

down_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env down --remove-orphans

build_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env build

# ========= LOCAL DEVELOPMENT WITH DB ONLY =========
dev_local: up_db
	@echo "🚀 Database started. Now run: npm run start:dev"

dev_local_pgadmin: up_db_pgadmin
	@echo "🚀 Database + pgAdmin started."
	@echo "📊 pgAdmin available at: http://localhost:8080"
	@echo "📧 Email: admin@admin.com"
	@echo "🔑 Password: admin"

# ========= UTILITIES =========
logs:
	docker compose --env-file .env logs -f

logs_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env logs -f

status:
	docker compose --env-file .env ps

status_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env ps

# ========= DATABASE UTILITIES =========
db_migrate:
	@echo "Creating new migration..."
	docker compose --env-file .env exec -T api npx prisma migrate dev --name auto-migration --schema=prisma/schema.prisma

db_reset:
	@echo "⚠️ Resetting database..."
	docker compose --env-file .env exec -T api npx prisma migrate reset --force

db_studio:
	@echo "Opening Prisma Studio..."
	docker compose --env-file .env exec -T api npx prisma studio

# ========= HEALTH CHECKS =========
health_local:
	@echo "🏥 Checking local health..."
	curl -f http://localhost:5055/health || echo "❌ Local health check failed"

health_coolify:
	@echo "🏥 Checking Coolify health..."
	curl -f http://localhost:5055/health || echo "❌ Coolify health check failed"

# ========= HELP =========
help:
	@echo "💻 LOCAL DEVELOPMENT:"
	@echo "  make rebuild_local       - Full local rebuild (Docker)"
	@echo "  make dev_local          - Start DB only for local dev"
	@echo "  make dev_local_pgadmin  - Start DB + pgAdmin for local dev"
	@echo "  make db_only            - Start/stop DB only"
	@echo ""
	@echo "☁️  COOLIFY:"
	@echo "  make coolify_build       - Build for Coolify"
	@echo "  make coolify_deploy      - Deploy to Coolify"
	@echo "  make coolify_down        - Stop Coolify deployment"
	@echo ""
	@echo "🔍 DATABASE:"
	@echo "  make db_migrate          - Create new migration"
	@echo "  make migrate_reset       - Reset all migrations"
	@echo "  make generate            - Generate Prisma client"
	@echo "  make db_reset            - Reset database"
	@echo "  make db_studio           - Open Prisma Studio"
	@echo ""
	@echo "🔍 UTILITIES:"
	@echo "  make logs                - Show local logs"
	@echo "  make logs_coolify        - Show Coolify logs"
	@echo "  make status              - Check local status"
	@echo "  make status_coolify      - Check Coolify status"
	@echo ""
	@echo "🏥 HEALTH CHECKS:"
	@echo "  make health_local        - Check local health"
	@echo "  make health_coolify      - Check Coolify health"
