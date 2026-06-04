import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Project Circles",
        short_name: "Circles",
        description: "Restore enchanted circular images by rotating coupled rings.",
        theme_color: "#071712",
        background_color: "#071712",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/assets/puzzle-grove.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      }
    })
  ]
});
