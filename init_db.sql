-- =====================================================
-- ESQUEMA POSTGRESQL PARA SISTEMA DE CONSULTORIO
-- Conversión de MySQL a PostgreSQL
-- =====================================================

-- Crear tipos ENUM para PostgreSQL
CREATE TYPE especialidad_enum AS ENUM ('odontologia', 'dermatologia', 'kinesiologia');
CREATE TYPE plan_enum AS ENUM ('trial', 'premium', 'enterprise');
CREATE TYPE categoria_prestacion_enum AS ENUM ('diagnostico', 'prevencion', 'operatoria', 'endodoncia', 'cirugia', 'protesis', 'ortodoncia', 'estetica');
CREATE TYPE complejidad_enum AS ENUM ('baja', 'media', 'alta', 'muy_alta');
CREATE TYPE categoria_insumo_enum AS ENUM ('descartable', 'farmaco', 'material_restaurador', 'instrumental', 'laboratorio', 'radiologia', 'otros');
CREATE TYPE unidad_medida_enum AS ENUM ('unidad', 'ml', 'gr', 'cm', 'caja', 'blister', 'metro');
CREATE TYPE metodo_pago_enum AS ENUM ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mercadopago', 'otro');
CREATE TYPE estado_consulta_enum AS ENUM ('pendiente', 'en_curso', 'completada', 'cancelada');
CREATE TYPE tipo_gasto_enum AS ENUM ('alquiler', 'servicios', 'impuestos', 'seguros', 'mantenimiento', 'sueldos', 'marketing', 'otros');
CREATE TYPE frecuencia_enum AS ENUM ('mensual', 'bimestral', 'trimestral', 'semestral', 'anual');

-- =====================================================
-- 1. TABLA USUARIOS
-- =====================================================
CREATE TABLE usuarios (
   id SERIAL PRIMARY KEY,
   username VARCHAR(50) UNIQUE NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   nombre VARCHAR(100) NOT NULL,
   apellido VARCHAR(100),
   email VARCHAR(150) UNIQUE,
   telefono VARCHAR(20),
   especialidad especialidad_enum NOT NULL,
   plan plan_enum DEFAULT 'trial',
   fecha_vencimiento DATE,
   fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   ultimo_acceso TIMESTAMP,
   activo BOOLEAN DEFAULT TRUE
);

-- Nota: El usuario admin se crea mediante script Python con contraseña hasheada
-- No se incluyen usuarios de prueba por seguridad

