-- Add observaciones field to prestaciones table
ALTER TABLE prestaciones ADD COLUMN IF NOT EXISTS observaciones TEXT;

COMMENT ON COLUMN prestaciones.observaciones IS 'Additional observations for the service';


