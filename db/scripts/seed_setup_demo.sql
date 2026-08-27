-- Limpiar antes
DELETE FROM sch_agenda.bloque_programacion WHERE agenda_id IN (SELECT id FROM sch_agenda.agenda WHERE codigo LIKE 'AG-JP%');
DELETE FROM sch_agenda.agenda WHERE codigo LIKE 'AG-JP%';
DELETE FROM sch_agenda.efector WHERE usuario_id IN (SELECT id FROM sch_seguridad.usuario_sistema WHERE username = 'juan.perez.med');
DELETE FROM sch_seguridad.usuario_rol WHERE usuario_id IN (SELECT id FROM sch_seguridad.usuario_sistema WHERE username = 'juan.perez.med');
DELETE FROM sch_seguridad.usuario_sistema WHERE username = 'juan.perez.med';
DELETE FROM sch_persona.persona WHERE numero_documento = '87654321' AND apellido = 'Perez';

-- Crear persona juan perez
INSERT INTO sch_persona.persona (apellido, nombre, tipo_documento_codigo, numero_documento, fecha_nacimiento, sexo_biologico, estado)
VALUES ('Perez', 'Juan', 'DNI', '87654321', '1985-05-15', 'M', 'VIGENTE');

-- Crear usuario juan perez
INSERT INTO sch_seguridad.usuario_sistema (username, password_hash, estado, persona_id)
SELECT 'juan.perez.med', 'pbkdf2-sha256$100000$EEjQivuxO/t9xi8GtN7Sig==$5PdkPlUAB2mFVItqLCRAL8jGqWgXxkRIf76GK67R95M=', 'ACTIVO', id
FROM sch_persona.persona WHERE numero_documento = '87654321';

-- Agregar rol médico
INSERT INTO sch_seguridad.usuario_rol (usuario_id, rol_id, centro_id, servicio_id)
SELECT u.id, '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101'
FROM sch_seguridad.usuario_sistema u WHERE u.username = 'juan.perez.med';

-- Crear efector
INSERT INTO sch_agenda.efector (centro_id, servicio_id, tipo_efector, nombre, activo, usuario_id)
SELECT '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'PROFESIONAL', 'Dr. Juan Perez', true, u.id
FROM sch_seguridad.usuario_sistema u WHERE u.username = 'juan.perez.med';

-- Crear agenda
INSERT INTO sch_agenda.agenda (codigo, nombre, centro_id, servicio_id, efector_id, tipo_efector, tipo_agenda, fecha_desde, fecha_hasta, estado, visible_contact_center, created_by, updated_by)
SELECT 'AG-JPMEDICA-2026', 'Agenda Juan Perez - Clinica Medica', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', e.id, 'PROFESIONAL', 'MEDICO', '2026-07-12'::date, '2026-12-31'::date, 'VIGENTE', true, 'admin', 'admin'
FROM sch_agenda.efector e WHERE e.usuario_id = (SELECT id FROM sch_seguridad.usuario_sistema WHERE username = 'juan.perez.med');

-- Crear bloque de programación
INSERT INTO sch_agenda.bloque_programacion (agenda_id, fecha_desde, fecha_hasta, hora_inicio, hora_fin, intervalo_minutos, dias_semana, frecuencia, tipo_bloque, duracion_turno_minutos, sobreturnos, estado, created_by, updated_by)
SELECT a.id, '2026-07-12'::date, '2026-12-31'::date, '08:00:00'::time, '23:00:00'::time, 20, '1,2,3,4,5,6,7', 'DIARIA', 'RECURRENTE', 20, 3, 'VIGENTE', 'admin', 'admin'
FROM sch_agenda.agenda a WHERE a.codigo = 'AG-JPMEDICA-2026';

-- Mostrar resultado
SELECT '=== VERIFICACIÓN ===' as status;
SELECT username, estado FROM sch_seguridad.usuario_sistema WHERE username IN ('admin', 'juan.perez.med') ORDER BY username;
