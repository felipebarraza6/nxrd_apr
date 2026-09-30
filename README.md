# nxrd_apr — Gestión de Agua Potable Rural

Sistema para comités y cooperativas de **Agua Potable Rural (APR)**: socios,
puntos de medición, lecturas de medidores, tarifarios por tramo, cobros
mensuales con **boleta electrónica SII**, caja de oficina e informes.

Clon vertical de [frig](https://github.com/felipebarraza6/frig) (POS gastronómico):
comparte backend (Yggdra) e infraestructura — auth multi-sucursal, finanzas,
pagos, SII/DTE, CRM, soporte — pero reemplaza la operación gastronómica por la
gestión de agua.

## Módulos propios del vertical (app `water` en el backend)

| Módulo | Qué hace |
|---|---|
| **Medidores** (`/meters`) | Puntos de medición por socio y sector, último consumo |
| **Lecturas** (`/readings`) | Captura por medidor + carga masiva CSV con validación |
| **Tarifarios** (`/tariffs`) | Cargo fijo mensual + tramos acumulativos por m³, con vigencias |
| **Cobros de agua** (`/billing`) | Corrida idempotente por período → cargos por socio + boletas SII en lote |

La corrida de cobro genera órdenes de venta por socio: los pagos, la morosidad,
las cuotas y la emisión SII (proveedor + CAF) reusan el flujo existente sin
cambios.

## Desarrollo

```bash
bun install
bun run dev            # frontend contra localhost:8000
bun run sync-contract  # regenerar tipos desde el freeze OpenAPI del backend
bun run lint && bun run type-check && bun run build
```

Backend: repositorio `yggdra_infra` (app `api/apps/water`). Cada APR es una
sucursal (`X-Branch-ID`).

## Branding

Placeholder `nxrd_apr` — identidad renombrable: `src/app/page.tsx` (landing),
`public/manifest.webmanifest`, `public/brand/` y `src/lib/frig-identity.ts`.
