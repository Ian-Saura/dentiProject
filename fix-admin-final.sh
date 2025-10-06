#!/bin/bash

# Final fix for admin login

SERVER_PASS="EfHrx&0P1U3aFb"
SERVER_PORT="5661"
SERVER_HOST="66.97.44.23"

echo "🔐 Creating Admin User (Final Fix)..."

sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no root@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "🐍 Running Python script in container..."
docker exec denti_backend python3 << 'PYTHON_EOF'
from app.db.session import SessionLocal
from app.models.usuarios import Usuario
from app.core.security import get_password_hash

# Create database session
db = SessionLocal()

try:
    # Delete existing admin
    db.query(Usuario).filter(Usuario.username == "admin").delete()
    db.commit()
    print("🗑️  Deleted old admin user")
    
    # Create new admin with proper password hash
    admin = Usuario(
        username="admin",
        password_hash=get_password_hash("admin"),
        nombre="Admin",
        apellido="Sistema",
        email="admin@dentiproject.com",
        telefono=None,
        especialidad="odontologia",
        plan="premium",
        activo=True,
        onboarding_completado=True,
        email_verificado=True,
        provider="local"
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    print(f"✅ Admin created successfully!")
    print(f"   ID: {admin.id}")
    print(f"   Username: {admin.username}")
    print(f"   Email: {admin.email}")
    print(f"   Active: {admin.activo}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()

PYTHON_EOF

echo ""
echo "🧪 Testing login..."
sleep 2
curl -s -X POST http://localhost:8000/v1/auth/login \
  -F 'username=admin' \
  -F 'password=admin' | head -50

ENDSSH

echo ""
echo "✅ Done! Login at: http://66.97.44.23"
echo "   Username: admin"
echo "   Password: admin"
