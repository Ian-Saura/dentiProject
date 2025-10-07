-- Migration: Add unique constraint for patients to prevent duplicates
-- This ensures a user cannot have duplicate patients with the same DNI

-- Step 1: Clean up existing duplicates (keep the oldest record for each duplicate)
WITH duplicates AS (
    SELECT 
        id,
        usuario_id,
        dni,
        ROW_NUMBER() OVER (
            PARTITION BY usuario_id, LOWER(TRIM(dni)) 
            ORDER BY fecha_registro ASC, id ASC
        ) as rn
    FROM pacientes
    WHERE dni IS NOT NULL 
    AND dni != ''
    AND dni NOT LIKE 'CSV%'  -- Exclude temporary DNIs from CSV imports
)
DELETE FROM pacientes
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint on (usuario_id, dni) for non-null DNIs
-- This prevents future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_usuario_dni_unique 
ON pacientes (usuario_id, LOWER(TRIM(dni))) 
WHERE dni IS NOT NULL AND dni != '' AND dni NOT LIKE 'CSV%';

-- Step 3: Add index for better performance on name searches
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre_apellido 
ON pacientes (usuario_id, LOWER(nombre), LOWER(apellido));

-- Step 4: Add composite index for fuzzy matching (using expression index)
CREATE INDEX IF NOT EXISTS idx_pacientes_search 
ON pacientes (usuario_id, lower(trim(nombre || ' ' || apellido)));
