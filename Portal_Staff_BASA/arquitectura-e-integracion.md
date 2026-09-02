# Arquitectura e integracion

## Componentes

- Portal del Paciente: `VitalFlowPortal/src/app/(portal)`.
- Portal Staff BASA: `VitalFlowPortal/src/app/(admin)/admin/autorizaciones`.
- API: tRPC, router `staff`.
- Base compartida: PostgreSQL `vitalflow_portal`.

## Integracion

1. El titular crea un integrante en Mi Cuenta y adjunta un documento de parentesco.
2. Se crea un registro `dependents` con estado `PENDING_REVIEW`.
3. El staff busca por DNI en Autorizaciones BASA.
4. El staff revisa el documento y actualiza el estado a `ACTIVE` o `REJECTED`.

## Seguridad

- Solo roles `ADMIN` y `STAFF` consumen los procedimientos de autorizaciones.
- El documento se entrega solo dentro de una sesion autenticada.
- El frontend no consulta PostgreSQL de forma directa.
- Los cambios de estado quedan vinculados al registro del integrante.