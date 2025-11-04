-- Remove unique constraint on prestaciones_usuario
-- Each consulta needs its own unique prestacion_usuario, even with the same name
-- This allows multiple "Consulta" or "Limpieza" records, each belonging to a specific consulta

BEGIN;

-- Drop the unique constraint on usuario_id + nombre_personalizado
ALTER TABLE prestaciones_usuario 
DROP CONSTRAINT IF EXISTS unique_usuario_nombre_personalizado;

-- Keep the index for performance but remove uniqueness
DROP INDEX IF EXISTS idx_usuario_prestacion;
CREATE INDEX IF NOT EXISTS idx_usuario_prestacion 
ON prestaciones_usuario (usuario_id, prestacion_id);

COMMIT;

