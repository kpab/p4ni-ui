import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 開発中は @p4ni/ui のソースを直接読む(ビルド不要・HMR即反映)
    conditions: ["development"],
  },
});
