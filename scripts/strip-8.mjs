import { readFileSync, writeFileSync } from "node:fs";

const p = "src/lib/help/guides.ts";
let s = readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const N = (t) => t.split("\n").join(nl);

const arrStart = s.indexOf("export const HELP_GUIDES: HelpGuide[] = [");
const open = s.indexOf("[", arrStart);
// cerrar el array: "];" en columna 0
const closeMark = nl + "];";
const close = s.indexOf(closeMark, open);
if (arrStart === -1 || open === -1 || close === -1) {
  console.log("MISS límites del array");
  process.exit(1);
}
const pre = s.slice(0, open + 1);
const body = s.slice(open + 1, close);
const post = s.slice(close);

const GASTRO_HREFS = [
  'href: "/pos"',
  'href: "/tables"',
  'href: "/products"',
  'href: "/promotions/discounts"',
  'href: "/reports/nutrition"',
  'href: "/quotations"',
  'href: "/equipment"',
  'href: "/iot"',
];

// dividir body en entradas de nivel superior: cada una empieza con nl + "  {" y
// termina cuando el balance de llaves vuelve a cero.
const entries = [];
let depth = 0;
let cur = "";
let inEntry = false;
for (let i = 0; i < body.length; i++) {
  const ch = body[i];
  if (!inEntry) {
    if (ch === "{") {
      inEntry = true;
      depth = 1;
      cur = "{";
    }
    continue;
  }
  cur += ch;
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) {
      entries.push(cur);
      cur = "";
      inEntry = false;
    }
  }
}

const kept = entries.filter((e) => !GASTRO_HREFS.some((h) => e.includes(h)));
console.log("entradas:", entries.length, "→ quedan", kept.length);

const out =
  pre +
  nl +
  kept.map((e) => N("  ") + e + ",").join(nl) +
  nl +
  post;

writeFileSync(p, out);
