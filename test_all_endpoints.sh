#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      🧪 TEST COMPLETO DE TODOS LOS ENDPOINTS                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"

BASE_URL="http://localhost:8000/v1"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="EfHrx&0P1U3aFb"
TOKEN=""
ERRORS=0
TOTAL_TESTS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function
test_endpoint() {
    local METHOD=$1
    local ENDPOINT=$2
    local DATA=$3
    local EXPECTED_STATUS=$4
    local TEST_NAME=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -z "$DATA" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "${BASE_URL}${ENDPOINT}" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $METHOD "${BASE_URL}${ENDPOINT}" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$DATA")
    fi
    
    STATUS=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$STATUS" == "$EXPECTED_STATUS" ]; then
        echo -e "${GREEN}✓${NC} $TEST_NAME (HTTP $STATUS)"
        return 0
    else
        echo -e "${RED}✗${NC} $TEST_NAME (Expected $EXPECTED_STATUS, got $STATUS)"
        echo "   Response: $(echo $BODY | head -c 100)"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# 1. AUTHENTICATION
echo -e "\n${YELLOW}═══ 1. AUTHENTICATION ═══${NC}"
AUTH_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${ADMIN_USERNAME}&password=EfHrx%260P1U3aFb")

if echo "$AUTH_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$AUTH_RESPONSE" | python3 -c 'import sys, json; print(json.load(sys.stdin)["access_token"])')
    echo -e "${GREEN}✓${NC} Login exitoso"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗${NC} Login falló"
    echo "$AUTH_RESPONSE"
    ERRORS=$((ERRORS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    exit 1
fi

# 2. HEALTH CHECK
echo -e "\n${YELLOW}═══ 2. HEALTH CHECK ═══${NC}"
test_endpoint "GET" "/health" "" "200" "Health check"

# 3. USER ENDPOINTS
echo -e "\n${YELLOW}═══ 3. USER ENDPOINTS ═══${NC}"
test_endpoint "GET" "/auth/me" "" "200" "Get current user"
test_endpoint "GET" "/auth/me/plan-status" "" "200" "Get plan status"

# 4. ADMIN ENDPOINTS
echo -e "\n${YELLOW}═══ 4. ADMIN ENDPOINTS ═══${NC}"
test_endpoint "GET" "/admin/users" "" "200" "List users"
test_endpoint "GET" "/admin/roles" "" "200" "List roles"
test_endpoint "GET" "/admin/stats" "" "200" "Get stats"

# 5. PACIENTES
echo -e "\n${YELLOW}═══ 5. PACIENTES ═══${NC}"
test_endpoint "GET" "/pacientes/" "" "200" "List pacientes"
RANDOM_DNI=$((40000000 + RANDOM % 10000000))
PACIENTE_DATA="{\"nombre\":\"Test\",\"apellido\":\"Usuario\",\"dni\":\"$RANDOM_DNI\",\"telefono\":\"1234567890\",\"email\":\"test$RANDOM_DNI@test.com\",\"fecha_nacimiento\":\"1990-01-01\"}"
test_endpoint "POST" "/pacientes/" "$PACIENTE_DATA" "200" "Create paciente"

# 6. CONSULTAS
echo -e "\n${YELLOW}═══ 6. CONSULTAS ═══${NC}"
test_endpoint "GET" "/consultas/" "" "200" "List consultas"

# 7. GASTOS FIJOS
echo -e "\n${YELLOW}═══ 7. GASTOS FIJOS ═══${NC}"
test_endpoint "GET" "/gastos/" "" "200" "List gastos"
GASTO_DATA='{"concepto":"Luz","monto_mensual_ars":10000}'
test_endpoint "POST" "/gastos/" "$GASTO_DATA" "200" "Create gasto"

# 8. EQUIPOS
echo -e "\n${YELLOW}═══ 8. EQUIPOS ═══${NC}"
test_endpoint "GET" "/equipos/" "" "200" "List equipos"
EQUIPO_DATA='{"nombre_equipo":"Autoclave","monto_compra_usd":5000,"anios_vida_util":10,"fecha_compra":"2024-01-01"}'
test_endpoint "POST" "/equipos/" "$EQUIPO_DATA" "200" "Create equipo"

# 9. PRESTACIONES
echo -e "\n${YELLOW}═══ 9. PRESTACIONES ═══${NC}"
test_endpoint "GET" "/prestaciones/" "" "200" "List prestaciones"
test_endpoint "GET" "/prestaciones-usuario/" "" "200" "List prestaciones usuario"

# 10. INSUMOS
echo -e "\n${YELLOW}═══ 10. INSUMOS ═══${NC}"
test_endpoint "GET" "/insumos-basicos/" "" "200" "List insumos"

# 11. COMPRAS
echo -e "\n${YELLOW}═══ 11. COMPRAS ═══${NC}"
test_endpoint "GET" "/compras/" "" "200" "List compras"

# 12. CONFIGURACION
echo -e "\n${YELLOW}═══ 12. CONFIGURACION ═══${NC}"
test_endpoint "GET" "/configuracion/" "" "200" "Get configuracion"

# 13. ANALYTICS
echo -e "\n${YELLOW}═══ 13. ANALYTICS ═══${NC}"
test_endpoint "GET" "/analytics/resumen" "" "200" "Analytics resumen"
test_endpoint "GET" "/analytics/kpis" "" "200" "Analytics KPIs"

# 14. COSTOS
echo -e "\n${YELLOW}═══ 14. COSTOS ═══${NC}"
test_endpoint "GET" "/costos/analisis" "" "200" "Análisis de costos"

# 15. CALCULADORA  
echo -e "\n${YELLOW}═══ 15. CALCULADORA ═══${NC}"
test_endpoint "POST" "/calculadora/recomendaciones?tiempo_horas=2&costo_materiales_ars=5000&usar_costo_real=false" "" "200" "Calculadora de precios"

# SUMMARY
echo -e "\n╔══════════════════════════════════════════════════════════════╗"
echo -e "║                    📊 RESUMEN DE TESTS                        ║"
echo -e "╚══════════════════════════════════════════════════════════════╝"
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Exitosos: $((TOTAL_TESTS - ERRORS))${NC}"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Fallidos: $ERRORS${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Todos los tests pasaron${NC}"
    exit 0
fi
