import { readFileSync, writeFileSync } from "node:fs";

function edit(p, pairs) {
  let s = readFileSync(p, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  let miss = false;
  for (const [a, b] of pairs) {
    const A = a.split("\n").join(nl);
    if (!s.includes(A)) {
      console.log("MISS", p, "|", a.slice(0, 55));
      miss = true;
      continue;
    }
    s = s.split(A).join((b != null ? b : "").split("\n").join(nl));
  }
  writeFileSync(p, s);
  if (!miss) console.log("OK", p);
}

// ── session.ts: catálogos de paths operativos de gastronomía ──
edit("src/lib/store/session.ts", [
  [
    `const WAITER_ALLOWED_PATHS = [
  "/pos",
  "/pos/terminal",
  "/tables",
  "/tables/map",
  "/profile",
  "/help",
  "/support",
];`,
    "",
  ],
  [
    `const COOK_ALLOWED_PATHS = [
  "/kds",
  "/kds/terminal",
  "/kds/monitor",
  "/profile",
  "/help",
  "/support",
];`,
    "",
  ],
]);

// ── roles.ts: catálogo de roles APR (sin mesero/cocinero/repartidor) ──
edit("src/lib/roles.ts", [
  [
    `  { codes: ["CAJERO"], label: "Cajero", module: "pos" },
  { codes: ["WAITER", "MESERO"], label: "Mesero", module: "tables" },
  { codes: ["COCINERO", "COOK"], label: "Cocinero", module: "production" },
  { codes: ["REPARTIDOR", "COURIER"], label: "Repartidor", module: "deliveries" },`,
    `  { codes: ["CAJERO"], label: "Cajero de oficina", module: "cash_register" },`,
  ],
]);

// ── nav-access.ts: docks por defecto sin gastronomía ──
edit("src/lib/nav-access.ts", [
  [
    `  if (role.isWaiter) {
    return ["/tables", "/pos", "/help", "/profile"];
  }
  if (role.isCook) {
    return ["/kds", "/profile"];
  }
  return ["/dashboard", "/sales", "/pos", "/cash-register", "/tables", "/customers"];`,
    `  return ["/dashboard", "/payments", "/cash-register", "/customers", "/profile"];`,
  ],
]);

// ── sw.js: app shell sin POS ──
edit("public/sw.js", [
  `  "/dashboard",
  "/pos",
  "/sales",`,
  `  "/dashboard",
  "/customers",
  "/payments",
  "/sales",`,
]);

// ── openapi.ts: consola API APR ──
edit("src/lib/api/openapi.ts", [
  [
    `export const FRIG_API_APPS = [
  { id: "sales", label: "Ventas", blurb: "Pedidos, cobros, mesas, cocina y cotizaciones" },
  { id: "inventory", label: "Inventario", blurb: "Productos, combos, recintos, stock y compras" },
  { id: "accounts", label: "Usuarios", blurb: "Sesión y perfil del equipo" },
  { id: "branches", label: "Sucursales", blurb: "Locales, equipo, tema y módulos" },
  { id: "shared", label: "Configuración", blurb: "Ajustes compartidos del local" },
  { id: "finance", label: "Finanzas", blurb: "Caja, ingresos, egresos e impuestos" },
  { id: "bank_accounts", label: "Bancos", blurb: "Billeteras y conciliaciones" },
  { id: "invoices", label: "Facturación", blurb: "Boletas y documentos tributarios" },
  { id: "promotions", label: "Promociones", blurb: "Descuentos y cupones del POS" },
  { id: "recipes", label: "Recetas", blurb: "Fichas de receta e insumos" },
  { id: "nutrition", label: "Nutrición", blurb: "Tablas y etiquetado de productos" },
  { id: "crm", label: "CRM", blurb: "Prospectos, embudo, seguimientos y resumen" },
  { id: "surveys", label: "Encuestas", blurb: "Encuestas, respuestas, adjuntos y plantillas" },
  { id: "support", label: "Soporte", blurb: "Tickets, comentarios y adjuntos" },
] as const;`,
    `export const FRIG_API_APPS = [
  { id: "sales", label: "Cobros", blurb: "Cargos por consumo, órdenes y cuotas" },
  { id: "water", label: "Agua", blurb: "Medidores, lecturas, tarifarios y corridas de cobro" },
  { id: "inventory", label: "Inventario", blurb: "Materiales, bodegas, stock y compras" },
  { id: "accounts", label: "Usuarios", blurb: "Sesión y perfil del equipo" },
  { id: "branches", label: "APRs", blurb: "APRs, equipo, tema y módulos" },
  { id: "shared", label: "Configuración", blurb: "Ajustes compartidos" },
  { id: "finance", label: "Finanzas", blurb: "Caja, ingresos, egresos e impuestos" },
  { id: "bank_accounts", label: "Bancos", blurb: "Billeteras y conciliaciones" },
  { id: "invoices", label: "Facturación", blurb: "Boletas y documentos tributarios" },
  { id: "customers", label: "Socios", blurb: "Clientes, campos personalizados y fichas" },
  { id: "crm", label: "CRM", blurb: "Solicitantes, conexiones y seguimientos" },
  { id: "surveys", label: "Encuestas", blurb: "Encuestas, respuestas y plantillas" },
  { id: "support", label: "Soporte", blurb: "Tickets, comentarios y adjuntos" },
] as const;`,
  ],
]);
