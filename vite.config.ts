import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH);

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Arcane Rings",
        short_name: "Arcane",
        description: "Restore enchanted circular images by rotating coupled rings.",
        theme_color: "#071712",
        background_color: "#071712",
        display: "standalone",
        orientation: "portrait",
        scope: basePath,
        start_url: basePath,
        icons: [
          {
            src: `${basePath}icons/icon.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      }
    })
  ]
});

function normalizeBasePath(basePath: string | undefined) {
  if (!basePath) {
    return "/";
  }

  const normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}
