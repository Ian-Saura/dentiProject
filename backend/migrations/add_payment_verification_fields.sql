-- Add payment verification fields to usuarios table
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_verificacion_pago DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pago_verificado BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN usuarios.ultima_verificacion_pago IS 'Last payment verification date';
COMMENT ON COLUMN usuarios.pago_verificado IS 'Payment verified flag';



