# 🚀 Guía de Deploy - DentiProject

## 📋 Pre-requisitos

- Servidor con Docker y Docker Compose instalados
- Dominio configurado (o IP pública)
- Credenciales de Twilio para notificaciones

## 🔐 Variables de Entorno Requeridas

### En el servidor, crear archivo `.env` con:

```bash
# Twilio Configuration (para notificaciones por WhatsApp)
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

## 📝 Pasos para Deploy

### 1. Clonar el repositorio

```bash
git clone https://github.com/Ian-Saura/dentiProject.git
cd dentiProject
git checkout feat/new-architecture
```

### 2. Configurar variables de entorno

```bash
# Copiar y editar el archivo .env
cp .env.example .env
nano .env

# Agregar tus credenciales de Twilio y Google
```

### 3. Configurar dominio (si aplica)

Editar `nginx.conf` y actualizar `server_name` con tu dominio.

### 4. Levantar servicios

```bash
# Desarrollo local
docker-compose up -d

# Producción (usando docker-compose.prod.yml si existe)
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. Verificar servicios

```bash
docker ps
docker logs denti_backend
docker logs denti_frontend
```

### 6. Configurar Cron Job para recordatorios automáticos

```bash
# Editar crontab
crontab -e

# Agregar esta línea para enviar recordatorios a las 9 AM
0 9 * * * docker exec denti_backend python -m app.jobs.enviar_recordatorios_diarios >> /var/log/recordatorios.log 2>&1
```

## 🔍 Verificación

### Backend
```bash
curl http://localhost:8000/v1/health
# Debería responder: {"status":"ok"}
```

### Frontend
```bash
curl http://localhost:3000
# Debería devolver el HTML de la app
```

### Twilio (crear un turno de prueba)
- Ve a http://tu-dominio.com/operational/turnos
- Crea un turno con un número de WhatsApp válido
- Verifica que llegue el mensaje de confirmación

## 📱 Configurar WhatsApp Business (Producción)

### Si usas Twilio Sandbox (desarrollo):
- Los números deben enviar "join <palabra>" al +1 415 523 8886 primero

### Para producción (recomendado):
1. Registrar un número real en Twilio
2. Configurar WhatsApp Business API
3. Actualizar `TWILIO_WHATSAPP_FROM` con tu número
4. Enviar templates para aprobación de WhatsApp

## 🔧 Troubleshooting

### Backend no arranca
```bash
docker logs denti_backend --tail 100
```

### Base de datos no conecta
```bash
docker logs denti_postgres --tail 50
```

### Mensajes de WhatsApp no llegan
```bash
# Ver logs de Twilio
docker logs denti_backend | grep -i twilio

# Verificar variables de entorno
docker exec denti_backend env | grep TWILIO
```

## 🔄 Actualizar

```bash
git pull origin feat/new-architecture
docker-compose down
docker-compose up -d --build
```

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker logs -f denti_backend
docker logs -f denti_frontend
docker logs -f denti_postgres
```

---

## 🎯 Características Implementadas

✅ Sistema de gestión de pacientes
✅ Gestión de turnos y agenda
✅ Calculadora de precios
✅ Analytics y reportes
✅ **Notificaciones por WhatsApp** (confirmación, recordatorios, cancelaciones)
✅ Modo Operacional y Analítico
✅ Dashboard de pacientes
✅ Gestión de prestaciones
✅ FAQs integradas
✅ Gestión de suscripciones

---

**¿Necesitas ayuda?** Revisa los logs de Docker o contacta al equipo de desarrollo.

