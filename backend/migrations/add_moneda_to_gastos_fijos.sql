-- Add moneda field to gastos_fijos table
ALTER TABLE gastos_fijos ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) DEFAULT 'ARS';

COMMENT ON COLUMN gastos_fijos.moneda IS 'Currency code (ARS/USD)';



