-- Migration: Add missing fields to pacientes table
-- Date: 2025-10-04
-- Description: Adds contacto_emergencia, alergias, medicamentos_actuales, observaciones_medicas

-- Add missing columns to pacientes
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(200);

ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS alergias VARCHAR(1000);

ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS medicamentos_actuales VARCHAR(1000);

ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS observaciones_medicas VARCHAR(1000);

COMMENT ON COLUMN pacientes.contacto_emergencia IS 'Contacto de emergencia del paciente';
COMMENT ON COLUMN pacientes.alergias IS 'Alergias del paciente';
COMMENT ON COLUMN pacientes.medicamentos_actuales IS 'Medicamentos actuales del paciente';
COMMENT ON COLUMN pacientes.observaciones_medicas IS 'Observaciones médicas del paciente';














