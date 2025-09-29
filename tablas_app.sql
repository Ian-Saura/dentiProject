-- =====================================================
-- ESQUEMA COMPLETO DEL SISTEMA DE CONSULTORIO
-- 11 TABLAS CON DATOS DE PRUEBA VINCULADOS
-- =====================================================
CREATE DATABASE IF NOT EXISTS consultorio_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE consultorio_db;
-- =====================================================
-- 1. TABLA USUARIOS (BASE - SIN FK)
-- =====================================================

CREATE TABLE usuarios (
   id INT PRIMARY KEY AUTO_INCREMENT,
   username VARCHAR(50) UNIQUE NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   nombre VARCHAR(100) NOT NULL,
   apellido VARCHAR(100),
   email VARCHAR(150) UNIQUE,
   telefono VARCHAR(20),
   especialidad ENUM('odontologia', 'dermatologia', 'kinesiologia') NOT NULL,
   plan ENUM('trial', 'premium', 'enterprise') DEFAULT 'trial',
   fecha_vencimiento DATE,
   fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   ultimo_acceso TIMESTAMP,
   activo BOOLEAN DEFAULT TRUE
);

-- Datos de prueba
INSERT INTO usuarios (username, password_hash, nombre, apellido, email, telefono, especialidad, plan) VALUES
('dr_juan_corte', 'hash123456', 'Juan Manuel', 'De La Corte', 'juan@consultorio.com', '3624-555001', 'odontologia', 'premium'),
('dra_maria_gomez', 'hash789012', 'María Laura', 'Gómez', 'maria@dental.com', '11-4567-8901', 'odontologia', 'trial');

-- =====================================================
-- 2. TABLA PRESTACIONES (BASE - SIN FK)
-- =====================================================

CREATE TABLE prestaciones (
   id INT PRIMARY KEY AUTO_INCREMENT,
   codigo VARCHAR(20) UNIQUE NOT NULL,
   nombre VARCHAR(150) NOT NULL,
   categoria ENUM('diagnostico', 'prevencion', 'operatoria', 'endodoncia', 'cirugia', 'protesis', 'ortodoncia', 'estetica') NOT NULL,
   subcategoria VARCHAR(50),
   tiempo_estimado_min INT NOT NULL,
   complejidad ENUM('baja', 'media', 'alta', 'muy_alta') DEFAULT 'media',
   requiere_anestesia BOOLEAN DEFAULT FALSE,
   requiere_radiografia BOOLEAN DEFAULT FALSE,
   es_multisesion BOOLEAN DEFAULT FALSE,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
   CHECK (tiempo_estimado_min > 0 AND tiempo_estimado_min <= 600)
);

-- Datos de prueba
INSERT INTO prestaciones (codigo, nombre, categoria, subcategoria, tiempo_estimado_min, complejidad, requiere_anestesia, requiere_radiografia) VALUES
('CONS001', 'Consulta Odontológica', 'diagnostico', 'inicial', 30, 'baja', FALSE, FALSE),
('OPER001', 'Operatoria Simple', 'operatoria', 'una_cara', 60, 'media', TRUE, FALSE),
('ENDO001', 'Endodoncia Unirradicular', 'endodoncia', 'anterior', 180, 'alta', TRUE, TRUE),
('PREV001', 'Profilaxis y Limpieza', 'prevencion', 'basica', 45, 'baja', FALSE, FALSE),
('CIRU001', 'Extracción Simple', 'cirugia', 'simple', 30, 'media', TRUE, FALSE);

-- =====================================================
-- 3. TABLA INSUMOS_BASICOS (BASE - SIN FK)
-- =====================================================

CREATE TABLE insumos_basicos (
   id INT PRIMARY KEY AUTO_INCREMENT,
   codigo VARCHAR(20) UNIQUE NOT NULL,
   nombre VARCHAR(150) NOT NULL,
   categoria ENUM('descartable', 'farmaco', 'material_restaurador', 'instrumental', 'laboratorio', 'radiologia', 'otros') NOT NULL,
   unidad_medida ENUM('unidad', 'ml', 'gr', 'cm', 'caja', 'blister', 'metro') NOT NULL,
   marca_referencia VARCHAR(100),
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
   CHECK (LENGTH(codigo) >= 3),
   CHECK (LENGTH(nombre) >= 3)
);

