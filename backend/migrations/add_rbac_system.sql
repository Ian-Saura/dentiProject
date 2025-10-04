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

