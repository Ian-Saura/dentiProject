#!/usr/bin/env python3
"""
Script para verificar y recrear el usuario admin en producción
"""
from app.db.session import SessionLocal
from app.models import Usuario, Role
from app.core.security import get_password_hash
from sqlalchemy import text

def fix_admin():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(Usuario).filter(Usuario.username == "admin_manny").first()
        
        if admin:
            print(f"✅ Usuario encontrado: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   ID: {admin.id}")
            
            # Update password
            new_password = "MannyAdmin2025!"
            admin.hashed_password = get_password_hash(new_password)
            
            # Set active if attribute exists
            if hasattr(admin, 'is_active'):
                admin.is_active = True
            if hasattr(admin, 'activo'):
                admin.activo = True
                
            db.commit()
            print(f"\n✅ Contraseña actualizada para admin_manny")
            print(f"   Username: admin_manny")
            print(f"   Password: {new_password}")
        else:
            print("❌ Usuario admin_manny NO encontrado")
            print("\n🔧 Creando usuario admin...")
            
            # Get admin role
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if not admin_role:
                print("❌ Rol admin no encontrado. Creando roles...")
                # Create roles
                admin_role = Role(name="admin", description="Administrator")
                db.add(admin_role)
                db.commit()
                db.refresh(admin_role)
            
            # Create admin user
            new_admin_data = {
                "username": "admin_manny",
                "email": "admin@manny.com.ar",
                "nombre": "Admin",
                "apellido": "Manny",
                "hashed_password": get_password_hash("MannyAdmin2025!"),
                "role_id": admin_role.id,
                "especialidad": "odontologia"
            }
            
            # Add is_active or activo based on model
            try:
                new_admin = Usuario(**new_admin_data, is_active=True)
            except TypeError:
                try:
                    new_admin = Usuario(**new_admin_data, activo=True)
                except TypeError:
                    new_admin = Usuario(**new_admin_data)
            
            db.add(new_admin)
            db.commit()
            print(f"\n✅ Usuario admin creado exitosamente")
            print(f"   Username: admin_manny")
            print(f"   Password: MannyAdmin2025!")
            print(f"   Email: admin@manny.com.ar")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin()