-- =====================================================
-- 2. TABLA PRESTACIONES
-- =====================================================
CREATE TABLE prestaciones (
   id SERIAL PRIMARY KEY,
   codigo VARCHAR(20) UNIQUE NOT NULL,
   nombre VARCHAR(150) NOT NULL,
   categoria categoria_prestacion_enum NOT NULL,
   subcategoria VARCHAR(50),
   tiempo_estimado_min INT NOT NULL,
   complejidad complejidad_enum DEFAULT 'media',
   requiere_anestesia BOOLEAN DEFAULT FALSE,
   requiere_radiografia BOOLEAN DEFAULT FALSE,
   es_multisesion BOOLEAN DEFAULT FALSE,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO prestaciones (codigo, nombre, categoria, subcategoria, tiempo_estimado_min, complejidad, requiere_anestesia, requiere_radiografia) VALUES
('P001', 'Consulta General', 'diagnostico', 'consulta_inicial', 30, 'baja', FALSE, FALSE),
('P002', 'Limpieza Dental', 'prevencion', 'profilaxis', 45, 'baja', FALSE, FALSE),
('P003', 'Empaste Simple', 'operatoria', 'restauracion', 60, 'media', TRUE, FALSE),
('P004', 'Extracción Simple', 'cirugia', 'exodoncia', 45, 'media', TRUE, TRUE),
('P005', 'Endodoncia Molar', 'endodoncia', 'conducto', 90, 'alta', TRUE, TRUE);

-- =====================================================
-- 3. TABLA INSUMOS BASICOS
-- =====================================================
CREATE TABLE insumos_basicos (
   id SERIAL PRIMARY KEY,
   codigo VARCHAR(20) UNIQUE NOT NULL,
   nombre VARCHAR(150) NOT NULL,
   categoria categoria_insumo_enum NOT NULL,
   unidad_medida unidad_medida_enum NOT NULL,
   marca_referencia VARCHAR(100),
   stock_minimo DECIMAL(10,2) DEFAULT 0,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO insumos_basicos (codigo, nombre, categoria, unidad_medida, marca_referencia) VALUES
('INS001', 'Guantes de látex', 'descartable', 'caja', 'Sempermed'),
('INS002', 'Anestesia Lidocaína 2%', 'farmaco', 'unidad', 'Densply'),
('INS003', 'Resina Composite', 'material_restaurador', 'gr', '3M'),
('INS004', 'Algodón', 'descartable', 'unidad', 'Genérico'),
('INS005', 'Eyector de saliva', 'descartable', 'unidad', 'Genérico');

-- =====================================================
-- 4. TABLA PRESTACIONES_INSUMOS_BASICOS
-- =====================================================
CREATE TABLE prestaciones_insumos_basicos (
   id SERIAL PRIMARY KEY,
   prestacion_id INT NOT NULL REFERENCES prestaciones(id) ON DELETE CASCADE,
   insumo_id INT NOT NULL REFERENCES insumos_basicos(id) ON DELETE CASCADE,
   cantidad_estimada DECIMAL(10,2) NOT NULL,
   es_opcional BOOLEAN DEFAULT FALSE,
   UNIQUE(prestacion_id, insumo_id)
);

-- Datos de prueba
INSERT INTO prestaciones_insumos_basicos (prestacion_id, insumo_id, cantidad_estimada, es_opcional) VALUES
(3, 1, 2.00, FALSE),  -- Empaste usa guantes
(3, 2, 1.00, FALSE),  -- Empaste usa anestesia
(3, 3, 5.00, FALSE),  -- Empaste usa resina
(4, 1, 2.00, FALSE),  -- Extracción usa guantes
(4, 2, 2.00, FALSE);  -- Extracción usa anestesia

-- =====================================================
-- 5. TABLA PACIENTES
-- =====================================================
CREATE TABLE pacientes (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   nombre VARCHAR(100) NOT NULL,
   apellido VARCHAR(100) NOT NULL,
   dni VARCHAR(20) UNIQUE,
   fecha_nacimiento DATE,
   telefono VARCHAR(20),
   email VARCHAR(150),
   direccion TEXT,
   obra_social VARCHAR(100),
   numero_afiliado VARCHAR(50),
   notas_medicas TEXT,
   activo BOOLEAN DEFAULT TRUE,
   fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO pacientes (usuario_id, nombre, apellido, dni, fecha_nacimiento, telefono, email) VALUES
(1, 'Carlos', 'Pérez', '30123456', '1985-05-15', '11-2345-6789', 'carlos@email.com'),
(1, 'Ana', 'Martínez', '28987654', '1990-08-22', '11-8765-4321', 'ana@email.com');

-- =====================================================
-- 6. TABLA CONSULTAS
-- =====================================================
CREATE TABLE consultas (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
   fecha_hora TIMESTAMP NOT NULL,
   duracion_minutos INT,
   estado estado_consulta_enum DEFAULT 'pendiente',
   notas TEXT,
   diagnostico TEXT,
   tratamiento_realizado TEXT,
   monto_total DECIMAL(10,2) DEFAULT 0,
   metodo_pago metodo_pago_enum,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO consultas (usuario_id, paciente_id, fecha_hora, duracion_minutos, estado, monto_total, metodo_pago) VALUES
(1, 1, '2025-01-15 10:00:00', 60, 'completada', 5000.00, 'efectivo'),
(1, 2, '2025-01-16 14:00:00', 45, 'completada', 3500.00, 'tarjeta_debito');

-- =====================================================
-- 7. TABLA PRESTACIONES_USUARIO
-- =====================================================
CREATE TABLE prestaciones_usuario (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   prestacion_id INT NOT NULL REFERENCES prestaciones(id) ON DELETE CASCADE,
   precio DECIMAL(10,2) NOT NULL,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE(usuario_id, prestacion_id)
);

-- Datos de prueba
INSERT INTO prestaciones_usuario (usuario_id, prestacion_id, precio) VALUES
(1, 1, 3000.00),
(1, 2, 4000.00),
(1, 3, 5000.00),
(1, 4, 6000.00),
(1, 5, 15000.00);

-- =====================================================
-- 8. TABLA GASTOS FIJOS
-- =====================================================
CREATE TABLE gastos_fijos (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   concepto VARCHAR(150) NOT NULL,
   tipo tipo_gasto_enum NOT NULL,
   monto DECIMAL(10,2) NOT NULL,
   frecuencia frecuencia_enum DEFAULT 'mensual',
   activo BOOLEAN DEFAULT TRUE,
   fecha_inicio DATE NOT NULL,
   fecha_fin DATE,
   notas TEXT,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO gastos_fijos (usuario_id, concepto, tipo, monto, frecuencia, fecha_inicio) VALUES
(1, 'Alquiler del consultorio', 'alquiler', 80000.00, 'mensual', '2025-01-01'),
(1, 'Luz', 'servicios', 5000.00, 'mensual', '2025-01-01'),
(1, 'Internet', 'servicios', 8000.00, 'mensual', '2025-01-01');

-- =====================================================
-- 9. TABLA COSTOS EQUIPOS
-- =====================================================
CREATE TABLE costos_equipos (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   nombre VARCHAR(150) NOT NULL,
   costo_total DECIMAL(12,2) NOT NULL,
   vida_util_meses INT NOT NULL,
   fecha_compra DATE NOT NULL,
   costo_mensual DECIMAL(10,2) GENERATED ALWAYS AS (costo_total / NULLIF(vida_util_meses, 0)) STORED,
   activo BOOLEAN DEFAULT TRUE,
   notas TEXT,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO costos_equipos (usuario_id, nombre, costo_total, vida_util_meses, fecha_compra) VALUES
(1, 'Sillón Odontológico', 500000.00, 120, '2024-01-15'),
(1, 'Compresor', 150000.00, 60, '2024-02-10');

-- =====================================================
-- 10. TABLA COMPRAS
-- =====================================================
CREATE TABLE compras (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   insumo_id INT NOT NULL REFERENCES insumos_basicos(id) ON DELETE CASCADE,
   fecha_compra DATE NOT NULL,
   cantidad DECIMAL(10,2) NOT NULL,
   precio_unitario DECIMAL(10,2) NOT NULL,
   precio_total DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
   proveedor VARCHAR(100),
   numero_factura VARCHAR(50),
   notas TEXT,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO compras (usuario_id, insumo_id, fecha_compra, cantidad, precio_unitario, proveedor) VALUES
(1, 1, '2025-01-10', 10.00, 2500.00, 'Droguería del Sur'),
(1, 2, '2025-01-10', 50.00, 350.00, 'Droguería del Sur'),
(1, 3, '2025-01-12', 5.00, 8000.00, 'Dental Sur');

-- =====================================================
-- 11. TABLA CONFIGURACION_USUARIO
-- =====================================================
CREATE TABLE configuracion_usuario (
   id SERIAL PRIMARY KEY,
   usuario_id INT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
   dias_laborables JSONB DEFAULT '{"lunes":true,"martes":true,"miercoles":true,"jueves":true,"viernes":true,"sabado":false,"domingo":false}',
   hora_inicio TIME DEFAULT '09:00:00',
   hora_fin TIME DEFAULT '18:00:00',
   duracion_turno_min INT DEFAULT 30,
   moneda VARCHAR(10) DEFAULT 'ARS',
   zona_horaria VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
   notificaciones_email BOOLEAN DEFAULT TRUE,
   notificaciones_sms BOOLEAN DEFAULT FALSE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba
INSERT INTO configuracion_usuario (usuario_id) VALUES (1), (2);

-- =====================================================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_pacientes_usuario ON pacientes(usuario_id);
CREATE INDEX idx_pacientes_dni ON pacientes(dni);
CREATE INDEX idx_consultas_usuario ON consultas(usuario_id);
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_fecha ON consultas(fecha_hora);
CREATE INDEX idx_prestaciones_usuario_usuario ON prestaciones_usuario(usuario_id);
CREATE INDEX idx_gastos_fijos_usuario ON gastos_fijos(usuario_id);
CREATE INDEX idx_costos_equipos_usuario ON costos_equipos(usuario_id);
CREATE INDEX idx_compras_usuario ON compras(usuario_id);
CREATE INDEX idx_compras_insumo ON compras(insumo_id);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de prestaciones con precios por usuario
CREATE VIEW v_prestaciones_precios AS
SELECT 
    pu.usuario_id,
    p.id as prestacion_id,
    p.codigo,
    p.nombre,
    p.categoria,
    pu.precio,
    p.tiempo_estimado_min
FROM prestaciones p
LEFT JOIN prestaciones_usuario pu ON p.id = pu.prestacion_id
WHERE p.activo = TRUE AND (pu.activo = TRUE OR pu.activo IS NULL);

-- Vista de consultas con información completa
CREATE VIEW v_consultas_completas AS
SELECT 
    c.id,
    c.fecha_hora,
    c.estado,
    c.monto_total,
    u.nombre as profesional_nombre,
    u.apellido as profesional_apellido,
    p.nombre as paciente_nombre,
    p.apellido as paciente_apellido,
    p.dni as paciente_dni
FROM consultas c
JOIN usuarios u ON c.usuario_id = u.id
JOIN pacientes p ON c.paciente_id = p.id;

COMMENT ON DATABASE consultorio_db IS 'Base de datos del sistema de gestión de consultorios';

