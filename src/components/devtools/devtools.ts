// ============================================
// DevTools - Lógica principal
// Separado de DevTools.astro para mantenerlo limpio
// ============================================

import { getEffectiveDomain, getDevToolsDomain, clearDevToolsDomain } from "../../lib/domain-check";

/**
 * Inicializa el DevTools: conecta eventos del panel flotante
 */
export function initDevToolsUI(): void {
  const toggle = document.getElementById("devtools-toggle");
  const panel = document.getElementById("devtools-panel");
  const domainInput = document.getElementById("devtools-domain-input") as HTMLInputElement | null;
  const domainApply = document.getElementById("devtools-domain-apply");
  const resetBtn = document.getElementById("devtools-action-reset");
  const reloadBtn = document.getElementById("devtools-action-reload");
  const firebaseStatus = document.getElementById("devtools-firebase-status");
  const onboardingSection = document.getElementById("devtools-onboarding-section");
  const autofillBtn = document.getElementById("devtools-onboarding-autofill");

  // --- Mostrar dominio actual al abrir ---
  function updateDomainInput() {
    if (domainInput) {
      const devDomain = getDevToolsDomain();
      domainInput.value = devDomain || getEffectiveDomain();
    }
  }

  // --- Toggle panel ---
  toggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    panel?.classList.toggle("hidden");
    if (!panel?.classList.contains("hidden")) {
      updateDomainInput();
      onPanelOpen(firebaseStatus, onboardingSection);
    }
  });

  // Cerrar al hacer clic fuera
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) return;
    if (!target.closest("#devtools")) {
      panel?.classList.add("hidden");
    }
  });

  // --- Dominio simulado ---
  domainApply?.addEventListener("click", () => {
    const domain = domainInput?.value?.trim();
    if (domain) {
      sessionStorage.setItem("devtools-domain", domain);
      window.location.reload();
    }
  });

  domainInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      domainApply?.click();
    }
  });

  // --- Acciones rápidas ---
  resetBtn?.addEventListener("click", () => {
    clearDevToolsDomain();
    window.location.reload();
  });

  reloadBtn?.addEventListener("click", () => {
    window.location.reload();
  });

  // --- Autocompletar onboarding ---
  autofillBtn?.addEventListener("click", async () => {
    const { autofillOnboarding } = await import("./onboarding-autofill");
    const ok = autofillOnboarding();
    if (ok) {
      autofillBtn.textContent = "✅ Formulario completado";
      setTimeout(() => {
        autofillBtn.textContent = "Autocompletar formulario";
      }, 2000);
    }
  });
}

/**
 * Se ejecuta cada vez que se abre el panel
 */
async function onPanelOpen(
  firebaseStatus: HTMLElement | null,
  onboardingSection: HTMLElement | null
): Promise<void> {
  // --- Firebase status ---
  if (firebaseStatus) {
    try {
      const { auth } = await import("../../lib/firebase");
      const user = auth.currentUser;
      if (user) {
        firebaseStatus.textContent = `✅ Conectado como ${user.email}`;
        firebaseStatus.className = "devtools-status success";
      } else {
        firebaseStatus.textContent = "⚠️ Sin sesión activa";
        firebaseStatus.className = "devtools-status warning";
      }
    } catch {
      firebaseStatus.textContent = "❌ Firebase no disponible";
      firebaseStatus.className = "devtools-status error";
    }
  }

  // --- Detectar onboarding ---
  if (onboardingSection) {
    const isOnboarding = !!document.querySelector(".onboarding-container");
    onboardingSection.classList.toggle("hidden", !isOnboarding);
  }
}
