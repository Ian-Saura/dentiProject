# 📱 DentiProject - Release Notes v2.0

## 🎉 Novedades Principales

### 1. Sistema de Notificaciones por WhatsApp 📲
**Integración completa con Twilio para notificaciones automáticas**

- ✅ **Confirmación inmediata** al crear un turno
  - Mensaje automático al paciente confirmando su cita
  - Incluye fecha, hora y profesional asignado
  
- ✅ **Recordatorios 24 horas antes**
  - Sistema automático vía cron job
  - Solo se envía a turnos confirmados
  - Validaciones inteligentes (no enviar si el turno es muy próximo)
  
- ✅ **Notificaciones de cancelación**
  - Aviso automático cuando se cancela un turno
  - Incluye motivo de cancelación (opcional)
  - Invita al paciente a reagendar

**Formatos de teléfono soportados:**
- `+5491112345678` (formato E.164)
- `11 1234 5678` (formato local)
- `15 1234 5678` (con el 15)
- Conversión automática a formato internacional

### 2. Gestión de Suscripciones 💳
**Nueva página para que los usuarios gestionen su suscripción con múltiples opciones de pago**

- ✅ Visualización del estado actual (Trial/Premium)
- ✅ Días restantes del trial
- ✅ Fecha de inicio y expiración
- ✅ **Dos opciones de pago disponibles:**
  - 💳 **MercadoPago** ($39.999 ARS/mes) - Ideal para Argentina
  - 💵 **OneInfinite** ($30 USD/mes) - Ideal para internacional (Costa Rica, etc.)
- ✅ Alerta informativa para usuarios internacionales
- ✅ Precios en ambas monedas (ARS y USD)
- ✅ Lista completa de beneficios del plan Premium
- ✅ Información de seguridad y procesamiento de pagos

### 3. Centro de Ayuda (FAQs) ❓
**Sección de preguntas frecuentes integrada**

- Accesible desde todos los modos (Operacional/Analítico)
- Categorías organizadas (General, Precios, Funcionalidades, etc.)
- Animaciones y diseño moderno
- Tips en la calculadora que referencian a las FAQs

### 4. Mejoras en Gestión de Pacientes 👥

#### Edición de DNI Mejorada
- DNI ahora editable incluso en pacientes existentes
- Indicador visual para DNIs temporales (CSV-XXXX)
- Alerta especial para actualizar DNIs temporales
- Campo resaltado con color ámbar para DNIs que requieren actualización

#### Información Médica Completa
- Campos de alergias en formulario de creación
- Medicamentos actuales
- Observaciones médicas
- Consistencia entre crear y editar paciente

### 5. Visualización de Observaciones en Prestaciones 📝
**Mejoras en la visualización de observaciones**

- Observaciones visibles en la lista de prestaciones
- Modal detallado al clickear en prestaciones desde dashboard del paciente
- Preview con "Click para ver más" en móviles
- Botón de editar prestación desde el modal de detalles

## 🔧 Mejoras Técnicas

### Backend
- ✅ Servicio completo de Twilio (`twilio_service.py`)
- ✅ Servicio de recordatorios (`recordatorios_service.py`)
- ✅ Endpoints API para recordatorios (`routes_recordatorios.py`)
- ✅ Job automático para recordatorios diarios
- ✅ Formateo inteligente de números telefónicos argentinos
- ✅ Configuración centralizada en Pydantic Settings

### Frontend
- ✅ Página de suscripciones completamente nueva
- ✅ Servicio de recordatorios para futuras integraciones
- ✅ Modal unificado para agregar/editar pacientes
- ✅ Modal de detalles de consulta con observaciones
- ✅ Navegación mejorada con enlaces a FAQs y Suscripción

### Docker & Deploy
- ✅ Variables de entorno externalizadas (no más secretos en el código)
- ✅ Docker Compose optimizado para desarrollo
- ✅ Script de deploy automático (`deploy_production.sh`)
- ✅ Guía de deploy completa (`DEPLOY_GUIDE.md`)
- ✅ Health checks mejorados

## 📦 Archivos Nuevos/Modificados

