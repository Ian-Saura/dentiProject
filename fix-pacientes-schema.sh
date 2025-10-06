#!/bin/bash

# Fix pacientes table schema by adding missing columns

SERVER_PASS="EfHrx&0P1U3aFb"
SERVER_PORT="5661"
SERVER_HOST="66.97.44.23"

echo "🔧 Fixing Pacientes Table Schema..."

sshpass -p "$SERVER_PASS" ssh -p $SERVER_PORT -o StrictHostKeyChecking=no root@$SERVER_HOST << 'ENDSSH'
cd /root/dentiProject

echo "📊 Adding missing columns to pacientes table..."

docker exec -i denti_postgres psql -U denti_user -d consultorio_db << 'EOF'

-- Add missing columns to pacientes table
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(200);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS alergias VARCHAR(1000);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medicamentos_actuales VARCHAR(1000);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS observaciones_medicas VARCHAR(1000);

-- Verify schema
\d pacientes

EOF

echo ""
echo "✅ Pacientes schema fixed!"
echo ""
echo "🔄 Restarting backend to apply changes..."
docker compose restart backend

echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 10

echo ""
echo "📊 Checking backend status..."
docker compose logs --tail=20 backend

ENDSSH

echo ""
echo "✅ Done! Try the app again at http://66.97.44.23"
