#!/bin/bash

echo "🚀 Starting Server Orchestrator..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file and update JWT_SECRET and ENCRYPTION_KEY!"
    echo "   ENCRYPTION_KEY must be exactly 32 characters!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start containers
echo "📦 Building and starting containers..."
docker-compose up --build -d

echo ""
echo "✅ Server Orchestrator is running!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3000"
echo "🔌 WebSocket: ws://localhost:8080"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
