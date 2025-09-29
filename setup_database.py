#!/usr/bin/env python3
"""
Database setup script for DentiProject
Creates database, tables, and initial data
"""
import os
import hashlib
from datetime import datetime, date
import mysql.connector
from mysql.connector import Error
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models
from backend_production import Base, Usuario, Prestacion, PrestacionUsuario, ConfiguracionUsuario

def simple_hash(password: str) -> str:
    """Simple SHA256 hash for compatibility"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_database():
    """Create the MySQL database if it doesn't exist"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        
        cursor = connection.cursor()
        
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS consultorio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print("✅ Database 'consultorio_db' created or already exists")
        
        cursor.close()
        connection.close()
        
    except Error as e:
        print(f"❌ Error creating database: {e}")
        return False
    
    return True

def setup_tables_and_data():
    """Create tables and insert initial data"""
    try:
        # Database URL
        DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/consultorio_db")
        
        # Create engine and session
        engine = create_engine(DATABASE_URL, echo=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully")
        
        # Create session
        db = SessionLocal()
        
        try:
            # Check if admin user already exists
            existing_admin = db.query(Usuario).filter(Usuario.username == "admin").first()
            if existing_admin:
                print("✅ Admin user already exists")
            else:
                # Create admin user
                admin_user = Usuario(
                    username="admin",
                    password_hash=simple_hash("Homero123"),
                    nombre="Dr. Administrador",
                    apellido="Sistema",
                    email="admin@dentiproject.com",
                    telefono="3624-555000",
                    especialidad="odontologia",
                    plan="premium",
                    activo=True
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                print("✅ Admin user created: admin / Homero123")
                
                # Create default configuration for admin
                config = ConfiguracionUsuario(
                    usuario_id=admin_user.id,
                    costo_hora_manual_ars=29000,
                    usar_costo_manual=False,
                    horas_anuales_trabajadas=1100
                )
                db.add(config)
                db.commit()
                print("✅ Default configuration created for admin user")
            
            # Check if basic prestaciones exist
            existing_prestaciones = db.query(Prestacion).count()
            if existing_prestaciones == 0:
                # Create basic prestaciones
                prestaciones_basicas = [
                    Prestacion(
                        codigo="CONS001",
                        nombre="Consulta Odontológica",
                        categoria="diagnostico",
                        subcategoria="inicial",
                        tiempo_estimado_min=30,
                        complejidad="baja",
                        requiere_anestesia=False,
                        requiere_radiografia=False
                    ),
                    Prestacion(
                        codigo="OPER001",
                        nombre="Operatoria Simple",
                        categoria="operatoria",
                        subcategoria="una_cara",
                        tiempo_estimado_min=60,
                        complejidad="media",
                        requiere_anestesia=True,
                        requiere_radiografia=False
                    ),
                    Prestacion(
                        codigo="ENDO001",
                        nombre="Endodoncia",
                        categoria="endodoncia",
                        subcategoria="unirradicular",
                        tiempo_estimado_min=180,
                        complejidad="alta",
                        requiere_anestesia=True,
                        requiere_radiografia=True
                    ),
                    Prestacion(
                        codigo="PREV001",
                        nombre="Limpieza",
                        categoria="prevencion",
                        subcategoria="basica",
                        tiempo_estimado_min=45,
                        complejidad="baja",
                        requiere_anestesia=False,
                        requiere_radiografia=False
                    ),
                    Prestacion(
                        codigo="CIRU001",
                        nombre="Extracción Simple",
                        categoria="cirugia",
                        subcategoria="simple",
                        tiempo_estimado_min=30,
                        complejidad="media",
                        requiere_anestesia=True,
                        requiere_radiografia=False
                    )
                ]
                
                for prestacion in prestaciones_basicas:
                    db.add(prestacion)
                
                db.commit()
                print("✅ Basic prestaciones created")
                
                # Create prestaciones_usuario for admin
                admin_user = db.query(Usuario).filter(Usuario.username == "admin").first()
                if admin_user:
                    prestaciones_usuario = [
                        PrestacionUsuario(
                            usuario_id=admin_user.id,
                            prestacion_id=1,  # Consulta
                            nombre_personalizado="Consulta General",
                            tiempo_personal_min=30,
                            margen_ganancia_porcentaje=40.00
                        ),
                        PrestacionUsuario(
                            usuario_id=admin_user.id,
                            prestacion_id=2,  # Operatoria
                            nombre_personalizado="Operatoria",
                            tiempo_personal_min=60,
                            margen_ganancia_porcentaje=50.00
                        ),
                        PrestacionUsuario(
                            usuario_id=admin_user.id,
                            prestacion_id=3,  # Endodoncia
                            nombre_personalizado="Endodoncia",
                            tiempo_personal_min=180,
                            margen_ganancia_porcentaje=60.00
                        ),
                        PrestacionUsuario(
                            usuario_id=admin_user.id,
                            prestacion_id=4,  # Limpieza
                            nombre_personalizado="Limpieza",
                            tiempo_personal_min=45,
                            margen_ganancia_porcentaje=45.00
                        )
                    ]
                    
                    for pu in prestaciones_usuario:
                        db.add(pu)
                    
                    db.commit()
                    print("✅ Prestaciones usuario created for admin")
            
            print("✅ Database setup completed successfully!")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error setting up tables and data: {e}")
        return False
    
    return True

def main():
    """Main setup function"""
    print("🚀 Setting up DentiProject Production Database...")
    print("=" * 50)
    
    # Step 1: Create database
    print("Step 1: Creating database...")
    if not create_database():
        print("❌ Failed to create database. Exiting.")
        return
    
    # Step 2: Create tables and initial data
    print("\nStep 2: Creating tables and initial data...")
    if not setup_tables_and_data():
        print("❌ Failed to setup tables and data. Exiting.")
        return
    
    print("\n" + "=" * 50)
    print("🎉 Database setup completed successfully!")
    print("\n📋 What was created:")
    print("   • Database: consultorio_db")
    print("   • All tables from tablas_app.sql schema")
    print("   • Admin user: admin / Homero123")
    print("   • Basic prestaciones (treatments)")
    print("   • Default configuration")
    print("\n🚀 You can now start the production backend:")
    print("   python backend_production.py")
    print("\n🌐 Frontend will connect to: http://localhost:8000")

if __name__ == "__main__":
    main()
