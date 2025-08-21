# 🚀 Chat CRM Backend - Deployment Guide

## 📋 Overview

This document describes the deployment architecture for the Chat CRM Backend application, focusing on local development and Coolify deployment.

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
├── docker-compose.coolify.yml # Coolify (backend only)
├── docker-compose.db.yml      # Database only (local)
├── scripts/
│   └── deploy-coolify.sh      # Coolify deployment script
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
make health_coolify    # Coolify health
```

## 📊 Monitoring & Logs

### **Logs**
```bash
make logs              # Local logs
make logs_coolify      # Coolify logs
```

### **Status**
```bash
make status            # Local status
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
docker system prune -f
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
2. Use Coolify deployment script
3. Deploy to Coolify
4. Verify production health

## 📚 Additional Resources

### **Documentation**
- [Coolify Deployment Guide](./COOLIFY-DEPLOYMENT.md)
- [API Documentation](./openapi.json)
- [Makefile Commands](./Makefile)

### **Scripts**
- [Coolify Deployment](./scripts/deploy-coolify.sh)

### **Configuration**
- [Local Environment](./env.local.example)
- [Production Environment](./env.production.example)

---

**Need help?** Check the troubleshooting section or run `make help` for available commands.
