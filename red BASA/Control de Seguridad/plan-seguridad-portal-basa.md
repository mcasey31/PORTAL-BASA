# Control de Seguridad - Portal BASA

## 1. Objetivo

Definir el marco de seguridad del Portal BASA y su futuro BackOffice para proteger datos personales, clínicos y documentos vinculados a habeas data.

El objetivo es prevenir accesos no autorizados, alteración de información, fuga de documentos y abuso de integraciones HIS, manteniendo trazabilidad de toda operación relevante.

## 2. Alcance

Este plan cubre:

- Portal de Pacientes BASA.
- BackOffice BASA futuro.
- Base exclusiva `portal_basa`.
- Integración mediante webservices con HIS BASA.
- Documentos de vínculo de menores.
- Registro, autenticación, recuperación de acceso y sesiones.
- Infraestructura, despliegue, logs y copias de seguridad.

## 3. Clasificación de datos

| Clasificación | Ejemplos | Protección requerida |
|---|---|---|
| Crítico | Historia clínica, estudios, recetas, adjuntos de vínculo | Cifrado, acceso mínimo, auditoría y URLs temporales |
| Sensible | DNI, fecha de nacimiento, sexo, cobertura, teléfono, domicilio | Cifrado en tránsito, RBAC y minimización |
| Confidencial | Usuarios admin, reglas de cobertura, configuraciones HIS | RBAC estricto, auditoría y secretos fuera del código |
| Interno | Métricas operativas y catálogos sin datos clínicos | Acceso autenticado y registros de cambios |
| Público | Landing institucional y textos de ayuda | Validación de contenido y protección contra manipulación |

## 4. Modelo de amenazas

| Amenaza | Riesgo | Control principal |
|---|---|---|
| Suplantación de paciente | Acceso a datos clínicos de otra persona | Verificación de email, contraseñas seguras, MFA futuro y control de sesión |
| Cambio de integrante manipulado | Un titular intenta consultar datos de un menor ajeno | Validar en backend la relación titular-menor en cada solicitud |
| Acceso directo a documentos | Exposición de partidas, autorizaciones u otros adjuntos | Object storage privado y URL firmada de corta duración |
| Escalada de privilegios admin | Gestión indebida de pacientes o documentos | RBAC en backend, MFA, auditoría y revisión de roles |
| Inyección SQL/NoSQL | Alteración o extracción de base | ORM parametrizado, validación Zod, rol de DB con mínimo privilegio |
| XSS | Robo de sesión o datos presentados en navegador | CSP, sanitización, escapar HTML y cookies HttpOnly |
| CSRF | Cambio de perfil o acciones de backoffice sin intención | SameSite, tokens CSRF y validación de origen |
| Fuerza bruta / credential stuffing | Toma de cuentas | Rate limit, bloqueo progresivo, alertas y MFA futuro |
| IDOR/BOLA | Acceder a recursos cambiando un ID | Autorización por recurso en backend, nunca por UI |
| SSRF / abuso de integración | Acceso a servicios internos mediante endpoints | Lista de destinos permitidos, adapter cerrado y timeouts |
| Fuga de secretos | Acceso a base o HIS | Secret manager, rotación y prohibición de secretos en Git/logs |
| Ransomware / pérdida | Indisponibilidad o pérdida de datos | Backups cifrados, restore drills y retención definida |

## 5. Controles de identidad y acceso

### 5.1 Pacientes

- Contraseñas con hash resistente: Argon2id o bcrypt con costo definido. Nunca texto plano.
- Política mínima: 12 caracteres, mayúscula, minúscula, número y símbolo.
- Verificación de email antes de activar la cuenta.
- Códigos de un solo uso, hash del código en base, expiración máxima 15 minutos y límite de intentos.
- Rate limiting por IP, cuenta y documento para login, registro y recuperación.
- Cookies de sesión `HttpOnly`, `Secure`, `SameSite=Lax` o `Strict` según flujo.
- Invalidar sesiones al cambiar contraseña o detectar anomalías.
- MFA optativo para pacientes y obligatorio para acciones sensibles futuras.

### 5.2 Titular y menores

- La cookie o selector de integrante no otorga permiso por sí misma.
- Cada endpoint debe verificar que el menor pertenezca al titular autenticado.
- Solo dependientes en estado `ACTIVE` pueden consultar funciones clínicas.
- `PENDING_REVIEW` y `REJECTED` no deben habilitar turnos, estudios ni recetas.
- El documento de vínculo debe ser revisado por rol autorizado y toda decisión debe quedar auditada.

### 5.3 BackOffice

- Login distinto al de pacientes.
- MFA obligatorio para `ADMIN`, `CONVENIOS`, `REVISOR_DOCUMENTAL` y `AUDITOR`.
- RBAC aplicado en cada endpoint, no solo en botones o rutas visuales.
- Principio de mínimo privilegio.
- Alta, baja y cambios de permisos con aprobación y auditoría.
- Revisión trimestral de cuentas administrativas activas.

