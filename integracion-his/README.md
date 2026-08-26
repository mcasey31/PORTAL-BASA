# Integracion HIS - RED BASA

Esta capa traduce entre el contrato canonico del Portal Paciente y el HIS del cliente.

## Estructura

- contracts/: contrato funcional canonico (endpoints, payloads, errores).
- adapters/: implementaciones por HIS (ejemplo: adapter-his-basa.ts).
- mappings/: transformaciones de campos y normalizacion de estados.

## Regla de oro

La UI del portal consume SOLO el contrato canonico. Si cambia el HIS, se reemplaza el adapter sin tocar el front.

## Flujo

1. Portal solicita operacion canonica (ej: buscar turnos).
2. Adapter transforma request al formato del HIS.
3. Adapter ejecuta llamada al HIS.
4. Adapter normaliza response al contrato canonico.
5. Portal renderiza sin conocer particularidades del HIS.
