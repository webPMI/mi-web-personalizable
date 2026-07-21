// ============================================
// DevTools - Módulo: Onboarding
// Solo se muestra si estamos en la página de onboarding
// ============================================

import type { DevToolsModule } from "../types";

export const onboardingModule: DevToolsModule = {
  id: "devtools-module-onboarding",
  label: "Onboarding",

  render() {
    return `
      <div class="devtools-row">
        <button id="devtools-onboarding-autofill" class="devtools-btn devtools-btn-accent">Autocompletar formulario</button>
      </div>
    `;
  },

  init(container) {
    const btn = container.querySelector("#devtools-onboarding-autofill");

    btn?.addEventListener("click", async () => {
      const { autofillOnboarding } = await import("../onboarding-autofill");
      const ok = autofillOnboarding();
      if (ok) {
        btn.textContent = "✅ Formulario completado";
        setTimeout(() => {
          btn.textContent = "Autocompletar formulario";
        }, 2000);
      }
    });
  },

  onOpen() {
    // Detectar si estamos en onboarding y mostrar/ocultar la sección
    const section = document.getElementById("devtools-module-onboarding");
    if (!section) return;

    // Verificar si existe el contenedor de onboarding en el DOM
    const isOnboarding = !!document.querySelector(".onboarding-container");
    section.classList.toggle("hidden", !isOnboarding);
  },
};
