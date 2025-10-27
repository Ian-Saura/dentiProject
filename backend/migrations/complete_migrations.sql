-- ============================================================================
-- COMPLETE DATABASE MIGRATIONS
-- Generated: Fri Oct 24 09:05:03 -03 2025
-- ============================================================================

-- ============================================================================
-- Migration: add_auth_and_audit.sql
-- ============================================================================
-- ============================================================================
-- MIGRATION: Add Google OAuth, Onboarding, and Audit System
-- Date: 2025-10-04
-- Description: Adds fields for OAuth authentication, onboarding tracking,
--              and comprehensive audit system
-- ============================================================================

-- Step 1: Modify usuarios table for OAuth and onboarding
-- ============================================================================

ALTER TABLE usuarios 
  -- Make password optional (for OAuth users)
  ALTER COLUMN password_hash DROP NOT NULL;

-- Add Google OAuth fields
ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50);

-- Add onboarding fields
ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Update existing users
UPDATE usuarios 
SET 
  provider = 'local',
  onboarding_completado = TRUE,
  email_verificado = FALSE
WHERE provider IS NULL;

-- Step 2: Create auditoria table
-- ============================================================================

CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  
  -- User who performed the action
  usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  
  -- Action details
  accion VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50),
  entidad_id INT,
  
  -- Description and metadata
  descripcion VARCHAR(500),
  metadata_json JSONB,
  
  -- Technical information
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  endpoint VARCHAR(255),
  metodo_http VARCHAR(10),
  
  -- Result information
  exitoso BOOLEAN DEFAULT TRUE,
  error_mensaje TEXT,
  
  -- Timestamps and performance
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duracion_ms INT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_exitoso ON auditoria(exitoso);

-- ============================================================================
-- DATA VALIDATION
-- ============================================================================

-- Verify usuarios table structure
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'usuarios' AND column_name = 'google_id') = 1,
         'Column google_id not created';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'usuarios' AND column_name = 'onboarding_completado') = 1,
         'Column onboarding_completado not created';
  
  RAISE NOTICE 'usuarios table migration: OK';
END $$;

-- Verify auditoria table structure
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name = 'auditoria') = 1,
         'Table auditoria not created';
  
  ASSERT (SELECT COUNT(*) FROM information_schema.columns 
          WHERE table_name = 'auditoria') >= 14,
         'auditoria table missing columns';
  
  RAISE NOTICE 'auditoria table migration: OK';
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  total_usuarios INT;
  total_columnas_nuevas INT;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM usuarios;
  
  SELECT COUNT(*) INTO total_columnas_nuevas
  FROM information_schema.columns 
  WHERE table_name = 'usuarios' 
  AND column_name IN ('google_id', 'avatar_url', 'provider', 'onboarding_completado', 'email_verificado');
  
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║           ✅ MIGRATION COMPLETED SUCCESSFULLY            ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Total usuarios: %', total_usuarios;
  RAISE NOTICE '   - New columns added to usuarios: %', total_columnas_nuevas;
  RAISE NOTICE '   - New table created: auditoria';
  RAISE NOTICE '   - Indexes created: 5';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 New features enabled:';
  RAISE NOTICE '   ✓ Google OAuth authentication';
  RAISE NOTICE '   ✓ User onboarding tracking';
  RAISE NOTICE '   ✓ Comprehensive audit system';
  RAISE NOTICE '   ✓ User activity analytics';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Restart backend service';
  RAISE NOTICE '   2. Test registration endpoint';
  RAISE NOTICE '   3. Test Google OAuth flow';
  RAISE NOTICE '   4. Verify audit logs are being created';
  RAISE NOTICE '';
END $$;



-- ============================================================================
-- Migration: add_rbac_system.sql
-- ============================================================================
-- ============================================================================
-- MIGRATION: Add Role-Based Access Control (RBAC) System
-- Date: 2025-10-04
-- Description: Adds roles, permissions, and role assignments for users
-- ============================================================================

-- Step 1: Create roles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(500)
);

-- Step 2: Create permissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(500)
);

-- Step 3: Create role_permissions junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Step 4: Add role_id to usuarios table
-- ============================================================================

ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS role_id INT REFERENCES roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role_id);

-- Step 5: Insert default roles
-- ============================================================================

