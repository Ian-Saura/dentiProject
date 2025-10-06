#!/bin/bash

# Fix login issues by recreating admin user

SERVER_PASS="EfHrx&0P1U3aFb"
SERVER_PORT="5661"
SERVER_HOST="66.97.44.23"

echo "🔧 Fixing Login Issues..."

sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no root@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "📊 Checking current users..."
docker exec -i denti_postgres psql -U denti_user -d consultorio_db << 'EOF'
SELECT id, username, nombre, email, especialidad, activo FROM usuarios;
EOF

echo ""
echo "🔑 Recreating admin user with correct password..."
docker exec -i denti_postgres psql -U denti_user -d consultorio_db << 'EOF'

-- Delete existing admin if exists
DELETE FROM usuarios WHERE username = 'admin';

-- Create admin user with bcrypt hashed password "admin"
-- This is the hash for "admin" using bcrypt
INSERT INTO usuarios (
    username, 
    password_hash, 
    nombre, 
    apellido,
    email, 
    especialidad, 
    plan, 
    activo,
    onboarding_completado,
    email_verificado,
    provider
) VALUES (
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5RA7W2rqR2DSu',  -- password: admin
    'Administrador',
    'Sistema',
    'admin@dentiproject.com',
    'odontologia',
    'premium',
    TRUE,
    TRUE,
    TRUE,
    'local'
);

-- Verify
SELECT id, username, nombre, email, activo, 
       CASE WHEN password_hash IS NOT NULL THEN 'SET' ELSE 'NULL' END as password_status
FROM usuarios WHERE username = 'admin';

EOF

echo ""
echo "✅ Admin user recreated!"
echo ""
echo "🔑 Login credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "🔄 Restarting backend..."
docker compose restart backend

echo ""
echo "⏳ Waiting for backend..."
sleep 10

echo ""
echo "🧪 Testing login endpoint..."
curl -s -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | head -20

ENDSSH

echo ""
echo "✅ Done! Try logging in with:"
echo "   Username: admin"
echo "   Password: admin"
