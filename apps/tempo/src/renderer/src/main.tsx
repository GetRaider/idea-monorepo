import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/inter-tight/latin-400.css";
import "@fontsource/inter-tight/latin-500.css";
import "@fontsource/inter-tight/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-200.css";
import "@fontsource/bricolage-grotesque/latin-300.css";
import "@fontsource/bricolage-grotesque/latin-600.css";

import { App } from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
