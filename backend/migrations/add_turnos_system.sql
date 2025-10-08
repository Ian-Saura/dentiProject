-- ============================================================================
-- MIGRATION: Add Turnos (Appointments) System
-- Date: 2025-10-08
-- Description: Adds tables for appointment management system with public booking
-- ============================================================================

-- Step 1: Create configuracion_turnos table
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion_turnos (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- General configuration
  activo BOOLEAN DEFAULT FALSE,
  duraciones_permitidas INTEGER[] DEFAULT ARRAY[15, 30, 45, 60],
  dias_anticipacion_min INT DEFAULT 1,
  dias_anticipacion_max INT DEFAULT 90,
  
  -- Schedule configuration (JSON format)
  -- Example: {"0": [{"inicio": "09:00", "fin": "13:00"}], "1": [...]}
  horarios_atencion JSONB DEFAULT '{}'::jsonb,
  
  -- Blocked days (holidays, vacations)
  -- Example: ["2024-01-01", "2024-12-25"]
  dias_bloqueados TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Appointment settings
  intervalo_descanso_minutos INT DEFAULT 0,
  permitir_superposicion BOOLEAN DEFAULT FALSE,
  
  -- Customizable messages
  mensaje_bienvenida VARCHAR(500),
  mensaje_confirmacion VARCHAR(500),
  
  -- Metadata
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create turnos table
-- ============================================================================

CREATE TABLE IF NOT EXISTS turnos (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  paciente_id INT REFERENCES pacientes(id) ON DELETE SET NULL,
  
  -- Appointment data
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_minutos INT NOT NULL,
  
  -- Status
  estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN (
    'disponible', 'reservado', 'confirmado', 'cancelado', 'completado', 'no_asistio'
  )),
  
  -- Patient information (for public bookings without registered patient)
  nombre_paciente VARCHAR(100),
  apellido_paciente VARCHAR(100),
  telefono_paciente VARCHAR(20),
  email_paciente VARCHAR(150),
  
  -- Reason and notes
  motivo_consulta VARCHAR(500),
  observaciones VARCHAR(1000),
  notas_profesional VARCHAR(1000),
  
  -- Unique token for managing the booking
  token_reserva VARCHAR(64) UNIQUE,
  
  -- Metadata
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por_publico BOOLEAN DEFAULT FALSE,
  
  -- Reminders
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  confirmado_por_paciente BOOLEAN DEFAULT FALSE
);

-- Step 3: Create indexes for better performance
-- ============================================================================

-- Index for quick lookups by date and professional
CREATE INDEX IF NOT EXISTS idx_turnos_usuario_fecha 
  ON turnos(usuario_id, fecha);

-- Index for quick lookups by token (for public access)
CREATE INDEX IF NOT EXISTS idx_turnos_token 
  ON turnos(token_reserva) WHERE token_reserva IS NOT NULL;

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_turnos_estado 
  ON turnos(estado);

-- Index for patient appointments
CREATE INDEX IF NOT EXISTS idx_turnos_paciente 
  ON turnos(paciente_id) WHERE paciente_id IS NOT NULL;

-- Composite index for availability checks
CREATE INDEX IF NOT EXISTS idx_turnos_availability 
  ON turnos(usuario_id, fecha, hora_inicio, hora_fin, estado);

-- Step 4: Create trigger for updating fecha_modificacion
-- ============================================================================

CREATE OR REPLACE FUNCTION update_turnos_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_modificacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_turnos_fecha_modificacion
  BEFORE UPDATE ON turnos
  FOR EACH ROW
  EXECUTE FUNCTION update_turnos_fecha_modificacion();

CREATE TRIGGER trigger_update_configuracion_turnos_fecha_modificacion
  BEFORE UPDATE ON configuracion_turnos
  FOR EACH ROW
  EXECUTE FUNCTION update_turnos_fecha_modificacion();

-- Step 5: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE configuracion_turnos IS 'Configuration table for appointment system per professional';
COMMENT ON TABLE turnos IS 'Appointments table for scheduling patient visits';

COMMENT ON COLUMN configuracion_turnos.horarios_atencion IS 'JSON object with working hours per weekday (0=Monday, 6=Sunday)';
COMMENT ON COLUMN configuracion_turnos.dias_bloqueados IS 'Array of dates (YYYY-MM-DD) when professional is not available';
COMMENT ON COLUMN turnos.token_reserva IS 'Unique token for public booking management and confirmation';
COMMENT ON COLUMN turnos.creado_por_publico IS 'Flag indicating if appointment was created via public booking form';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
