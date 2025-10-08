-- Migración: Agregar campos de configuración de turnos
-- Fecha: 2025-10-08
-- Descripción: Agrega hora_inicio_dia, hora_fin_dia y link_reserva_unico

-- Agregar columnas a configuracion_turnos
ALTER TABLE configuracion_turnos 
ADD COLUMN IF NOT EXISTS hora_inicio_dia VARCHAR(5) DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS hora_fin_dia VARCHAR(5) DEFAULT '20:00',
ADD COLUMN IF NOT EXISTS link_reserva_unico VARCHAR(50) UNIQUE;

-- Crear índice para link_reserva_unico
CREATE INDEX IF NOT EXISTS idx_configuracion_turnos_link_unico 
ON configuracion_turnos(link_reserva_unico);

-- Generar links únicos para configuraciones existentes
-- Formato: usuario_id como slug (ej: "dr-juan-perez-123")
UPDATE configuracion_turnos ct
SET link_reserva_unico = CONCAT(
    'odontologo-',
    CAST(ct.usuario_id AS VARCHAR)
)
WHERE link_reserva_unico IS NULL;

-- Comentarios
COMMENT ON COLUMN configuracion_turnos.hora_inicio_dia IS 'Hora de inicio del día laboral (formato HH:MM)';
COMMENT ON COLUMN configuracion_turnos.hora_fin_dia IS 'Hora de fin del día laboral (formato HH:MM)';
COMMENT ON COLUMN configuracion_turnos.link_reserva_unico IS 'Slug único para el link de reservas públicas';
