#!/bin/bash

# Fix database schema by adding missing columns

SERVER_PASS="EfHrx&0P1U3aFb"
SERVER_PORT="5661"
SERVER_HOST="66.97.44.23"

echo "🔧 Fixing Database Schema..."

sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no root@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "📊 Running database migration..."

docker exec -i denti_postgres psql -U denti_user -d consultorio_db << 'EOF'

-- Add missing columns to usuarios table
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_inicio_plan DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role_id INTEGER;

-- Update existing users to have default values
UPDATE usuarios SET 
    onboarding_completado = TRUE,
    email_verificado = TRUE,
    provider = 'local'
WHERE onboarding_completado IS NULL OR email_verificado IS NULL;

-- Verify changes
\d usuarios

EOF

echo ""
echo "✅ Database schema fixed!"
echo ""
echo "🔄 Restarting backend to apply changes..."
docker compose restart backend

echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 10

echo ""
echo "📊 Checking backend status..."
docker compose ps backend

echo ""
echo "📝 Checking backend logs..."
docker compose logs --tail=20 backend

ENDSSH

echo ""
echo "✅ Done! Try importing again."
