import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PluginGate } from "./PluginGate";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PluginGate>
      <App />
    </PluginGate>
  </React.StrictMode>
);
