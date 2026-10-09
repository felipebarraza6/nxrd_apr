# Caudal

Fondo de agua en WebGL1, con fallback CSS si el contexto no existe. No usa Next, Tailwind ni tokens de Cauce. La carpeta se copia entera.

## Qué copiar

```
src/components/water/
  palette.ts          colores y hex → 0–1
  shaders.ts          GLSL WebGL1
  mount-water.ts      renderer, sin React
  water-canvas.tsx    wrapper React
  water-backdrop.tsx  fallback + puntos + velo
  water.css
  index.ts
  README.md
```

El proyecto destino necesita React 18+ y un bundler que importe CSS desde un componente. El alias `@/` no hace falta dentro de la carpeta: los imports son relativos.

En Cauce el mismo componente se usa como `AuthWaterBackdrop` (`src/components/auth/auth-water-shell.tsx`). No dupliques el shader ahí.

## React

El padre tiene que ser `position: relative` (o `fixed`) y tener tamaño. El backdrop es `position: absolute; inset: 0`.

```tsx
import { WaterBackdrop, hexToUnit } from "@/components/water";

<section className="relative min-h-dvh">
  <WaterBackdrop variant="dark" intensity={1} />
  <div className="relative z-10">{children}</div>
</section>
```

| Prop | Default | Para qué |
| --- | --- | --- |
| `variant` | `"dark"` | `"light"` es el mármol sobre papel. |
| `intensity` | `1` | `0` apaga las vetas. Se acota a 0–1. |
| `scrim` | `true` | Velo para leer texto encima. En una app con hoja clara, `false`. |
| `interactive` | `true` en dark | Ondas del puntero. En light parte en `false`. |
| `paused` | `false` | Congela un cuadro. |
| `palette` | Cauce | Solo los canales que cambies. |

Retintar sin tocar el shader:

```tsx
<WaterBackdrop
  palette={{ accent: hexToUnit("#0ea5e9") }}
  scrim={false}
/>
```

Variables del fallback, por si WebGL no arranca:

```css
:root {
  --water-ink: #000;
  --water-paper: #f3f3f3;
}
```

## Sin React

```ts
import { mountWater } from "./mount-water";

const handle = mountWater(canvas, { variant: "dark", intensity: 1 });
handle?.update({ intensity: 0.4 });
handle?.dispose();
```

`null` significa que no hubo contexto. El canvas queda transparente y se ve `.cauce-water-fallback`.

## Reglas

Son las que ya dejaron la landing en un gris plano.

1. Importa el canvas directo. `next/dynamic({ ssr: false })` en el app router se queda en un `<template>` y el canvas no se monta.
2. No llames `WEBGL_lose_context` al desmontar. En desarrollo React corre el efecto dos veces; el segundo pase recibe el contexto muerto y el shader no compila. `dispose()` borra programa y buffer, y deja el contexto vivo.
3. Un contexto por región visible. Los navegadores dan unos 8–16. No montes un caudal por tarjeta.
4. El canvas es `pointer-events: none`. Las ondas escuchan al **padre** de `[data-water-root]`. Si ese padre también es `pointer-events: none` (la app lo hace a propósito), no hay ripples y el caudal igual se mueve.
5. `prefers-reduced-motion: reduce` dibuja un solo cuadro y no entra al `requestAnimationFrame`.
6. El índice de las ondas en el shader es constante (`u_rip[0]`, `u_rip[3]`, …). Un `for` con `u_rip[i]` no compila en varios GPU WebGL1.
7. El alpha del fragment es 1. Un alpha bajo con `premultipliedAlpha: true` transparenta el caudal hasta que desaparece sobre el papel.

## Dónde no ponerlo

Terminales densas (en Cauce, el punto de venta). El movimiento estorba y el texto tiene que ganar. Ahí no se monta el backdrop.
