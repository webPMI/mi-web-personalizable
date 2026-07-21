// ============================================
// DevTools - Módulo: Acciones rápidas
// ============================================

import type { DevToolsModule } from "../types";

export const actionsModule: DevToolsModule = {
  id: "devtools-module-actions",
  label: "Acciones rápidas",

  render() {
    return `
      <div class="devtools-row">
        <button id="devtools-action-reset" class="devtools-btn devtools-btn-secondary">Reiniciar onboarding</button>
        <button id="devtools-action-reload" class="devtools-btn devtools-btn-secondary">Recargar</button>
      </div>
    `;
  },

  init() {
    const resetBtn = document.getElementById("devtools-action-reset");
    const reloadBtn = document.getElementById("devtools-action-reload");

    resetBtn?.addEventListener("click", () => {
      sessionStorage.removeItem("devtools-domain");
      window.location.reload();
    });

    reloadBtn?.addEventListener("click", () => {
      window.location.reload();
    });
  },
};
