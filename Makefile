# ========================================
# CHAT CRM BACKEND - MAKEFILE
# ========================================

# ========= LOCAL DEVELOPMENT =========
rebuild_local: down build up migrate_dev migrate seed
rebuild_local_clean: down build up migrate_reset
db_only: down_db up_db

# ========= STAGING (PROD FILE) =========
rebuild_stage: down_stage build_stage up_stage migrate_stage seed_stage

# ========= PRODUCTION (SAFE) =========
rebuild_prod: down_prod build_prod up_prod migrate_prod seed_prod

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

# ========= COOLIFY COMMANDS =========
up_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env up -d

down_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env down --remove-orphans

build_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env build

# ========= CI/CD COMMANDS =========
ci_build:
	@echo "🔨 Building for CI/CD..."
	docker build -f Dockerfile.prod -t chat-crm-backend:latest .

ci_test:
	@echo "🧪 Running tests..."
	npm run test

ci_lint:
	@echo "🔍 Running linting..."
	npm run lint

ci_build_test: ci_build ci_test ci_lint

# ========= DOCKER UTILITIES =========
docker_clean:
	@echo "🧹 Cleaning Docker..."
	docker system prune -f
	docker volume prune -f

docker_images:
	@echo "📸 Docker images:"
	docker images | grep chat-crm

docker_containers:
	@echo "📦 Docker containers:"
	docker ps -a | grep chat-crm

# ========= NODE UTILITIES =========
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

logs_stage:
	docker compose -f docker-compose.prod.yml --env-file .env logs -f

logs_coolify:
	docker compose -f docker-compose.coolify.yml --env-file .env logs -f

status:
	docker compose --env-file .env ps

status_stage:
	docker compose -f docker-compose.prod.yml --env-file .env ps

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

health_stage:
	@echo "🏥 Checking staging health..."
	curl -f http://localhost:5055/health || echo "❌ Staging health check failed"

health_coolify:
	@echo "🏥 Checking Coolify health..."
	curl -f http://localhost:5055/health || echo "❌ Coolify health check failed"

# ========= HELP =========
help:
	@echo "💻 LOCAL DEVELOPMENT:"
	@echo "  make rebuild_local       - Full local rebuild (Docker)"
	@echo "  make rebuild_local_clean - Clean rebuild (reset DB)"
	@echo "  make rebuild_ubuntu_server - Ubuntu server rebuild"
	@echo "  make dev_local          - Start DB only for local dev"
	@echo "  make dev_local_pgadmin  - Start DB + pgAdmin for local dev"
	@echo "  make db_only            - Start/stop DB only"
	@echo ""
	@echo "🧪 STAGING:"
	@echo "  make rebuild_stage       - Full staging rebuild"
	@echo ""
	@echo "🚀 PRODUCTION:"
	@echo "  make rebuild_prod        - Full production rebuild"
	@echo ""
	@echo "☁️  COOLIFY:"
	@echo "  make coolify_build       - Build for Coolify"
	@echo "  make coolify_deploy      - Deploy to Coolify"
	@echo "  make coolify_down        - Stop Coolify deployment"
	@echo ""
	@echo "🔧 CI/CD:"
	@echo "  make ci_build            - Build for CI/CD"
	@echo "  make ci_test             - Run tests"
	@echo "  make ci_lint             - Run linting"
	@echo "  make ci_build_test       - Build + test + lint"
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
	@echo "  make logs_stage          - Show staging logs"
	@echo "  make logs_coolify        - Show Coolify logs"
	@echo "  make status              - Check local status"
	@echo "  make status_stage        - Check staging status"
	@echo "  make status_coolify      - Check Coolify status"
	@echo ""
	@echo "🏥 HEALTH CHECKS:"
	@echo "  make health_local        - Check local health"
	@echo "  make health_stage        - Check staging health"
	@echo "  make health_coolify      - Check Coolify health"
	@echo ""
	@echo "🧹 MAINTENANCE:"
	@echo "  make docker_clean        - Clean Docker system"
	@echo "  make docker_images       - Show Docker images"
	@echo "  make docker_containers   - Show Docker containers"
