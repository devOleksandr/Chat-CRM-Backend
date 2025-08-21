# 🚀 Coolify Deployment Guide

## 📋 Overview

This guide explains how to deploy the Chat CRM Backend to Coolify, a self-hosted platform-as-a-service solution.

## 🏗️ Architecture

### **Local Development**
- Full stack with PostgreSQL database
- Hot reload and development tools
- Makefile commands for easy management

### **Coolify Production**
- Backend only (no database)
- External database connection
- Health checks and monitoring
- Optimized Docker image

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

## 🔧 Prerequisites

### **Local Development**
- Docker & Docker Compose
- Node.js 18+
- Make

### **Coolify Deployment**
- Coolify instance running
- External PostgreSQL database
- Environment variables configured

## 🚀 Quick Start

### **1. Local Development**

```bash
# Full stack development
make rebuild_local

# Database only
make dev_local

# Database + pgAdmin
make dev_local_pgadmin
```

### **2. Coolify Deployment**

```bash
# Build for Coolify
make coolify_build

# Deploy locally (for testing)
make coolify_deploy

# Stop Coolify deployment
make coolify_down
```

### **3. Deployment Script**

```bash
# Use deployment script
./scripts/deploy-coolify.sh
```

## ☁️ Coolify Setup

### **1. Create New Project**
1. Log into Coolify dashboard
2. Click "New Project"
3. Select "Application"
4. Choose "Docker" as deployment method

### **2. Configure Repository**
1. Connect your Git repository
2. Set branch to `main`
3. Set build command: `npm run build`
4. Set start command: `node dist/main.js`

### **3. Environment Variables**
Set these in Coolify dashboard:

```bash
# Core Configuration
NODE_ENV=production
PORT=5055

# Database (External)
DATABASE_URL=postgresql://user:password@your-db-host:5432/crm?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-production-jwt-key
JWT_REFRESH_SECRET=your-super-secret-production-refresh-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Expo Push Notifications
EXPO_PUBLIC_PROJECT_ID=d7aed120-6c52-4383-bf2e-a01683ad1b8c
EXPO_ACCESS_TOKEN=sPD-5LdUDWs3UknA1mix1UTPY7OQdzcl3vGXazht

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-production-app-password

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### **4. Docker Configuration**
1. **Dockerfile**: `Dockerfile.prod`
2. **Port**: `5055`
3. **Health Check**: `/health` endpoint
4. **Restart Policy**: `unless-stopped`

### **5. Deploy**
1. Click "Deploy" button
2. Wait for build to complete
3. Verify health check passes
4. Test API endpoints

## 🔍 Health Checks

### **Health Endpoint**
```
GET /health
```

### **Expected Response**
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
make health_local        # Check local health
make health_coolify      # Check Coolify health
```

## 📊 Monitoring

### **Logs**
```bash
make logs                # Show local logs
make logs_coolify        # Show Coolify logs
```

### **Status**
```bash
make status              # Check local status
make status_coolify      # Check Coolify status
```

## 🗄️ Database Setup

### **External Database Requirements**
- PostgreSQL 15+
- SSL enabled (recommended)
- Connection pooling support
- Backup strategy

### **Local Database**
```bash
# Start database only
make db_only

# Start database + pgAdmin
make db_with_pgadmin

# Database utilities
make db_migrate
make db_reset
make db_studio
```

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. Database Connection Failed**
```bash
# Check database URL format
echo $DATABASE_URL

# Test connection locally
psql $DATABASE_URL -c "SELECT 1;"
```

#### **2. Port Already in Use**
```bash
# Check what's using port 5055
lsof -i :5055

# Kill process
kill -9 <PID>
```

#### **3. Build Failed**
```bash
# Clean Docker
docker system prune -f

# Rebuild
make coolify_build
```

#### **4. Health Check Failed**
```bash
# Check container logs
make logs_coolify

# Check container status
make status_coolify

# Restart container
make coolify_down && make coolify_deploy
```

### **Debug Commands**
```bash
# Show all available commands
make help

# Check Docker system
docker system df
docker images | grep chat-crm
```

## 📚 Additional Resources

### **Documentation**
- [Coolify Documentation](https://coolify.io/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)

### **Support**
- Check container logs for errors
- Verify environment variables
- Test database connectivity
- Review health check responses

## 🎯 Best Practices

### **Security**
- Use strong JWT secrets
- Enable SSL for database
- Regular security updates
- Environment variable validation

### **Performance**
- Database connection pooling
- Health check monitoring
- Log level optimization
- Resource limits

### **Monitoring**
- Health check endpoints
- Log aggregation
- Metrics collection
- Alert notifications

---

**Need help?** Check the troubleshooting section or review the logs for specific error messages.
