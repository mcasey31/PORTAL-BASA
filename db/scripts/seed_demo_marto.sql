-- =========================================================================
-- SEED DEMO DATA - MARTO LOCAL SETUP (Versión Simplificada)
-- =========================================================================

BEGIN;

-- =================================================================
-- 1. CREAR PERSONA PARA JUAN PEREZ MÉDICO
-- =================================================================
DELETE FROM sch_persona.persona WHERE numero_documento = '87654321';

INSERT INTO sch_persona.persona (id, apellido, nombre, tipo_documento_codigo, numero_documento, fecha_nacimiento, sexo_biologico, estado)
VALUES ('10000000-0000-0000-0000-000000000004', 'Perez', 'Juan', 'DNI', '87654321', '1985-05-15', 'M', 'VIGENTE');

-- =================================================================
-- 2. CREAR USUARIO JUAN PEREZ MÉDICO
-- =================================================================
DELETE FROM sch_seguridad.usuario_sistema WHERE username = 'juan.perez.med';

INSERT INTO sch_seguridad.usuario_sistema (id, username, password_hash, estado, persona_id)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  'juan.perez.med',
  'pbkdf2-sha256$100000$EEjQivuxO/t9xi8GtN7Sig==$5PdkPlUAB2mFVItqLCRAL8jGqWgXxkRIf76GK67R95M=',  -- password: admin
  'ACTIVO',
  '10000000-0000-0000-0000-000000000004'
);

-- =================================================================
-- 3. ACTUALIZAR ADMIN USER
-- =================================================================
UPDATE sch_seguridad.usuario_sistema 
SET estado = 'ACTIVO'
WHERE username = 'admin';

-- =================================================================
-- 4. CREAR EFECTOR PARA JUAN PEREZ
-- =================================================================
DELETE FROM sch_agenda.efector WHERE id = '30000000-0000-0000-0000-000000000001';

INSERT INTO sch_agenda.efector (
  id, centro_id, servicio_id, tipo_efector, nombre, activo, usuario_id
)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',  -- Centro Ambulatorio Central
  '00000000-0000-0000-0000-000000000101',  -- Servicio Clínica Médica
  'PROFESIONAL',
  'Dr. Juan Perez',
  true,
  '10000000-0000-0000-0000-000000000003'   -- juan.perez.med user
);

-- =================================================================
-- 5. AGREGAR MÉDICO AL ROL MÉDICO Y ASIGNAR CENTRO/SERVICIO
-- =================================================================
DELETE FROM sch_seguridad.usuario_rol 
WHERE usuario_id = '10000000-0000-0000-0000-000000000003';

INSERT INTO sch_seguridad.usuario_rol (usuario_id, rol_id, centro_id, servicio_id, created_at)
VALUES (
  '10000000-0000-0000-0000-000000000003',  -- juan.perez.med
  '50000000-0000-0000-0000-000000000002',  -- Rol Médico
  '00000000-0000-0000-0000-000000000001',  -- Centro Ambulatorio Central
  '00000000-0000-0000-0000-000000000101',  -- Servicio Clínica Médica
  NOW()
);

-- =================================================================
-- 6. CREAR AGENDA PARA JUAN PEREZ
-- =================================================================
DELETE FROM sch_agenda.agenda WHERE codigo = 'AG-JPMEDICA-2026';

INSERT INTO sch_agenda.agenda (
  id, codigo, nombre, centro_id, servicio_id, efector_id, tipo_efector, tipo_agenda,
  fecha_desde, fecha_hasta, estado, visible_contact_center,
  created_at, updated_at, created_by, updated_by
)
VALUES (
  gen_random_uuid(),
  'AG-JPMEDICA-2026',
  'Agenda Juan Perez - Clinica Medica',
  '00000000-0000-0000-0000-000000000001',  -- Centro
  '00000000-0000-0000-0000-000000000101',  -- Servicio
  '30000000-0000-0000-0000-000000000001',  -- Efector
  'PROFESIONAL',
  'MEDICO',
  '2026-07-12'::date,
  '2026-12-31'::date,
  'VIGENTE',
  true,
  NOW(),
  NOW(),
  'admin',
  'admin'
);

-- =================================================================
-- 7. CREAR BLOQUES DE PROGRAMACIÓN (Lunes a Domingo, 08:00-23:00)
-- =================================================================
DELETE FROM sch_agenda.bloque_programacion 
WHERE agenda_id IN (SELECT id FROM sch_agenda.agenda WHERE codigo = 'AG-JPMEDICA-2026');

INSERT INTO sch_agenda.bloque_programacion (
  id, agenda_id, fecha_desde, fecha_hasta, 
  hora_inicio, hora_fin, intervalo_minutos,
  dias_semana, frecuencia, tipo_bloque,
  duracion_turno_minutos, sobreturnos,
  estado, created_at, updated_at, created_by, updated_by
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM sch_agenda.agenda WHERE codigo = 'AG-JPMEDICA-2026'),
  '2026-07-12'::date,
  '2026-12-31'::date,
  '08:00:00'::time,
  '23:00:00'::time,
  20,
  '1,2,3,4,5,6,7',
  'DIARIA',
  'RECURRENTE',
  20,
  3,
  'VIGENTE',
  NOW(),
  NOW(),
  'admin',
  'admin'
);

COMMIT;

-- =================================================================
-- VERIFICACIÓN
-- =================================================================
SELECT '=== USUARIOS CREADOS ===' as info;
SELECT username, estado FROM sch_seguridad.usuario_sistema WHERE username IN ('admin', 'juan.perez.med');

SELECT '=== EFECTORES ===' as info;
SELECT nombre, tipo_efector, activo FROM sch_agenda.efector WHERE id = '30000000-0000-0000-0000-000000000001';

SELECT '=== AGENDAS ===' as info;
SELECT codigo, nombre, estado, fecha_desde, fecha_hasta FROM sch_agenda.agenda WHERE codigo = 'AG-JPMEDICA-2026';

SELECT '=== BLOQUES PROGRAMACIÓN ===' as info;
SELECT 
  dias_semana,
  hora_inicio,
  hora_fin,
  intervalo_minutos,
  duracion_turno_minutos,
  sobreturnos
FROM sch_agenda.bloque_programacion
WHERE agenda_id = (SELECT id FROM sch_agenda.agenda WHERE codigo = 'AG-JPMEDICA-2026');
