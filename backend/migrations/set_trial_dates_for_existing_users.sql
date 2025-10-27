-- Set trial dates for existing users without them
UPDATE usuarios
SET
    fecha_inicio_plan = COALESCE(fecha_inicio_plan, fecha_registro::DATE),
    fecha_vencimiento = COALESCE(fecha_vencimiento, fecha_registro::DATE + INTERVAL '14 days')
WHERE
    fecha_inicio_plan IS NULL OR fecha_vencimiento IS NULL;


