// Post-procesado del export estático de Next.js: genera out/.htaccess para Apache.
//
// Next 16 emite cada ruta como "<ruta>.html" plano (más un directorio con el
// payload RSC), no como "<ruta>/index.html". Por eso:
//   1. Las URLs legacy de bodega (/warehouses/<id>) se reescriben a la vista
//      estática /warehouses/view.html (resuelve el id desde la querystring).
//      Otras rutas dinámicas (/login/<slug>, /reset-password/<token>,
//      /survey/<slug>) se reescriben a la instancia estática.
//   2. Cualquier otra URL sin extensión se resuelve a su "<ruta>.html" si existe.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

const dynamicRewrites = [
  ["^login/[^/]+/?$", "/login/__.html"],
  ["^warehouses/\\d+/?$", "/warehouses/view.html"],
  ["^reset-password/[^/]+/?$", "/reset-password/__.html"],
  // Encuesta pública por slug (excluye /survey/view fijo).
  ["^survey/(?!view(?:/|$))[^/]+/?$", "/survey/__.html"],
];

const dynamicRules = dynamicRewrites
  .map(([pattern, target]) => {
    const flags = target.includes("?") ? "[L,QSA]" : "[L]";
    return `RewriteRule ${pattern} ${target} ${flags}`;
  })
  .join("\n");

const htaccess = `# Generado por scripts/post-export.mjs — no editar a mano.
RewriteEngine On

# 1) Rutas dinámicas → instancia estática del placeholder "__" (resolución en el cliente)
${dynamicRules}

# 2) URLs sin extensión → su <ruta>.html (Next 16 exporta HTML plano, no index.html)
RewriteCond %{DOCUMENT_ROOT}/$1.html -f
RewriteRule ^(.+?)/?$ /$1.html [L]

# 3) 404 amigable: Next exporta 404.html; sin esto Apache sirve su página por defecto
ErrorDocument 404 /404.html

# Seguridad (equivalente a los headers que Next servía antes del export estático)
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
`;

writeFileSync(join(outDir, ".htaccess"), htaccess);
console.log(`OK: ${join(outDir, ".htaccess")}`);