### Backend (Python/FastAPI)
- `backend/app/services/twilio_service.py` ⭐ **NUEVO**
- `backend/app/services/recordatorios_service.py` ⭐ **NUEVO**
- `backend/app/api/v1/routes_recordatorios.py` ⭐ **NUEVO**
- `backend/app/jobs/enviar_recordatorios_diarios.py` ⭐ **NUEVO**
- `backend/app/core/config.py` - Agregadas variables Twilio
- `backend/app/api/v1/routes_turnos.py` - Integración automática
- `backend/requirements.txt` - Agregado twilio>=8.10.0

### Frontend (React/TypeScript)
- `frontend/src/pages/SubscriptionPage.tsx` ⭐ **NUEVO**
- `frontend/src/services/recordatorios.ts` ⭐ **NUEVO**
- `frontend/src/components/AddPacienteModal.tsx` - DNI editable
- `frontend/src/pages/PatientDashboardPage.tsx` - Modal de detalles
- `frontend/src/pages/ConsultasPage.tsx` - Columna de observaciones
- `frontend/src/pages/CalculadoraPage.tsx` - Tip de FAQs
- `frontend/src/pages/FAQPage.tsx` - Versión autenticada
- Todos los layouts - Enlaces a FAQs y Suscripción

### Deploy & Configuración
- `docker-compose.yml` - Variables de entorno externalizadas
- `deploy_production.sh` ⭐ **NUEVO**
- `DEPLOY_GUIDE.md` ⭐ **NUEVO**
- `.gitignore` - Actualizaciones de seguridad

## 🚀 Para Deployar

```bash
# Opción 1: Usando el script automático
./deploy_production.sh

# Opción 2: Manual
git clone https://github.com/Ian-Saura/dentiProject.git
cd dentiProject
git checkout feat/new-architecture
cp .env.example .env
# Editar .env con tus credenciales
docker-compose up -d --build
```

## ⚙️ Configuración Requerida en Producción

### 1. Variables de Entorno
```bash
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token  
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 2. Cron Job para Recordatorios
```bash
# Agregar al crontab
0 9 * * * docker exec denti_backend python -m app.jobs.enviar_recordatorios_diarios
```

### 3. Twilio Sandbox (Desarrollo)
Los números deben enviar `join <palabra>` al `+1 415 523 8886` primero.

### 4. Twilio Production (Recomendado)
- Registrar número real en Twilio
- Configurar WhatsApp Business API
- Aprobar templates por WhatsApp

## 🧪 Testing Local

### 1. Iniciar servicios
```bash
docker-compose up -d
```

### 2. Verificar backend
```bash
curl http://localhost:8000/v1/health
```

### 3. Probar notificaciones
1. Ve a http://localhost:3000/operational/turnos
2. Crea un turno con número de WhatsApp válido
3. Verifica que llegue el mensaje de confirmación

### 4. Ver logs
```bash
docker logs -f denti_backend | grep -i twilio
```

## 📊 Estado del Proyecto

- ✅ **Backend**: 100% funcional
- ✅ **Frontend**: 100% funcional
- ✅ **Notificaciones**: 100% funcional y probado
- ✅ **Docker**: Configurado y probado
- ✅ **Deploy**: Script automático disponible
- ⏳ **Producción**: Pendiente de deploy en servidor

## 🎯 Próximos Pasos

1. Deploy en servidor de producción
2. Configurar dominio y SSL
3. Configurar Twilio número real (no sandbox)
4. Configurar cron job en servidor
5. Monitoreo y logs centralizados

## 📝 Notas Importantes

- Los mensajes usan formato simple (no templates) para mayor flexibilidad
- Las notificaciones no bloquean operaciones principales (fail-safe)
- Todos los secretos están externalizados en variables de entorno
- El sistema valida números telefónicos argentinos automáticamente

---

**Versión**: 2.1  
**Fecha**: 29 de Octubre, 2025  
**Branch**: `feat/new-architecture`

## 🆕 Actualización 2.1 - Opciones de Pago Internacionales

### Cambios en esta versión:
- ✅ Agregada opción de pago **OneInfinite** para usuarios internacionales
- ✅ Precios actualizados mostrando ARS y USD
- ✅ Alerta informativa para usuarios fuera de Argentina
- ✅ Botones diferenciados para cada método de pago
- ✅ Documentación completa de opciones de pago ([PAYMENT_OPTIONS.md](PAYMENT_OPTIONS.md))

**🎉 ¡Todo listo para producción internacional!**


