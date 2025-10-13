-- Migration: Add plan management fields to usuarios table
-- Date: 2025-10-04
-- Description: Adds fecha_inicio_plan for tracking when a plan was assigned

-- Add fecha_inicio_plan column
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS fecha_inicio_plan DATE;

-- Update comment on existing fecha_vencimiento column
COMMENT ON COLUMN usuarios.fecha_vencimiento IS 'Fecha de vencimiento del plan (principalmente para trial)';
COMMENT ON COLUMN usuarios.fecha_inicio_plan IS 'Fecha de inicio del plan actual';

-- Set fecha_inicio_plan to fecha_registro for existing users
UPDATE usuarios 
SET fecha_inicio_plan = fecha_registro::date
WHERE fecha_inicio_plan IS NULL;

-- For trial users without fecha_vencimiento, set it to 7 days after registration
UPDATE usuarios
SET fecha_vencimiento = (fecha_registro::date + INTERVAL '7 days')
WHERE plan = 'trial' AND fecha_vencimiento IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_usuarios_plan ON usuarios(plan);
CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_vencimiento ON usuarios(fecha_vencimiento);








