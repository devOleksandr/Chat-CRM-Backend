#!/bin/bash

# ========================================
# CI/CD BUILD AND TEST SCRIPT
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_TARGET="production"
SKIP_TESTS=false
SKIP_LINT=false
SKIP_BUILD=false

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

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -t, --target        Build target (production, development)"
    echo "  --skip-tests        Skip running tests"
    echo "  --skip-lint         Skip linting"
    echo "  --skip-build        Skip building Docker image"
    echo
    echo "Examples:"
    echo "  $0                    # Full CI/CD pipeline"
    echo "  $0 --skip-tests      # Skip tests"
    echo "  $0 -t development    # Build for development"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -t|--target)
                BUILD_TARGET="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-lint)
                SKIP_LINT=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

check_requirements() {
    log_info "Checking CI/CD requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed successfully"
}

run_lint() {
    if [ "$SKIP_LINT" = true ]; then
        log_warning "Skipping linting"
        return 0
    fi
    
    log_info "Running linting..."
    
    if npm run lint; then
        log_success "Linting passed"
    else
        log_error "Linting failed"
        exit 1
    fi
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests"
        return 0
    fi
    
    log_info "Running tests..."
    
    if npm run test; then
        log_success "Tests passed"
    else
        log_error "Tests failed"
        exit 1
    fi
}

build_application() {
    log_info "Building application..."
    
    if npm run build; then
        log_success "Application built successfully"
    else
        log_error "Application build failed"
        exit 1
    fi
}

build_docker_image() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping Docker build"
        return 0
    fi
    
    log_info "Building Docker image for $BUILD_TARGET..."
    
    if [ "$BUILD_TARGET" = "production" ]; then
        if [ -f "Dockerfile.prod" ]; then
            docker build -f Dockerfile.prod -t chat-crm-backend:latest .
            log_success "Production Docker image built successfully"
        else
            log_warning "Dockerfile.prod not found, using default Dockerfile"
            docker build -t chat-crm-backend:latest .
            log_success "Docker image built successfully using default Dockerfile"
        fi
    else
        docker build -t chat-crm-backend:dev .
        log_success "Development Docker image built successfully"
    fi
}

run_security_scan() {
    log_info "Running security scan..."
    
    # Check for known vulnerabilities
    if npm audit --audit-level=moderate; then
        log_success "Security scan passed"
    else
        log_warning "Security vulnerabilities found (moderate or higher)"
        # Don't exit on security warnings, just warn
    fi
}

generate_build_info() {
    log_info "Generating build information..."
    
    # Create build info file
    cat > build-info.json << EOF
{
  "build_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "build_target": "$BUILD_TARGET",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "package_version": "$(node -p "require('./package.json').version")"
}
EOF
    
    log_success "Build information generated"
}

show_build_summary() {
    log_info "Build completed successfully!"
    echo
    echo "📋 Build Summary:"
    echo "  Target: $BUILD_TARGET"
    echo "  Tests: $([ "$SKIP_TESTS" = true ] && echo "Skipped" || echo "Passed")"
    echo "  Lint: $([ "$SKIP_LINT" = true ] && echo "Skipped" || echo "Passed")"
    echo "  Docker: $([ "$SKIP_BUILD" = true ] && echo "Skipped" || echo "Built")"
    echo
    echo "🔧 Available commands:"
    echo "  make ci_build            - Build for CI/CD"
    echo "  make ci_test             - Run tests"
    echo "  make ci_lint             - Run linting"
    echo "  make ci_build_test       - Build + test + lint"
    echo
    echo "📦 Docker images:"
    docker images | grep chat-crm || echo "  No chat-crm images found"
}

# Main execution
main() {
    echo "🔨 Starting CI/CD pipeline..."
    echo
    
    parse_args "$@"
    check_requirements
    install_dependencies
    run_lint
    run_tests
    build_application
    build_docker_image
    run_security_scan
    generate_build_info
    show_build_summary
    
    log_success "CI/CD pipeline completed successfully!"
}

# Run main function
main "$@"
