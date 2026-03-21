import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      manifest: false, // use existing public/manifest.json
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,mp4,webm}"],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MB for video assets
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
  },
});
