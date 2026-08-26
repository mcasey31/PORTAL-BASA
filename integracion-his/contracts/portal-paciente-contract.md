# Contrato Canonico - Portal Paciente

## Dominios minimos

- Autenticacion paciente
- Centros y coberturas
- Turnos (listar, reservar, reprogramar, cancelar)
- Estudios y resultados
- Recetas

## Principios de contrato

- IDs estables de paciente, profesional y centro.
- Fechas en ISO-8601 UTC en capa de integracion.
- Errores normalizados con codigo y mensaje funcional.
- Sin exposicion de estructuras internas del HIS.

## Error envelope sugerido

{
  "code": "TURNO_NO_DISPONIBLE",
  "message": "No hay disponibilidad para el horario solicitado",
  "traceId": "...",
  "details": {}
}

## Seguridad

- Token entre portal e integracion con rotacion.
- Auditoria de operaciones sensibles.
- Mascarado de PII en logs.
