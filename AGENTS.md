<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Instalar con Node.js 24 y `npm ci`, igual que `.github/workflows/ci.yml`. El README menciona `bun`, pero el lockfile del repo es `package-lock.json`.
- Servidor de desarrollo: `npm run dev -- --hostname 0.0.0.0 --port 3000`. Sin `NEXT_PUBLIC_YGGDRA_API_BASE`, `next dev` usa `http://localhost:8000/api`. El backend está en el repo aparte `yggdra_infra` y no hace falta para arrancar la UI (landing, ingreso, políticas).
- Comprobaciones: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`. El build de producción es un export estático y, sin esa variable, apunta a `https://api.yggdra.cl/api`.
