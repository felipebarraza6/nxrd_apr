import { readFileSync, writeFileSync } from "node:fs";

const p = "src/app/page.tsx";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const N = (t) => t.split("\n").join(nl);

// 1. hero CTAs → componente cliente con estado de sesión
const A = N(`            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-sky-400 px-6 py-3 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-400/30 transition-colors hover:bg-sky-300"
              >
                Entrar al sistema
              </Link>
              <a
                href="#planes"
                className="rounded-xl border border-sky-300/40 px-6 py-3 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-400/10"
              >
                Ver planes y precios
              </a>
            </div>`);
const B = N(`            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <LandingCtas />
              <a
                href="#planes"
                className="rounded-xl border border-sky-300/40 px-6 py-3 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-400/10"
              >
                Ver planes y precios
              </a>
            </div>`);
if (!s.includes(A)) { console.log("MISS hero ctas"); process.exit(1); }
s = s.replace(A, B);

// 2. contacto hero: teléfono + email
s = s.replace(
  "¿Quieres el Plan Piloto para tu comité? Escríbenos a",
  "¿Quieres el Plan Piloto para tu comité? Llámanos al +56 9 9093 2133 o escríbenos a",
);

// 3. TRUST soporte sin WhatsApp
s = s.replace(
  "Soporte prioritario por WhatsApp y teléfono, y asistencia presencial en Ñuble y Biobío.",
  "Soporte prioritario por teléfono y asistencia remota de lunes a viernes. Asistencia presencial en Ñuble y Biobío.",
);

// 4. CTA final: quitar 'Empezar ahora' (login innecesario)
const C = N(`            <Link
              href="/login"
              className="mt-8 inline-block rounded-xl bg-sky-400 px-8 py-3.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-400/30 transition-colors hover:bg-sky-300"
            >
              Empezar ahora
            </Link>
`);
if (!s.includes(C)) { console.log("MISS cta final"); process.exit(1); }
s = s.replace(C, "");

// 5. import del componente
s = s.replace(
  N('import { StandaloneRedirect } from "@/components/standalone-redirect";'),
  N('import { StandaloneRedirect } from "@/components/standalone-redirect";\nimport { LandingCtas } from "@/components/landing/landing-ctas";'),
);

writeFileSync(p, s);
console.log("OK landing rewire");
