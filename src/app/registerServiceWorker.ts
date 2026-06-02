import { APP_CONFIG } from "../config/appConfig";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(APP_CONFIG.pwa.serviceWorkerPath).catch((error: unknown) => {
      console.warn("Project Circles service worker registration failed", error);
    });
  });
}
