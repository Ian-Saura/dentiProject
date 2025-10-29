# Jobs / Cron Tasks

## Recordatorios Diarios

Este job envía recordatorios automáticos por WhatsApp/SMS a todos los pacientes que tienen turnos agendados para el día siguiente.

### Ejecución Manual

```bash
cd /root/dentiproject
docker exec -it denti_backend python app/jobs/enviar_recordatorios_diarios.py
```

### Configurar Cron (Automático)

Para ejecutar diariamente a las 9:00 AM:

```bash
# Editar crontab
crontab -e

# Agregar esta línea:
0 9 * * * cd /root/dentiproject && docker exec denti_backend python app/jobs/enviar_recordatorios_diarios.py >> /root/dentiproject/logs/cron_recordatorios.log 2>&1
```

### Características

- ✅ Envía recordatorios 24 horas antes del turno
- ✅ Solo envía si el paciente tiene teléfono registrado
- ✅ Usa templates aprobados de WhatsApp
- ✅ Intenta WhatsApp primero, si falla usa SMS
- ✅ Marca turnos como "recordatorio_enviado" para no duplicar
- ✅ Logs detallados en `logs/recordatorios_diarios.log`

### Logs

Los logs se guardan en:
- Stdout: Salida estándar del container
- File: `/root/dentiproject/logs/recordatorios_diarios.log`
- Rotación: Semanal
- Retención: 1 mes

### Verificar Logs

```bash
# Ver logs recientes
tail -f /root/dentiproject/logs/recordatorios_diarios.log

# Ver logs del container
docker logs denti_backend --tail 100
```

