import type { ModuleName, SubmoduleConfig } from "@/lib/api/branch-modules";

/**
 * Mapeo de rutas de Cauce al módulo de Yggdra que las controla.
 * `null` = ruta libre de módulo. No listadas → permitidas por defecto.
 *
 * Water gated con `water_management` (ViewSets alineados en yggdra_infra#39).
 */
export const ROUTE_MODULE_MAP: Record<string, ModuleName | null> = {
  "/dashboard": "dashboard",
  "/sales": "sales",
  "/reports": null,
  "/meters": "water_management",
  "/readings": "water_management",
  "/readings/pos": "water_management",
  "/tariffs": "water_management",
  "/billing": "water_management",
  "/reports/sales": null,
  "/reports/money": null,
  "/reports/revenues": null,
  "/reports/expenses": null,
  "/reports/dinero": null,
  "/reports/ingresos": null,
  "/reports/gastos": null,
  "/cash-register": "cash_register",
  "/cash-register/stations": "cash_register",
  "/warehouses": "inventory",
  "/inventory": "inventory",
  "/equipment": null,
  "/iot": "iot_telemetry",
  "/reports/equipment": null,
  "/reports/crm": "customers",
  "/customers": "customers",
  "/customers/surveys": "customers",
  "/customers/prospects": "customers",
  "/customers/pipeline": "customers",
  "/customers/forms": "customers",
  "/customers/follow-ups": "customers",
  "/survey/fill": "customers",
  "/promotions/discounts": "promotions",
  "/payments": "payment_methods",
  "/payment-methods": "payment_methods",
  "/tax-documents": "invoices",
  "/quotations": "sales",
  "/banks": "bank_accounts",
  "/bank-accounts": "bank_accounts",
  "/reconciliations": "bank_accounts",
  "/revenues": "finance",
  "/expenses": "finance",
  "/finance": "finance",
  "/fixed-expenses": "finance",
  "/finance/settings": "finance",
  "/suppliers": "suppliers",
  "/purchase-orders": "suppliers",
  "/users": "config",
  "/branches": "config",
  "/organization": "config",
  "/settings/modules": "config",
  "/profile": null,
  "/support": null,
  "/help": null,
};

/** Módulos que el backend trata como compuestos (tienen submódulos opcionales). */
export const COMPOSITE_MODULES: ModuleName[] = [
  "employees",
  "finance",
  "sales",
  "customers",
  "suppliers",
  "inventory",
  "logistics",
  "services",
  "water_management",
  "nutrition",
  "waste_management",
];

/** Submódulos opcionales soportados por cada módulo compuesto (alineado al backend). */
export const COMPOSITE_SUBMODULES: Partial<Record<ModuleName, ModuleName[]>> = {
  employees: ["payroll"],
  finance: ["payment_methods", "bank_accounts", "cash_register"],
  sales: ["tables"],
  customers: ["promotions", "scheduling"],
  inventory: ["product_gallery", "raw_materials", "certificates", "tariffs", "equipment"],
  logistics: ["deliveries"],
  services: ["memberships", "subscriptions"],
  water_management: ["tariffs", "certificates", "agreements"],
  nutrition: ["recipes", "ingredients"],
  waste_management: ["waste_tariffs", "waste_certificates", "waste_agreements"],
};

export function isCompositeModule(moduleName: ModuleName): boolean {
  return COMPOSITE_MODULES.includes(moduleName);
}

export function getCompositeSubmodules(moduleName: ModuleName): ModuleName[] {
  return COMPOSITE_SUBMODULES[moduleName] ?? [];
}

/** Todos los submódulos conocidos, útil para evitar mostrarlos también como módulos independientes. */
export const ALL_COMPOSITE_SUBMODULES: ModuleName[] = Object.values(COMPOSITE_SUBMODULES).flat();

