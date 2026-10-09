import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — CAUCE",
  description:
    "Cómo CAUCE trata los datos de tu APR: Ley 19.628, no divulgación a terceros, transparencia y estado del servicio.",
};

const SECTIONS = [
  {
    h: "1 · Responsable del tratamiento",
    body: [
      "El responsable del tratamiento de los datos personales recolectados a través de CAUCE es Smart APR SpA (contacto: contacto@smartapr.cl, Chile).",
      "Esta política aplica a la plataforma web CAUCE (socios, medidores, lecturas, tarifas, cobros, boletas electrónicas SII y finanzas del APR) y a sus sitios públicos (landing, demo y login).",
    ],
  },
  {
    h: "2 · Datos que recolectamos",
    body: [
      "Registro y contratación: nombre, correo electrónico, nombre de la APR y datos necesarios para habilitar tu servicio.",
      "Datos operacionales: socios, medidores, lecturas, consumos, cobros, pagos y configuración que cada APR carga en su propia cuenta. Esos datos pertenecen a tu APR, no a Smart APR.",
      "Técnicos: dirección IP, navegador y registros de uso mínimos necesarios para operar y proteger el servicio.",
    ],
  },
  {
    h: "3 · Finalidad",
    body: [
      "Usamos los datos exclusivamente para operar la plataforma, autenticar usuarios, emitir boletas electrónicas ante el SII cuando tu APR lo solicita, prestar soporte, mejorar el servicio y cumplir obligaciones legales.",
      "No elaboramos perfiles publicitarios ni utilizamos los datos operacionales de tu APR para fines ajenos a la prestación del servicio.",
    ],
  },
  {
    h: "4 · Conservación y seguridad",
    body: [
      "Los datos se conservan mientras la cuenta esté activa y durante los plazos exigidos por la normativa chilena.",
      "Si dejas el servicio, te entregamos tu base completa en Excel y eliminamos los datos según los plazos legales.",
      "Aplicamos medidas técnicas y administrativas razonables: conexión cifrada (HTTPS/TLS), contraseñas con hash, accesos por rol y separación por APR/tenant.",
    ],
  },
  {
    h: "5 · No divulgación a terceros",
    body: [
      "No vendemos, cedemos ni compartimos datos personales con terceros para fines comerciales. Punto.",
      "Solo se revelarán datos cuando exista obligación legal o requerimiento de autoridad competente (por ejemplo, del SII en materias tributarias), notificándolo al titular cuando la ley lo permita.",
    ],
  },
  {
    h: "6 · Derechos del titular (Ley 19.628)",
    body: [
      "Conforme a la Ley 19.628 de protección de la vida privada, todo titular puede solicitar en cualquier momento: información sobre sus datos, rectificación, cancelación o bloqueo (oposición).",
      "Para ejercerlos escríbenos a contacto@smartapr.cl desde el correo asociado a tu cuenta. Respondemos dentro de los plazos legales vigentes.",
    ],
  },
  {
    h: "7 · Cookies y almacenamiento local",
    body: [
      "Usamos solo cookies y almacenamiento local estrictamente necesarios: sesión de autenticación y preferencias de la aplicación. No usamos cookies de terceros ni de publicidad.",
    ],
  },
  {
    h: "8 · Menores de edad",
    body: [
      "CAUCE es un servicio de gestión dirigido a comités y cooperativas de agua potable rural. No está dirigido a menores de 14 años y no recolectamos intencionalmente datos de menores.",
    ],
  },
  {
    h: "9 · Servicio en desarrollo activo",
    body: [
      "CAUCE se mejora de forma continua: se despliegan mejoras y nuevas funciones regularmente. La disponibilidad es esfuerzo razonable y los cortes programados se comunican con anticipación.",
      "Mientras un módulo se encuentre en desarrollo puede estar marcado como beta y cambiar sin previo aviso. Esta política también se actualiza a medida que el producto madura.",
    ],
  },
  {
    h: "10 · Modificaciones a esta política",
    body: [
      "Cualquier cambio se publicará en esta misma página con su fecha de actualización. Si el cambio es sustancial, lo comunicaremos por correo a las cuentas registradas.",
    ],
  },
] as const;

function Section({ h, body }: { h: string; body: readonly string[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h2 className="text-sm font-semibold tracking-wide text-primary">{h}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {body.map((p) => (
          <p key={p.slice(0, 24)} className="text-sm leading-relaxed text-zinc-300">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

export default function PoliticasPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#0a0a0a] text-zinc-100">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/cauce-symbol.svg" alt="Cauce" className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-[0.2em] text-white">CAUCE</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
          >
            ← Volver
          </Link>
        </div>
      </header>

      {/* Encabezado */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 120%, rgba(48,60,240,0.22) 0%, rgba(48,60,240,0.06) 50%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-10 sm:px-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Transparencia
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-snug tracking-tight text-white sm:text-4xl">
            Política de <span className="text-primary">Privacidad</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Qué datos recolectamos, para qué, y lo que jamás haremos con ellos. Conforme a la
            Ley 19.628 (Chile). Última actualización: octubre de 2026.
          </p>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-12 sm:px-6">
        {SECTIONS.map((s) => (
          <Section key={s.h} {...s} />
        ))}

        <section className="rounded-xl border border-primary/40 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-primary">11 · Contacto</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Para ejercer tus derechos, resolver dudas sobre esta política o reportar un problema
            de seguridad:{" "}
            <a
              href="mailto:contacto@smartapr.cl"
              className="font-semibold text-primary hover:underline"
            >
              contacto@smartapr.cl
            </a>
            . Los reportes de seguridad se responden con prioridad.
          </p>
        </section>
      </main>

      <footer className="mt-auto border-t border-white/10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/cauce-symbol.svg" alt="Cauce" className="h-4 w-4" />
            CAUCE — Gestión de agua potable rural por Smart APR SpA
          </span>
          <a href="mailto:contacto@smartapr.cl" className="transition-colors hover:text-white">
            Contacto: contacto@smartapr.cl
          </a>
        </div>
      </footer>
    </div>
  );
}
