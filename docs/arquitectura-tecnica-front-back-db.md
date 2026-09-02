# Arquitectura Tecnica HIS - Separacion FRONT, BACK y DB

## Objetivo
Asegurar separacion estricta entre frontend, backend y base de datos para evitar acoplamiento y mezcla de responsabilidades durante el desarrollo de modulos HIS.

## Estandar de interoperabilidad y datos clinicos
- Estandar rector: HL7 FHIR R4.
- La base de datos debe poder mapearse de forma trazable a recursos FHIR.
- El BACK debe exponer contratos alineados a FHIR (cuando aplique) y adaptadores para sistemas legados.
- El FRONT consume DTOs de aplicacion y no depende directamente de la complejidad del modelo FHIR.

## Principio rector
- FRONT solo orquesta experiencia de usuario y validaciones de interfaz.
- BACK implementa reglas de negocio, seguridad, workflows y APIs.
- DB persiste datos y expone estructuras optimizadas para integridad y consulta.

## Estructura fisica obligatoria del repositorio
- front/: aplicaciones web y componentes de UI.
- back/: servicios, APIs, casos de uso y reglas de negocio.
- db/: modelo de datos, migraciones, seeds y scripts SQL.
- docs/: arquitectura, decisiones y lineamientos.

## Reglas de separacion (no negociables)
1. FRONT no accede a DB en forma directa.
2. FRONT no contiene reglas de negocio clinica/operativa.
3. BACK no renderiza UI ni contiene logica visual.
4. BACK accede a DB mediante repositorios/adaptadores.
5. DB no contiene logica de flujo funcional (solo constraints, indices, integridad).
6. Todo dato clinico clave debe tener mapeo definido a recurso/perfil FHIR.
7. Las codificaciones clinicas deben usar terminologias estandar (SNOMED CT, LOINC, ICD-10, ATC segun caso).

## Arquitectura recomendada por capa
### FRONT (BFF-friendly)
- Stack sugerido: React + TypeScript + Vite/Next + TanStack Query + Zod.
- Responsabilidad:
  - Vistas por modulo: agenda, turnos, admision, HCA.
  - Formularios, navegacion, estados de UI, accesibilidad.
  - Consumo de APIs versionadas (/api/v1/...).
- Prohibido:
  - SQL, acceso directo a BD, reglas de negocio core.

### BACK (Modular Monolith inicial)
- Stack sugerido: .NET 8 Web API o Node.js NestJS (TypeScript).
- Estilo: Modular Monolith con limites de dominio claros (evolucionable a microservicios).
- Capa de interoperabilidad: modulo FHIR dedicado (serializacion, validacion de perfiles, conversiones).
- Modulos sugeridos:
  - Agenda
  - Turnos
  - Admision
  - HCA
  - Personas
  - Caja
  - Auditoria
  - Shared (auth, permisos, catalogos, eventos)
- Capas internas por modulo:
  - API (controllers/dto)
  - Application (use cases)
  - Domain (entidades, reglas)
  - Infrastructure (repositorios, adaptadores)

### BACK - Contratos FHIR recomendados
- Endpoint facade FHIR: /fhir/{resourceType} para interoperabilidad externa.
- Endpoint interno de aplicacion: /api/v1/... para UX y casos internos.
- Estrategia: modelo canonico de dominio + mapper a FHIR para evitar acoplamiento excesivo.

### DB (PostgreSQL recomendado)
- Esquemas por dominio:
  - sch_agenda
  - sch_turnos
  - sch_admision
  - sch_hca
  - sch_personas
  - sch_caja
  - sch_auditoria
- Convenciones:
  - Migraciones versionadas y trazables.
  - Constraints de integridad + FKs.
  - Indices por consultas criticas.
  - Soft delete y auditoria tecnica donde aplique.
  - Tablas de referencia para codigos estandar y value sets.
  - Columnas de trazabilidad de interoperabilidad (source_system, source_id, fhir_profile, last_sync_at).

### DB - Estandarizacion FHIR
- No persistir recursos FHIR como unica fuente de verdad JSON crudo para operacion core.
- Persistir modelo relacional normalizado y mantener mapeo explicito a FHIR.
- Usar JSONB solo para extensiones controladas cuando no exista estructura estable.
- Versionar perfiles FHIR adoptados y documentar cardinalidades criticas.