INSERT INTO roles (name, display_name, description) VALUES
  ('admin', 'Administrator', 'Full system access'),
  ('user', 'User', 'Standard user with access to own data'),
  ('viewer', 'Viewer', 'Read-only access'),
  ('moderator', 'Moderator', 'Can manage users but not system config')
ON CONFLICT (name) DO NOTHING;

-- Step 6: Insert permissions
-- ============================================================================

INSERT INTO permissions (name, display_name, description) VALUES
  -- User Management
  ('view_users', 'View Users', 'Permission to view_users'),
  ('create_users', 'Create Users', 'Permission to create_users'),
  ('edit_users', 'Edit Users', 'Permission to edit_users'),
  ('delete_users', 'Delete Users', 'Permission to delete_users'),
  ('assign_roles', 'Assign Roles', 'Permission to assign_roles'),
  
  -- Data Access
  ('view_own_data', 'View Own Data', 'Permission to view_own_data'),
  ('edit_own_data', 'Edit Own Data', 'Permission to edit_own_data'),
  ('view_all_data', 'View All Data', 'Permission to view_all_data'),
  ('edit_all_data', 'Edit All Data', 'Permission to edit_all_data'),
  ('delete_any_data', 'Delete Any Data', 'Permission to delete_any_data'),
  
  -- Analytics
  ('view_analytics', 'View Analytics', 'Permission to view_analytics'),
  ('view_audit_logs', 'View Audit Logs', 'Permission to view_audit_logs'),
  
  -- Configuration
  ('manage_system_config', 'Manage System Config', 'Permission to manage_system_config'),
  ('manage_app_settings', 'Manage App Settings', 'Permission to manage_app_settings')
ON CONFLICT (name) DO NOTHING;

-- Step 7: Assign permissions to roles
-- ============================================================================

-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- User: Own data access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' 
  AND p.name IN ('view_own_data', 'edit_own_data')
ON CONFLICT DO NOTHING;

-- Viewer: Read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer' 
  AND p.name IN ('view_own_data')
ON CONFLICT DO NOTHING;

-- Moderator: User management + own data
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'moderator' 
  AND p.name IN ('view_users', 'edit_users', 'view_own_data', 'edit_own_data', 'view_analytics')
ON CONFLICT DO NOTHING;

-- Step 8: Assign admin role to existing admin user
-- ============================================================================

UPDATE usuarios
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE username = 'admin' AND role_id IS NULL;

-- Step 9: Assign user role to all other existing users
-- ============================================================================

UPDATE usuarios
SET role_id = (SELECT id FROM roles WHERE name = 'user')
WHERE role_id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  roles_count INT;
  permissions_count INT;
  admin_perms_count INT;
  users_with_roles INT;
BEGIN
  SELECT COUNT(*) INTO roles_count FROM roles;
  SELECT COUNT(*) INTO permissions_count FROM permissions;
  SELECT COUNT(*) INTO admin_perms_count 
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    WHERE r.name = 'admin';
  SELECT COUNT(*) INTO users_with_roles FROM usuarios WHERE role_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║           ✅ RBAC SYSTEM MIGRATION COMPLETED             ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Roles created: %', roles_count;
  RAISE NOTICE '   - Permissions created: %', permissions_count;
  RAISE NOTICE '   - Admin permissions: %', admin_perms_count;
  RAISE NOTICE '   - Users with roles: %', users_with_roles;
  RAISE NOTICE '';
  RAISE NOTICE '👥 Roles:';
  RAISE NOTICE '   - admin: Full system access';
  RAISE NOTICE '   - user: Standard user (default for new users)';
  RAISE NOTICE '   - viewer: Read-only access';
  RAISE NOTICE '   - moderator: User management';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security:';
  RAISE NOTICE '   ✓ Existing admin user has admin role';
  RAISE NOTICE '   ✓ All users have been assigned roles';
  RAISE NOTICE '   ✓ New users will get "user" role by default';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Restart backend to initialize roles/permissions';
  RAISE NOTICE '   2. Access /v1/admin/users (admin only)';
  RAISE NOTICE '   3. Manage user roles via admin panel';
  RAISE NOTICE '';
END $$;

-- List current role assignments
SELECT 
  u.id,
  u.username,
  u.email,
  r.name as role,
  r.display_name as role_display_name
FROM usuarios u
LEFT JOIN roles r ON r.id = u.role_id
ORDER BY u.id;



