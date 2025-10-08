#!/usr/bin/env python3
"""
Script para resetear la base de datos en el servidor cloud
ADVERTENCIA: Esto eliminará TODOS los datos existentes
"""

import sys
from sqlalchemy import create_engine, text
from app.db.base import Base
from app.core.config import get_settings

def reset_database():
    """Resetea completamente la base de datos"""
    settings = get_settings()
    
    print("🔥 ==========================================")
    print("🔥 RESET DE BASE DE DATOS")
    print("🔥 ==========================================")
    print()
    print("⚠️  ADVERTENCIA: Esto eliminará TODOS los datos")
    print(f"📊 Base de datos: {settings.database_url}")
    print()
    
    # Confirmación
    confirm = input("¿Estás seguro? Escribe 'RESET' para confirmar: ")
    if confirm != "RESET":
        print("❌ Operación cancelada")
        sys.exit(0)
    
    print()
    print("🔄 Conectando a la base de datos...")
    
    try:
        engine = create_engine(settings.database_url)
        
        # Eliminar todas las tablas
        print("🗑️  Eliminando todas las tablas...")
        Base.metadata.drop_all(bind=engine)
        print("✅ Tablas eliminadas")
        
        # Crear todas las tablas nuevamente
        print("🏗️  Creando tablas nuevas...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas")
        
        # Verificar tablas creadas
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            
            print()
            print(f"📋 Tablas creadas ({len(tables)}):")
            for table in tables:
                print(f"   ✓ {table}")
        
        print()
        print("✅ ==========================================")
        print("✅ BASE DE DATOS RESETEADA EXITOSAMENTE")
        print("✅ ==========================================")
        print()
        print("📝 Próximos pasos:")
        print("   1. Crear usuario administrador")
        print("   2. Configurar datos iniciales")
        print("   3. Importar datos si es necesario")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_database()
