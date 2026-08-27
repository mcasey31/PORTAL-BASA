# Guia de Extraccion a Repo Propio - RED BASA

## Objetivo

Separar este paquete en un nuevo repositorio independiente para operacion comercial RED BASA + servicios de integracion HIS.

## Paso 1: Crear repositorio destino

- Nombre sugerido: red-basa-portal-paciente
- Crear ramas base: main, develop, release

## Paso 2: Migrar carpetas

Copiar al repo nuevo:

- red BASA/portal-red-basa/
- red BASA/integracion-his/
- red BASA/README.md

## Paso 3: Limpieza tecnica

- Eliminar referencias a marcas o tenants no RED BASA.
- Revisar variables de entorno y secretos.
- Ajustar CI/CD a nuevo repo.

## Paso 4: Variables de entorno

Definir al menos:

- NEXT_PUBLIC_BRAND_NAME=RED BASA
- HIS_BASE_URL=
- HIS_AUTH_CLIENT_ID=
- HIS_AUTH_CLIENT_SECRET=
- PORTAL_SUPPORT_PHONE=

## Paso 5: Integracion con HIS del cliente

- Implementar adapter especifico en integracion-his/adapters.
- Completar mappings de estados y codigos.
- Validar contrato con pruebas de integracion.

## Paso 6: Checklist de salida a QA

- Login paciente
- Listado y reserva de turnos
- Visualizacion de estudios
- Recetas y documentos
- Logs y auditoria
- Rendimiento en horario pico

## Modelo comercial sugerido

- Producto: licencia Portal Paciente white-label.
- Servicio: onboarding de integracion HIS.
- Servicio continuo: mantenimiento evolutivo y soporte SLA.
