#!/bin/bash

# 🦷 DentiProject Docker Startup Script
# This script builds and starts the entire application stack

set -e

echo "🦷 Starting DentiProject Docker Stack..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Remove old images (optional, uncomment if you want fresh builds)
# echo "🗑️  Removing old images..."
# docker-compose down --rmi all

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check MySQL
if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
    echo "✅ MySQL is ready"
else
    echo "❌ MySQL is not ready"
fi

# Check Backend
if curl -f http://localhost:8000/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
fi

# Check Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is ready"
else
    echo "❌ Nginx is not ready"
fi

echo ""
echo "🎉 DentiProject is starting up!"
echo "========================================"
echo "📱 Frontend: http://localhost (via Nginx)"
echo "📱 Frontend Direct: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️  MySQL: localhost:3306"
echo ""
echo "🔐 Default credentials:"
echo "   Username: admin"
echo "   Password: Homero123"
echo ""
echo "📊 To view logs: docker-compose logs -f [service_name]"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart [service_name]"

# Show running containers
echo ""
echo "🐳 Running containers:"
docker-compose ps