-- Datos de prueba
INSERT INTO insumos_basicos (codigo, nombre, categoria, unidad_medida, marca_referencia) VALUES
('DESC001', 'Guantes de Nitrilo', 'descartable', 'unidad', 'Sempermed'),
('FARM001', 'Lidocaína 2% con Epinefrina', 'farmaco', 'ml', 'DFL'),
('REST001', 'Resina Compuesta A2', 'material_restaurador', 'gr', 'Filtek 3M'),
('INST001', 'Fresa Carburo #330', 'instrumental', 'unidad', 'Komet'),
('DESC002', 'Barbijo Quirúrgico', 'descartable', 'unidad', 'Atom Protect'),
('RADIO001', 'Película Periapical', 'radiologia', 'unidad', 'Kodak');

-- =====================================================
-- 4. TABLA PRESTACIONES_INSUMOS_BASICOS (FK: prestacion_id, insumo_basico_id)
-- =====================================================

CREATE TABLE prestaciones_insumos_basicos (
   id INT PRIMARY KEY AUTO_INCREMENT,
   prestacion_id INT NOT NULL,
   insumo_basico_id INT NOT NULL,
   cantidad_estimada DECIMAL(8,3) NOT NULL,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
   FOREIGN KEY (prestacion_id) REFERENCES prestaciones(id) ON DELETE CASCADE,
   FOREIGN KEY (insumo_basico_id) REFERENCES insumos_basicos(id) ON DELETE RESTRICT,
   UNIQUE KEY unique_prestacion_insumo (prestacion_id, insumo_basico_id),
   
   CHECK (cantidad_estimada > 0)
);

-- Datos de prueba (Fórmulas de tratamientos)
INSERT INTO prestaciones_insumos_basicos (prestacion_id, insumo_basico_id, cantidad_estimada) VALUES
-- Consulta usa: guantes + barbijo
(1, 1, 2.0),  -- 2 guantes
(1, 5, 1.0),  -- 1 barbijo
-- Operatoria Simple usa: guantes + anestesia + resina + fresa
(2, 1, 2.0),  -- 2 guantes
(2, 2, 1.5),  -- 1.5ml anestesia
(2, 3, 0.5),  -- 0.5gr resina
(2, 4, 1.0),  -- 1 fresa
-- Endodoncia usa: guantes + anestesia + radiografías
(3, 1, 4.0),  -- 4 guantes (procedimiento largo)
(3, 2, 3.6),  -- 3.6ml anestesia
(3, 6, 3.0);  -- 3 radiografías

-- =====================================================
-- 5. TABLA PRESTACIONES_USUARIO (FK: usuario_id, prestacion_id)
-- =====================================================

CREATE TABLE prestaciones_usuario (
   id INT PRIMARY KEY AUTO_INCREMENT,
   usuario_id INT NOT NULL,
   prestacion_id INT NOT NULL,
   nombre_personalizado VARCHAR(150),
   tiempo_personal_min INT,
   margen_ganancia_porcentaje DECIMAL(5,2) DEFAULT 40.00,
   activo BOOLEAN DEFAULT TRUE,
   notas_personales TEXT,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   FOREIGN KEY (prestacion_id) REFERENCES prestaciones(id) ON DELETE RESTRICT,
   UNIQUE KEY unique_usuario_prestacion (usuario_id, prestacion_id),
   
   CHECK (margen_ganancia_porcentaje >= 0 AND margen_ganancia_porcentaje <= 300),
   CHECK (tiempo_personal_min IS NULL OR tiempo_personal_min > 0)
);

-- Datos de prueba
INSERT INTO prestaciones_usuario (usuario_id, prestacion_id, tiempo_personal_min, margen_ganancia_porcentaje, notas_personales) VALUES
-- Dr. Juan ofrece estos tratamientos:
(1, 1, 25, 30.00, 'Consulta express'),  -- Consulta más rápida, margen menor
(1, 2, 75, 45.00, 'Mi técnica con resina premium'),  -- Operatoria personalizada
(1, 3, 240, 55.00, 'Endodoncia con técnica rotatoria'),  -- Endodoncia más rápida
-- Dra. María ofrece otros:
(2, 1, NULL, 35.00, 'Consulta estándar'),  -- Usa tiempo estándar
(2, 4, 50, 40.00, 'Limpieza con ultrasonido avanzado');  -- Limpieza más rápida

