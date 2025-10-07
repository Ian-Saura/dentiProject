-- Agregar campos tipo_cambio_usd_ars y margen_ganancia_porcentaje a configuracion_usuario
-- Ejecutar: psql -U postgres -d dentiproject -f migrations/add_config_fields.sql

ALTER TABLE configuracion_usuario 
ADD COLUMN IF NOT EXISTS tipo_cambio_usd_ars DECIMAL(10, 2) DEFAULT 1335,
ADD COLUMN IF NOT EXISTS margen_ganancia_porcentaje DECIMAL(5, 2) DEFAULT 40;

-- Actualizar registros existentes con valores por defecto si son NULL
UPDATE configuracion_usuario 
SET tipo_cambio_usd_ars = 1335 
WHERE tipo_cambio_usd_ars IS NULL;

UPDATE configuracion_usuario 
SET margen_ganancia_porcentaje = 40 
WHERE margen_ganancia_porcentaje IS NULL;
