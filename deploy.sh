#!/bin/bash

# ChronoAutoTee Deployment Script
# This script helps deploy the application locally or to production

set -e

echo "🏌️ ChronoAutoTee Deployment Script"
echo "=================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure it first."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-"local"}
ACTION=${2:-"start"}

case $ENVIRONMENT in
    "local")
        echo "🏠 Local deployment selected"
        ;;
    "production")
        echo "🚀 Production deployment selected"
        ;;
    *)
        echo "❌ Invalid environment. Use 'local' or 'production'"
        exit 1
        ;;
esac

case $ACTION in
    "build")
        echo "🔨 Building application..."
        docker-compose build
        ;;
    "start")
        echo "▶️  Starting application..."
        if [ "$ENVIRONMENT" = "production" ]; then
            docker-compose -f docker-compose.yml up -d
        else
            docker-compose up -d
        fi
        ;;
    "stop")
        echo "⏹️  Stopping application..."
        docker-compose down
        ;;
    "restart")
        echo "🔄 Restarting application..."
        docker-compose down
        docker-compose up -d
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker-compose logs -f chronoautotee
        ;;
    "health")
        echo "🏥 Checking health..."
        sleep 5  # Wait for containers to start
        curl -f http://localhost:3000/health || echo "❌ Health check failed"
        ;;
    "status")
        echo "📊 Checking status..."
        docker-compose ps
        ;;
    *)
        echo "❌ Invalid action. Use: build, start, stop, restart, logs, health, status"
        exit 1
        ;;
esac

if [ "$ACTION" = "start" ]; then
    echo ""
    echo "✅ Deployment completed!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Main App: http://localhost:3000"
    echo "   Health:   http://localhost:3000/health"
    echo "   Status:   http://localhost:3000/status"
    echo "   Web UI:   http://localhost:8000 (if python server still running)"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: ./deploy.sh $ENVIRONMENT logs"
    echo "   Check health: ./deploy.sh $ENVIRONMENT health"
    echo "   Stop: ./deploy.sh $ENVIRONMENT stop"
    echo ""
    echo "⚠️  Remember to:"
    echo "   - Configure real credentials in .env for production"
    echo "   - Set appropriate polling intervals"
    echo "   - Monitor logs for the first few hours"
fi