## 6. Protección de datos y documentos

### 6.1 Base de datos

- Una base física por cliente: BASA nunca comparte pacientes con otro cliente.
- Usuario de DB exclusivo con permisos mínimos; no usar superusuario en runtime.
- Conexión TLS entre aplicación y base en ambientes no locales.
- Cifrado de volumen o servicio administrado con cifrado en reposo.
- Backups cifrados, retención definida y pruebas periódicas de restauración.
- Migraciones versionadas, revisadas y aplicadas por ambiente.

### 6.2 Documentos de habeas data y vínculo

- No almacenar adjuntos como base64 en tablas relacionales en producción.
- Usar object storage privado por cliente, por ejemplo bucket o contenedor BASA.
- Guardar en DB solo metadatos: ID, hash SHA-256, tamaño, mime type, propietario, estado, fecha y clave de objeto.
- Servir documentos con URL firmada, temporal y de un solo recurso.
- Prohibir acceso público al bucket.
- Validar tipo real del archivo, no solo extensión; permitir PDF/JPG/PNG/WEBP según política.
- Limitar tamaño, aplicar antivirus/antimalware y cuarentena previa a revisión.
- Eliminar metadatos EXIF cuando no sean necesarios.
- Definir retención y eliminación legalmente aprobada.

### 6.3 Logs

No registrar en logs:

- Contraseñas, códigos de email o tokens.
- Documentos adjuntos ni URLs firmadas.
- Historia clínica completa.
- DNI completo cuando un identificador parcial alcanza.
- Datos de tarjetas, credenciales HIS o cadenas de conexión.

Los logs deben incluir: `tenant`, correlation ID, actor, rol, acción, recurso, resultado, IP/cliente según política y fecha UTC.

## 7. Seguridad de APIs

- Todo endpoint sensible requiere autenticación y autorización de recurso.
- Validar entrada con esquemas tipados y límites de longitud/tamaño.
- Usar consultas parametrizadas; evitar SQL dinámico.
- Aplicar rate limiting a login, registro, verificación, recuperación, adjuntos y consultas HIS.
- Respuestas de error genéricas para el usuario; detalles técnicos solo en logs protegidos.
- CORS limitado a dominios aprobados por ambiente.
- Headers de seguridad: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y anti-clickjacking.
- Verificar método HTTP, content type, origen y CSRF en mutaciones de navegador.
- Versionar contratos de API y de integración HIS.

## 8. Seguridad de integración HIS

- El Portal y BackOffice nunca acceden directamente a tablas HIS.
- Toda llamada pasa por un adapter server-side con destinos permitidos.
- Credenciales del HIS guardadas en secret manager; rotación programada.
- Autenticación service-to-service con scopes mínimos.
- Timeouts, reintentos limitados, circuit breaker y observabilidad por endpoint.
- Validar que el paciente retornado por HIS coincide con tipo/número de documento solicitado.
- No confiar en IDs provistos por frontend sin volver a resolverlos y autorizarlos.
- Registrar resultado y latencia de integración, sin persistir respuestas clínicas completas en logs.
- Separar ambientes de sandbox, QA y producción con credenciales distintas.

## 9. Gateway de reglas de cobertura

- La elegibilidad de centro, agenda, práctica, financiador y plan se evalúa exclusivamente en backend.
- Sin regla activa y vigente, no se ofrece ni reserva turno.
- Revalidar la regla inmediatamente antes de reservar.
- Toda importación de Convenios requiere validación, preview, aprobación y auditoría.
- Cambios de reglas deben tener vigencia, autor, motivo, origen y versión.
- Alertar reglas vencidas, duplicadas o inconsistentes.

Referencia: [Estrategia Gateway de Reglas](../estrategia%20de%20implementacion/estrategia-gateway-reglas-portal.md).

## 10. Pentest y verificación de seguridad

Las pruebas se ejecutan únicamente con autorización escrita, alcance definido, entorno acordado y plan de reversión. Nunca se prueban técnicas intrusivas contra producción sin aprobación formal.

### 10.1 Alcance mínimo de pentest

- Autenticación de pacientes y admin.
- Gestión de sesión, logout y recuperación de contraseña.
- Registro y validación de email.
- Autorización de titular, menores y recursos clínicos.
- Acceso a documentos de vínculo.
- Endpoints de turnos, estudios, recetas y perfil.
- BackOffice, roles y acciones administrativas.
- Carga de archivos.
- APIs internas y adapter HIS.
- Configuración HTTP, TLS, CORS, CSP y headers.

### 10.2 Casos de prueba defensivos

