/**
 * Catálogo completo de guías del producto (Ayuda → Documentación).
 * Cubre todos los grupos del menú y roles ops / admin / dev.
 */

export type HelpGuideAudience = "ops" | "admin" | "dev";

export type HelpGuideGroup =
  | "inicio"
  | "vender"
  | "local"
  | "crm"
  | "catalogo"
  | "dinero"
  | "informes"
  | "ajustes"
  | "ayuda"
  | "integraciones";

/** Mini pantalla con datos como en la app. */
export interface HelpExample {
  caption?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  /** Líneas "nombre · valor" (cuenta, ticket, listado). */
  items?: string[];
  rows?: { label: string; value: string }[];
  total?: string;
  code?: string;
}

export interface HelpGuideSection {
  heading: string;
  body: string[];
  tips?: string[];
  /** Lo que esta función no cubre (alcance). */
  limits?: string[];
  example?: HelpExample;
}

export interface HelpGuide {
  slug: string;
  title: string;
  summary: string;
  group: HelpGuideGroup;
  /** Módulo relacionado (null = transversal). */
  module: string | null;
  audience: HelpGuideAudience[];
  icon: string;
  href?: string;
  sections: HelpGuideSection[];
}

export const HELP_GUIDE_GROUPS: {
  id: HelpGuideGroup;
  label: string;
  description: string;
}[] = [
  { id: "inicio", label: "Inicio", description: "Acceso, roles y panorama general" },
  { id: "vender", label: "Cobros", description: "Cargos de agua, caja y cobros" },
    { id: "crm", label: "Socios", description: "Socios, conexiones y seguimientos" },
  { id: "catalogo", label: "Operación", description: "Materiales, bodegas e inventario" },
  { id: "dinero", label: "Dinero", description: "Pagos, finanzas, proveedores y bancos" },
  { id: "informes", label: "Informes", description: "Cobros, flujo de caja y CRM" },
  { id: "ajustes", label: "Ajustes", description: "Organización, usuarios, sucursales y módulos" },
  { id: "ayuda", label: "Ayuda", description: "Suscripción, soporte y documentación" },
  { id: "integraciones", label: "Integraciones", description: "Alcance de la API que la app usa en el APR" },
];

