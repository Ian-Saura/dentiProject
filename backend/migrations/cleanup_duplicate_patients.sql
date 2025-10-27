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















