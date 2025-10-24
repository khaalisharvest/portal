#!/bin/bash

# Livestock Ecosystem Deployment Script
echo "🚀 Deploying Livestock Ecosystem..."

# Check if environment is provided
if [ -z "$1" ]; then
    echo "❌ Please specify environment: staging, production, or local"
    echo "Usage: ./deploy.sh [staging|production|local]"
    exit 1
fi

ENVIRONMENT=$1

# Set environment-specific variables
case $ENVIRONMENT in
    "local")
        echo "🏠 Deploying locally..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "staging")
        echo "🧪 Deploying to staging..."
        docker-compose -f docker-compose.yml up -d --build
        ;;
    "production")
        echo "🌐 Deploying to production..."
        # Check if production environment file exists
        if [ ! -f ".env.production" ]; then
            echo "❌ Production environment file not found!"
            echo "Please create .env.production with production values"
            exit 1
        fi
        
        # Load production environment
        export $(cat .env.production | grep -v '^#' | xargs)
        
        # Deploy with production compose file
        docker-compose -f docker-compose.prod.yml up -d --build
        
        # Run migrations
        echo "🔄 Running database migrations..."
        docker-compose -f docker-compose.prod.yml exec backend yarn migration:run
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: local, staging, production"
        exit 1
        ;;
esac

echo "✅ Deployment completed for $ENVIRONMENT environment"
echo ""
echo "Services:"
echo "  🌐 Web App: http://localhost:3001"
echo "  🚀 API: http://localhost:3000"
echo "  📚 API Docs: http://localhost:3000/api/docs"
echo "  ❤️ Health Check: http://localhost:3000/api/v1/health"
