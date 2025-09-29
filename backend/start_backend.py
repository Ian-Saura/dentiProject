#!/usr/bin/env python3
"""
Backend Startup Script
Handles dependency installation and server startup
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'sqlalchemy', 
        'pyjwt', 'passlib', 'pymysql'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_dependencies():
    """Install backend dependencies"""
    print("📦 Installing backend dependencies...")
    try:
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', 
            '-r', 'requirements.txt'
        ])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_environment():
    """Set up environment configuration"""
    env_file = Path('.env')
    env_example = Path('env.example')
    
    if not env_file.exists() and env_example.exists():
        print("📋 Creating .env file from example...")
        env_file.write_text(env_example.read_text())
        print("✅ .env file created. Please update database credentials.")
        return True
    elif env_file.exists():
        print("✅ .env file already exists")
        return True
    else:
        print("⚠️  No environment configuration found")
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server...")
    try:
        # Import here to avoid issues if dependencies aren't installed
        import uvicorn
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError:
        print("❌ uvicorn not installed. Installing dependencies first...")
        if install_dependencies():
            import uvicorn
            uvicorn.run(
                "app.main:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info"
            )
        else:
            print("❌ Could not start server due to missing dependencies")
            return False
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False

def main():
    """Main startup function"""
    print("🏥 DentiProject Backend Startup")
    print("=" * 40)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Check if we're in the right directory
    if not Path('app/main.py').exists():
        print("❌ Not in backend directory or app/main.py not found")
        return 1
    
    # Check dependencies
    missing = check_dependencies()
    if missing:
        print(f"📦 Missing packages: {', '.join(missing)}")
        if not install_dependencies():
            return 1
    else:
        print("✅ All dependencies are installed")
    
    # Setup environment
    setup_environment()
    
    # Start server
    print("\n🌐 Backend will be available at:")
    print("   - API: http://localhost:8000")
    print("   - Docs: http://localhost:8000/v1/docs")
    print("   - Health: http://localhost:8000/v1/health")
    print("\n⚠️  Make sure to:")
    print("   1. Update database credentials in .env")
    print("   2. Create the database: consultorio_db")
    print("   3. Run migrations if needed")
    print("\n" + "=" * 40)
    
    start_server()
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
        sys.exit(0)
