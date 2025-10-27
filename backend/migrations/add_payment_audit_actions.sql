-- Add new audit action types for payment verification and plan assignment
ALTER TYPE tipoaccion ADD VALUE IF NOT EXISTS 'verificar_pago';
ALTER TYPE tipoaccion ADD VALUE IF NOT EXISTS 'asignar_plan';

-- Verify the new values were added
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipoaccion') ORDER BY enumlabel;


