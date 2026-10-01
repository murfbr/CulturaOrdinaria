/* Ponto de entrada: monta o App no #raiz. O CSS entra antes do App: a ordem das camadas do Tailwind (theme, base,
   legado, utilities) é definida no central.css e precisa vir primeiro. */
import "./styles/central.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("raiz")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
