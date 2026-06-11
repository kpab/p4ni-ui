# p4ni-ui

WebGL/CSS-flavored React UI effects by [p4ni](https://p4ni.com). Demo: https://ui.p4ni.com

## Structure

```
packages/ui/        @p4ni/ui — npm に公開する本体
apps/playground/    Vite 開発用プレビュー
```

## Development

```bash
pnpm install
pnpm dev          # playground 起動 (ソース直読み・HMR)
pnpm build        # @p4ni/ui を tsup でビルド
pnpm release      # build + npm publish (--access public)
```

## Usage

```bash
npm install @p4ni/ui
```

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

## Roadmap

- [ ] GlowInput (CSS) — done
- [ ] AuraInput (Three.js / R3F) — WebGL shader glow + typing particles
- [ ] Skyline — astro-skyline の React 移植
- [ ] Astro demo site (ui.p4ni.com) — copy-paste + StackBlitz links
- [ ] Ladle catalog