-- ============================================================================
-- Migration: add_config_fields.sql
-- ============================================================================
-- Agregar campos tipo_cambio_usd_ars y margen_ganancia_porcentaje a configuracion_usuario
-- Ejecutar: psql -U postgres -d dentiproject -f migrations/add_config_fields.sql

ALTER TABLE configuracion_usuario 
ADD COLUMN IF NOT EXISTS tipo_cambio_usd_ars DECIMAL(10, 2) DEFAULT 1335,
ADD COLUMN IF NOT EXISTS margen_ganancia_porcentaje DECIMAL(5, 2) DEFAULT 40;

-- Actualizar registros existentes con valores por defecto si son NULL
UPDATE configuracion_usuario 
SET tipo_cambio_usd_ars = 1335 
WHERE tipo_cambio_usd_ars IS NULL;

UPDATE configuracion_usuario 
SET margen_ganancia_porcentaje = 40 
WHERE margen_ganancia_porcentaje IS NULL;


-- ============================================================================
-- Migration: add_unique_patient_constraint.sql
-- ============================================================================
-- Migration: Add unique constraint for patients to prevent duplicates
-- This ensures a user cannot have duplicate patients with the same DNI

-- Step 1: Clean up existing duplicates (keep the oldest record for each duplicate)
WITH duplicates AS (
    SELECT 
        id,
        usuario_id,
        dni,
        ROW_NUMBER() OVER (
            PARTITION BY usuario_id, LOWER(TRIM(dni)) 
            ORDER BY fecha_registro ASC, id ASC
        ) as rn
    FROM pacientes
    WHERE dni IS NOT NULL 
    AND dni != ''
    AND dni NOT LIKE 'CSV%'  -- Exclude temporary DNIs from CSV imports
)
DELETE FROM pacientes
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint on (usuario_id, dni) for non-null DNIs
-- This prevents future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_usuario_dni_unique 
ON pacientes (usuario_id, LOWER(TRIM(dni))) 
WHERE dni IS NOT NULL AND dni != '' AND dni NOT LIKE 'CSV%';

-- Step 3: Add index for better performance on name searches
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre_apellido 
ON pacientes (usuario_id, LOWER(nombre), LOWER(apellido));

-- Step 4: Add composite index for fuzzy matching (using expression index)
CREATE INDEX IF NOT EXISTS idx_pacientes_search 
ON pacientes (usuario_id, lower(trim(nombre || ' ' || apellido)));


-- ============================================================================
-- Migration: add_dientes_to_consultas.sql
-- ============================================================================
-- Agregar campo dientes_tratados a la tabla consultas
-- Almacena array de números de dientes tratados (11, 21, etc.)

ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS dientes_tratados INTEGER[] DEFAULT '{}';

-- Crear índice para búsquedas rápidas por diente
CREATE INDEX IF NOT EXISTS idx_consultas_dientes_tratados 
ON consultas USING GIN (dientes_tratados);

-- Comentario
COMMENT ON COLUMN consultas.dientes_tratados IS 'Array de números de dientes tratados en esta consulta (numeración universal)';


-- ============================================================================
-- Migration: add_turnos_system.sql
-- ============================================================================
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


-- ============================================================================
-- Migration: update_turnos_config.sql
-- ============================================================================
-- Migración: Agregar campos de configuración de turnos
-- Fecha: 2025-10-08
-- Descripción: Agrega hora_inicio_dia, hora_fin_dia y link_reserva_unico

-- Agregar columnas a configuracion_turnos
ALTER TABLE configuracion_turnos 
ADD COLUMN IF NOT EXISTS hora_inicio_dia VARCHAR(5) DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS hora_fin_dia VARCHAR(5) DEFAULT '20:00',
ADD COLUMN IF NOT EXISTS link_reserva_unico VARCHAR(50) UNIQUE;

-- Crear índice para link_reserva_unico
CREATE INDEX IF NOT EXISTS idx_configuracion_turnos_link_unico 
ON configuracion_turnos(link_reserva_unico);

-- Generar links únicos para configuraciones existentes
-- Formato: usuario_id como slug (ej: "dr-juan-perez-123")
UPDATE configuracion_turnos ct
SET link_reserva_unico = CONCAT(
    'odontologo-',
    CAST(ct.usuario_id AS VARCHAR)
)
WHERE link_reserva_unico IS NULL;

