import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://ui.p4ni.com",
  outDir: "../../dist",
  integrations: [react()],
  vite: {
    resolve: {
      // playground と同じく @p4ni/ui のソースを直接読む(ビルド不要)
      conditions: ["development"],
    },
  },
});