/** Verifica si un submódulo específico está habilitado dentro de su compuesto. */
export function isSubmoduleEnabled(
  compositeName: ModuleName,
  submoduleName: ModuleName,
  submoduleConfig: SubmoduleConfig,
): boolean {
  if (!isCompositeModule(compositeName)) return false;
  const submodules = getCompositeSubmodules(compositeName);
  if (!submodules.includes(submoduleName)) return false;
  return submoduleConfig[submoduleName] ?? false;
}

const ROUTE_KEYS = Object.keys(ROUTE_MODULE_MAP);

/**
 * Resuelve el módulo asociado a una ruta.
 *
 * - Match exacto primero.
 * - Luego prefix de mayor longitud (ej. /readings/pos → /readings).
 * - Si no hay mapeo, devuelve `undefined` (se permite por defecto).
 */
export function getModuleForPath(pathname: string): ModuleName | null | undefined {
  const normalized = pathname.replace(/\/$/, "") || "/";

  if (normalized in ROUTE_MODULE_MAP) {
    return ROUTE_MODULE_MAP[normalized];
  }

  const prefixes = ROUTE_KEYS
    .filter((key) => key !== "/" && normalized.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length);

  if (prefixes.length > 0) {
    return ROUTE_MODULE_MAP[prefixes[0]];
  }

  return undefined;
}

/**
 * Verifica si un módulo está dentro de un set de módulos habilitados.
 * `null` siempre está habilitado (rutas libres de módulo).
 */
export function isModuleEnabled(
  moduleName: ModuleName | null | undefined,
  enabledModules: Set<ModuleName>,
): boolean {
  if (moduleName === null || moduleName === undefined) return true;
  return enabledModules.has(moduleName);
}

/**
 * Nombre del plan fijo de FRIG. Se busca insensible a mayúsculas/minúsculas
 * entre los planes disponibles y se aplica automáticamente al crear una
 * sucursal. Las demás apps (Smart Hydro, etc.) usan otros frontends.
 */
export const FRIG_PLAN_NAME = "Plan APR";

/**
 * Módulos que en Frig siempre están activos: no aparecen en /settings/modules
 * y el menú las muestra sin consultar el estado del backend.
 */
export const FRIG_ALWAYS_ON_MODULES: ModuleName[] = [
  "sales",
  "cash_register",
  "inventory",
  "invoices",
  "finance",
  "customers",
  "suppliers",
  "payment_methods",
  "bank_accounts",
  "water_management",
];

/**
 * Módulos que sí aparecen como cards en /settings/modules para activar/desactivar.
 * Todo lo demás se oculta de esa vista.
 *
 * Cada módulo usado por la app debe estar aquí o en FRIG_ALWAYS_ON_MODULES:
 * si falta de ambas listas, la ruta/menú que lo consume queda bloqueada
 * (fail-closed) sin forma de activarlo desde la UI.
 */
export const FRIG_SETTINGS_MODULES: ModuleName[] = [
  "invoices",
];

// ── Definición del menú de Frig ───────────────────────────────────────────────

export interface FrigMenuItem {
  href: string;
  label: string;
  /** Nombre del icono Lucide (para getMenuIcon). */
  icon: string;
  /** Módulo que controla este ítem. Si es `null` o está en FRIG_ALWAYS_ON_MODULES se muestra
   *  siempre; de lo contrario requiere `is_enabled === true` en el backend. */
  module: ModuleName | null;
  /** Badge opcional (pedidos pendientes, caja abierta, etc.). */
  badge?: "ordersPending" | "cashOpen" | "kitchenReady";
  /** Descripción corta para tooltip o subtítulo en el menú. */
  description?: string;
}

export interface FrigMenuGroup {
  title: string;
  /** Nombre del icono Lucide del grupo (para getIcon). */
  icon: string;
  items: FrigMenuItem[];
}

/**
 * Estructura completa del menú de Frig.
 * Cada grupo agrupa rutas funcionales; cada ítem declara el módulo del que depende.
 */
