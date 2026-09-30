import { readFileSync, writeFileSync } from "node:fs";

const p = "src/app/(auth)/login/page.tsx";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const N = (t) => t.split("\n").join(nl);

// 1. import del wordmark matrix
s = s.replace(N('import { FrigWordmarkMatrix } from "@/components/landing/frig-wordmark-matrix";\n'), "");
// 2. imports de content/landing
s = s.replace(N('import { LANDING_USE_CASES } from "@/content/landing";\n'), "");
s = s.replace(N('import type { LandingUseCase } from "@/content/landing";\n'), "");
// 3. estado demoCase + su uso de credenciales
s = s.replace(N(`  const [demoCase] = useState<LandingUseCase | null>(() => {
    if (typeof window === "undefined") return null;
    const slug = new URLSearchParams(window.location.search).get("branch");
    return LANDING_USE_CASES.find((u) => u.slug === slug) ?? null;
  });
`), "");
// 4. bloque visual del wordmark
s = s.replace(N(`          ) : (
            <FrigWordmarkMatrix className="mb-8 h-12 w-auto self-center" />
          )`), "          ) : null");
// 5. bloque completo del aviso demo
const start = s.indexOf(N(`          {demoCase && mode === "login" && (`));
if (start === -1) {
  console.log("MISS bloque demo");
} else {
  const endMark = N(`          {mode === "set_password" ? (`);
  const end = s.indexOf(endMark, start);
  if (end === -1) {
    console.log("MISS fin bloque demo");
  } else {
    s = s.slice(0, start) + s.slice(end);
    console.log("OK bloque demo eliminado");
  }
}

writeFileSync(p, s);
console.log("OK login limpio");
