# p4ni-ui

## Structure

```
packages/ui/        publishable @p4ni/ui package
apps/playground/    Vite preview app
apps/site/          Astro demo site (ui.p4ni.com)
```

## Development

```bash
pnpm install
pnpm dev          # start the playground (source-linked + HMR)
pnpm dev:site     # start the Astro demo site
pnpm build        # build UI first, then build the demo site into root dist
pnpm build:ui     # build @p4ni/ui with tsup
pnpm build:site   # build the demo site
pnpm release      # build:ui + npm publish (--access public)
```

## Usage

```bash
npm install @p4ni/ui
```

### GlowInput (CSS)

```tsx
import { GlowInput } from "@p4ni/ui";

<GlowInput
  placeholder="Type here... / ここに入力..."
  colors={["#7f77dd", "#1d9e75", "#d85a30"]}
  speed={3.2}
  intensity={0.45}
  reactive
/>
```

### AuraInput (WebGL)

The WebGL upgrade for GlowInput. It layers shader-rendered aura behind a real
`<input>` (the canvas uses `pointer-events: none`, so IME, paste, and
accessibility still work). `three` and `@react-three/fiber` are required as
optional peer dependencies.

```bash
npm install @p4ni/ui three @react-three/fiber
```

```tsx
import { AuraInput } from "@p4ni/ui/aura";

<AuraInput
  placeholder="Type and it breathes... / 入力で脈動..."
  colors={["#7f77dd", "#1d9e75", "#d85a30"]}
  speed={3.2}
  intensity={0.45}
  reactive          // boosts the glow while typing
  particles         // emits a pulse on each keypress
  bleed={24}        // aura spread outside the input in px
  fps={60}          // frame-rate cap for power saving
/>
```

- With `prefers-reduced-motion: reduce`, animation slows to near stillness
- Off-screen rendering is paused with `IntersectionObserver`
- In Next.js (App Router), load it without SSR:

```tsx
import dynamic from "next/dynamic";

const AuraInput = dynamic(
  () => import("@p4ni/ui/aura").then((m) => m.AuraInput),
  { ssr: false },
);
```

### LockInput (Three.js)

A 3D padlock (Three.js / R3F) with a text field embedded in its face. Enter the
correct `keyword` and the shackle springs open while the lock dissolves into
particles, revealing `children`. A wrong answer shakes the lock and flares it
coral. Like AuraInput, `three` and `@react-three/fiber` are required as optional
peer dependencies, and the input is a real `<input>` (IME, paste, and
accessibility all work; Enter is guarded against IME composition).

```bash
npm install @p4ni/ui three @react-three/fiber
```

```tsx
import { useRef } from "react";
import { LockInput, type LockInputHandle } from "@p4ni/ui/three";

const lock = useRef<LockInputHandle>(null);

<LockInput
  ref={lock}
  keyword="p4ni"          // string | RegExp | (value) => boolean
  placeholder="keyword"
  onUnlock={() => console.log("unlocked!")}
  onFail={(v) => console.log("wrong:", v)}
>
  <h2>UNLOCKED</h2>
  <button onClick={() => lock.current?.reset()}>lock again</button>
</LockInput>
```

> **LockInput is theatrical, not cryptographic** — the keyword ships in the
> client bundle. Use it as a presentational gate, not a security boundary. For
> real protection, authorize on the server.

- Sizing is container-driven (`width: 100%; aspect-ratio: 12 / 11`); set the
  width on the parent.
- With `prefers-reduced-motion: reduce`, every phase is shortened and CSS
  animations stop.
- In Next.js (App Router), load it without SSR:

```tsx
import dynamic from "next/dynamic";

const LockInput = dynamic(
  () => import("@p4ni/ui/three").then((m) => m.LockInput),
  { ssr: false },
);
```

## Roadmap

- [x] GlowInput (CSS)
- [x] AuraInput (Three.js / R3F) — WebGL shader glow + typing particles
- [x] LockInput (Three.js / R3F) — passphrase-gated reveal with particle dissolve
- [ ] Skyline — React port of astro-skyline
- [x] Astro demo site (ui.p4ni.com) — `apps/site` (deploy pending)
- [ ] Ladle catalog
