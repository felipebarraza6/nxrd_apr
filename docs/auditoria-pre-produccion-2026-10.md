# Auditoría pre-producción — Cauce (nxrd_apr)

Fecha: 2026-10-08 · Rama `dev` (limpia) · Alcance: transversal, 3 frentes (entrada/acceso, núcleo operativo, calidad transversal) + pipeline automático.

## Pipeline automático

| Check | Resultado |
|---|---|
| `npm run lint` | ✅ sin errores |
| `npm run type-check` | ✅ sin errores |
| `npm test` | ✅ 69 tests en 9 suites |
| `npm run build` | ✅ export estático completo |

No hay bloqueadores de build. Los hallazgos son de producto/UX/seguridad de cara al cliente.

## CRÍTICOS (resolver antes de producción)

1. **Búsqueda POS por RUT/dirección rota** — `src/lib/api/water.ts:150-155` + `readings/pos/page.tsx:115-123`. El backend filtra por nombre/sector/número antes del matching client-side: buscar `12.345.678-9` o texto sin tilde (`jose perez` vs `José Pérez`) devuelve 0 resultados aunque el socio exista. Rompe el caso de uso principal del medidor en terreno. Fix: buscar en cliente sobre el listado completo (o ampliar search fields en backend).
2. **`/politicas` con marca FRIG y contacto legal equivocado** — `politicas/page.tsx:5,7-76,159-175`. Título "— FRIG", cuerpo gastronómico, `frig@yggdra.cl` dos veces. Texto legal con marca equivocada en producción = riesgo legal/comercial y coherencia de marca.
3. **Heurística demo captura APRs reales** — `cauce-demo.ts:139-149` marca como demo cualquier branch con "río claro"/"(demo") en el nombre. Una APR cliente real llamada "Río Claro" ve banner demo congelado y **se le oculta el aviso de vencimiento del trial** (`(app)/layout.tsx:268,296`). Fix: detectar solo por `demo_expires_at`/email demo.

## ALTOS

**Marca y confianza**
4. Reset/forgot password con branding FRIG — `reset-password-client.tsx:42,121,215-231`, `forgot-password/page.tsx:105`. La tesorera llega desde el correo de recuperación a una página "FRIG — gestión gastronómica": parece phishing y abandona.
5. Checkout de contratación menciona FRIG — `checkout-modal.tsx:54,187,239` (default `frig@yggdra.cl` desde `content/landing.ts:141-143`).

**Errores sin traducir (usuario no técnico)**
6. Login muestra mensajes crudos del backend (posible inglés) — `login/page.tsx:230-234` vía `client.ts:278-308`. El error más frecuente del ciclo de entrada es justo el no traducido.
7. Correo duplicado vía 400 llega en inglés — `cauce-checkout.ts:204-232,285-301`; `toSpanish()` no cubre "already exists".

**Núcleo operativo**
8. Omisiones silenciosas en corrida de cobro — `billing/page.tsx:64-72` descarta `run.skipped`: socios sin lectura/medidor quedan sin facturar sin aviso. Igual el CSV (`readings/page.tsx:296-299` hardcodea la razón).
9. Truncamiento silencioso en 500 medidores — `water.ts:165,217` (`page_size=500` sin paginar): APRs grandes ven rutas "completadas" falsas.
10. Tarifario sin tramos facturable sin warning — se puede facturar un mes completo con solo cargo fijo (`tariffs/page.tsx`, `/billing` sin aviso de "sin tramos"); además el badge "Vigente" = más reciente aunque sea futuro (`tariffs/page.tsx:32-83`).
11. Sin reversa de corridas de cobro — facturar con tarifario equivocado es irreversible desde la UI.
12. Pagos sin validar contra saldo — `payments/page.tsx:1606-1620`: excedentes/pagos parciales sin confirmación ni manejo.
13. Persister sirve datos de hasta 24h sin aviso — `query-persist.ts` + `providers.tsx:52-68` sin banner offline ni fecha de datos. Con API caída, el tesorero ve datos viejos como actuales.
14. Logout no limpia blobs IDB de otras sucursales — `logout-local.ts:20-28` limpia solo la sucursal activa; quedan socios/usuarios en dispositivos compartidos. Debería borrar por prefijo `cauce.rq.<uid>.*`.

## MEDIOS (selección)

- `activatingBranchRef` sin reset: fallo de `activateBranch` deja sin sucursal ni reintento (`(app)/layout.tsx:183-195`).
- Iniciar demo sobrescribe sesión real sin aviso (`demo-role-picker.tsx:39-43`).
- Polling de `/checkout/result` reintenta ciego 4 min ante 404 (`page.tsx:104-114`).
- Éxito de signup sin reenvío/soporte si el correo no llega (`cauce-signup.tsx:252-280`).
- `must_set_password` quema el magic link si expira a mitad (`login/page.tsx:298-305`).
- Export de pagos inconsistente con filtros (`payments/page.tsx:755-775`); CSV finanzas con montos como texto `$1.250`.
- Caja cierra con descuadre sin nota ni confirmación (`cash-register/page.tsx:799-814`).
- `ErrorDocument 404` falta en `.htaccess` generado (`post-export.mjs`).
- Terminología: "ventas" residual vs "cobros/cargos" en reports, dashboard, tax-documents; textos "mesas/cocina" en help/support.
- Zoom bloqueado (`layout.tsx:66-69`) — usuarios adultos APR, WCAG 1.4.4.
- Lectura menor a la anterior: solo warning, preview enmascara consumo negativo a 0 (`pos/page.tsx:457,511-541`).

## Positivo verificado

- Emisión DTE idempotente con reporte emitted/failed/skipped por medidor y modal claro.
- Guard anti doble-submit en POS; CSV export con BOM UTF-8 y `;` es-CL.
- Fix 20efe6e confirmado (cuentas abiertas desde receivables) — falta solo el monto del fallback.
- Aislamiento entre tenants correcto (X-Branch-ID por request, invalidación al cambiar sucursal).
- Forgot password anti-enumeración; aviso persistente de sesión expirada en login.

## Plan sugerido (orden de ataque)

1. Bloqueantes de confianza: #2, #4, #5 (rebranding), #3 (demo), #6, #7 (traducción de errores).
2. Bloqueantes operativos: #1 (búsqueda POS), #8 (skipped visibles), #9 (paginación >500).
3. Protección de datos: #14 (logout), #13 (banner offline), token en localStorage (documentar decisión).
4. Después: #10-#12 y los medios.
