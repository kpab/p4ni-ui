import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    aura: "src/aura.ts",
    three: "src/three/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "three", "@react-three/fiber"],
});
