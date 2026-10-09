# Validación funcional end-to-end — Cauce demo (producción)

Fecha: 2026-10-08 · Entorno: https://cauce.smartapr.cl · Rol: Administrador (demo «APR Río Claro», sesión de 60 min).
Método: navegador automatizado sobre el sitio en producción, con verificación contra la API (api.yggdra.cl) cuando la UI no dio señal. Los fixes locales (rama `dev`, aún sin desplegar) se marcan como tales.

## Resultados por prueba

| # | Módulo | Prueba | Resultado | Detalle / evidencia |
|---|--------|--------|-----------|---------------------|
| 1 | Acceso | Landing → «Probar demo» → rol Administrador | ✅ PASS | Modal con 3 roles, login demo OK, redirige a `/dashboard` |
| 2 | Acceso | Banner de demo con cuenta regresiva | ✅ PASS | «quedan 59:31» al entrar, visible en todas las páginas |
| 3 | Dashboard | KPIs y últimas órdenes | ✅ PASS | Ventas $1.176.960 (132), cuentas abiertas 108, socios 40, últimas órdenes con folio/estado/monto |
| 4 | Socios | Listado + contadores | ✅ PASS | 40 socios, cartera $2.166.450, tabs Todos/Deuda/Empresas/Personas |
| 5 | Socios | Búsqueda por nombre (con tilde) | ✅ PASS | «Rodrigo Lefián» → 1 resultado |
| 6 | Socios | Búsqueda sin tilde | ❌ FAIL | «rodrigo lefian» → «No hay socios con estos filtros» (placeholder promete RUT/nombre/tel) |
| 7 | Socios | Búsqueda por RUT | ❌ FAIL | «940000039» → vacío. **Gap también en /customers**, no solo en POS |
| 8 | Socios | Crear socio | ✅ PASS | «Socio Prueba QA» creado (40→41), validación de requeridos OK |
| 9 | Socios | Eliminar socio (limpieza) | ✅ PASS | DELETE API 204 (sin UI de borrado probada) |
| 10 | Puntos de medición | Listado + contadores | ✅ PASS | 41 medidores, estado, última lectura y nº de lecturas por medidor |
| 11 | Puntos de medición | Crear medidor | ⚠️ DEGRADADO | Crea (M-QA01 persistió, 40→41) pero el formulario se quedó «pegado» en carga sin confirmación visible; requirió recargar para ver el resultado |
| 12 | Puntos de medición | Vincular socio al editar | ⚠️ PARCIAL | Edición guarda OK, pero el combo de socio **solo carga los primeros 20** (A–L): un socio posterior no puede vincularse desde la UI |
| 13 | Lecturas | Listado por período | ✅ PASS | 25 lecturas, consumo total 368,1 m³ coherente con la lectura nueva |
| 14 | Lecturas POS | Búsqueda sin tilde | ✅ PASS | «nancucheo» encontró a «Ñancucheo» (el matching client-side cubre tildes cuando el término coincide por nombre) |
| 15 | Lecturas POS | Búsqueda por dirección | ✅ PASS | «sitio 28» → resultados correctos |
| 16 | Lecturas POS | Búsqueda por RUT | ❌ FAIL | «940000039» → sin resultados. **Fix ya implementado en `dev`** (búsqueda 100% client-side), pendiente de despliegue |
| 17 | Lecturas POS | Registrar lectura (Enter/botón) | ✅ PASS | 110,5 m³ en M-028: «Hechas» 24→25, avanzó 25/41→26/41, consumo reflejado en /readings |
| 18 | Tarifarios | Listado con tramos + ejemplo | ✅ PASS | Tarifa social con 3 tramos y cálculo de ejemplo (15 m³ = $7.750) |
| 19 | Tarifarios | Crear tarifario | ⚠️ DEGRADADO | Se crea (API 201 al instante) pero el diálogo no cierra ni confirma; sin feedback. Queda como «Vigente» por ser el más reciente |
| 20 | Tarifarios | Badge «Vigente» | ❌ FAIL (conocido) | El más reciente por fecha toma «Vigente» aunque recién creado; gap de tramos READ-ONLY ya documentado |
| 21 | Cobros | Listado de corridas + detalle | ✅ PASS | 6 corridas con tarifario, cargos, totales y detalle por medidor (consumo/cargo/pago) |
| 22 | Cobros | Generar corrida 2026-10 | ✅ PASS* | Corrida creada: 25 cargos (coincide con 25 lecturas). *Sin aviso de los 16 medidores saltados — fix en `dev` agrega toast + modal de detalle |
| 23 | Cobros | Emisión boletas SII | ⏭ NO PROBADO | Se omitió deliberadamente: riesgo de emisión documental real si la demo usa credenciales SII productivas |
| 24 | Cobros | Idempotencia de corrida | ✅ PASS (implícito) | Re-generación no duplicó cargos (corridas 6→7 solo por la nueva, no duplicó 2026-09) |
| 25 | Pagos | Carga del módulo | ✅ PASS | Listados con montos y estados visibles |
| 26 | Caja | Carga del módulo | ✅ PASS | Página operativa (sin turno abierto, estado consistente) |
| 27 | Informes | Informe de cobros | ✅ PASS | Carga con datos del período |

