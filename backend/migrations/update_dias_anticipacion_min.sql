-- Actualizar días de anticipación mínima a 0
-- Esto permite que los pacientes reserven turnos para el mismo día
-- Útil para consultas de urgencia o turnos de último momento

-- Actualizar todas las configuraciones existentes
UPDATE configuracion_turnos 
SET dias_anticipacion_min = 0
WHERE dias_anticipacion_min > 0;

-- Mostrar resumen
SELECT 
    usuario_id,
    dias_anticipacion_min,
    dias_anticipacion_max,
    'Actualizado para permitir reservas el mismo día' as estado
FROM configuracion_turnos;

-- Esto permite que los pacientes reserven turnos para el mismo día
-- Útil para consultas de urgencia o turnos de último momento

-- Actualizar todas las configuraciones existentes
UPDATE configuracion_turnos 
SET dias_anticipacion_min = 0
WHERE dias_anticipacion_min > 0;

-- Mostrar resumen
SELECT 
    usuario_id,
    dias_anticipacion_min,
    dias_anticipacion_max,
    'Actualizado para permitir reservas el mismo día' as estado
FROM configuracion_turnos;