| Categoría | Verificación |
|---|---|
| Autorización | Un paciente no puede obtener recursos de otro paciente modificando IDs o cookies |
| Grupo familiar | Un titular solo puede elegir menores propios y activos |
| BackOffice | Un rol sin permiso no puede aprobar, rechazar ni ver documentos |
| Sesión | Cookies no son legibles por JavaScript y se invalidan correctamente |
| Registro | Códigos expiran, no se reutilizan y no permiten enumerar emails |
| Adjuntos | Archivos inválidos, ejecutables, sobredimensionados o maliciosos son rechazados |
| Integración | Inputs alterados no permiten cambiar destino HIS ni consultar pacientes arbitrarios |
| Base | Credenciales runtime no pueden administrar esquemas ni acceder a otra base cliente |
| Errores | No se exponen stack traces, secretos, SQL ni datos clínicos |
| Disponibilidad | Rate limit y alertas responden a intentos repetitivos de login o verificación |

### 10.3 Entregables

- Alcance, activos y ventanas de prueba aprobadas.
- Hallazgos clasificados por criticidad, evidencia y riesgo.
- Plan de corrección con responsable y fecha objetivo.
- Revalidación de hallazgos corregidos.
- Informe ejecutivo sin datos sensibles.

## 11. Auditoría

Eventos mínimos a registrar:

- Login exitoso, fallido, bloqueo y recuperación de cuenta.
- Registro, verificación de email y aceptación/rechazo de TyC.
- Validación de atención previa y resultado.
- Cambio de integrante activo.
- Consulta, descarga o intento de acceso a documento clínico o de vínculo.
- Alta, aprobación y rechazo de menor asociado.
- Cambio de perfil, cobertura, plan o foto.
- Búsqueda, reserva y cancelación de turno.
- Acciones de BackOffice y cambios de reglas.
- Acceso o error de integración HIS.

La auditoría debe ser append-only, con controles de integridad y acceso restringido a rol auditor.

## 12. Respuesta a incidentes

### 12.1 Severidades

| Severidad | Ejemplo | Respuesta inicial |
|---|---|---|
| Crítica | Fuga confirmada de documentos o acceso masivo no autorizado | Contener, revocar sesiones/URLs, preservar evidencia y escalar legalmente |
| Alta | Acceso indebido a una cuenta, escalada admin o compromiso de secreto | Bloquear actor, rotar secreto, analizar alcance y notificar según política |
| Media | Intentos repetidos de fuerza bruta o archivo sospechoso bloqueado | Aplicar rate limit/bloqueo, investigar y monitorear |
| Baja | Error de configuración sin exposición confirmada | Corregir, documentar y verificar |

### 12.2 Proceso

1. Detectar y registrar el incidente.
2. Clasificar severidad y activar responsables.
3. Contener: bloquear cuenta, revocar sesión, deshabilitar URL o integración afectada.
4. Preservar logs, eventos y evidencia.
5. Erradicar causa raíz y rotar secretos si aplica.
6. Recuperar y verificar integridad.
7. Comunicar a responsables legales, seguridad y cliente según obligaciones.
8. Realizar retrospectiva y crear acciones preventivas.

## 13. Criterios de salida a producción

- Contraseñas hasheadas y nunca almacenadas en texto plano.
- Email transaccional real, dominio verificado y códigos sin exposición en UI/logs.
- MFA activo para BackOffice.
- RBAC probado por endpoint.
- Documentos en object storage privado, escaneados y con URLs firmadas.
- Rate limits activos en endpoints sensibles.
- TLS, CSP, CORS y headers verificados.
- Pentest autorizado sin hallazgos críticos o altos abiertos.
- Backups cifrados y restore drill exitoso.
- Monitoreo, alertas y runbook de incidentes activos.
- Auditoría de eventos críticos disponible.
- Revisión legal de TyC, habeas data, retención y notificación de incidentes.

## 14. Backlog de seguridad

1. Sustituir contraseñas de texto plano por Argon2id/bcrypt.
2. Implementar proveedor real de email y ocultar código de desarrollo fuera de local.
3. Agregar rate limiting, captcha adaptativo y protección anti-enumeración.
4. Implementar login y MFA de BackOffice.
5. Crear servicio de object storage, antivirus y URL firmadas para documentos.
6. Crear auditoría append-only y panel de consulta para auditores.
7. Agregar gateway de reglas de cobertura con aprobación de Convenios.
8. Configurar CSP, HSTS, CORS y headers de seguridad.
9. Ejecutar SAST, dependency scanning, secret scanning y pentest autorizado.
10. Definir y probar runbook de incidentes y restauración de backups.

## 15. Referencias

- [Diagrama C4 de la solución](../ARQUITECTURA/diagrama-c4-solucion-basa.md)
- [Estructura de Base de Datos](../ESTRUCTURA%20BASE%20DE%20DATOS.md)
- [Backlog BackOffice](../BACKLOGS/backoffice-basa.md)
- [Estrategia Gateway de Reglas](../estrategia%20de%20implementacion/estrategia-gateway-reglas-portal.md)
