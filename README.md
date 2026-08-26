# RED BASA - Portal Paciente White-Label

Esta carpeta contiene el paquete preparado para RED BASA con enfoque de extraccion a repositorio propio.

## Contenido

- portal-red-basa/: copia base del portal (sin artefactos de build).
- integracion-his/: capa de integracion desacoplada para conectar el portal con HIS de terceros.
- EXTRACCION-A-REPO.md: guia de migracion a proyecto nuevo.

## Objetivo

Vender y operar solo el Portal Paciente para RED BASA, manteniendo independencia del HIS interno del cliente mediante adapters de integracion.

## Principio tecnico

- El portal NO debe codificar reglas del HIS directamente.
- Toda adaptacion al HIS vive en integracion-his/adapters y mappings.
- El contrato canonico portal <-> integracion se mantiene estable.
