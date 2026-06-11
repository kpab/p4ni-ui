import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/aura.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "three", "@react-three/fiber"],
});
