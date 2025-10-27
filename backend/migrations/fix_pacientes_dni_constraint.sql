-- Fix pacientes DNI constraint
-- El DNI debe ser único por usuario, no globalmente
-- Esto permite que diferentes profesionales tengan pacientes con el mismo DNI
-- (lo cual es correcto, ya que es un sistema multi-tenant)

-- 1. Eliminar la constraint única global en dni
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_dni_key;
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_dni_unique;

-- 2. Crear constraint única compuesta (usuario_id, dni)
-- Esto permite que el mismo DNI exista para diferentes usuarios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pacientes_usuario_dni_unique'
    ) THEN
        ALTER TABLE pacientes 
        ADD CONSTRAINT pacientes_usuario_dni_unique 
        UNIQUE (usuario_id, dni);
    END IF;
END
$$;

-- 3. Recrear el índice para búsquedas eficientes
DROP INDEX IF EXISTS idx_pacientes_dni;
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_dni ON pacientes (usuario_id, LOWER(TRIM(dni)));

-- Nota: La constraint pacientes_dni_min_length se mantiene intacta

-- El DNI debe ser único por usuario, no globalmente
-- Esto permite que diferentes profesionales tengan pacientes con el mismo DNI
-- (lo cual es correcto, ya que es un sistema multi-tenant)

-- 1. Eliminar la constraint única global en dni
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_dni_key;
ALTER TABLE pacientes DROP CONSTRAINT IF EXISTS pacientes_dni_unique;

-- 2. Crear constraint única compuesta (usuario_id, dni)
-- Esto permite que el mismo DNI exista para diferentes usuarios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pacientes_usuario_dni_unique'
    ) THEN
        ALTER TABLE pacientes 
        ADD CONSTRAINT pacientes_usuario_dni_unique 
        UNIQUE (usuario_id, dni);
    END IF;
END
$$;

-- 3. Recrear el índice para búsquedas eficientes
DROP INDEX IF EXISTS idx_pacientes_dni;
CREATE INDEX IF NOT EXISTS idx_pacientes_usuario_dni ON pacientes (usuario_id, LOWER(TRIM(dni)));

-- Nota: La constraint pacientes_dni_min_length se mantiene intacta