-- Comentarios
COMMENT ON COLUMN configuracion_turnos.hora_inicio_dia IS 'Hora de inicio del día laboral (formato HH:MM)';
COMMENT ON COLUMN configuracion_turnos.hora_fin_dia IS 'Hora de fin del día laboral (formato HH:MM)';
COMMENT ON COLUMN configuracion_turnos.link_reserva_unico IS 'Slug único para el link de reservas públicas';


-- ============================================================================
-- Migration: fix_pacientes_fields.sql
-- ============================================================================
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















-- ============================================================================
-- Migration: add_plan_fields.sql
-- ============================================================================
-- Migration: Add plan management fields to usuarios table
-- Date: 2025-10-04
-- Description: Adds fecha_inicio_plan for tracking when a plan was assigned

-- Add fecha_inicio_plan column
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS fecha_inicio_plan DATE;

-- Update comment on existing fecha_vencimiento column
COMMENT ON COLUMN usuarios.fecha_vencimiento IS 'Fecha de vencimiento del plan (principalmente para trial)';
COMMENT ON COLUMN usuarios.fecha_inicio_plan IS 'Fecha de inicio del plan actual';

-- Set fecha_inicio_plan to fecha_registro for existing users
UPDATE usuarios 
SET fecha_inicio_plan = fecha_registro::date
WHERE fecha_inicio_plan IS NULL;

-- For trial users without fecha_vencimiento, set it to 7 days after registration
UPDATE usuarios
SET fecha_vencimiento = (fecha_registro::date + INTERVAL '7 days')
WHERE plan = 'trial' AND fecha_vencimiento IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_usuarios_plan ON usuarios(plan);
CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_vencimiento ON usuarios(fecha_vencimiento);















-- ============================================================================
-- Migration: cleanup_duplicate_patients.sql
-- ============================================================================
-- Script para eliminar pacientes duplicados creados por importación CSV
-- Solo elimina pacientes SIN consultas asociadas y con DNI que empiece con "CSV"

-- Ver duplicados antes de eliminar
SELECT 
    id, 
    nombre, 
    apellido, 
    dni, 
    usuario_id,
    (SELECT COUNT(*) FROM consultas WHERE paciente_id = pacientes.id) as num_consultas
FROM pacientes 
WHERE dni LIKE 'CSV%' 
  AND (SELECT COUNT(*) FROM consultas WHERE paciente_id = pacientes.id) = 0
ORDER BY nombre, apellido, id DESC;

-- Eliminar pacientes duplicados SIN consultas
DELETE FROM pacientes 
WHERE dni LIKE 'CSV%' 
  AND (SELECT COUNT(*) FROM consultas WHERE paciente_id = pacientes.id) = 0;

-- Mostrar resultado
SELECT 
    COUNT(*) as pacientes_restantes,
    COUNT(DISTINCT CONCAT(nombre, ' ', apellido)) as nombres_unicos
FROM pacientes 
WHERE dni LIKE 'CSV%';

-- Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE 'Limpieza completada. Pacientes duplicados sin consultas eliminados.';
END $$;















-- ============================================================================
-- Migration: add_import_hash.sql
-- ============================================================================
-- Add import_hash column to consultas table for duplicate detection
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS import_hash VARCHAR(64);

-- Create index on import_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_consultas_import_hash ON consultas(import_hash);

-- Create composite index for unique identification
CREATE INDEX IF NOT EXISTS idx_consulta_unica ON consultas(usuario_id, paciente_id, prestacion_usuario_id, fecha_consulta, monto_ars);

-- Add comment
COMMENT ON COLUMN consultas.import_hash IS 'SHA256 hash for CSV import duplicate detection';















-- ============================================================================
-- Migration: make_dni_mandatory.sql
-- ============================================================================
-- Migration: Make DNI mandatory for all patients
-- This script updates existing patients without DNI and makes the field NOT NULL

BEGIN;

-- Step 1: Update patients without DNI to have a temporary DNI
-- Using format TEMP-<id> to be easily identifiable
UPDATE pacientes
SET dni = 'TEMP-' || id::text
WHERE dni IS NULL OR dni = '';

-- Step 2: Verify all patients now have DNI
DO $$
DECLARE
    patients_without_dni INTEGER;
