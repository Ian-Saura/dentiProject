-- Migration: Make DNI mandatory for all patients
-- This script updates existing patients without DNI and makes the field NOT NULL

BEGIN;

-- Step 1: Update patients without DNI to have a temporary DNI
-- Using format TEMP-<id> to be easily identifiable
UPDATE pacientes
SET dni = 'TEMP-' || id::text
WHERE dni IS NULL OR dni = '';

-- Step 2: Verify all patients now have DNI
DO $$
DECLARE
    patients_without_dni INTEGER;
BEGIN
    SELECT COUNT(*) INTO patients_without_dni
    FROM pacientes
    WHERE dni IS NULL OR dni = '';
    
    IF patients_without_dni > 0 THEN
        RAISE EXCEPTION 'Still have % patients without DNI', patients_without_dni;
    ELSE
        RAISE NOTICE 'All % patients now have DNI', (SELECT COUNT(*) FROM pacientes);
    END IF;
END $$;

-- Step 3: Make DNI NOT NULL in the database
ALTER TABLE pacientes 
ALTER COLUMN dni SET NOT NULL;

-- Step 4: Add UNIQUE constraint on DNI (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pacientes_dni_unique'
    ) THEN
        ALTER TABLE pacientes ADD CONSTRAINT pacientes_dni_unique UNIQUE (dni);
        RAISE NOTICE 'Added UNIQUE constraint on DNI';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on DNI already exists';
    END IF;
END $$;

-- Step 5: Add check constraint for minimum length (7 characters) (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pacientes_dni_min_length'
    ) THEN
        ALTER TABLE pacientes ADD CONSTRAINT pacientes_dni_min_length CHECK (length(dni) >= 7);
        RAISE NOTICE 'Added check constraint for DNI minimum length';
    ELSE
        RAISE NOTICE 'Check constraint for DNI minimum length already exists';
    END IF;
END $$;

-- Step 6: Create index on DNI for better performance on searches
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes (LOWER(TRIM(dni)));

COMMIT;

-- After this migration, all patients have DNI
-- Patients with TEMP-* DNI should be updated by users to real DNI














