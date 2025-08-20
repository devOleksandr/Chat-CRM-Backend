#!/bin/bash

# ========================================
# COOLIFY DEPLOYMENT SCRIPT
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="chat-crm-backend"
TAG="latest"
REGISTRY=""  # Leave empty for local builds

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

build_image() {
    log_info "Building production Docker image..."
    
    if [ -f "Dockerfile.prod" ]; then
        docker build -f Dockerfile.prod -t ${IMAGE_NAME}:${TAG} .
        log_success "Image built successfully using Dockerfile.prod"
    else
        log_warning "Dockerfile.prod not found, using default Dockerfile"
        docker build -t ${IMAGE_NAME}:${TAG} .
        log_success "Image built successfully using default Dockerfile"
    fi
}

test_image() {
    log_info "Testing built image..."
    
    # Create a temporary container to test the image
    CONTAINER_ID=$(docker create ${IMAGE_NAME}:${TAG})
    
    # Check if container was created successfully
    if [ $? -eq 0 ]; then
        log_success "Image test passed - container created successfully"
        docker rm $CONTAINER_ID
    else
        log_error "Image test failed"
        exit 1
    fi
}

tag_and_push() {
    if [ ! -z "$REGISTRY" ]; then
        log_info "Tagging and pushing to registry..."
        
        # Tag for registry
        docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}
        
        # Push to registry
        docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}
        
        log_success "Image pushed to registry: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
    else
        log_info "No registry specified, skipping push"
    fi
}

create_deployment_files() {
    log_info "Creating deployment files..."
    
    # Create docker-compose for Coolify
    if [ ! -f "docker-compose.coolify.yml" ]; then
        log_warning "docker-compose.coolify.yml not found, creating from template..."
        cat > docker-compose.coolify.yml << 'EOF'
version: '3.8'
services:
  backend:
    image: ${IMAGE_NAME}:${TAG}
    container_name: chat-crm-backend-coolify
    ports:
      - "5055:5055"
    environment:
      - NODE_ENV=production
      - PORT=5055
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - EXPO_PUBLIC_PROJECT_ID=${EXPO_PUBLIC_PROJECT_ID}
      - EXPO_ACCESS_TOKEN=${EXPO_ACCESS_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5055/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF
        log_success "Created docker-compose.coolify.yml"
    fi
    
    # Create .env.production template if it doesn't exist
    if [ ! -f ".env.production" ]; then
        log_warning ".env.production not found, creating from template..."
        if [ -f "env.production.example" ]; then
            cp env.production.example .env.production
            log_success "Created .env.production from template"
        else
            log_warning "env.production.example not found, skipping .env.production creation"
        fi
    fi
}

show_deployment_info() {
    log_info "Deployment completed successfully!"
    echo
    echo "📋 Next steps for Coolify:"
    echo "1. Upload your code to Coolify"
    echo "2. Set environment variables in Coolify dashboard:"
    echo "   - DATABASE_URL (your external database)"
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo "   - EXPO_PUBLIC_PROJECT_ID"
    echo "   - EXPO_ACCESS_TOKEN"
    echo "3. Use Dockerfile.prod for build"
    echo "4. Set port to 5055"
    echo "5. Deploy!"
    echo
    echo "🔧 Available commands:"
    echo "  make coolify_build       - Build for Coolify"
    echo "  make coolify_deploy      - Deploy locally (for testing)"
    echo "  make coolify_down        - Stop Coolify deployment"
    echo
    echo "🏥 Health check:"
    echo "  make health_coolify      - Check Coolify health"
}

# Main execution
main() {
    echo "🚀 Starting Coolify deployment process..."
    echo
    
    check_requirements
    build_image
    test_image
    tag_and_push
    create_deployment_files
    show_deployment_info
    
    log_success "Coolify deployment script completed!"
}

# Run main function
main "$@"
