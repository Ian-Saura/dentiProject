-- Agregar campo dientes_tratados a la tabla consultas
-- Almacena array de números de dientes tratados (11, 21, etc.)

ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS dientes_tratados INTEGER[] DEFAULT '{}';

-- Crear índice para búsquedas rápidas por diente
CREATE INDEX IF NOT EXISTS idx_consultas_dientes_tratados 
ON consultas USING GIN (dientes_tratados);

-- Comentario
COMMENT ON COLUMN consultas.dientes_tratados IS 'Array de números de dientes tratados en esta consulta (numeración universal)';
