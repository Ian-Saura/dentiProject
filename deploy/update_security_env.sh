#!/bin/bash

# Script para actualizar variables de entorno de seguridad
echo "🔒 Actualizando variables de seguridad..."

# Generar JWT secret fuerte
JWT_SECRET="Itm7scZzCsgNN-N0_tY8lV1nrGjv0Bl0GM7gRyt4qWaF6A7_If0_S_vt7lTNRv6HEFYJnCWcncUSG0kW0LGXvg"

# CORS origins correctos (solo tu dominio)
CORS_ORIGINS="https://manny.com.ar,https://www.manny.com.ar"

# Actualizar docker-compose.yml
cd /root/dentiproject

# Backup del archivo original
cp docker-compose.yml docker-compose.yml.backup

# Actualizar JWT_SECRET_KEY
sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${JWT_SECRET}|g" docker-compose.yml

# Actualizar CORS_ORIGINS
sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=${CORS_ORIGINS}|g" docker-compose.yml

echo "✅ Variables de seguridad actualizadas"
echo "📝 Reiniciando backend para aplicar cambios..."

# Reiniciar solo el backend
docker-compose up -d --no-deps --build backend

echo "⏳ Esperando a que el backend esté listo..."
sleep 10

# Verificar que esté corriendo
docker ps --format "table {{.Names}}\t{{.Status}}" | grep backend

echo "✅ Backend actualizado con nuevas configuraciones de seguridad"

