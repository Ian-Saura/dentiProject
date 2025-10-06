#!/bin/bash

# Quick fix for 502 Bad Gateway
# This script checks and restarts services if needed

SERVER_PASS="EfHrx&0P1U3aFb"
SERVER_PORT="5661"
SERVER_HOST="66.97.44.23"

echo "🔧 Fixing 502 Bad Gateway..."

sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no root@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "📊 Current status:"
docker compose ps

echo ""
echo "🛑 Stopping all services..."
docker compose down

echo ""
echo "🚀 Starting all services..."
docker compose up -d

echo ""
echo "⏳ Waiting 15 seconds for services to start..."
sleep 15

echo ""
echo "📊 New status:"
docker compose ps

echo ""
echo "📝 Checking logs for errors..."
echo "=== Backend logs (last 20 lines) ==="
docker compose logs --tail=20 backend

echo ""
echo "=== Frontend logs (last 20 lines) ==="
docker compose logs --tail=20 frontend

echo ""
echo "=== Nginx logs (last 20 lines) ==="
docker compose logs --tail=20 nginx

ENDSSH

echo ""
echo "✅ Done! Check http://66.97.44.23"
