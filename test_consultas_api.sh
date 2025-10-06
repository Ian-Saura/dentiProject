#!/bin/bash

echo "🧪 Testing Consultas API with Patient/Treatment Names"
echo "======================================================="
echo ""

# Login and get token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://manny.com.ar/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Fetch consultas
echo "2. Fetching consultas..."
CONSULTAS_RESPONSE=$(curl -s -X GET "http://manny.com.ar/v1/consultas/?limit=3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "Raw response:"
echo "$CONSULTAS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CONSULTAS_RESPONSE"

echo ""
echo "3. Checking for patient and treatment names..."

# Check if paciente.nombre exists
if echo "$CONSULTAS_RESPONSE" | grep -q '"paciente"'; then
  echo "✅ 'paciente' field found!"
  
  if echo "$CONSULTAS_RESPONSE" | grep -q '"nombre"'; then
    echo "✅ Patient names are being returned!"
  else
    echo "❌ Patient names are missing!"
  fi
else
  echo "❌ 'paciente' field not found!"
fi

# Check if prestacion_usuario exists
if echo "$CONSULTAS_RESPONSE" | grep -q '"prestacion_usuario"'; then
  echo "✅ 'prestacion_usuario' field found!"
  
  if echo "$CONSULTAS_RESPONSE" | grep -q '"nombre_personalizado"'; then
    echo "✅ Treatment names are being returned!"
  else
    echo "❌ Treatment names are missing!"
  fi
else
  echo "❌ 'prestacion_usuario' field not found!"
fi

echo ""
echo "======================================================="
