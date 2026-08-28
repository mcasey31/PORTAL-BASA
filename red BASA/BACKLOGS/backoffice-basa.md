# Backlog BackOffice BASA

## Estado

Pendiente de implementación. La aplicación se creará más adelante dentro de `red BASA`.

## Objetivo

Crear un BackOffice independiente para que los administradores de RED BASA gestionen el Portal de Pacientes BASA y su base exclusiva.

## Módulos iniciales

- Login administrativo y recuperación de acceso.
- Roles y permisos de usuarios administradores.
- Dashboard operativo.
- Gestión de usuarios y pacientes.
- Bandeja de menores a cargo pendientes de revisión.
- Visualización del documento que acredita el vínculo.
- Aprobar o rechazar asociaciones de menores.
- Gestión de financiadores y planes.
- Gestión de centros y servicios.
- Consulta del estado de validación de atenciones en la red.
- Gestión de términos y condiciones.
- Configuración de branding y datos institucionales.
- Auditoría de acciones administrativas.

## Primer flujo prioritario

1. El titular asocia un menor desde el Portal de Pacientes.
2. La solicitud queda en estado `PENDING_REVIEW`.
3. El administrador ingresa al BackOffice BASA.
4. Visualiza los datos del menor, titular y documento adjunto.
5. Aprueba o rechaza la solicitud.
6. La solicitud pasa a `ACTIVE` o `REJECTED`.
7. El Portal muestra el estado actualizado al titular.

## Arquitectura prevista

```text
red BASA/
├── portal-red-basa/          # Portal de Pacientes
├── integracion-his/          # Adapters y contratos HIS
├── BACKLOGS/
│   └── backoffice-basa.md
└── portal-basa-backoffice/   # Aplicación futura
```

El BackOffice será una aplicación separada del Portal de Pacientes, pero operará exclusivamente sobre la base propia de RED BASA. No debe mezclar pacientes, usuarios ni documentos de otros clientes.

## Base de datos

El BackOffice BASA utilizará la base exclusiva `portal_basa`/`vitalflow_portal` de la instalación BASA. Las futuras instalaciones de otros clientes deberán utilizar bases separadas.

## Seguridad pendiente

- Validar sesión y rol `ADMIN` en backend.
- Registrar cada aprobación y rechazo en auditoría.
- No exponer documentos públicamente.
- Definir almacenamiento seguro de adjuntos.
- Definir retención y eliminación de documentación.
- Separar secretos por cliente.

## Próximo paso

Crear `red BASA/portal-basa-backoffice` cuando se decida iniciar la implementación, comenzando por login administrativo y bandeja de menores pendientes.
