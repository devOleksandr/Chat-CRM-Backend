# 🚀 Chat CRM Backend - Deployment Guide

## 📋 Overview

This document describes the deployment architecture and CI/CD pipeline for the Chat CRM Backend application.

## 🏗️ Architecture

### **Development Environment**
- **Full Stack**: Backend + PostgreSQL database
- **Hot Reload**: Development mode with file watching
- **Local Database**: Docker container with persistent data
- **Makefile Commands**: Easy development workflow

### **Production Environment (Coolify)**
- **Backend Only**: Single container deployment
- **External Database**: PostgreSQL hosted separately
- **Health Checks**: Built-in monitoring endpoints
- **Optimized Image**: Multi-stage Docker build

## 📁 File Structure

```
├── Dockerfile                  # Development Dockerfile
├── Dockerfile.prod            # Production Dockerfile (Coolify)
├── docker-compose.yml         # Local development (full stack)
├── docker-compose.prod.yml    # Staging (full stack)
├── docker-compose.coolify.yml # Coolify (backend only)
├── docker-compose.db.yml      # Database only (local)
├── scripts/
│   ├── deploy-coolify.sh      # Coolify deployment script
│   └── ci-build.sh            # CI/CD build script
├── .github/workflows/
│   └── ci-cd.yml              # GitHub Actions workflow
├── src/health/                # Health check endpoints
├── env.local.example          # Local environment template
├── env.production.example     # Production environment template
└── Makefile                   # Development commands
```

## 🚀 Quick Start

### **Local Development**

```bash
# Full stack development
make rebuild_local

# Database only
make dev_local

# Database + pgAdmin
make dev_local_pgadmin
```

### **Coolify Deployment**

```bash
# Build for Coolify
make coolify_build

# Deploy locally (for testing)
make coolify_deploy

# Stop deployment
make coolify_down
```

### **CI/CD Pipeline**

```bash
# Full pipeline
./scripts/ci-build.sh

# Skip tests
./scripts/ci-build.sh --skip-tests

# Development build
./scripts/ci-build.sh -t development
```

## ☁️ Coolify Setup

### **1. Project Configuration**
- **Type**: Application
- **Deployment**: Docker
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Start Command**: `node dist/main.js`

### **2. Docker Settings**
- **Dockerfile**: `Dockerfile.prod`
- **Port**: `5055`
- **Health Check**: `/health` endpoint
- **Restart Policy**: `unless-stopped`

### **3. Environment Variables**
```bash
# Core
NODE_ENV=production
PORT=5055

# Database (External)
DATABASE_URL=postgresql://user:password@host:5432/crm?schema=public

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Expo Push
EXPO_PUBLIC_PROJECT_ID=your-project-id
EXPO_ACCESS_TOKEN=your-access-token

# Optional
FRONTEND_URL=https://your-frontend.com
LOG_LEVEL=info
```

## 🔍 Health Monitoring

### **Health Endpoint**
```
GET /health
```

### **Response Format**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345,
  "version": "1.0.0",
  "environment": "production",
  "memory": {
    "used": 123,
    "total": 987,
    "percentage": 12.5
  }
}
```

### **Health Check Commands**
```bash
make health_local      # Local health
make health_stage      # Staging health
make health_coolify    # Coolify health
```

## 📊 Monitoring & Logs

### **Logs**
```bash
make logs              # Local logs
make logs_stage        # Staging logs
make logs_coolify      # Coolify logs
```

### **Status**
```bash
make status            # Local status
make status_stage      # Staging status
make status_coolify    # Coolify status
```

## 🗄️ Database Management

### **Local Database**
```bash
# Start database
make db_only

# Start database + pgAdmin
make db_with_pgadmin

# Database utilities
make db_migrate
make db_reset
make db_studio
```

### **External Database (Production)**
- PostgreSQL 15+
- SSL enabled
- Connection pooling
- Backup strategy
- Monitoring

## 🔄 CI/CD Pipeline

### **GitHub Actions**
- **Trigger**: Push to `main`/`develop`
- **Build**: Node.js 18, tests, linting
- **Docker**: Build and push to registry
- **Deploy**: Automatic deployment

### **Pipeline Stages**
1. **Build & Test**: Compile, test, lint
2. **Docker**: Build production image
3. **Deploy**: Staging/Production deployment
4. **Verify**: Health checks and monitoring

### **Manual Deployment**
```bash
# Deploy to staging
gh workflow run ci-cd.yml -f environment=staging

# Deploy to production
gh workflow run ci-cd.yml -f environment=production
```

## 🛠️ Troubleshooting

### **Common Issues**

#### **Database Connection**
```bash
# Check connection
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1;"
```

#### **Port Conflicts**
```bash
# Check port usage
lsof -i :5055
kill -9 <PID>
```

#### **Build Failures**
```bash
# Clean and rebuild
make docker_clean
make coolify_build
```

#### **Health Check Failures**
```bash
# Check logs and status
make logs_coolify
make status_coolify
make health_coolify
```

### **Debug Commands**
```bash
make help              # Show all commands
make docker_images     # List Docker images
make docker_containers # List containers
make docker_clean      # Clean Docker system
```

## 🔧 Development Workflow

### **Daily Development**
1. Start database: `make dev_local`
2. Run backend: `npm run start:dev`
3. Make changes and test
4. Commit and push

### **Testing Changes**
1. Build locally: `make coolify_build`
2. Test deployment: `make coolify_deploy`
3. Verify health: `make health_coolify`
4. Clean up: `make coolify_down`

### **Production Deployment**
1. Push to `main` branch
2. GitHub Actions build and test
3. Automatic deployment to Coolify
4. Verify production health

## 📚 Additional Resources

### **Documentation**
- [Coolify Deployment Guide](./COOLIFY-DEPLOYMENT.md)
- [API Documentation](./openapi.json)
- [Makefile Commands](./Makefile)

### **Scripts**
- [Coolify Deployment](./scripts/deploy-coolify.sh)
- [CI/CD Build](./scripts/ci-build.sh)

### **Configuration**
- [Local Environment](./env.local.example)
- [Production Environment](./env.production.example)

---

**Need help?** Check the troubleshooting section or run `make help` for available commands.
