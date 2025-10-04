#!/usr/bin/env python3
"""
Database Initialization Script
Creates tables and adds initial data including admin user
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import get_sync_engine, SessionLocal
from app.db.base import Base
from app.models.usuarios import Usuario
from app.models.prestaciones import Prestacion
from app.core.security import get_password_hash

def create_tables():
    """Create all database tables"""
    print("📋 Creating database tables...")
    engine = get_sync_engine()
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")

def create_admin_user():
    """Create default admin user"""
    print("👤 Creating admin user...")
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        
        if not admin:
            hashed_password = get_password_hash("Homero123")
            admin = Usuario(
                username="admin",
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
            print(f"✅ Admin user created (ID: {admin.id})")
        else:
            print(f"ℹ️  Admin user already exists (ID: {admin.id})")
        
        return admin
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
        raise
    finally:
        db.close()

def create_default_prestaciones():
    """Create default prestaciones (dental services)"""
    print("🦷 Creating default prestaciones...")
    
    db = SessionLocal()
    try:
        # Check if prestaciones exist
        count = db.query(Prestacion).count()
        
        if count == 0:
            prestaciones = [
                Prestacion(
                    codigo="CONS001",
                    nombre="Consulta General",
                    categoria="Consulta",
                    tiempo_estimado_min=30
                ),
                Prestacion(
                    codigo="OPER001",
                    nombre="Operatoria Simple",
                    categoria="Operatoria",
                    tiempo_estimado_min=45
                ),
                Prestacion(
                    codigo="ENDO001",
                    nombre="Endodoncia Unirradicular",
                    categoria="Endodoncia",
                    tiempo_estimado_min=90
                ),
                Prestacion(
                    codigo="EXTR001",
                    nombre="Extracción Simple",
                    categoria="Cirugía",
                    tiempo_estimado_min=30
                ),
                Prestacion(
                    codigo="LMPP001",
                    nombre="Limpieza Profiláctica",
                    categoria="Prevención",
                    tiempo_estimado_min=40
                ),
            ]
            
            for prestacion in prestaciones:
                db.add(prestacion)
            
            db.commit()
            print(f"✅ Created {len(prestaciones)} default prestaciones")
        else:
            print(f"ℹ️  Prestaciones already exist ({count} found)")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating prestaciones: {e}")
        raise
    finally:
        db.close()

def main():
    """Main initialization function"""
    print("\n🦷 DentiProject Database Initialization")
    print("=" * 50)
    
    try:
        # Create tables
        create_tables()
        
        # Create admin user
        admin = create_admin_user()
        
        # Create default prestaciones
        create_default_prestaciones()
        
        print("\n" + "=" * 50)
        print("✅ Database initialized successfully!")
        print("\n🔐 Admin Credentials:")
        print("   Username: admin")
        print("   Password: Homero123")
        print("\n📊 Next steps:")
        print("   1. Run: python populate_db.py (optional - adds sample data)")
        print("   2. Start backend: uvicorn app.main:app --reload")
        print("=" * 50)
        
        return 0
    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())

