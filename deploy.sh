#!/bin/bash

echo "🚀 Deploying Khaalis Harvest Platform..."

# Stop existing containers
docker-compose down

# Build and start
docker-compose up --build -d

# Wait for services
sleep 30

# Show status
docker-compose ps

echo ""
echo "✅ Khaalis Harvest Platform is running!"
echo "🌐 Frontend: http://localhost:3001"
echo "🚀 Backend: http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api/docs"