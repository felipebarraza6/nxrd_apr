# Documentación

Índice de este directorio. La descripción del producto está en el [README](../README.md) de la raíz.

Hay dos capas. La primera describe Cauce. La segunda conserva notas de cuando este cliente compartía código con otro producto de la misma API. Esas notas no describen la operación de agua.

## Cauce

| Documento | Qué fija |
| --- | --- |
| [validacion-e2e-2026-10-08.md](validacion-e2e-2026-10-08.md) | Recorrido de octubre 2026 sobre el demo: padrón, lectura, tarifa y cobro |
| [auditoria-pre-produccion-2026-10.md](auditoria-pre-produccion-2026-10.md) | Revisión previa a la pasada de interfaz. Parte de los hallazgos ya está cerrada en `dev` |

## Contrato con la API

| Documento | Qué fija |
| --- | --- |
| [api-map.md](api-map.md) | Mapa de endpoints que el cliente consume |
| [api/yggdra-backend-requisitos.md](api/yggdra-backend-requisitos.md) | Requisitos del servicio para este cliente |
| [api/landing-config-requisitos.md](api/landing-config-requisitos.md) | Configuración pública de la landing |
| [landing-config-requerimientos-backend.md](landing-config-requerimientos-backend.md) | Mismo tema, nota de implementación |
| [checkout-requerimientos-backend.md](checkout-requerimientos-backend.md) | Contratación |
| [requerimientos-backend-verificacion-cuenta.md](requerimientos-backend-verificacion-cuenta.md) | Verificación de cuenta |
| [requerimientos-backend-inventario.md](requerimientos-backend-inventario.md) | Inventario |
| [requerimientos-backend-surveys-public.md](requerimientos-backend-surveys-public.md) | Levantamientos públicos |
| [requerimientos-backend-survey-client-token.md](requerimientos-backend-survey-client-token.md) | Token de levantamiento |
| [plan-madurez-api.md](plan-madurez-api.md) | Plan de la capa de datos del cliente |
| [plan-fix-stock-unificado.md](plan-fix-stock-unificado.md) | Stock y bodegas |

`npm run sync-contract` regenera los tipos desde el freeze OpenAPI. `npm run audit:api` cruza el cliente con ese contrato.

## Registro anterior

Estos archivos quedan como archivo. El nombre de producto que usan no es Cauce.

- [auditoria-frontend.md](auditoria-frontend.md)
- [auditoria-e2e.md](auditoria-e2e.md)
- [auditoria-frig-vs-backend.md](auditoria-frig-vs-backend.md)
- [auditoria-modulos.md](auditoria-modulos.md)
- [auditoria-modulos-productos.md](auditoria-modulos-productos.md)
- [auditoria-productos.md](auditoria-productos.md)
- [auditoria-ventas.md](auditoria-ventas.md)
- [auditoria-compras.md](auditoria-compras.md)
- [auditoria-modifiers.md](auditoria-modifiers.md)
- [auditoria-sucursales.md](auditoria-sucursales.md)
- [backend-cierre-produccion.md](backend-cierre-produccion.md)
- [gaps-crm-pendientes.md](gaps-crm-pendientes.md)
- [tasks/2026-08-28-landing-login.md](tasks/2026-08-28-landing-login.md)
