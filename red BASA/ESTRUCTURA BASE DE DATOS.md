# Estructura de Base de Datos por Cliente

## Decisión de arquitectura

Cada cliente del Portal tendrá una base de datos PostgreSQL propia. Los pacientes, usuarios y datos operativos de un cliente nunca se compartirán con otro cliente.

El modelo elegido es **database-per-client**:

```text
Portal BASA
└── Base PostgreSQL: portal_basa
    ├── usuarios
    ├── pacientes
    ├── turnos
    ├── estudios
    ├── centros
    ├── coberturas
    └── configuracion

Red Clínicas X
└── Base PostgreSQL: portal_red_clinicas_x
    ├── usuarios
    ├── pacientes
    ├── turnos
    ├── estudios
    ├── centros
    ├── coberturas
    └── configuracion
```

## Regla de aislamiento

Una cuenta, paciente o registro creado para un cliente debe persistirse únicamente en la base de ese cliente.

```text
RED BASA              -> portal_basa
RED CLÍNICAS X         -> portal_red_clinicas_x
OTRO CLIENTE          -> portal_<cliente>
```

No se debe usar una tabla compartida de pacientes para separar clientes mediante un simple `institutionId`. La separación principal debe ser física, mediante bases distintas.

## Base de configuración central

Para administrar múltiples clientes se podrá disponer de una base central de configuración, sin datos clínicos ni pacientes:

```text
tenants
├── id
├── codigo
├── nombre
├── dominio
├── database_name
├── database_host
├── database_secret_ref
├── his_base_url
└── activo
```

Ejemplo:

| Código | Cliente | Dominio | Base propia |
|---|---|---|---|
| BASA | RED BASA | basa.portal.local | portal_basa |
| RCX | Red Clínicas X | redclinicasx.portal.local | portal_red_clinicas_x |

La base central debe guardar una referencia segura al secreto de conexión. No se deben almacenar contraseñas en código fuente ni en archivos versionados.

## Resolución del cliente

El backend identifica el cliente mediante el dominio, subdominio o configuración de despliegue:

```text
basa.portal.local
        -> tenant BASA
        -> DATABASE_URL de portal_basa

redclinicasx.portal.local
        -> tenant Red Clínicas X
        -> DATABASE_URL de portal_red_clinicas_x
```

La selección de base debe realizarse en el backend. Nunca debe depender de un valor enviado por el navegador.

## Estructura lógica dentro de cada base

Cada base de cliente mantiene el mismo esquema lógico:

```text
User
├── Patient
├── Account
└── Session

Patient
├── tipo_documento
├── MedicalCenter
├── Appointment
├── MedicalStudy
├── InsuranceProvider
├── InsurancePlan
├── FavoriteCenter
├── TelemedicineCall
└── TelemedicineSurvey
```

Además, cada base tendrá sus propias tablas de soporte:

- `User`: credenciales, email, rol, validación de red y aceptación de términos.
- `patients`: documento, fecha de nacimiento, sexo, contacto y referencia HIS.
- `tipo_documento`: DNI, Pasaporte, Libreta Cívica y Cédula de Identidad.
- `pending_registrations`: registros temporales hasta validar el email.
- `appointments`: turnos del cliente.
- `medical_studies`: estudios e informes del cliente.
- `medical_centers`: centros disponibles para ese cliente.
- `insurance_providers` y `insurance_plans`: coberturas propias del cliente.

## Registro de un paciente

El flujo esperado es:

```text
1. El usuario ingresa al dominio del cliente.
2. El backend resuelve el tenant.
3. El registro se guarda en la base propia del tenant.
4. Se valida el email.
5. Se crea User + Patient en esa misma base.
6. El Portal consulta el HIS del cliente mediante su webservice.
```

Un paciente de RED BASA nunca debe aparecer en `portal_red_clinicas_x`, y un paciente de Red Clínicas X nunca debe aparecer en `portal_basa`.

## Integración con el HIS

Cada cliente puede tener su propio HIS o configuración de integración:

```text
portal_basa              -> HIS BASA
portal_red_clinicas_x    -> HIS Red Clínicas X
```

El Portal no debe consultar directamente las tablas internas del HIS. Las agendas, turnos, estudios y validaciones se deben obtener por adapters y webservices definidos para cada cliente.

## Operación y seguridad

- Migraciones versionadas y aplicadas por base de cliente.
- Backup y restauración independientes por cliente.
- Credenciales de base separadas.
- Logs identificados por `tenant` sin incluir contraseñas ni tokens.
- Pruebas de aislamiento entre clientes.
- No reutilizar datos demo de un cliente en otro.
- No ejecutar scripts destructivos sin indicar explícitamente la base objetivo.

## Estado actual de desarrollo

La instalación local de RED BASA utiliza actualmente:

```text
Base: portal_basa
Contenedor: vitalflow_portal_postgres
Usuario: portal_user
```

El backend del Portal BASA debe apuntar a esa base exclusiva mediante `DATABASE_URL`. La base del HIS integrado es independiente y no debe utilizarse para guardar usuarios o pacientes del Portal BASA.

## Evolución recomendada

1. Mantener el esquema Prisma igual para todos los clientes.
2. Crear una base nueva por cliente a partir del mismo esquema y migraciones.
3. Implementar un registro central de tenants y referencias seguras a conexiones.
4. Resolver tenant por dominio en middleware/backend.
5. Agregar pruebas automatizadas que confirmen que un cliente no puede leer datos de otro.
6. Automatizar provisionamiento, migraciones y backups por cliente.
