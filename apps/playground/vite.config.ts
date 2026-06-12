import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    // 開発中は @p4ni/ui のソースを直接読む(ビルド不要・HMR即反映)
    // ビルド時は dist を使う(公開物と同じ解決経路で確認できる)
    conditions: command === "serve" ? ["development"] : [],
  },
}));