-- =====================================================
-- 6. TABLA COMPRAS (FK: usuario_id, insumo_basico_id)
-- =====================================================

CREATE TABLE compras (
   id INT PRIMARY KEY AUTO_INCREMENT,
   usuario_id INT NOT NULL,
   insumo_basico_id INT NOT NULL,
   cantidad DECIMAL(10,2) NOT NULL,
   precio_total_ars DECIMAL(12,2) NOT NULL,
   fecha_compra DATE NOT NULL,
   proveedor VARCHAR(150),
   lote VARCHAR(50),
   fecha_vencimiento DATE,
   observaciones TEXT,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   FOREIGN KEY (insumo_basico_id) REFERENCES insumos_basicos(id) ON DELETE RESTRICT,
   
   CHECK (cantidad > 0),
   CHECK (precio_total_ars > 0)
);

-- Datos de prueba
INSERT INTO compras (usuario_id, insumo_basico_id, cantidad, precio_total_ars, fecha_compra, proveedor, lote) VALUES
-- Dr. Juan compras:
(1, 1, 100, 4500, '2025-09-01', 'MercadoLibre - DentalSupply', 'GL2025090'),
(1, 2, 10, 6500, '2025-09-05', 'Henry Schein', 'LD240905'),
(1, 3, 5, 6000, '2025-08-20', 'Dental Import', 'RS240820'),
-- Dra. María compras:
(2, 1, 200, 9200, '2025-09-10', 'Distribuidora Dental', 'GL2025091'),
(2, 4, 20, 36000, '2025-08-15', 'Komet Argentina', 'FR240815');

-- =====================================================
-- 7. TABLA CONFIGURACION_USUARIO (FK: usuario_id)
-- =====================================================

CREATE TABLE configuracion_usuario (
   id INT PRIMARY KEY AUTO_INCREMENT,
   usuario_id INT NOT NULL,
   costo_hora_calculado_ars DECIMAL(12,2),
   costo_hora_manual_ars DECIMAL(12,2),
   usar_costo_manual BOOLEAN DEFAULT FALSE,
   horas_anuales_trabajadas INT DEFAULT 1100,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   UNIQUE KEY unique_config_usuario (usuario_id),
   
   CHECK (costo_hora_calculado_ars IS NULL OR costo_hora_calculado_ars > 0),
   CHECK (costo_hora_manual_ars IS NULL OR costo_hora_manual_ars > 0),
   CHECK (horas_anuales_trabajadas > 0 AND horas_anuales_trabajadas <= 3000)
);

-- Datos de prueba
INSERT INTO configuracion_usuario (usuario_id, costo_hora_calculado_ars, costo_hora_manual_ars, usar_costo_manual, horas_anuales_trabajadas) VALUES
(1, 28500.00, 32000.00, FALSE, 1200),  -- Dr. Juan usa cálculo automático
(2, NULL, 30000.00, TRUE, 1000);       -- Dra. María usa costo manual

-- =====================================================
-- 8. TABLA COSTOS_EQUIPOS (FK: usuario_id)
-- =====================================================

CREATE TABLE costos_equipos (
   id INT PRIMARY KEY AUTO_INCREMENT,
   usuario_id INT NOT NULL,
   nombre_equipo VARCHAR(150) NOT NULL,
   monto_compra_usd DECIMAL(12,2) NOT NULL,
   fecha_compra DATE NOT NULL,
   anios_vida_util INT NOT NULL,
   marca VARCHAR(100),
   modelo VARCHAR(100),
   observaciones TEXT,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   
   CHECK (monto_compra_usd > 0),
   CHECK (anios_vida_util > 0 AND anios_vida_util <= 50)
);

