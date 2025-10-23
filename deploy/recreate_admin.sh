#!/bin/bash

echo "🔐 Recreating admin user with backend's password hasher..."

ssh -p 5661 root@66.97.44.23 << 'ENDSSH'
cd /root/dentiproject

docker exec -i denti_backend python3 << 'EOPY'
import sys
sys.path.insert(0, '/app')

from app.core.security import get_password_hash, verify_password
import psycopg2

password = "admin"

print("🔐 Hashing password using backend's method...")
try:
    password_hash = get_password_hash(password)
    print(f"✅ Password hashed successfully (length: {len(password_hash)})")
    
    # Test that it can be verified
    if verify_password(password, password_hash):
        print("✅ Password verification works!")
    else:
        print("⚠️  Password verification failed!")
        sys.exit(1)
    
except Exception as e:
    print(f"❌ Error hashing password: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n📊 Connecting to database...")
try:
    conn = psycopg2.connect(
        host="denti_postgres",
        database="consultorio_db",
        user="denti_user",
        password="denti_pass"
    )
    cur = conn.cursor()
    
    # Check if admin exists
    cur.execute("SELECT id FROM usuarios WHERE username = 'admin'")
    admin = cur.fetchone()
    
    if admin:
        print(f"👤 Updating existing admin (ID: {admin[0]})...")
        cur.execute("""
            UPDATE usuarios 
            SET password_hash = %s, activo = true, plan = 'premium'
            WHERE username = 'admin'
        """, (password_hash,))
        print("✅ Admin password updated!")
    else:
        print("👤 Creating new admin user...")
        cur.execute("""
            INSERT INTO usuarios (username, password_hash, nombre, apellido, email, 
                                especialidad, plan, activo, fecha_registro)
            VALUES ('admin', %s, 'Admin', 'System', 'admin@manny.com.ar',
                   'odontologia', 'premium', true, NOW())
        """, (password_hash,))
        print("✅ Admin user created!")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ SUCCESS!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("")
    print("👤 Login credentials:")
    print("   Username: admin")
    print("   Password: admin")
    print("")
    
except Exception as e:
    print(f"❌ Database error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
EOPY

ENDSSH

echo ""
echo "✅ Done! Try logging in now at https://manny.com.ar"




