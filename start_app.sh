#!/bin/bash

# 🚀 DentiProject - One-Click Startup Script
# This script starts both backend and frontend automatically

echo "🦷 Starting DentiProject - Dental Practice Management System"
echo "============================================================"

# Check if we're in the right directory
if [ ! -f "ingresos.csv" ]; then
    echo "❌ Error: Please run this script from the DentiProject root directory"
    echo "   Expected to find ingresos.csv in current directory"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed"
    echo "   Please install Python 3.11+ and try again"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed"
    echo "   Please install Node.js 18+ and try again"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down DentiProject..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   Frontend stopped"
    fi
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Install Python dependencies if needed
echo "📦 Installing Python dependencies..."
pip3 install fastapi uvicorn pandas numpy python-multipart > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Python dependencies ready"
else
    echo "⚠️  Warning: Some Python packages may need manual installation"
fi

# Start Backend
echo ""
echo "🔧 Starting Backend (FastAPI)..."
python3 backend_with_real_data.py > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend started successfully on http://localhost:8004"
else
    echo "❌ Backend failed to start. Check backend.log for details"
    exit 1
fi

# Install Node.js dependencies if needed
echo ""
echo "📦 Installing Node.js dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages (this may take a few minutes)..."
    npm install > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Node.js dependencies installed"
    else
        echo "❌ Failed to install Node.js dependencies"
        cleanup
        exit 1
    fi
else
    echo "✅ Node.js dependencies already installed"
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend (React + Vite)..."
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 5

# Check if frontend started successfully
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend started successfully on http://localhost:3000"
else
    echo "❌ Frontend failed to start. Check frontend.log for details"
    cleanup
    exit 1
fi

echo ""
echo "🎉 DentiProject is now running!"
echo "============================================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8004"
echo "🔐 Login:    admin / Homero123"
echo ""
echo "📊 Features Available:"
echo "   • Financial Dashboard with real data (111 consultations)"
echo "   • Patient Management with Clinical History"
echo "   • Treatment Profitability Analysis"
echo "   • Monthly P&L and Cash Flow Reports"
echo "   • Intelligent Price Calculator"
echo "   • CSV Import with Data Normalization"
echo ""
echo "🖥️  Open your browser and go to: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop both servers"
echo ""

# Keep script running and wait for user to stop
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend process died unexpectedly"
        cleanup
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend process died unexpectedly"
        cleanup
        exit 1
    fi
    
    sleep 5
done
