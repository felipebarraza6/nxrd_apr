# Cauce (nxrd_apr)

## Qué es

Cauce es el cliente web del ciclo de agua potable rural en Ginnung: socio, medidor, lectura, tarifa vigente y cobro del período. Cubre la operación Smart APR y la operación APR del comité o la cooperativa. Cada comité es una sucursal de la API. Este repo no guarda el padrón ni firma documentos.

## A quién sirve

Administración del comité (padrón, medidores, tarifa y cierre de mes), quien toma lecturas en terreno y quien cobra en caja. Sitio: [cauce.smartapr.cl](https://cauce.smartapr.cl).

## Stack

Next.js 16 (export estático), React 19, TypeScript, Tailwind CSS 4, TanStack Query, Zustand. CI con npm y `package-lock.json` (Node 24).

## Cómo correr en local

```bash
npm ci
npm run dev
```

Sin `NEXT_PUBLIC_YGGDRA_API_BASE`, desarrollo usa `http://localhost:8000/api`. Un build de producción del workflow usa `https://api.yggdra.cl/api`. Hace falta la API Ginnung corriendo si vas a operar datos reales en local.


## Variables de entorno

Solo nombres. Copia el ejemplo a un archivo local y completa los valores ahí. No los commitees ni los pegues en un issue.

| Nombre | Uso |
|--------|-----|
| `NEXT_PUBLIC_YGGDRA_API_BASE` | Base de la API, con `/api` |
| `NEXT_PUBLIC_APP_BUILD` | Identificador de build visible en la app |
| `YGGDRA_SCHEMA_YML` | Freeze local para `npm run sync-contract` y `npm run audit:api` |

No hay `.env.example` en la rama por defecto. El deploy inyecta la base de producción en el workflow.


## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Next en desarrollo |
| `npm run build` | Export estático |
| `npm run start` | Sirve el build de Next (el sitio público es el export) |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run test:watch` | Vitest en watch |
| `npm run sync-contract` | Regenera tipos y `src/lib/api/contract-sha.ts` |
| `npm run audit:api` | Cruza llamadas del cliente con el OpenAPI |

El mapa de `src/` está en [src/README.md](src/README.md). El índice histórico de `docs/` está en [docs/README.md](docs/README.md).


## Deploy (como está hoy)

Push a `production`, o `workflow_dispatch`, corre `.github/workflows/deploy.yml`: `npm ci`, build estático con la API de producción y subida FTP a cauce.smartapr.cl. `scripts/post-export.mjs` genera el `.htaccess`.

Secretos y variables del workflow (solo nombres): `CAUCE_FTP_PASSWORD` (secreto), `CAUCE_FTP_SERVER`, `CAUCE_FTP_USERNAME`, `CAUCE_FTP_TARGET_DIR` (variables).

`docs/CONSUMERS.yaml` registra el mismo destino: FTP desde `production`, dominio cauce.smartapr.cl.


Este PR de documentación no cambia workflows, secretos ni el destino del deploy.

## Relación con la API Ginnung

Auth `Authorization: Token` y header `X-Branch-ID`.

El ciclo de negocio usa accounts, branches, inventory, sales, finance, customers, suppliers, crm, support, iot-telemetry, water, surveys, shared, external-apps, equipment, privacy, plan-checkout y public.

`npm run sync-contract` sigue el mismo patrón que Frig: freeze local o descarga. En el inventario del backend, Cauce figura con tipos generados y sin el gate de CI del contrato. En este repo se confirma que no existe `contract.yml`.

Id de consumidor y etiqueta de issues de backend: `front:nxrd_apr`.


El chequeo reutilizable está en [docs/CONTRACT_CHECK.md](https://github.com/felipebarraza6/yggdra_infra/blob/main/docs/CONTRACT_CHECK.md) y en `.github/workflows/contract-check.yml` de `yggdra_infra`. Corre en el runner del VPS, compara el `schema_sha256` de `https://api.yggdra.cl/api/schema/contract/` con el sha commiteado en el front, regenera tipos desde el freeze de `api/schema/openapi.yaml` y exige `tsc --noEmit`.

En la rama por defecto de este repo **no hay** un workflow `contract.yml` que llame ese chequeo. El inventario `docs/CONSUMERS.yaml` del backend describe el estilo de consumo de cada app.

## Enlaces

- Arquitectura: [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)
- Índice de docs del cliente: [docs/README.md](docs/README.md)
- Mapa de API: [docs/api-map.md](docs/api-map.md)
- API Ginnung: https://github.com/felipebarraza6/yggdra_infra
- Chequeo de contrato: https://github.com/felipebarraza6/yggdra_infra/blob/main/docs/CONTRACT_CHECK.md
- Sitio: https://cauce.smartapr.cl
