# Flujo de autorizaciones

## Cuentas / Integrantes

- Buscar por DNI de titular o integrante, o por nombre.
- Ver titular, integrantes asociados y estado de validacion.
- Un integrante pendiente permite abrir su documento y decidir Validar o Rechazar.

## Documentación

- Muestra solamente integrantes con estado `PENDING_REVIEW`.
- Identifica titular, DNI, integrante y documento para revisar.
- Validar cambia el estado a `ACTIVE`.
- Rechazar cambia el estado a `REJECTED`.

## Pendiente de evolucion

- Guardar usuario staff, fecha y motivo de la decision en una auditoria dedicada.
- Migrar documentos base64 a almacenamiento privado con URL firmada.
- Integrar la autorizacion aprobada al HIS cuando su contrato este disponible.