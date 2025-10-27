-- Actualizar duraciones permitidas para turnos
-- Cambiar de [15, 30, 45, 60] a [30, 60]
-- Esto deja solo turnos de 30 minutos y 60 minutos
-- El frontend permitirá seleccionar duración personalizada

-- Actualizar todas las configuraciones existentes que tengan [15, 30, 45, 60]
UPDATE configuracion_turnos 
SET duraciones_permitidas = '[30, 60]'::json
WHERE duraciones_permitidas::text = '[15, 30, 45, 60]';

-- Mostrar resumen de actualizaciones
SELECT 
    id,
    usuario_id,
    duraciones_permitidas,
    'Actualizado' as estado
FROM configuracion_turnos 
WHERE duraciones_permitidas::text = '[30, 60]';


-- Esto deja solo turnos de 30 minutos y 60 minutos
-- El frontend permitirá seleccionar duración personalizada

-- Actualizar todas las configuraciones existentes que tengan [15, 30, 45, 60]
UPDATE configuracion_turnos 
SET duraciones_permitidas = '[30, 60]'::json
WHERE duraciones_permitidas::text = '[15, 30, 45, 60]';

-- Mostrar resumen de actualizaciones
SELECT 
    id,
    usuario_id,
    duraciones_permitidas,
    'Actualizado' as estado
FROM configuracion_turnos 
WHERE duraciones_permitidas::text = '[30, 60]';

