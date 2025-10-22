-- Migration: Add link_turnos table for unique booking links per dentist
-- This table stores unique tokens for public appointment booking

CREATE TABLE IF NOT EXISTS link_turnos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    duracion_minutos INTEGER NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    mensaje_personalizado TEXT,
    usos_totales INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_link_turnos_token ON link_turnos(token);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_link_turnos_usuario_id ON link_turnos(usuario_id);

-- Index for active links
CREATE INDEX IF NOT EXISTS idx_link_turnos_activo ON link_turnos(activo);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_link_turnos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_link_turnos_updated_at
    BEFORE UPDATE ON link_turnos
    FOR EACH ROW
    EXECUTE FUNCTION update_link_turnos_updated_at();

-- Comment
COMMENT ON TABLE link_turnos IS 'Stores unique booking links for each dentist with specific durations';
COMMENT ON COLUMN link_turnos.token IS 'Unique token for the booking link (cryptographically secure)';
COMMENT ON COLUMN link_turnos.duracion_minutos IS 'Pre-configured duration for appointments booked via this link';
COMMENT ON COLUMN link_turnos.activo IS 'Whether this link is currently active';
COMMENT ON COLUMN link_turnos.usos_totales IS 'Total number of appointments booked via this link';





