#!/usr/bin/env python3
"""
Create or Update Admin User
Creates admin user with secure password
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.usuarios import Usuario
from app.core.security import get_password_hash


def create_or_update_admin(username: str = "admin", password: str = None):
    """Create or update admin user with secure password"""
    
    if not password:
        # Try to get from environment variable
        password = os.getenv("ADMIN_PASSWORD")
        
    if not password:
        print("❌ Error: Password not provided")
        print("\nUsage:")
        print("  ADMIN_PASSWORD='your_password' python backend/create_admin.py")
        print("  or")
        print("  python backend/create_admin.py")
        return 1
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(Usuario).filter(Usuario.username == username).first()
        
        hashed_password = get_password_hash(password)
        
        if not admin:
            # Create new admin user
            admin = Usuario(
                username=username,
                password_hash=hashed_password,
                nombre="Admin",
                apellido="User",
                email="admin@dentiproject.com",
                especialidad="odontologia",
                plan="premium",
                activo=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"✅ Admin user created successfully (ID: {admin.id})")
            print(f"   Username: {username}")
        else:
            # Update existing admin user password
            admin.password_hash = hashed_password
            admin.activo = True
            db.commit()
            print(f"✅ Admin user password updated successfully (ID: {admin.id})")
            print(f"   Username: {username}")
        
        return 0
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    print("\n🔐 Admin User Setup")
    print("=" * 50)
    
    # Check if password is provided as environment variable
    password = os.getenv("ADMIN_PASSWORD")
    
    if not password:
        print("\n⚠️  No ADMIN_PASSWORD environment variable found")
        print("\nPlease provide password:")
        print("  ADMIN_PASSWORD='your_secure_password' python backend/create_admin.py")
        sys.exit(1)
    
    result = create_or_update_admin(password=password)
    
    if result == 0:
        print("\n" + "=" * 50)
        print("✅ Admin setup completed!")
        print("\n🚀 You can now login with:")
        print("   Username: admin")
        print("   Password: [your provided password]")
        print("=" * 50)
    
    sys.exit(result)

