#!/bin/bash

# Test de funcionalidades críticas reportadas por el usuario
# Date: 2025-10-04

set -e

BASE_URL="http://localhost:8000"
TOKEN=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      🧪 TEST DE FUNCIONALIDADES CRÍTICAS                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Login
echo "1️⃣  Autenticando..."
login_response=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=EfHrx%260P1U3aFb")

TOKEN=$(echo "$login_response" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ FAIL - No se pudo autenticar${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Autenticado correctamente${NC}"
echo ""

# Test 1: Configuración (reportó 2 errores)
echo "2️⃣  Testeando Configuración..."
config_response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/v1/configuracion/" \
    -H "Authorization: Bearer $TOKEN")
if [ "$config_response" -eq 200 ]; then
    echo -e "${GREEN}✓ Configuración OK${NC}"
else
    echo -e "${RED}✗ Configuración FAIL (HTTP $config_response)${NC}"
fi
echo ""

# Test 2: Gastos Fijos - Crear
echo "3️⃣  Testeando Gastos Fijos..."
gastos_list=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/v1/gastos/" \
    -H "Authorization: Bearer $TOKEN")
if [ "$gastos_list" -eq 200 ]; then
    echo -e "${GREEN}✓ Listar gastos OK${NC}"
else
    echo -e "${RED}✗ Listar gastos FAIL (HTTP $gastos_list)${NC}"
fi

gasto_create=$(curl -s -X POST "$BASE_URL/v1/gastos/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Test Alquiler","monto_mensual_ars":50000,"categoria":"alquiler","activo":true}')
gasto_id=$(echo "$gasto_create" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
if [ -n "$gasto_id" ]; then
    echo -e "${GREEN}✓ Crear gasto OK (ID: $gasto_id)${NC}"
else
    echo -e "${RED}✗ Crear gasto FAIL${NC}"
fi
echo ""

# Test 3: Costos Equipos - Crear
echo "4️⃣  Testeando Costos Equipos..."
equipos_list=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/v1/equipos/" \
    -H "Authorization: Bearer $TOKEN")
if [ "$equipos_list" -eq 200 ]; then
    echo -e "${GREEN}✓ Listar equipos OK${NC}"
else
    echo -e "${RED}✗ Listar equipos FAIL (HTTP $equipos_list)${NC}"
fi

equipo_create=$(curl -s -X POST "$BASE_URL/v1/equipos/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Equipo Test","costo_compra_ars":100000,"vida_util_meses":60}')
equipo_id=$(echo "$equipo_create" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
if [ -n "$equipo_id" ]; then
    echo -e "${GREEN}✓ Crear equipo OK (ID: $equipo_id)${NC}"
else
    echo -e "${RED}✗ Crear equipo FAIL${NC}"
fi
echo ""

# Test 4: Reportes
echo "5️⃣  Testeando Reportes..."
costos_response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/v1/costos/analisis" \
    -H "Authorization: Bearer $TOKEN")
if [ "$costos_response" -eq 200 ]; then
    echo -e "${GREEN}✓ Análisis de costos OK${NC}"
else
    echo -e "${RED}✗ Análisis de costos FAIL (HTTP $costos_response)${NC}"
fi

config_costo=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/v1/configuracion/" \
    -H "Authorization: Bearer $TOKEN")
if [ "$config_costo" -eq 200 ]; then
    echo -e "${GREEN}✓ Configuración de costos OK${NC}"
else
    echo -e "${RED}✗ Configuración de costos FAIL (HTTP $config_costo)${NC}"
fi
echo ""

# Test 5: Pacientes - Listar y Crear
echo "6️⃣  Testeando Pacientes..."
pacientes_list=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/v1/pacientes/" \
    -H "Authorization: Bearer $TOKEN")
if [ "$pacientes_list" -eq 200 ]; then
    echo -e "${GREEN}✓ Listar pacientes OK${NC}"
else
    echo -e "${RED}✗ Listar pacientes FAIL (HTTP $pacientes_list)${NC}"
fi

paciente_create=$(curl -s -X POST "$BASE_URL/v1/pacientes/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Juan","apellido":"Pérez","dni":"30123456"}')
paciente_id=$(echo "$paciente_create" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
if [ -n "$paciente_id" ]; then
    echo -e "${GREEN}✓ Crear paciente OK (ID: $paciente_id)${NC}"
else
    echo -e "${RED}✗ Crear paciente FAIL${NC}"
    echo "Response: $paciente_create"
fi
echo ""

# Test 6: Consultas - Crear
echo "7️⃣  Testeando Consultas..."
# First, get a prestacion_usuario_id
prestaciones=$(curl -s -X GET "$BASE_URL/v1/prestaciones-usuario/" \
    -H "Authorization: Bearer $TOKEN")
prestacion_id=$(echo "$prestaciones" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if len(data)>0 else '')" 2>/dev/null || echo "")

if [ -n "$prestacion_id" ] && [ -n "$paciente_id" ]; then
    consulta_create=$(curl -s -X POST "$BASE_URL/v1/consultas/" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"paciente_id\":$paciente_id,\"prestacion_usuario_id\":$prestacion_id,\"monto_ars\":5000,\"medio_pago\":\"efectivo\"}")
    consulta_id=$(echo "$consulta_create" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
    if [ -n "$consulta_id" ]; then
        echo -e "${GREEN}✓ Crear consulta OK (ID: $consulta_id)${NC}"
    else
        echo -e "${RED}✗ Crear consulta FAIL${NC}"
        echo "Response: $consulta_create"
    fi
else
    echo -e "${RED}✗ No se pudo crear consulta (falta paciente o prestación)${NC}"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ TESTS COMPLETADOS                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"







