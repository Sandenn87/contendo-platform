#!/bin/bash

# Contendo Platform Deployment Script
# This script automates deployment tasks

set -e

echo "🚀 Contendo Platform Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Parse command line arguments
ACTION=${1:-"help"}

case $ACTION in
    "build")
        echo ""
        print_status "Building application..."
        
        # Build backend
        echo "📦 Installing backend dependencies..."
        npm ci
        
        echo "📦 Installing frontend dependencies..."
        cd src/client
        npm ci
        cd ../..
        
        echo "🔨 Building frontend..."
        cd src/client
        npm run build
        cd ../..
        
        echo "🔨 Building backend..."
        npm run build
        
        print_status "Build complete!"
        ;;
        
    "test")
        echo ""
        print_status "Running tests..."
        
        echo "🔍 TypeScript check (backend)..."
        npx tsc --noEmit
        
        echo "🔍 TypeScript check (frontend)..."
        cd src/client
        npx tsc --noEmit
        cd ../..
        
        print_status "All checks passed!"
        ;;
        
    "deploy")
        echo ""
        print_status "Preparing for deployment..."
        
        # Run tests first
        $0 test
        
        # Build
        $0 build
        
        # Check git status
        if [ -n "$(git status --porcelain)" ]; then
            print_warning "You have uncommitted changes!"
            read -p "Do you want to commit them? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git add -A
                git commit -m "Deploy: $(date +%Y-%m-%d\ %H:%M:%S)"
            fi
        fi
        
        # Push to main
        print_status "Pushing to GitHub..."
        git push origin main
        
        print_status "Deployment initiated! Render will auto-deploy."
        ;;
        
    "check")
        echo ""
        print_status "Checking deployment status..."
        
        # Check if .env exists
        if [ ! -f ".env" ]; then
            print_warning ".env file not found (this is OK for Render, uses env vars)"
        else
            print_status ".env file exists"
        fi
        
        # Check TypeScript
        echo "🔍 Running TypeScript check..."
        if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
            print_error "TypeScript errors found!"
            npx tsc --noEmit
            exit 1
        else
            print_status "No TypeScript errors"
        fi
        
        # Check Dockerfile
        if [ -f "Dockerfile" ]; then
            print_status "Dockerfile exists"
        else
            print_error "Dockerfile not found!"
            exit 1
        fi
        
        print_status "All checks passed!"
        ;;
        
    "help"|*)
        echo ""
        echo "Usage: ./scripts/deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  build   - Build the application (backend + frontend)"
        echo "  test    - Run TypeScript checks"
        echo "  deploy  - Build, test, commit, and push to GitHub"
        echo "  check   - Check deployment readiness"
        echo "  help    - Show this help message"
        echo ""
        ;;
esac

