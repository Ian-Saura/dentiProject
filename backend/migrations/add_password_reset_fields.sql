-- Agregar campos para reset de contraseña
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(6);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_reset_token ON usuarios(reset_password_token) WHERE reset_password_token IS NOT NULL;


