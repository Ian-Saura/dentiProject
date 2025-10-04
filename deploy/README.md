# 🚀 Guía de Despliegue DentiProject

Esta guía te ayudará a desplegar tu aplicación DentiProject en el servidor VPS de forma segura.

## 📋 Prerrequisitos

- Acceso al servidor VPS (datos proporcionados por Dattaweb)
- Git instalado en tu máquina local
- SSH instalado

## 🔐 Configuración Segura

### Paso 1: Configuración Inicial del Servidor

Este script configurará Docker, firewall, seguridad y acceso SSH con claves:

```bash
cd deploy
chmod +x setup_server.sh
./setup_server.sh
```

**Importante:** Durante la ejecución, se te pedirá la contraseña del servidor varias veces. Esto es normal y es la última vez que necesitarás la contraseña root directamente.

El script realizará:
1. ✅ Actualización del sistema
2. ✅ Instalación de Docker y Docker Compose
3. ✅ Configuración del firewall (UFW)
4. ✅ Instalación de fail2ban (protección contra ataques)
5. ✅ Creación de usuario para la aplicación
6. ✅ Configuración de acceso SSH con claves (sin contraseña)

### Paso 2: Desplegar la Aplicación

Una vez completada la configuración inicial:

```bash
chmod +x deploy_app.sh
./deploy_app.sh
```

Este script:
1. 📝 Configurará las variables de entorno (base de datos, JWT, etc.)
2. 📦 Copiará los archivos al servidor
3. 🌐 Configurará Nginx como reverse proxy
4. 🐳 Construirá y levantará los contenedores Docker
5. ✅ Verificará que todo esté funcionando

## 🔑 Acceso SSH Simplificado

Después de ejecutar `setup_server.sh`, podrás conectarte al servidor simplemente con:

```bash
ssh dentiproject
```

**Sin necesidad de recordar:**
- ❌ La contraseña
- ❌ El puerto personalizado (5661)
- ❌ La IP del servidor

## 🌐 Acceso a la Aplicación

Una vez desplegada, tu aplicación estará disponible en:

- **Frontend:** http://66.97.44.23
- **API Backend:** http://66.97.44.23/api
- **Documentación API:** http://66.97.44.23/docs

## 🗄️ Base de Datos

La aplicación usa **PostgreSQL 16** por su:
- ✅ Mayor robustez para datos médicos
- ✅ Mejor manejo de transacciones
- ✅ Soporte para tipos de datos avanzados (JSON, Arrays, ENUM)
- ✅ Mejor integridad referencial

## 📊 Comandos Útiles

### Ver logs en tiempo real
```bash
ssh dentiproject
cd /opt/dentiproject
sudo -u dentiapp docker compose logs -f
```

### Ver estado de contenedores
```bash
ssh dentiproject 'cd /opt/dentiproject && sudo -u dentiapp docker compose ps'
```

### Reiniciar la aplicación
```bash
ssh dentiproject 'cd /opt/dentiproject && sudo -u dentiapp docker compose restart'
```

### Actualizar la aplicación
```bash
# En tu máquina local
cd deploy
./deploy_app.sh
```

### Detener la aplicación
```bash
ssh dentiproject 'cd /opt/dentiproject && sudo -u dentiapp docker compose down'
```

### Iniciar la aplicación
```bash
ssh dentiproject 'cd /opt/dentiproject && sudo -u dentiapp docker compose up -d'
```

## 🔒 Configuración SSL/HTTPS (Opcional pero Recomendado)

Para habilitar HTTPS con certificado gratuito de Let's Encrypt:

```bash
ssh dentiproject

# Reemplaza tu-dominio.com con tu dominio real
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones en pantalla
```

Certbot configurará automáticamente:
- ✅ Certificado SSL
- ✅ Renovación automática
- ✅ Redirección HTTP → HTTPS

## 🛡️ Seguridad

El servidor está configurado con:

- ✅ **UFW Firewall** - Solo puertos 80, 443 y 5661 (SSH) abiertos
- ✅ **Fail2ban** - Protección contra ataques de fuerza bruta
- ✅ **SSH con claves** - Sin contraseñas
- ✅ **Docker** - Aplicación aislada en contenedores
- ✅ **Usuario separado** - La app no corre como root

## 🐛 Solución de Problemas

### Los contenedores no inician

```bash
ssh dentiproject
cd /opt/dentiproject
sudo -u dentiapp docker compose logs
```

### Error de conexión a la base de datos

Verificar que el archivo `.env` esté correctamente configurado:

```bash
ssh dentiproject
cat /opt/dentiproject/.env
```

### Reiniciar todos los servicios

```bash
ssh dentiproject
cd /opt/dentiproject
sudo -u dentiapp docker compose down
sudo -u dentiapp docker compose up -d --build
```

### Ver uso de recursos

```bash
ssh dentiproject
htop
# o
docker stats
```

## 📁 Estructura en el Servidor

```
/opt/dentiproject/
├── backend/
├── frontend/
├── docker-compose.yml
├── Dockerfile.backend
├── nginx.conf
└── .env
```

## 🔄 Flujo de Actualización

1. Hacer cambios en tu código local
2. Commit y push a tu repositorio
3. Ejecutar `./deploy_app.sh` desde el directorio `deploy/`
4. El script automáticamente:
   - Copia los archivos nuevos
   - Reconstruye los contenedores
   - Reinicia la aplicación

## 📞 Información del Servidor

- **Host:** vps-5365949-x.dattaweb.com
- **IP:** 66.97.44.23
- **Puerto SSH:** 5661
- **Alias SSH:** dentiproject

## ⚠️ Notas Importantes

1. **Backup:** Configura backups automáticos de la base de datos
2. **Monitoring:** Considera instalar herramientas de monitoreo
3. **Logs:** Los logs de Docker se rotan automáticamente
4. **Updates:** Actualiza el sistema regularmente con `apt update && apt upgrade`

## 📚 Recursos Adicionales

- [Documentación Docker](https://docs.docker.com/)
- [Documentación Nginx](https://nginx.org/en/docs/)
- [Documentación UFW](https://help.ubuntu.com/community/UFW)
- [Certbot](https://certbot.eff.org/)

