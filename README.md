# p4ni-ui

WebGL/CSS-flavored React UI effects by [p4ni](https://p4ni.com). Demo: https://ui.p4ni.com

## Structure

```
packages/ui/        @p4ni/ui — npm に公開する本体
apps/playground/    Vite 開発用プレビュー
apps/site/          Astro デモサイト (ui.p4ni.com)
```

## Development

```bash
pnpm install
pnpm dev          # playground 起動 (ソース直読み・HMR)
pnpm dev:site     # Astro デモサイト起動
pnpm build        # @p4ni/ui を tsup でビルド
pnpm build:site   # デモサイトをビルド
pnpm release      # build + npm publish (--access public)
```

## Usage

```bash
npm install @p4ni/ui
```

### GlowInput (CSS)

```tsx
import { GlowInput } from "@p4ni/ui";

<GlowInput
  placeholder="ここに入力..."
  colors={["#7f77dd", "#1d9e75", "#d85a30"]}
  speed={3.2}
  intensity={0.45}
  reactive
/>
```

### AuraInput (WebGL)

GlowInput の WebGL 強化版。本物の `<input>` の背面にシェーダー描画のオーラを重ねます
(canvas は `pointer-events: none`。IME・コピペ・アクセシビリティはそのまま)。
`three` と `@react-three/fiber` が必要です(optional peerDependencies)。

```bash
npm install @p4ni/ui three @react-three/fiber
```

```tsx
import { AuraInput } from "@p4ni/ui/aura";

<AuraInput
  placeholder="タイピングで脈動..."
  colors={["#7f77dd", "#1d9e75", "#d85a30"]}
  speed={3.2}
  intensity={0.45}
  reactive          // typing で発光ブースト
  particles         // キー入力ごとにパルスを1発
  bleed={24}        // オーラが input の外に広がる px
  fps={60}          // 省電力用の上限フレームレート(省略で無制限)
/>
```

- `prefers-reduced-motion: reduce` 時はほぼ静止状態まで減速します
- 画面外では `IntersectionObserver` で描画を停止します
- Next.js (App Router) では SSR を避けて読み込んでください:

```tsx
import dynamic from "next/dynamic";

const AuraInput = dynamic(
  () => import("@p4ni/ui/aura").then((m) => m.AuraInput),
  { ssr: false },
);
```

## Roadmap

- [x] GlowInput (CSS)
- [x] AuraInput (Three.js / R3F) — WebGL shader glow + typing particles
- [ ] Skyline — astro-skyline の React 移植
- [x] Astro demo site (ui.p4ni.com) — apps/site (デプロイは未)
- [ ] Ladle catalog