BEGIN
    SELECT COUNT(*) INTO patients_without_dni
    FROM pacientes
    WHERE dni IS NULL OR dni = '';
    
    IF patients_without_dni > 0 THEN
        RAISE EXCEPTION 'Still have % patients without DNI', patients_without_dni;
    ELSE
        RAISE NOTICE 'All % patients now have DNI', (SELECT COUNT(*) FROM pacientes);
    END IF;
END $$;

-- Step 3: Make DNI NOT NULL in the database
ALTER TABLE pacientes 
ALTER COLUMN dni SET NOT NULL;

-- Step 4: Add UNIQUE constraint on DNI (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pacientes_dni_unique'
    ) THEN
        ALTER TABLE pacientes ADD CONSTRAINT pacientes_dni_unique UNIQUE (dni);
        RAISE NOTICE 'Added UNIQUE constraint on DNI';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on DNI already exists';
    END IF;
END $$;

-- Step 5: Add check constraint for minimum length (7 characters) (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pacientes_dni_min_length'
    ) THEN
        ALTER TABLE pacientes ADD CONSTRAINT pacientes_dni_min_length CHECK (length(dni) >= 7);
        RAISE NOTICE 'Added check constraint for DNI minimum length';
    ELSE
        RAISE NOTICE 'Check constraint for DNI minimum length already exists';
    END IF;
END $$;

-- Step 6: Create index on DNI for better performance on searches
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON pacientes (LOWER(TRIM(dni)));

COMMIT;

-- After this migration, all patients have DNI
-- Patients with TEMP-* DNI should be updated by users to real DNI














-- ============================================================================
-- Migration: add_link_turnos_table.sql
-- ============================================================================
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








-- ============================================================================
-- Migration: add_moneda_to_gastos_fijos.sql
-- ============================================================================
-- Add moneda field to gastos_fijos table
ALTER TABLE gastos_fijos ADD COLUMN IF NOT EXISTS moneda VARCHAR(3) DEFAULT 'ARS';

COMMENT ON COLUMN gastos_fijos.moneda IS 'Currency code (ARS/USD)';



-- ============================================================================
-- Migration: add_observaciones_to_prestaciones.sql
-- ============================================================================
-- Add observaciones field to prestaciones table
ALTER TABLE prestaciones ADD COLUMN IF NOT EXISTS observaciones TEXT;

COMMENT ON COLUMN prestaciones.observaciones IS 'Additional observations for the service';



-- ============================================================================
-- Migration: add_payment_verification_fields.sql
-- ============================================================================
-- Add payment verification fields to usuarios table
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_verificacion_pago DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pago_verificado BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN usuarios.ultima_verificacion_pago IS 'Last payment verification date';
COMMENT ON COLUMN usuarios.pago_verificado IS 'Payment verified flag';



-- ============================================================================
-- Migration: add_password_reset_fields.sql
-- ============================================================================
-- Agregar campos para reset de contraseña
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(6);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_reset_token ON usuarios(reset_password_token) WHERE reset_password_token IS NOT NULL;



-- ============================================================================
-- Migration: add_payment_audit_actions.sql
-- ============================================================================
-- Add new audit action types for payment verification and plan assignment
ALTER TYPE tipoaccion ADD VALUE IF NOT EXISTS 'verificar_pago';
ALTER TYPE tipoaccion ADD VALUE IF NOT EXISTS 'asignar_plan';

-- Verify the new values were added
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipoaccion') ORDER BY enumlabel;



-- ============================================================================
-- Migration: make_password_hash_nullable.sql
-- ============================================================================
-- Migration: Make password_hash nullable for Google OAuth users
-- Date: 2025-10-22

-- Make password_hash nullable
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;

-- Add comment to explain
COMMENT ON COLUMN usuarios.password_hash IS 'Password hash for local authentication. NULL for OAuth users (Google, etc.)';





-- ============================================================================
-- Migration: set_trial_dates_for_existing_users.sql
-- ============================================================================
-- Set trial dates for existing users without them
UPDATE usuarios
SET
    fecha_inicio_plan = COALESCE(fecha_inicio_plan, fecha_registro::DATE),
    fecha_vencimiento = COALESCE(fecha_vencimiento, fecha_registro::DATE + INTERVAL '14 days')
WHERE
    fecha_inicio_plan IS NULL OR fecha_vencimiento IS NULL;