export const FRIG_MENU_DEF: FrigMenuGroup[] = [
  {
    title: "Resumen",
    icon: "LayoutDashboard",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", module: "dashboard", description: "Resumen general del negocio en tiempo real" },
    ],
  },
  {
    title: "Agua",
    icon: "Droplets",
    items: [
      { href: "/meters", label: "Medidores", icon: "Gauge", module: "water_management", description: "Puntos de medición por socio y sector" },
      { href: "/readings", label: "Lecturas", icon: "NotebookPen", module: "water_management", description: "Toma por ruta y carga masiva del período" },
      { href: "/readings/pos", label: "POS de lectura", icon: "Gauge", module: "water_management", description: "Casa por casa: captura rápida medidor a medidor" },
      { href: "/tariffs", label: "Tarifarios", icon: "ScrollText", module: "water_management", description: "Cargo fijo y tramos por m³ (tramos RO en API)" },
      { href: "/billing", label: "Cobros de agua", icon: "Receipt", module: "water_management", description: "Corridas del período y boletas SII" },
    ],
  },
  {
    title: "Informes",
    icon: "BarChart3",
    items: [
      { href: "/reports/sales", label: "Cobros", icon: "TrendingUp", module: null, description: "Informe de cobros por socio y período" },
      { href: "/reports/revenues", label: "Ingresos", icon: "ArrowDownLeft", module: null, description: "Detalle de ingresos por categoría" },
      { href: "/reports/expenses", label: "Gastos", icon: "ArrowUpRight", module: null, description: "Detalle de gastos por categoría" },
      { href: "/reports/money", label: "Dinero", icon: "Wallet", module: null, description: "Flujo de caja completo: pagos, orígenes, ingresos y egresos" },
      { href: "/reports/crm", label: "CRM", icon: "Users", module: "customers", description: "Prospectos, embudo, acciones y hallazgos comerciales" },
    ],
  },
  {
    title: "Cobros",
    icon: "HandCoins",
    items: [
      { href: "/sales", label: "Cargos", icon: "ShoppingBag", module: "sales", description: "Cargos por consumo de agua y su cobro" },
      { href: "/cash-register", label: "Caja", icon: "Banknote", module: "cash_register", description: "Apertura, cierre y movimientos de caja de oficina" },
    ],
  },
  {
    title: "Socios",
    icon: "Users",
    items: [
      { href: "/customers", label: "Socios", icon: "UserCircle", module: "customers", description: "Ficha 360, historial y deuda" },
      { href: "/customers/prospects", label: "Solicitantes", icon: "Users", module: "customers", description: "Postulantes antes de aprobar la conexión" },
      { href: "/customers/pipeline", label: "Conexiones", icon: "Kanban", module: "customers", description: "Embudo de nuevas conexiones" },
      { href: "/customers/follow-ups", label: "Seguimientos", icon: "FolderKanban", module: "customers", description: "Tareas del día, sin entrar a cada ficha" },
      { href: "/customers/forms", label: "Fichas", icon: "FileText", module: "customers", description: "Ficha del arranque y datos de instalación" },
      { href: "/customers/surveys", label: "Encuestas", icon: "ClipboardList", module: "customers", description: "Satisfacción con link público / QR" },
    ],
  },
  {
    title: "Operación",
    icon: "Package",
    items: [
      { href: "/warehouses", label: "Bodegas", icon: "Warehouse", module: "inventory", description: "Bodegas y sus responsables" },
      { href: "/inventory", label: "Inventario", icon: "ClipboardList", module: "inventory", description: "Materiales, cloro y stock por bodega" },
    ],
  },
  {
    title: "Dinero",
    icon: "Landmark",
    items: [
      { href: "/payments", label: "Pagos", icon: "Banknote", module: "payment_methods", description: "Transacciones y métodos de pago" },
      { href: "/revenues", label: "Ingresos", icon: "ArrowDownLeft", module: "finance", description: "Registro de ingresos del APR" },
      { href: "/expenses", label: "Egresos", icon: "ArrowUpRight", module: "finance", description: "Registro de egresos del APR" },
      { href: "/fixed-expenses", label: "Gastos", icon: "TrendingDown", module: "finance", description: "Gastos fijos y programados (energía, mantención)" },
      { href: "/tax-documents", label: "DTE", icon: "FileText", module: "invoices", description: "Boletas y facturas electrónicas al SII" },
      { href: "/suppliers", label: "Proveedores", icon: "Truck", module: "suppliers", description: "Directorio de proveedores" },
      { href: "/purchase-orders", label: "Órdenes de compra", icon: "ShoppingCart", module: "suppliers", description: "Pedidos a proveedores y su recepción" },
      { href: "/bank-accounts", label: "Billeteras", icon: "Wallet", module: "bank_accounts", description: "Cuentas y saldos bancarios" },
      { href: "/reconciliations", label: "Conciliaciones", icon: "ArrowLeftRight", module: "bank_accounts", description: "Cuadra movimientos con el banco" },
      { href: "/finance/settings", label: "Configuración", icon: "Settings", module: "finance", description: "Impuestos, SII, funciones de la app y folios CAF" },
    ],
  },
  {
    title: "Ajustes de acceso",
    icon: "Settings",
    items: [
      { href: "/organization", label: "Organización", icon: "Building2", module: "config", description: "Tu organización: APR y planes" },
      { href: "/users", label: "Usuarios", icon: "UserIcon", module: "config", description: "Usuarios y sus roles por APR" },
      { href: "/branches", label: "APRs", icon: "Store", module: "config", description: "APRs de la organización y su equipo" },
      { href: "/settings/modules", label: "Módulos", icon: "Settings", module: "config", description: "Activa o desactiva módulos por APR" },
    ],
  },
  {
    title: "Ayuda",
    icon: "LifeBuoy",
    items: [
      {
        href: "/help",
        label: "Documentación",
        icon: "BookOpen",
        module: null,
        description: "Guías claras para usar FRIG",
      },
      {
        href: "/help/api",
        label: "API para integrar",
        icon: "Code2",
        module: null,
        description: "Rutas para conectar tu propio sistema",
      },
      {
        href: "/support",
        label: "Soporte",
        icon: "LifeBuoy",
        module: null,
        description: "Problemas, dudas e ideas al equipo",
      },
    ],
  },
];

