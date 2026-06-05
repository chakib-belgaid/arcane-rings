import { withBasePath } from "./assetPaths";

export const APP_CONFIG = {
  appName: "Arcane Rings",
  placeholderSeed: "app-shell-v1",
  pwa: {
    serviceWorkerPath: withBasePath("sw.js"),
  },
} as const;
