import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
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
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          }
        ]
      }
    })
  ]
});
