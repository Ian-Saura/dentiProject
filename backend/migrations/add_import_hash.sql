-- Add import_hash column to consultas table for duplicate detection
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);

-- Create index on import_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_consultas_import_hash ON consultas(import_hash);

-- Create composite index for unique identification
CREATE INDEX IF NOT EXISTS idx_consulta_unica ON consultas(usuario_id, paciente_id, prestacion_usuario_id, fecha_consulta, monto_ars);

-- Add comment
COMMENT ON COLUMN consultas.import_hash IS 'SHA256 hash for CSV import duplicate detection';



















