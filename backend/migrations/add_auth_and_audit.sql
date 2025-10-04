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

