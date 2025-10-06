"""
Migration script to add missing columns to usuarios table
"""
import psycopg2
from psycopg2 import sql

# Database connection details
DB_CONFIG = {
    'host': 'localhost',  # or 'db' if running inside Docker
    'port': 5432,
    'database': 'consultorio_db',
    'user': 'denti_user',
    'password': 'denti_pass'
}

def add_missing_columns():
    """Add missing columns to usuarios table"""
    conn = None
    try:
        # Connect to database
        print("🔌 Conectando a la base de datos...")
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("📋 Verificando columnas existentes...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='usuarios'
        """)
        existing_columns = [row[0] for row in cur.fetchall()]
        print(f"   Columnas existentes: {len(existing_columns)}")
        
        # List of columns to add
        migrations = [
            ("fecha_inicio_plan", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_inicio_plan DATE"),
            ("google_id", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE"),
            ("avatar_url", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)"),
            ("provider", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS provider VARCHAR(50)"),
            ("onboarding_completado", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN DEFAULT FALSE"),
            ("email_verificado", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE"),
            ("role_id", "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL"),
        ]
        
        print("\n🔧 Agregando columnas faltantes...")
        for column_name, sql_query in migrations:
            if column_name not in existing_columns:
                print(f"   ➕ Agregando columna: {column_name}")
                cur.execute(sql_query)
            else:
                print(f"   ✅ Columna ya existe: {column_name}")
        
        # Commit changes
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        
        # Verify
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='usuarios'
            ORDER BY ordinal_position
        """)
        final_columns = [row[0] for row in cur.fetchall()]
        print(f"\n📊 Total de columnas después de migración: {len(final_columns)}")
        print(f"   Columnas: {', '.join(final_columns)}")
        
    except psycopg2.Error as e:
        print(f"\n❌ Error en la base de datos: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            cur.close()
            conn.close()
            print("\n🔌 Conexión cerrada")

if __name__ == "__main__":
    print("🚀 Iniciando migración de esquema de base de datos\n")
    print("=" * 60)
    add_missing_columns()
    print("=" * 60)
    print("\n🎉 ¡Listo! La base de datos está actualizada.")
