import React from "react";
import ReactDOM from "react-dom/client";
import { registerServiceWorker } from "./app/registerServiceWorker";
import { applyAssetCssVariables } from "./config/assetPaths";
import { App } from "./App";
import "./styles.css";

applyAssetCssVariables();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
