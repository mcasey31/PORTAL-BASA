# Diagrama C4 - Solución RED BASA

## Nivel 1 - Contexto del sistema

```mermaid
flowchart LR
    patient[Paciente / titular o tutor]
    admin[Usuario administrativo BASA]
    portal[Portal de Pacientes BASA]
    backoffice[BackOffice BASA
    Futuro]
    his[HIS BASA]
    email[Proveedor de email
    Futuro]

    patient -->|Registro, perfil, turnos, estudios, recetas| portal
    admin -->|Gestión operativa, reglas y revisiones| backoffice
    portal -->|Consulta de identidad, atenciones, turnos, estudios| his
    backoffice -->|Configuración y gestión de integración| his
    portal -->|Códigos y notificaciones| email
```

## Nivel 2 - Contenedores

```mermaid
flowchart TB
    subgraph users[Usuarios]
        patient[Paciente]
        admin[Administrador BASA]
    end

    subgraph basa[Solución RED BASA]
        portalUi[Portal de Pacientes
        Next.js]
        backofficeUi[BackOffice BASA
        Aplicación futura]
        bff[Backend / BFF BASA
        Next.js API + tRPC]
        rules[Gateway de Reglas
        Cobertura y elegibilidad]
        adapter[Adapter HIS BASA
        Contrato canónico]
        portalDb[(PostgreSQL portal_basa
        Base exclusiva BASA)]
        storage[(Object storage
        Documentos de vínculo)]
    end

    his[HIS BASA
    APIs / Webservices]
    notify[Email transaccional]

    patient --> portalUi
    admin --> backofficeUi
    portalUi --> bff
    backofficeUi --> bff
    bff --> portalDb
    bff --> rules
    rules --> portalDb
    bff --> adapter
    adapter --> his
    bff --> storage
    bff --> notify
```

## Nivel 3 - Componentes del Backend / BFF

```mermaid
flowchart LR
    subgraph clients[Clientes]
        portalUi[Portal Pacientes]
        backofficeUi[BackOffice]
    end

    subgraph bff[Backend BASA]
        auth[Autenticación y sesión]
        registration[Registro y verificación email]
        profile[Perfil, titular y menores]
        clinical[Turnos, estudios, recetas]
        coverage[Gateway de reglas de cobertura]
        admin[Administración y auditoría]
        integration[Adaptador HIS]
    end

    db[(portal_basa)]
    storage[(Documentos)]
    his[HIS BASA]

    portalUi --> auth
    portalUi --> registration
    portalUi --> profile
    portalUi --> clinical
    backofficeUi --> admin
    backofficeUi --> coverage
    backofficeUi --> profile

    auth --> db
    registration --> db
    profile --> db
    admin --> db
    coverage --> db
    profile --> storage
    clinical --> coverage
    clinical --> integration
    integration --> his
```

## Límites y responsabilidades

| Componente | Responsabilidad | No debe hacer |
|---|---|---|
| Portal Pacientes | Experiencia de autogestión | Decidir reglas de cobertura desde el navegador |
| BackOffice BASA | Gestión, aprobación, configuración y auditoría | Exponer documentos sin autorización |
| Backend / BFF | Autorización, orquestación y validaciones | Acceder a tablas internas del HIS |
| Gateway de reglas | Validar centro, agenda, práctica, financiador y plan | Reemplazar la confirmación final del HIS |
| Adapter HIS | Aislar protocolos, autenticación y mapeos del HIS | Exponer formatos internos al Portal |
| Base `portal_basa` | Datos exclusivos de RED BASA | Mezclar datos de otros clientes |
| HIS BASA | Fuente clínica y operación final de turnos | Ser la fuente de reglas locales no confiables |

## Flujo: reserva de turno con integrante

```mermaid
sequenceDiagram
    participant P as Paciente
    participant UI as Portal BASA
    participant API as BFF BASA
    participant DB as portal_basa
    participant R as Gateway de reglas
    participant HIS as HIS BASA

    P->>UI: Selecciona integrante
    UI->>API: Cookie portal_member_id
    API->>DB: Resolver titular o menor activo
    P->>UI: Busca turno
    UI->>API: Centro, servicio y práctica
    API->>R: Validar cobertura y elegibilidad
    R->>DB: Consultar regla vigente
    R-->>API: Combinaciones permitidas
    API->>HIS: Consultar disponibilidad autorizada
    HIS-->>API: Slots disponibles
    API-->>UI: Mostrar opciones
    P->>UI: Confirma turno
    UI->>API: Solicitud de reserva
    API->>R: Revalidar regla
    API->>HIS: Reservar turno
    HIS-->>API: Resultado
    API-->>UI: Confirmación
```

## Regla de aislamiento por cliente

```mermaid
flowchart LR
    basa[RED BASA] --> basaDb[(portal_basa)]
    clinicas[RED CLÍNICAS X] --> clinicasDb[(portal_red_clinicas_x)]
    another[Nuevo cliente] --> anotherDb[(portal_cliente)]

    basaDb -.- note1[Sin acceso a datos de otros clientes]
    clinicasDb -.- note2[Sin acceso a datos de otros clientes]
```

## Referencias

- [Índice de arquitectura técnica](indice-arquitectura-tecnica-solucion-basa.md)
- [Estructura de base de datos](../ESTRUCTURA%20BASE%20DE%20DATOS.md)
- [Gateway de reglas](../estrategia%20de%20implementacion/estrategia-gateway-reglas-portal.md)
- [Backlog BackOffice](../BACKLOGS/backoffice-basa.md)
