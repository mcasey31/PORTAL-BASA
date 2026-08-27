# Backlog - Logica de Llamadores y Dependencias Funcionales

## Objetivo
Dejar documentado el estado actual y el backlog para implementar una logica consistente de:
- Consultorios en Escritorio Clinico
- Asociacion por centro/servicio/estructura
- Integracion con llamador de sala de espera (televisores)

## Estado actual relevado

### 1) Existe tabla de consultorio/lugar de atencion
- Tabla existente: `sch_agenda.lugar_atencion`
- Definida en migracion: `db/migrations/004_feature_7027_bloques_programacion_fija.sql`
- Relacionada con: `sch_agenda.bloque_programacion.lugar_atencion_id`

### 2) Escritorio Clinico hoy no usa catalogo canonico de consultorios
- En el flujo de medico, el selector de consultorio se infiere desde valores de `turno.efector`.
- Esto puede mezclar nombre de profesional con concepto de consultorio.

### 3) Estructura interna (ABM) no expone nodo consultorio
- No hay, al momento del relevamiento, un nodo funcional de consultorio integrado en ABM estructura interna para gobernanza completa.

## Ajuste transitorio ya aplicado
En front, para evitar mostrar nombres de profesional como consultorio, se aplico una salida transitoria:
- Etiqueta visual: `Consultorio 1`, `Consultorio 2`, etc.
- Manteniendo internamente la referencia existente para no romper flujos actuales.

Archivo impactado:
- `front/src/escritorioClinico/useEscritorioClinicoController.ts`

## Backlog funcional y tecnico propuesto

### Fase 1 - Normalizacion minima (corto plazo)
1. Alinear origen de datos de consultorio a `lugar_atencion` en los endpoints consumidos por Escritorio Clinico.
2. Evitar dependencia de `turno.efector` como fuente semantica de consultorio.
3. Mantener compatibilidad temporal mientras se migra front.

Criterio de aceptacion:
- Un medico solo visualiza consultorios reales asociados a su contexto operativo.

### Fase 2 - Modelo canonico de consultorio (medio plazo)
1. Definir entidad consultorio canonica (si se reutiliza `lugar_atencion` extendida o tabla dedicada).
2. Relacionar consultorio con centro y servicio.
3. Incorporar estado (activo/inactivo), nombre operativo, codigo interno y metadatos de integracion.

Criterio de aceptacion:
- Todo turno y pantalla operativa referencia consultorio por `consultorio_id` y no por texto libre.

### Fase 3 - Dependencias de estructura interna
1. Integrar consultorio como nodo administrable en estructura interna (ABM).
2. Definir reglas de pertenencia y alcance por centro/sede/servicio.
3. Definir trazabilidad de cambios (alta, modificacion, baja logica).

Criterio de aceptacion:
- Se puede administrar consultorios por estructura sin SQL manual.

### Fase 4 - Integracion con llamador (sala de espera)
1. Modelar vinculacion `consultorio -> llamador` (dispositivo/canal/pantalla/sala).
2. Definir eventos y contrato de llamado (pendiente, llamado, atendido, cancelado).
3. Integrar visualizacion en televisores por centro/sala.
4. Registrar auditoria de llamados y tiempos.

Criterio de aceptacion:
- Desde un consultorio se emite llamado y se refleja en pantalla correcta de sala de espera.

### Fase 5 - Operacion y observabilidad
1. Tablero de salud de llamadores (latencia, caidas, cola de llamados).
2. Reintentos y fallback ante desconexion de dispositivo.
3. Alertas de configuracion inconsistente (consultorio sin llamador asignado).

Criterio de aceptacion:
- Operacion puede detectar y resolver desvio sin impacto prolongado al paciente.

## Dependencias funcionales clave
1. Agenda / Bloques: origen de disponibilidad y lugar de atencion.
2. Admision: consistencia de asignacion entre turno y consultorio.
3. Escritorio Clinico: seleccion de consultorio por usuario y contexto.
4. Estructura interna (ABM): gobernanza y mantenimiento de catalogo.
5. Seguridad: permisos por rol para ver/usar consultorios y accion de llamado.
6. Integracion dispositivos: protocolo de comunicacion con televisores/llamadores.
7. Auditoria: trazabilidad clinica y operativa de cada llamado.

## Riesgos si no se implementa el modelo canonico
1. Inconsistencia semantica (consultorio vs profesional vs efector).
2. Errores de llamado en sala equivocada.
3. Dificultad para escalar a multiples centros/sedes.
4. Alto costo de mantenimiento por reglas hardcodeadas en front.

## Propuesta de priorizacion
1. Prioridad alta: Fase 1 + Fase 2 (fuente canonica de consultorio).
2. Prioridad media: Fase 3 (ABM estructura para gobernanza).
3. Prioridad alta operativa: Fase 4 (llamador vinculado por consultorio).
4. Prioridad media: Fase 5 (observabilidad y resiliencia).

## Definiciones pendientes para cierre funcional
1. Si `lugar_atencion` sera la entidad canonica final de consultorio.
2. Nivel de granularidad de asociacion (centro, sede, servicio, especialidad).
3. Contrato tecnico del llamador (API, websocket, broker, polling).
4. Politica de fallback cuando no exista llamador asignado.

## Evidencia de referencia
- `db/migrations/003_feature_7014_agenda_campos_y_asociaciones.sql`
- `db/migrations/004_feature_7027_bloques_programacion_fija.sql`
- `db/migrations/008_feature_abms_estructura_interna.sql`
- `back/src/VitalFlow.His.Api/Application/Admision/Services/AdmisionService.cs`
- `front/src/escritorioClinico/useEscritorioClinicoController.ts`
