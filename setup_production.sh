#!/bin/bash

# 🚀 DentiProject Production Setup Script
# This script sets up the complete production environment

echo "🦷 Setting up DentiProject Production Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "tablas_app.sql" ]; then
    print_error "Please run this script from the DentiProject root directory"
    exit 1
fi

print_info "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi
print_status "Python 3 found"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    print_warning "MySQL client not found. Please install MySQL server and client."
    print_info "On macOS: brew install mysql"
    print_info "On Ubuntu: sudo apt install mysql-server mysql-client"
    read -p "Do you want to continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_status "MySQL client found"
fi

# Check Node.js for frontend
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Frontend won't work without it."
    print_info "Install Node.js 18+ from: https://nodejs.org/"
else
    print_status "Node.js found"
fi

echo ""
print_info "Step 1: Installing Python dependencies..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv_production" ]; then
    python3 -m venv venv_production
    print_status "Created production virtual environment"
fi

# Activate virtual environment
source venv_production/bin/activate
print_status "Activated virtual environment"

# Install production requirements
pip install -r requirements_production.txt
if [ $? -eq 0 ]; then
    print_status "Python dependencies installed"
else
    print_error "Failed to install Python dependencies"
    exit 1
fi

echo ""
print_info "Step 2: Environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp env.example .env
    print_status "Created .env file from template"
    print_warning "Please edit .env file with your actual database credentials!"
    print_info "Especially update: DB_PASSWORD, JWT_SECRET_KEY"
else
    print_status ".env file already exists"
fi

echo ""
print_info "Step 3: Database setup..."

# Ask for database credentials
echo "Please provide your MySQL credentials:"
read -p "MySQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL user (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -s -p "MySQL password: " DB_PASSWORD
echo

# Test database connection
print_info "Testing database connection..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null
if [ $? -eq 0 ]; then
    print_status "Database connection successful"
    
    # Update .env file with database credentials
    sed -i.bak "s/DB_HOST=localhost/DB_HOST=$DB_HOST/" .env
    sed -i.bak "s/DB_USER=root/DB_USER=$DB_USER/" .env
    sed -i.bak "s/DB_PASSWORD=your_mysql_password/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i.bak "s|DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/consultorio_db|DATABASE_URL=mysql+pymysql://$DB_USER:$DB_PASSWORD@$DB_HOST:3306/consultorio_db|" .env
    rm .env.bak
    
    print_status "Updated .env file with database credentials"
else
    print_error "Database connection failed. Please check your credentials."
    exit 1
fi

# Run database setup
print_info "Setting up database schema and initial data..."
export DB_HOST="$DB_HOST"
export DB_USER="$DB_USER"
export DB_PASSWORD="$DB_PASSWORD"

python setup_database.py
if [ $? -eq 0 ]; then
    print_status "Database setup completed"
else
    print_error "Database setup failed"
    exit 1
fi

echo ""
print_info "Step 4: Frontend setup..."

if command -v node &> /dev/null; then
    cd frontend
    
    # Install frontend dependencies
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -eq 0 ]; then
            print_status "Frontend dependencies installed"
        else
            print_error "Failed to install frontend dependencies"
        fi
    else
        print_status "Frontend dependencies already installed"
    fi
    
    # Update frontend API URL for production backend
    if [ -f "vite.config.ts" ]; then
        # Update proxy target to port 8000 (production backend)
        sed -i.bak 's/target: "http:\/\/localhost:8004"/target: "http:\/\/localhost:8000"/' vite.config.ts
        rm vite.config.ts.bak 2>/dev/null
        print_status "Updated frontend to connect to production backend (port 8000)"
    fi
    
    cd ..
else
    print_warning "Skipping frontend setup (Node.js not found)"
fi

echo ""
print_info "Step 5: Creating startup scripts..."

# Create production startup script
cat > start_production.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting DentiProject Production Environment"
echo "=============================================="

# Activate virtual environment
source venv_production/bin/activate

# Start backend in background
echo "Starting production backend on port 8000..."
python backend_production.py > backend_production.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend started successfully (PID: $BACKEND_PID)"
    echo "📊 Backend URL: http://localhost:8000"
    echo "📖 API Docs: http://localhost:8000/docs"
else
    echo "❌ Backend failed to start. Check backend_production.log"
    exit 1
fi

# Start frontend if Node.js is available
if command -v node &> /dev/null; then
    echo "Starting frontend on port 3000..."
    cd frontend
    npm run dev > ../frontend_production.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    sleep 3
    
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"
        echo "🌐 Frontend URL: http://localhost:3000"
    else
        echo "❌ Frontend failed to start. Check frontend_production.log"
    fi
    
    echo ""
    echo "🎉 DentiProject is now running in production mode!"
    echo "🔐 Login with: admin / Homero123"
    echo "🛑 Press Ctrl+C to stop all services"
    
    # Function to cleanup on exit
    cleanup() {
        echo ""
        echo "🛑 Shutting down DentiProject..."
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        echo "👋 Goodbye!"
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    # Keep script running
    while true; do
        sleep 5
        # Check if processes are still running
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            echo "❌ Backend process died"
            break
        fi
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "❌ Frontend process died"
            break
        fi
    done
else
    echo "⚠️  Frontend not started (Node.js not found)"
    echo "🌐 Backend only mode - API available at: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop backend"
    
    # Wait for backend
    wait $BACKEND_PID
fi
EOF

chmod +x start_production.sh
print_status "Created start_production.sh script"

# Create stop script
cat > stop_production.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping DentiProject Production Services..."

# Kill backend
pkill -f "python backend_production.py"
echo "✅ Backend stopped"

# Kill frontend
pkill -f "npm run dev"
echo "✅ Frontend stopped"

echo "👋 All services stopped"
EOF

chmod +x stop_production.sh
print_status "Created stop_production.sh script"

echo ""
print_info "Step 6: Cleaning up old files..."

# Remove old backend files
OLD_FILES=("backend_simple_test.py" "backend_complete.py" "backend_standalone.py" "backend_with_real_data.py")
for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "old_backends/"
        print_status "Moved $file to old_backends/ directory"
    fi
done

# Create old_backends directory if it doesn't exist
mkdir -p old_backends

echo ""
echo "🎉 Production Setup Complete!"
echo "=============================="
print_status "Production backend: backend_production.py"
print_status "Database: MySQL with real schema"
print_status "Authentication: JWT with real user management"
print_status "Environment: Configured with .env file"
print_status "Startup script: ./start_production.sh"

echo ""
print_info "Next steps:"
echo "1. Review and update .env file with your settings"
echo "2. Start the application: ./start_production.sh"
echo "3. Open browser: http://localhost:3000"
echo "4. Login with: admin / Homero123"

echo ""
print_warning "Important for production deployment:"
echo "• Change JWT_SECRET_KEY in .env file"
echo "• Update ALLOWED_ORIGINS for your domain"
echo "• Use HTTPS in production"
echo "• Set up proper database backups"
echo "• Configure firewall rules"

echo ""
print_info "Logs will be saved to:"
echo "• Backend: backend_production.log"
echo "• Frontend: frontend_production.log"