-- Datos de prueba
INSERT INTO costos_equipos (usuario_id, nombre_equipo, monto_compra_usd, fecha_compra, anios_vida_util, marca, modelo) VALUES
-- Equipos Dr. Juan:
(1, 'Sillón Dental', 8500.00, '2020-03-15', 15, 'Gnatus', 'G2000'),
(1, 'Compresor Odontológico', 1200.00, '2022-06-10', 10, 'Schulz', 'MSV 6ML'),
-- Equipos Dra. María:
(2, 'Unidad Dental Completa', 12000.00, '2023-01-20', 12, 'Kavo', 'Primus 1058'),
(2, 'Autoclave', 800.00, '2023-02-15', 8, 'Cristófoli', 'Vitale 12L');

-- =====================================================
-- 9. TABLA GASTOS_FIJOS (FK: usuario_id)
-- =====================================================

CREATE TABLE gastos_fijos (
   id INT PRIMARY KEY AUTO_INCREMENT,
   usuario_id INT NOT NULL,
   concepto VARCHAR(100) NOT NULL,
   monto_mensual_ars DECIMAL(12,2) NOT NULL,
   observaciones TEXT,
   activo BOOLEAN DEFAULT TRUE,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   
   CHECK (monto_mensual_ars >= 0)
);

-- Datos de prueba
INSERT INTO gastos_fijos (usuario_id, concepto, monto_mensual_ars, observaciones) VALUES
-- Gastos Dr. Juan:
(1, 'Alquiler consultorio', 180000.00, 'Incluye expensas'),
(1, 'Servicios públicos', 25000.00, 'Luz, gas, agua promedio'),
(1, 'COCH', 8500.00, 'Colegio de Odontólogos Chaco'),
-- Gastos Dra. María:
(2, 'Alquiler consultorio CABA', 350000.00, 'Zona Palermo'),
(2, 'Servicios y expensas', 45000.00, 'Todo incluido');

-- =====================================================
-- 10. TABLA PACIENTES (FK: usuario_id)
-- =====================================================

