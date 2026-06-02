import React from "react";
import ReactDOM from "react-dom/client";
import { ProjectCirclesApp } from "./app/ProjectCirclesApp";
import { registerServiceWorker } from "./app/registerServiceWorker";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ProjectCirclesApp />
  </React.StrictMode>
);

registerServiceWorker();
