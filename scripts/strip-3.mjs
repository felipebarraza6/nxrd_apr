import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

function rep(p, a, b) {
  let s = readFileSync(p, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  const A = a.split("\n").join(nl);
  if (!s.includes(A)) {
    console.log("MISS", p, "|", a.slice(0, 60));
    return;
  }
  s = s.split(A).join((b ?? "").split("\n").join(nl));
  writeFileSync(p, s);
  console.log("OK", p, "|", a.slice(0, 40));
}

// dashboard: quitar contador de productos y la card completa
rep(
  "src/app/(app)/dashboard/page.tsx",
  `  // El contador de productos del backend llega en 0 para esta sucursal a pesar de
  // tener catálogo. Usamos la lista local que ya cargamos.
  const productsCount = products.length;
`,
  "",
);
const card = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");
const start = card.indexOf(`        <SharedStatCard
          label="Productos"`);
if (start === -1) {
  console.log("MISS card Productos");
} else {
  // la card termina en /> antes de la card de Gastos; buscar el cierre '        />' siguiente
  const end = card.indexOf("\n        />", start);
  if (end === -1) {
    console.log("MISS cierre card");
  } else {
    let out = card.slice(0, start) + card.slice(end + "\n        />".length);
    // limpiar posible doble salto
    out = out.replace(/\n\n\n+/g, "\n\n");
    writeFileSync("src/app/(app)/dashboard/page.tsx", out);
    console.log("OK card Productos eliminada");
  }
}

// sales: quitar query de cupones y su UI
rep(
  "src/app/(app)/sales/page.tsx",
  `  const { data: orderDiscountUsages = [] } = useQuery({
    queryKey: ["discounts", "usage", "order", detail?.id],
    queryFn: () => fetchDiscountUsages({ order: detail!.id, page_size: 20 }),
    enabled: Boolean(detail?.id),
    staleTime: 30_000,
  });
`,
  "",
);
const cupones = readFileSync("src/app/(app)/sales/page.tsx", "utf8");
const cStart = cupones.indexOf(`                    Cupones aplicados`);
if (cStart === -1) {
  console.log("MISS UI cupones");
} else {
  // el bloque abre con <p ...> arriba; buscar el <p inicial y el cierre del div contenedor
  const blockStart = cupones.lastIndexOf(`<p className="text-xs font-semibold`, cStart);
  // cierre: el div que envuelve termina con </div> tras el map; buscar '</div>\n                  </div>' siguiente
  const tail = cupones.indexOf(`</div>\n                  </div>`, cStart);
  if (blockStart === -1 || tail === -1) {
    console.log("MISS límites UI cupones");
  } else {
    const out = cupones.slice(0, blockStart) + cupones.slice(tail + `</div>\n                  </div>`.length);
    writeFileSync("src/app/(app)/sales/page.tsx", out);
    console.log("OK UI cupones eliminada");
  }
}

// sidebar: quitar getBadgeValue kitchenReady
rep(
  "src/components/app-sidebar/app-sidebar.tsx",
  `  function getBadgeValue(badge?: string) {
    if (badge === "kitchenReady") return badges.readyCount > 0 ? badges.readyCount : undefined;
    return undefined;
  }
`,
  "",
);

// useCatalog ya sin usuarios: eliminar
unlinkSync("src/lib/hooks/useCatalog.ts");
console.log("OK useCatalog eliminado");