CREATE TABLE pacientes (
   id INT PRIMARY KEY AUTO_INCREMENT,
   usuario_id INT NOT NULL,
   nombre VARCHAR(100) NOT NULL,
   apellido VARCHAR(100) NOT NULL,
   dni VARCHAR(20),
   fecha_nacimiento DATE,
   telefono VARCHAR(20),
   email VARCHAR(150),
   direccion TEXT,
   obra_social VARCHAR(100),
   numero_afiliado VARCHAR(50),
   contacto_emergencia VARCHAR(200),
   alergias TEXT,
   medicamentos_actuales TEXT,
   observaciones_medicas TEXT,
   fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   activo BOOLEAN DEFAULT TRUE,
   
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Datos de prueba
INSERT INTO pacientes (usuario_id, nombre, apellido, dni, fecha_nacimiento, telefono, email, obra_social) VALUES
-- Pacientes Dr. Juan:
(1, 'Carlos', 'Mendoza', '30123456789', '1985-06-15', '3624-555100', 'carlos@email.com', 'OSDE'),
(1, 'Ana', 'Rodriguez', '27456789012', '1988-03-22', '3624-555200', 'ana@email.com', 'Swiss Medical'),
-- Pacientes Dra. María:
(2, 'Roberto', 'Silva', '28789012345', '1987-11-08', '11-4444-1111', 'roberto@email.com', 'Medicus'),
(2, 'Laura', 'Fernandez', '35234567890', '1982-09-12', '11-4444-2222', 'laura@email.com', 'OSECAC');

-- =====================================================
-- 11. TABLA CONSULTAS (FK: prestacion_usuario_id, paciente_id, usuario_id)
-- =====================================================

CREATE TABLE consultas (
   id INT PRIMARY KEY AUTO_INCREMENT,
   paciente_id INT NOT NULL,
   prestacion_usuario_id INT NOT NULL,
   usuario_id INT NOT NULL,
   fecha_consulta DATE NOT NULL,
   monto_ars DECIMAL(10,2) NOT NULL,
   medio_pago ENUM('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago', 'otro') NOT NULL,
   pieza_dental VARCHAR(10),
   tiempo_real_minutos INT,
   estado ENUM('completada', 'pendiente', 'cancelada', 'no_asistio') DEFAULT 'completada',
   proxima_cita DATE,
   observaciones TEXT,
   notas_privadas TEXT,
   descuento_aplicado DECIMAL(5,2) DEFAULT 0,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   
   FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
   FOREIGN KEY (prestacion_usuario_id) REFERENCES prestaciones_usuario(id) ON DELETE RESTRICT,
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   
   CHECK (monto_ars > 0),
   CHECK (descuento_aplicado >= 0 AND descuento_aplicado <= 100),
   CHECK (tiempo_real_minutos IS NULL OR tiempo_real_minutos > 0)
);

-- Datos de prueba
INSERT INTO consultas (paciente_id, prestacion_usuario_id, usuario_id, fecha_consulta, monto_ars, medio_pago, pieza_dental, tiempo_real_minutos, observaciones) VALUES
-- Dr. Juan atendió:
(1, 1, 1, '2025-09-10', 35000.00, 'efectivo', NULL, 25, 'Control de rutina'),
(2, 2, 1, '2025-09-11', 65000.00, 'transferencia', '16', 80, 'Operatoria en molar superior'),
-- Dra. María atendió:
(3, 4, 2, '2025-09-09', 55000.00, 'debito', NULL, 45, 'Limpieza completa'),
(4, 5, 2, '2025-09-12', 42000.00, 'credito', NULL, 30, 'Consulta inicial');

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Prestaciones
CREATE INDEX idx_prestaciones_categoria ON prestaciones(categoria, activo);
CREATE INDEX idx_prestaciones_codigo ON prestaciones(codigo);

-- Insumos
CREATE INDEX idx_insumos_categoria ON insumos_basicos(categoria, activo);
CREATE INDEX idx_insumos_codigo ON insumos_basicos(codigo);

-- Prestaciones-Insumos
CREATE INDEX idx_prestaciones_insumos_prestacion ON prestaciones_insumos_basicos(prestacion_id, activo);
CREATE INDEX idx_prestaciones_insumos_insumo ON prestaciones_insumos_basicos(insumo_basico_id, activo);

-- Prestaciones Usuario
CREATE INDEX idx_prestaciones_usuario_activo ON prestaciones_usuario(usuario_id, activo);

-- Compras
CREATE INDEX idx_compras_usuario_fecha ON compras(usuario_id, fecha_compra DESC);
CREATE INDEX idx_compras_insumo_fecha ON compras(insumo_basico_id, fecha_compra DESC);

-- Equipos y Gastos
CREATE INDEX idx_costos_equipos_usuario ON costos_equipos(usuario_id, activo);
CREATE INDEX idx_gastos_fijos_usuario ON gastos_fijos(usuario_id, activo);

-- Pacientes y Consultas
CREATE INDEX idx_pacientes_usuario ON pacientes(usuario_id, activo);
CREATE INDEX idx_consultas_fecha_usuario ON consultas(usuario_id, fecha_consulta DESC);
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);

-- =====================================================
-- VISTA ÚTIL: PRECIOS CALCULADOS
-- =====================================================

CREATE VIEW v_prestaciones_precios AS
SELECT 
    pu.id AS prestacion_usuario_id,
    pu.usuario_id,
    u.nombre AS profesional,
    p.codigo,
    COALESCE(pu.nombre_personalizado, p.nombre) AS nombre_prestacion,
    COALESCE(pu.tiempo_personal_min, p.tiempo_estimado_min) AS tiempo_min,
    pu.margen_ganancia_porcentaje,
    COALESCE(
        (
            SELECT SUM(pib.cantidad_estimada * (c.precio_total_ars / c.cantidad))
            FROM prestaciones_insumos_basicos pib
            JOIN compras c 
                ON pib.insumo_basico_id = c.insumo_basico_id
            WHERE pib.prestacion_id = pu.prestacion_id 
              AND c.usuario_id = pu.usuario_id
              AND c.id = (
                  SELECT MAX(c2.id)
                  FROM compras c2
                  WHERE c2.usuario_id = c.usuario_id
                    AND c2.insumo_basico_id = c.insumo_basico_id
              )
        ), 0
    ) AS costo_insumos_estimado
FROM prestaciones_usuario pu
JOIN prestaciones p ON pu.prestacion_id = p.id
JOIN usuarios u ON pu.usuario_id = u.id
WHERE pu.activo = TRUE;
