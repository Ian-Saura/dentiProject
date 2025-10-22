-- Migration: Add currency fields to gastos_fijos table
-- Date: 2025-10-16
-- Description: Adds moneda and monto_mensual fields to allow expenses in USD or ARS

-- Create enum type for currency
DO $$ BEGIN
    CREATE TYPE monedagasto AS ENUM ('ARS', 'USD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns
ALTER TABLE gastos_fijos 
ADD COLUMN IF NOT EXISTS monto_mensual DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS moneda monedagasto DEFAULT 'ARS';

-- Migrate existing data: copy monto_mensual_ars to monto_mensual and set moneda to ARS
UPDATE gastos_fijos 
SET monto_mensual = monto_mensual_ars,
    moneda = 'ARS'
WHERE monto_mensual IS NULL;

-- Make monto_mensual NOT NULL after migration
ALTER TABLE gastos_fijos 
ALTER COLUMN monto_mensual SET NOT NULL,
ALTER COLUMN moneda SET NOT NULL;

-- Make monto_mensual_ars nullable (will be calculated field)
ALTER TABLE gastos_fijos 
ALTER COLUMN monto_mensual_ars DROP NOT NULL;

COMMENT ON COLUMN gastos_fijos.monto_mensual IS 'Monto mensual en la moneda especificada (ARS o USD)';
COMMENT ON COLUMN gastos_fijos.moneda IS 'Moneda del gasto (ARS o USD)';
COMMENT ON COLUMN gastos_fijos.monto_mensual_ars IS 'Monto convertido a ARS (calculado automáticamente para compatibilidad)';

-- Verify columns were created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'gastos_fijos' AND column_name = 'monto_mensual') = 1,
         'Column monto_mensual not created';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'gastos_fijos' AND column_name = 'moneda') = 1,
         'Column moneda not created';
  
  RAISE NOTICE 'gastos_fijos currency fields added successfully';
END $$;



