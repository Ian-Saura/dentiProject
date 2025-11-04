-- Fix PrestacionUsuario unique constraint
-- The constraint should be on usuario_id + nombre_personalizado, not usuario_id + prestacion_id
-- This allows multiple custom treatments using the same base prestacion

BEGIN;

-- Drop the old unique constraint
ALTER TABLE prestaciones_usuario 
DROP CONSTRAINT IF EXISTS unique_usuario_prestacion;

-- Add new unique constraint on usuario_id + nombre_personalizado
-- This ensures each user can only have one prestacion with the same custom name
ALTER TABLE prestaciones_usuario 
ADD CONSTRAINT unique_usuario_nombre_personalizado 
UNIQUE (usuario_id, nombre_personalizado);

-- Create an index on usuario_id + prestacion_id for better query performance
-- (not unique, just for performance)
CREATE INDEX IF NOT EXISTS idx_usuario_prestacion 
ON prestaciones_usuario (usuario_id, prestacion_id);

COMMIT;