export const HELP_GUIDES: HelpGuide[] = [
  // ── Inicio ──────────────────────────────────────────────────────────────
  {
    slug: "primeros-pasos",
    title: "Primeros pasos",
    summary: "Login, sucursal activa, menú y dock móvil.",
    group: "inicio",
    module: null,
    audience: ["ops", "admin"],
    icon: "Sparkles",
    sections: [
      {
        heading: "Entrar",
        body: [
          "Abre la URL de tu marca e inicia sesión con el correo que te asignó el propietario.",
          "Al entrar ves el menú de tu sucursal: solo aparecen las áreas que el plan y los módulos permiten.",
        ],
        tips: ["Si no puedes entrar, pide al propietario que revise tu usuario y la sucursal asignada."],
      },
      {
        heading: "Sucursal activa",
        body: [
          "Todo lo que haces (ventas, stock, caja) queda en la sucursal que estás viendo.",
          "Si trabajas en varios locales, cámbialos desde el conmutador del menú. Colores y logo siguen a ese local.",
        ],
        example: {
          kicker: "Conmutador",
          title: "Macanuo Bowl",
          subtitle: "Las ventas y el color de esta sesión son de este local.",
          badge: "Activa",
          rows: [
            { label: "Rol", value: "Cajero" },
            { label: "Plan", value: "Plan mensual" },
          ],
        },
      },
      {
        heading: "Navegación",
        body: [
          "En escritorio el menú lateral agrupa Vender, Local, Catálogo, Dinero y Ajustes.",
          "En el teléfono el dock inferior no cambia al navegar. Abre Menú para el resto de pantallas y fija favoritos.",
        ],
        tips: ["En Ayuda están las guías, la API y Soporte para hablar con el equipo."],
      },
    ],
  },
  {
    slug: "roles-y-permisos",
    title: "Roles y permisos",
    summary: "OWNER, ADMIN_LOCAL, CAJERO, GARZÓN, COCINERO y qué puede hacer cada uno.",
    group: "inicio",
    module: "config",
    audience: ["admin", "ops"],
    icon: "UserIcon",
    href: "/users",
    sections: [
      {
        heading: "Roles habituales",
        body: [
          "OWNER: contrata plan, gestiona sucursal y equipo.",
          "ADMIN_LOCAL: opera y configura módulos, sin cancelar suscripción de plataforma.",
          "CAJERO: POS, caja y cobros. GARZÓN: mesas y pedidos. COCINERO: KDS.",
        ],
      },
      {
        heading: "Módulos",
        body: [
          "Aunque tengas rol, si el módulo está apagado en Ajustes → Módulos no verás la ruta.",
          "El candado de suscripción (sin plan activo) deja Perfil, Ayuda y Soporte.",
        ],
      },
    ],
  },
  {
    slug: "dashboard",
    title: "Dashboard",
    summary: "Resumen del día: ventas, caja y alertas.",
    group: "inicio",
    module: "dashboard",
    audience: ["admin", "ops"],
    icon: "LayoutDashboard",
    href: "/dashboard",
    sections: [
      {
        heading: "Qué mirar",
        body: [
          "KPIs del período (ventas, tickets, promedio).",
          "Accesos rápidos a POS, ventas y reportes según módulos activos.",
        ],
      },
    ],
  },

  // ── Vender ──────────────────────────────────────────────────────────────
  {
    slug: "caja",
    title: "Caja",
    summary: "Apertura, movimientos, arqueo y cierre de estación.",
    group: "vender",
    module: "cash_register",
    audience: ["ops", "admin"],
    icon: "Banknote",
    href: "/cash-register",
    sections: [
      {
        heading: "Ciclo de caja",
        body: [
          "Abre la estación con el efectivo inicial antes del primer cobro.",
          "Durante el turno entran pagos del POS e ingresos o egresos que registres a mano.",
          "Al cerrar, cuenta el efectivo, anota diferencias y confirma el arqueo.",
        ],
        tips: ["No compartas una estación abierta entre turnos distintos: cierra y abre de nuevo."],
        example: {
          kicker: "Estación Barra",
          title: "Caja abierta",
          badge: "Turno",
          rows: [
            { label: "Apertura", value: "$50.000" },
            { label: "Ventas POS", value: "$128.400" },
            { label: "Egresos", value: "$8.000" },
            { label: "Esperado", value: "$170.400" },
          ],
        },
      },
      {
        heading: "Estaciones",
        body: [
          "Un local puede tener barra, terraza o delivery, cada una con su caja.",
          "Configúralas en Caja → Estaciones y elige cuál usas al vender.",
        ],
      },
    ],
  },
  {
    slug: "ventas",
    title: "Ventas",
    summary: "Historial de órdenes, estados, devoluciones y documentos.",
    group: "vender",
    module: "sales",
    audience: ["ops", "admin"],
    icon: "ShoppingBag",
    href: "/sales",
    sections: [
      {
        heading: "Listado",
        body: [
          "Filtra por fecha, estado de pago y tipo de orden.",
          "Abre el detalle para ver líneas, pagos, descuentos y documentos.",
        ],
        example: {
          kicker: "Hoy",
          title: "Venta #1842",
          subtitle: "Mesa 7 · 13:42",
          badge: "Pagada",
          items: ["Efectivo · $9.180", "2 productos · Completos"],
        },
      },
      {
        heading: "Detalle",
        body: [
          "Desde el detalle puedes registrar un cobro pendiente, una devolución o descargar boleta y comanda de cocina cuando el local lo usa.",
          "Unir órdenes: pasa los productos de otras cuentas abiertas a esta. Sirve para mostrador, delivery o mesas (más universal que juntar solo mesas).",
          "Pagar en cuotas: conviertes el saldo en un plan (fechas y montos). Cada cuota se cobra aparte hasta cerrar la orden.",
          "El estado de pago se actualiza al registrar el dinero; no borres una venta cobrada: anula o devuelve según el caso.",
        ],
      },
    ],
  },

  // ── Local ───────────────────────────────────────────────────────────────

  // ── CRM ─────────────────────────────────────────────────────────────────
  {
    slug: "clientes",
    title: "Socios",
    summary: "Ficha 360: historial, deuda y seguimientos comerciales.",
    group: "crm",
    module: "customers",
    audience: ["ops", "admin"],
    icon: "UserCircle",
    href: "/customers",
    sections: [
      {
        heading: "Ficha 360",
        body: [
          "Abre un socio para ver identidad, KPIs, ventas y montos por cobrar.",
          "Desde Pendientes puedes cobrar sin salir de la ficha.",
        ],
      },
      {
        heading: "Seguimientos",
        body: [
          "Registra notas, llamadas y tareas en la pestaña Seguimientos.",
          "Quedan ligados al socio para el próximo contacto comercial.",
        ],
      },
    ],
  },
  {
    slug: "prospectos",
    title: "Prospectos",
    summary: "Leads antes de convertirse en socios.",
    group: "crm",
    module: "customers",
    audience: ["ops", "admin"],
    icon: "Users",
    href: "/customers/prospects",
    sections: [
      {
        heading: "Flujo",
        body: [
          "Alta rápida → contactar / calificar → Convertir a socio.",
          "Al convertir se crea la ficha y puedes seguir en Socios.",
        ],
      },
    ],
  },
  {
    slug: "seguimientos",
    title: "Seguimientos",
    summary: "Notas, llamadas y tareas comerciales.",
    group: "crm",
    module: "customers",
    audience: ["ops", "admin"],
    icon: "FolderKanban",
    href: "/customers/follow-ups",
    sections: [
      {
        heading: "Dónde",
        body: [
          "Hub de abiertos/completados, o pestaña Seguimientos dentro de cada socio.",
        ],
      },
    ],
  },
  {
    slug: "fichas",
    title: "Fichas de levantamiento",
    summary: "Campos del socio y el formulario de levantamiento para cotizar.",
    group: "crm",
    module: "customers",
    audience: ["admin", "ops"],
    icon: "FileText",
    href: "/customers/forms",
    sections: [
      {
        heading: "Armar",
        body: [
          "Crea secciones y campos (texto, sí/no, fecha, etc.).",
          "Publica el levantamiento de la sección: el link queda en Fichas.",
          "Desde el socio se envía por WhatsApp; al responder, se aplica a la ficha y se cotiza.",
        ],
      },
    ],
  },
  {
    slug: "encuestas",
    title: "Encuestas",
    summary: "Satisfacción NPS y CSAT con link público.",
    group: "crm",
    module: "customers",
    audience: ["ops", "admin"],
    icon: "ClipboardList",
    href: "/customers/surveys",
    sections: [
      {
        heading: "Crear",
        body: [
          "Plantillas NPS (0–10) o CSAT (1–5).",
          "Copia el link público (QR) o el interno (staff).",
        ],
      },
      {
        heading: "Link",
        body: [
          "Público: sin login (/survey/view?slug=…).",
          "Interno: dentro de la app con sesión y socio opcional.",
        ],
      },
    ],
  },
  {
    slug: "pipeline",
    title: "Pipeline comercial",
    summary: "Embudo de oportunidades por etapa, con valor y cierre esperado.",
    group: "crm",
    module: "customers",
    audience: ["admin", "ops"],
    icon: "Kanban",
    href: "/customers/pipeline",
    sections: [
      {
        heading: "Mover",
        body: [
          "Arrastra o usa las flechas ← → de cada tarjeta para cambiar de etapa.",
          "El detalle permite editar valor, cierre esperado y notas (botón lápiz).",
        ],
      },
      {
        heading: "KPIs",
        body: [
          "Total abierto, valor ponderado por probabilidad de etapa y ganado.",
          "Crea oportunidades desde un prospecto con el atajo de la tarjeta.",
        ],
      },
    ],
  },

  // ── Catálogo ────────────────────────────────────────────────────────────
  {
    slug: "combos-y-modificadores",
    title: "Combos y modificadores",
    summary: "Armados con precio especial y opciones por producto.",
    group: "catalogo",
    module: "product_catalog",
    audience: ["admin"],
    icon: "Boxes",
    href: "/products/combos",
    sections: [
      {
        heading: "Combos",
        body: ["Agrupa productos con precio de combo.", "Se venden como unidad en el POS."],
      },
      {
        heading: "Modificadores",
        body: [
          "Grupos (tamaño, proteína) y opciones con cargo extra.",
          "Se asocian a productos vía product-modifier-groups.",
        ],
      },
    ],
  },
  {
    slug: "categorias",
    title: "Categorías",
    summary: "Organiza el catálogo para POS y menús públicos.",
    group: "catalogo",
    module: "product_catalog",
    audience: ["admin"],
    icon: "Tags",
    href: "/categories",
    sections: [
      {
        heading: "Uso",
        body: [
          "Crea categorías y asigna productos.",
          "El orden y visibilidad impactan cartas digitales y el selector del POS.",
        ],
      },
    ],
  },
  {
    slug: "bodegas",
    title: "Bodegas (recintos)",
    summary: "Planta de recintos: frío, seco, herramientas y stock por sala.",
    group: "catalogo",
    module: "inventory",
    audience: ["admin", "ops"],
    icon: "Warehouse",
    href: "/warehouses",
    sections: [
      {
        heading: "Planta",
        body: [
          "El hub muestra recintos como salas. Entra a cada uno para ver productos y movimientos.",
          "Frío, seco u otros tipos se distinguen por el color del tema del local.",
        ],
      },
      {
        heading: "Agregar productos",
        body: [
          "Desde el recinto puedes encolar productos y cantidades.",
          "El stock que ves es el de esa sala, no el consolidado de toda la sucursal.",
        ],
      },
    ],
  },
  {
    slug: "inventario",
    title: "Inventario",
    summary: "Stock por bodega, alertas y movimientos.",
    group: "catalogo",
    module: "inventory",
    audience: ["admin", "ops"],
    icon: "ClipboardList",
    href: "/inventory",
    sections: [
      {
        heading: "Operación",
        body: [
          "Consulta existencias, mínimos y puntos de reorden.",
          "Los ingresos por OC actualizan cantidades al recibir.",
        ],
      },
    ],
  },

  // ── Dinero ──────────────────────────────────────────────────────────────
  {
    slug: "pagos",
    title: "Pagos",
    summary: "Transacciones y métodos de pago de la sucursal.",
    group: "dinero",
    module: "payment_methods",
    audience: ["admin", "ops"],
    icon: "Banknote",
    href: "/payments",
    sections: [
      {
        heading: "Uso",
        body: [
          "Revisa pagos registrados (efectivo, tarjeta, transferencia…).",
          "Los métodos disponibles se configuran por sucursal.",
        ],
      },
    ],
  },
  {
    slug: "ingresos-y-egresos",
    title: "Ingresos y egresos",
    summary: "Registro manual de dinero que no viene del POS.",
    group: "dinero",
    module: "finance",
    audience: ["admin"],
    icon: "ArrowDownLeft",
    href: "/revenues",
    sections: [
      {
        heading: "Ingresos",
        body: ["Registra entradas extra (arriendos, aportes) con categoría y fecha."],
      },
      {
        heading: "Egresos",
        body: ["Registra salidas operativas fuera de OC o gastos fijos."],
      },
      {
        heading: "Gastos fijos",
        body: ["Programa gastos recurrentes (arriendo, servicios) en Gastos."],
      },
    ],
  },
  {
    slug: "documentos-tributarios",
    title: "DTE (documentos tributarios)",
    summary: "Boleta o factura electrónica por cada venta, enviada al SII.",
    group: "dinero",
    module: "invoices",
    audience: ["admin"],
    icon: "FileText",
    href: "/tax-documents",
    sections: [
      {
        heading: "Qué es un DTE",
        body: [
          "Es el comprobante electrónico de una venta: boleta (consumidor final) o factura (empresa con RUT).",
          "Se genera desde una orden pagada. El folio sale del CAF cargado en Configuración financiera.",
        ],
      },
      {
        heading: "Cómo se configura",
        body: [
          "En Configuración financiera eliges la app de facturación, y para cada caso (boleta, factura, nota) la función de esa app.",
          "Los CAF, la resolución SII y el certificado se cargan ahí, no en la ficha de sucursal.",
        ],
      },
      {
        heading: "Estados",
        body: [
          "Borrador → Emitido → Enviado al SII → Aceptado o Rechazado.",
          "Un documento ya emitido se anula con una nota de crédito.",
        ],
      },
    ],
  },
  {
    slug: "proveedores-y-oc",
    title: "Proveedores y órdenes de compra",
    summary: "Directorio, OC y recepción de mercadería.",
    group: "dinero",
    module: "suppliers",
    audience: ["admin"],
    icon: "Truck",
    href: "/suppliers",
    sections: [
      {
        heading: "Proveedores",
        body: ["Mantén el directorio con contacto y productos asociados."],
      },
      {
        heading: "Órdenes de compra",
        body: [
          "Crea la OC, envíala y recibe cantidades: el stock de bodega se actualiza al completar.",
          "Estados de la OC siguen las reglas de Yggdra (parcial / completa).",
        ],
      },
    ],
  },
  {
    slug: "billeteras-y-conciliaciones",
    title: "Billeteras y conciliaciones",
    summary: "Cuentas bancarias, saldos y cuadre con cartolas.",
    group: "dinero",
    module: "bank_accounts",
    audience: ["admin"],
    icon: "Wallet",
    href: "/bank-accounts",
    sections: [
      {
        heading: "Billeteras",
        body: ["Registra cuentas y saldos de la organización/sucursal."],
      },
      {
        heading: "Conciliaciones",
        body: ["Cuadra movimientos internos con el extracto bancario."],
      },
    ],
  },
  {
    slug: "config-financiera",
    title: "Configuración financiera",
    summary: "Impuestos y parámetros de dinero de la sucursal.",
    group: "dinero",
    module: "finance",
    audience: ["admin"],
    icon: "Settings",
    href: "/finance/settings",
    sections: [
      {
        heading: "Qué configurar",
        body: [
          "Impuestos, redondeos y preferencias contables expuestas por Yggdra.",
          "Afecta reportes de dinero e ingresos/egresos.",
        ],
      },
    ],
  },

  // ── Informes ────────────────────────────────────────────────────────────
  {
    slug: "informes-ventas",
    title: "Informe de ventas",
    summary: "Cobros por socio, tipo y día.",
    group: "informes",
    module: null,
    audience: ["admin"],
    icon: "TrendingUp",
    href: "/reports/sales",
    sections: [
      {
        heading: "Filtros",
        body: [
          "Usa rango de fechas y presets del kit de informes.",
          "Exporta CSV/Excel según la pantalla.",
        ],
      },
    ],
  },
  {
    slug: "informe-crm",
    title: "Informe CRM",
    summary: "Prospectos, embudo y acciones del período con deltas.",
    group: "informes",
    module: "customers",
    audience: ["admin"],
    icon: "Users",
    href: "/reports/crm",
    sections: [
      {
        heading: "Pestañas",
        body: [
          "Resumen con KPIs vs. período anterior, Embudo por etapa, Acciones y Hallazgos.",
          "Hallazgos enlazan directo a la pantalla para resolver cada problema.",
        ],
      },
      {
        heading: "Exportar",
        body: [
          "Botón Exportar CSV: resumen, embudo, estados, fuentes y acciones.",
          "Los KPIs se calculan en el servidor (sin límite de registros).",
        ],
      },
    ],
  },
  {
    slug: "informes-dinero",
    title: "Informes de dinero",
    summary: "Ingresos, gastos y flujo de caja consolidado.",
    group: "informes",
    module: null,
    audience: ["admin"],
    icon: "Wallet",
    href: "/reports/money",
    sections: [
      {
        heading: "Pantallas",
        body: [
          "Ingresos y Gastos detallan categorías.",
          "Dinero une pagos, orígenes, ingresos y egresos del período.",
        ],
      },
    ],
  },

  // ── Ajustes ─────────────────────────────────────────────────────────────
  {
    slug: "organizacion",
    title: "Organización",
    summary: "Holding, planes de venta y planes de módulos.",
    group: "ajustes",
    module: "config",
    audience: ["admin"],
    icon: "Building2",
    href: "/organization",
    sections: [
      {
        heading: "Qué gestionas",
        body: [
          "Datos de la organización y sucursales asociadas.",
          "Superadmin: editor de planes de venta (GroupPlan) y planes de módulos.",
        ],
      },
    ],
  },
  {
    slug: "usuarios",
    title: "Usuarios",
    summary: "Altas, roles por sucursal y desactivación.",
    group: "ajustes",
    module: "config",
    audience: ["admin"],
    icon: "UserIcon",
    href: "/users",
    sections: [
      {
        heading: "Asignación",
        body: [
          "Crea o invita personas y asígnales un rol en cada sucursal.",
          "Un mismo correo puede ser cajero en un local y garzón en otro.",
        ],
        tips: ["Desactiva en vez de borrar si la persona deja de trabajar: se conserva el historial de ventas."],
      },
    ],
  },
  {
    slug: "sucursales",
    title: "Sucursales",
    summary: "Alta de locales, plan aplicado y equipo.",
    group: "ajustes",
    module: "config",
    audience: ["admin"],
    icon: "Store",
    href: "/branches",
    sections: [
      {
        heading: "Ficha",
        body: [
          "Nombre comercial, dirección y preferencias.",
          "El plan de módulos define qué ve el equipo. El dueño contrata planes comerciales desde Suscripción.",
        ],
      },
    ],
  },
  {
    slug: "modulos",
    title: "Módulos",
    summary: "Activa o apaga capacidades por sucursal.",
    group: "ajustes",
    module: "config",
    audience: ["admin"],
    icon: "Settings",
    href: "/settings/modules",
    sections: [
      {
        heading: "Efecto",
        body: [
          "Un módulo apagado oculta su ruta en el menú.",
          "Algunos dependen de otros: Caja necesita POS activo.",
        ],
        tips: ["El plan contratado limita qué módulos puedes encender."],
      },
    ],
  },

  // ── Ayuda ───────────────────────────────────────────────────────────────
  {
    slug: "suscripcion",
    title: "Suscripción",
    summary: "Planes comerciales, candado sin plan y contratación.",
    group: "ayuda",
    module: null,
    audience: ["admin"],
    icon: "CreditCard",
    href: "/profile",
    sections: [
      {
        heading: "Reglas",
        body: [
          "La suscripción es por sucursal. Sin plan activo puedes usar Perfil, Ayuda y Soporte.",
          "El propietario contrata o cambia plan pagando desde Perfil → Suscripción.",
          "Cancelar el plan apaga los módulos extra; el local queda bloqueado hasta un nuevo pago.",
        ],
        tips: ["Elige el plan en la parrilla y pulsa Contratar. Se activa cuando el pago se confirma."],
        example: {
          kicker: "Perfil · Suscripción",
          title: "Plan mensual",
          badge: "Activo",
          rows: [
            { label: "Local", value: "Macanuo Bowl" },
            { label: "Precio", value: "2,5 UF" },
            { label: "Término", value: "15 oct 2026" },
          ],
        },
      },
    ],
  },
  {
    slug: "solicitudes-soporte",
    title: "Soporte",
    summary: "Casos del local: incidencias, dudas, ideas, visitas técnicas y plazos.",
    group: "ayuda",
    module: null,
    audience: ["ops", "admin"],
    icon: "FolderKanban",
    href: "/support",
    sections: [
      {
        heading: "Para qué sirve",
        body: [
          "Soporte es el canal del equipo del local con el equipo de atención: un problema, una duda, una idea o un pedido de manual.",
          "Vive en Ayuda → Soporte. Cada caso tiene tablero, hilo, adjuntos y plazos.",
        ],
        limits: [
          "No es un chat de socios finales ni un helpdesk de otro producto.",
          "No sustituye las guías de uso ni la consola API.",
        ],
      },
      {
        heading: "Qué puedes pedir",
        body: [
          "Incidencia: algo no funciona (cobro, stock, pantalla).",
          "Duda: cómo hacer una operación en la app.",
          "Feedback: una mejora o un comentario.",
          "Manual: pedir o aclarar una guía.",
        ],
        tips: ["Una captura o un PDF del error acorta la respuesta."],
        example: {
          kicker: "Nuevo caso",
          title: "Incidencia",
          subtitle: "El POS no cobra con tarjeta en Mesa 7.",
          badge: "Alta",
          rows: [
            { label: "Asunto", value: "[Incidencia] Cobro con tarjeta" },
            { label: "Adjunto", value: "captura-pos.png" },
          ],
        },
      },
      {
        heading: "Cómo abrir y seguir un caso",
        body: [
          "Elige el tipo, escribe asunto y descripción, adjunta archivos si hace falta y envía.",
          "El caso aparece en el tablero. Ábrelo para ver el hilo (no es una ventana encima de todo).",
          "Puedes agregar más información y archivos mientras el caso está abierto.",
          "Cuando se resuelve, evalúa con estrellas y un comentario.",
        ],
        tips: [
          "El enlace con el identificador del caso abre siempre el mismo hilo.",
          "Sin plan activo igual puedes usar Soporte, junto con Perfil y Ayuda.",
        ],
      },
      {
        heading: "Tablero, visita y plazos",
        body: [
          "Columnas: abierto, en curso, visita pendiente, en espera y cerrado.",
          "Si hace falta una visita técnica, el caso pasa a visita pendiente y ves la agenda (fecha y estado de la orden de trabajo).",
          "En el detalle aparecen el plazo de primera respuesta y el de cierre.",
        ],
        limits: [
          "No se configuran políticas de plazo ni agentes desde esta pantalla: eso lo opera el equipo que atiende.",
          "Los comentarios internos del equipo que atiende no se muestran al solicitante.",
        ],
        example: {
          kicker: "Tablero",
          title: "#184 · POS no cobra con tarjeta",
          badge: "Visita pendiente",
          rows: [
            { label: "Primera respuesta", value: "Hoy 16:00" },
            { label: "Visita", value: "Mañana 10:30 · en ruta" },
          ],
        },
      },
    ],
  },
  {
    slug: "documentacion-ayuda",
    title: "Cómo usar esta documentación",
    summary: "Guías de producto + contrato API en el menú Ayuda.",
    group: "ayuda",
    module: null,
    audience: ["ops", "admin", "dev"],
    icon: "BookOpen",
    href: "/help",
    sections: [
      {
        heading: "Mapa",
        body: [
          "Guías de uso: cómo opera cada pantalla, por rol.",
          "API para integrar: consola y alcance de lo que la app ya hace en el local.",
          "Soporte: casos del equipo (problemas, dudas, ideas, visitas).",
        ],
        tips: ["La consola API no lista secretos ni funciones que la app no usa."],
      },
    ],
  },

  // ── Integraciones ───────────────────────────────────────────────────────
  {
    slug: "integraciones-api",
    title: "Integraciones con la API",
    summary: "Alcance de la app: qué puedes automatizar y cómo hacerlo sin depender de otra persona.",
    group: "integraciones",
    module: null,
    audience: ["dev", "admin"],
    icon: "Code2",
    href: "/help/api",
    sections: [
      {
        heading: "Qué cubre esta API",
        body: [
          "Las mismas funciones que usa la app en el local: vender, catálogo, stock, dinero, sucursal y marca.",
          "Sirve para un totem, un canal propio, un reporte o un conector. Tú eliges el área en la consola, copias la ruta, el JSON y el curl.",
        ],
        limits: [
          "No documentamos productos de la plataforma que la app no usa (agentes, IoT, otros verticales).",
          "No aparecen claves, reset de acceso, certificados ni administración de planes de plataforma.",
          "Los casos con personas se atienden en Ayuda → Soporte, no por esta consola.",
        ],
      },
      {
        heading: "Cómo trabajar en autonomía",
        body: [
          "Entra con un usuario del local (el mismo de siempre). Guarda el token.",
          "En cada llamada manda el token y el id de sucursal. Así ves solo ese local.",
          "Abre Ayuda → API para integrar → elige el área → filtra Leer o Crear → abre el detalle.",
          "Copia la URL, el ejemplo JSON (si es crear o actualizar) y el curl. Pégalo en tu cliente y ajusta ids reales.",
        ],
        tips: [
          "Si el módulo está apagado en la app, la API responde que no tienes permiso: enciéndelo en Módulos o elige otra función.",
          "Los listados vienen en páginas (results, count, next).",
        ],
        example: {
          kicker: "Consola · Ventas",
          title: "Crear un pedido",
          badge: "Crear",
          subtitle: "Clic en el JSON para copiarlo. Cambia mesa y productos por los de tu local.",
          code: `{
  "table": 7,
  "items": [
    { "product": "Completo italiano", "qty": 2 }
  ]
}`,
        },
      },
      {
        heading: "Mapa rápido",
        body: [
          "Ventas: pedidos, cobros, mesas, cocina, cotizaciones.",
          "Inventario: productos, combos, categorías, recintos, stock, órdenes de compra.",
          "Recetas y nutrición: fichas y etiquetado.",
          "Finanzas, bancos, facturación y promociones: caja, movimientos, documentos y cupones.",
          "Sucursales y usuarios: locales, tema visual y equipo (sobre todo lecturas).",
        ],
      },
    ],
  },
  {
    slug: "api-inventario",
    title: "API: catálogo e inventario",
    summary: "Productos, cartas, recintos, stock y compras que la app ya opera.",
    group: "integraciones",
    module: "inventory",
    audience: ["dev"],
    icon: "Code2",
    href: "/help/api",
    sections: [
      {
        heading: "Qué puedes hacer",
        body: [
          "Leer y mantener productos, categorías, combos y modificadores (las mismas fichas del catálogo).",
          "Consultar recintos y existencias por sala. Recibir una orden de compra actualiza el stock, como en la app.",
          "Leer recetas y datos de etiquetado si esos módulos están activos.",
          "Publicar o leer cartas/vitrinas públicas (modos vitrina, pedir, pagar) que ya usa Menús.",
        ],
        limits: [
          "El stock es de la sucursal del encabezado, no el consolidado de toda la organización.",
          "No crees tipos de producto que el plan del local no permite.",
        ],
      },
      {
        heading: "En la consola",
        body: [
          "Áreas Inventario, Recetas y Nutrición.",
          "Para cartas públicas usa las rutas de catálogo que aparecen al filtrar el área Inventario.",
        ],
      },
    ],
  },
  {
    slug: "api-sucursal-y-marca",
    title: "API: sucursal, equipo y marca",
    summary: "Locales, colores, logo y usuarios que la app ya muestra.",
    group: "integraciones",
    module: "config",
    audience: ["dev"],
    icon: "Code2",
    href: "/help/api",
    sections: [
      {
        heading: "Qué puedes hacer",
        body: [
          "Leer las sucursales del usuario y el tema (colores, logo, textos de marca).",
          "Consultar el equipo asignado al local.",
        ],
        limits: [
          "Altas de usuario, certificados tributarios y cambio de clave se hacen en la app, no desde un conector.",
          "Encender o apagar módulos es de Ajustes en la app; la API respeta ese estado.",
        ],
      },
      {
        heading: "En la consola",
        body: [
          "Áreas Sucursales y Usuarios. Quédate en lecturas salvo que tu flujo replique una pantalla de la app.",
        ],
      },
    ],
  },
  {
    slug: "api-dinero-y-planes",
    title: "API: dinero y contratación",
    summary: "Caja, movimientos, documentos, cupones y planes que la app ya cobra.",
    group: "integraciones",
    module: null,
    audience: ["dev"],
    icon: "Code2",
    href: "/help/api",
    sections: [
      {
        heading: "Dinero del local",
        body: [
          "Caja: abrir, movimientos, cierre y estaciones (igual que Caja en la app).",
          "Ingresos, egresos y gastos fijos. Billeteras y conciliaciones bancarias.",
          "Documentos tributarios si el módulo de facturación está activo.",
          "Descuentos y cupones del POS (área Promociones).",
        ],
        limits: [
          "No operes impuestos ni certificados SII fuera de lo que la pantalla de la app permite.",
        ],
      },
      {
        heading: "Planes",
        body: [
          "Ver precios públicos de la landing. Contratar o cambiar el plan de un local existente lo hace el propietario en la app (pago autenticado).",
        ],
        limits: [
          "No uses contratación pública para un local que ya existe: eso crea otra organización.",
          "No administres el catálogo de planes de plataforma desde tu conector.",
        ],
      },
    ],
  },
];

