-- Migration: Add observaciones field to prestaciones table
-- Date: 2025-10-16
-- Description: Adds observaciones column to store characteristics and details about treatments

-- Add observaciones column to prestaciones
ALTER TABLE prestaciones 
ADD COLUMN IF NOT EXISTS observaciones VARCHAR(500);

COMMENT ON COLUMN prestaciones.observaciones IS 'Observaciones y características del tratamiento';

-- Verify column was created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'prestaciones' AND column_name = 'observaciones') = 1,
         'Column observaciones not created';
  
  RAISE NOTICE 'prestaciones.observaciones column added successfully';
END $$;