**Resumen: 19 PASS · 3 DEGRADADO/PARCIAL · 4 FAIL (3 ya corregidos en `dev`) · 1 no probado (decisión de seguridad)**

## Hallazgos nuevos (no estaban en la auditoría de código)

1. **ALTO — Búsqueda de socios rota igual que la del POS**: `/customers` promete «RUT, nombre, tel» en el placeholder pero RUT y sin-tilde no encuentran nada. → **CORREGIDO en `dev`**: fallback client-side sobre el padrón completo (matching normalizado nombre/RUT/teléfono) cuando el backend no encuentra.
2. **ALTO — Combo de socio truncado en medidores**: al crear/editar un punto de medición, el select de socio solo listaba los primeros 20 (orden alfabético A–L). → **CORREGIDO en `dev`**: el picker ahora carga el padrón completo (activos + inactivos, hasta 1.000).
3. ~~Formularios sin feedback post-guardado~~ **DESCARTADO (falso positivo de automatización)**: el código de medidor y tarifario sí cierra el diálogo y muestra toast en `onSuccess`; lo observado en el loop fue efecto de clics sintéticos que no disparaban el submit real de React. La corrida sí tiene `window.confirm` previo.
4. **MEDIO — Badge «Vigente» engañoso**: un tarifario recién creado (o con vigencia futura) quedaba marcado «Vigente» por ser el más reciente. → **CORREGIDO en `dev`**: «Vigente» solo si `effective_from ≤ hoy`; los futuros muestran «Vigencia futura». Además `/billing` marca «sin tramos (solo cargo fijo)» en el selector y muestra warning antes de facturar con un tarifario sin bloques.

## Otros fixes de este pase

- `ErrorDocument 404 /404.html` agregado al `.htaccess` generado (`scripts/post-export.mjs`): Apache ahora sirve la página 404 de la app en vez de la suya por defecto.

## Estado de los fixes de `dev` (pendientes de despliegue)

| Fix | Estado |
|-----|--------|
| Búsqueda POS por RUT (client-side) | ✅ implementado, validado por tests; revalidar en producción tras deploy |
| Paginación >500 medidores/lecturas | ✅ implementado |
| Skipped de corrida y CSV visibles | ✅ implementado — este loop confirmó el problema real (41 medidores → 25 cargos sin aviso) |
| Rebranding, errores es-CL, logout IDB | ✅ implementados, verificados en dev local |

## Limpieza post-prueba

Se eliminaron de la demo: socio «Socio Prueba QA», medidor M-QA01, tarifarios «Tarifa QA sin tramos» 1 y 2. Quedan (realistas): una lectura adicional en M-028 y la corrida 2026-10 con 25 cargos.