/**
 * Todos los módulos que aparecen en el menú de Frig.
 * Útil para saber qué módulos son relevantes para esta app.
 */
export const FRIG_MODULE_NAMES = Array.from(
  new Set(FRIG_MENU_DEF.flatMap((g) => g.items.map((i) => i.module))),
) as ModuleName[];

// ── Guards de redirección ─────────────────────────────────────────────────────

/** Módulos de ruta que en Cauce dependen de caja de oficina. */
const POS_DEPENDENT_ROUTE_MODULES = new Set<string>(["cash_register"]);

/**
 * Dado un conjunto de paths permitidos y los módulos habilitados,
 * devuelve el primer path cuyo módulo asociado esté activo.
 */
export function firstEnabledAllowedPath(
  allowedPaths: readonly string[],
  enabledModuleNames: ReadonlySet<string>,
): string | null {
  for (const path of allowedPaths) {
    const moduleName = getModuleForPath(path);
    if (moduleName === null || moduleName === undefined) return path;
    if (FRIG_ALWAYS_ON_MODULES.includes(moduleName)) return path;
    if (!enabledModuleNames.has(moduleName)) continue;
    if (
      POS_DEPENDENT_ROUTE_MODULES.has(moduleName) &&
      !enabledModuleNames.has("pos")
    ) {
      continue;
    }
    return path;
  }
  return null;
}

/**
 * Set de módulos habilitados construido a partir del estado del session
 * store (frontend-config). Útil para los guards que necesitan la respuesta
 * rápida del store (sin esperar a la query `branch-modules`).
 */
export function enabledModuleSet(
  modules: Record<string, { is_enabled?: boolean } | undefined>,
): Set<string> {
  const set = new Set<string>();
  for (const [name, state] of Object.entries(modules)) {
    if (state?.is_enabled === true) set.add(name);
  }
  return set;
}