## Trazabilidad HU -> Back/Front/DB
### AGENDA
- FRONT: pantallas de agenda, bloques, cupos, bloqueos, calendario, dispositivos.
- BACK: reglas de disponibilidad, conflictos, validacion de solapamientos.
- DB: tablas agenda, bloque_programacion, cupo, bloqueo, calendario, dispositivo.
- FHIR: Schedule, Slot, HealthcareService, Practitioner, PractitionerRole, Location.

### TURNOS
- FRONT: asignacion, visualizacion y cancelacion de turnos.
- BACK: algoritmo de asignacion, validaciones de cobertura y politicas de cancelacion.
- DB: tablas turno, estado_turno, practica_turno, motivo_cancelacion.
- FHIR: Appointment, AppointmentResponse, Slot, ServiceRequest (cuando aplique).

### ADMISION
- FRONT: check-in con/sin turno, estados del paciente.
- BACK: regla operativa, validacion cobertura, transiciones de estado.
- DB: tablas admision, estado_paciente, arribo, validacion_cobertura.
- FHIR: Encounter, Patient, Coverage, EpisodeOfCare.

### HCA
- FRONT: landing clinica, documentos, evolucion, medicamentos, practicas.
- BACK: reglas clinicas, versionado de documentos, cierre de encuentro.
- DB: tablas encuentro, evolucion, medicamento, solicitud_practica, inmunizacion.
- FHIR: Observation, Condition, MedicationRequest, Procedure, Immunization, DiagnosticReport, DocumentReference.

## Estrategia de implementacion para no mezclar
1. Definir contrato API primero (OpenAPI).
2. Implementar caso de uso en BACK + pruebas.
3. Aplicar migracion DB y repositorios.
4. Integrar FRONT contra API mockeada y luego real.
5. Validar E2E por HU.
6. Definir y validar mapeo FHIR por HU antes de cerrar desarrollo.

## Gobierno tecnico
- Pull requests separados por capa:
  - PR FRONT
  - PR BACK
  - PR DB
- Checklist de PR obligatorio:
  - No hay imports cruzados indebidos entre capas.
  - HU vinculada y criterio de aceptacion cumplido.
  - Pruebas de la capa correspondiente incluidas.
  - Recurso/perfil FHIR impactado identificado.
  - Mapeo DB <-> Dominio <-> FHIR actualizado.

## Proximo paso inmediato
Iniciar con AGENDA respetando esta secuencia:
1. DB: modelo inicial de agenda/bloques/cupos.
2. BACK: APIs de gestion de agenda.
3. FRONT: pantallas de administracion de agenda consumiendo esas APIs.
4. FHIR: perfiles iniciales de Schedule/Slot y contratos de interoperabilidad externa.

## Portal Staff BASA - Autorizaciones
- El Portal del Paciente y Portal Staff BASA comparten la base `basa_portal`; no se duplican cuentas ni documentos.
- Cuando un titular asocia un integrante, el Portal persiste `Dependent.relationshipDocument` y el estado inicial `PENDING_REVIEW`.
- El backoffice consume esta informacion exclusivamente mediante procedimientos tRPC protegidos para roles `ADMIN` o `STAFF`.
- El handler tRPC resuelve la sesión desde los headers de cada request HTTP antes de ejecutar procedimientos protegidos; las consultas administrativas no reutilizan una sesión anónima en cache.
- El staff puede consultar titular e integrantes por DNI, visualizar el documento asociado y cambiar el estado a `ACTIVE` o `REJECTED`.
- La bandeja Cuentas/Integrantes muestra solo registros `PENDING_REVIEW` y no permite resolverlos; la resolucion se realiza exclusivamente desde Documentación.
- El reporte de Documentación consulta en modo lectura los integrantes `ACTIVE` y `REJECTED`, junto con su titular en `patients` y su cuenta en `User`; no crea tablas ni agrega campos a `basa_portal`.
- Los documentos clinicos o de parentesco no se exponen por APIs publicas, no se cachean en el navegador y requieren sesion autenticada.