export function getHelpGuide(slug: string): HelpGuide | undefined {
  return HELP_GUIDES.find((g) => g.slug === slug);
}

export function helpGuidesForAudience(audience?: HelpGuideAudience): HelpGuide[] {
  if (!audience) return HELP_GUIDES;
  return HELP_GUIDES.filter((g) => g.audience.includes(audience));
}

export function helpGuidesByGroup(group: HelpGuideGroup): HelpGuide[] {
  return HELP_GUIDES.filter((g) => g.group === group);
}

export function helpGuideCount(): number {
  return HELP_GUIDES.length;
}

export type HelpSearchHit = {
  slug: string;
  title: string;
  summary: string;
  group: HelpGuideGroup;
  snippet: string;
  score: number;
};

function guideHaystack(g: HelpGuide): string {
  const parts = [g.title, g.summary, g.slug.replace(/-/g, " ")];
  for (const s of g.sections) {
    parts.push(s.heading, ...s.body);
    if (s.tips) parts.push(...s.tips);
    if (s.limits) parts.push(...s.limits);
    if (s.example) {
      parts.push(s.example.title, s.example.subtitle ?? "", s.example.kicker ?? "");
    }
  }
  const group = HELP_GUIDE_GROUPS.find((x) => x.id === g.group);
  if (group) parts.push(group.label, group.description);
  return parts.join("\n").toLowerCase();
}

function snippetAround(hay: string, token: string): string {
  const i = hay.indexOf(token);
  if (i < 0) return "";
  const start = Math.max(0, i - 40);
  const end = Math.min(hay.length, i + token.length + 72);
  return hay.slice(start, end).replace(/\s+/g, " ").trim();
}

/** Busca en el catálogo de guías (título, cuerpo, tips). Sin mínimo de letras. */
export function searchHelpGuides(query: string, limit = 12): HelpSearchHit[] {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return [];

  const hits: HelpSearchHit[] = [];
  for (const g of HELP_GUIDES) {
    const hay = guideHaystack(g);
    let score = 0;
    let snippet = "";
    for (const t of tokens) {
      if (!hay.includes(t)) {
        score = -1;
        break;
      }
      const title = g.title.toLowerCase();
      const summary = g.summary.toLowerCase();
      if (title === t) score += 12;
      else if (title.includes(t)) score += 8;
      if (summary.includes(t)) score += 3;
      score += 1;
      if (!snippet) snippet = snippetAround(hay, t);
    }
    if (score < 0) continue;
    hits.push({
      slug: g.slug,
      title: g.title,
      summary: g.summary,
      group: g.group,
      snippet: snippet || g.summary,
      score,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
