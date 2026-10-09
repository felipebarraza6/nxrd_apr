# Código

Mapa de `src/`. El producto y el ciclo operativo están en el [README](../README.md) de la raíz.

| Carpeta | Contenido |
| --- | --- |
| `app/` | Rutas. La landing está en la raíz. `(auth)` es el ingreso. `(app)` es la operación con sesión. |
| `components/` | Interfaz. `water/` es el caudal WebGL y no importa el resto de Cauce. `ui/` es el kit compartido. |
| `lib/` | Cliente HTTP, sesión, tarifa vigente y búsqueda de socios. |
| `content/` | Textos de la landing. |

Una ruta de `(app)` lee y escribe por `lib/api`. No llama al servicio desde el componente de página si ya existe una función en ese cliente.
