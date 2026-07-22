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
  const loginSection = document.getElementById("devtools-login-section");
  const loginAutofillBtn = document.getElementById("devtools-login-autofill");
  const loginAdminBtn = document.getElementById("devtools-login-admin");
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

  // --- Autocompletar login (demo) ---
  loginAutofillBtn?.addEventListener("click", async () => {
    const { autofillLogin } = await import("./login-autofill");
    const ok = autofillLogin();
    if (ok) {
      loginAutofillBtn.textContent = "✅ Login completado";
      setTimeout(() => {
        loginAutofillBtn.textContent = "Autocompletar login (demo)";
      }, 2000);
    }
  });

  // --- Login como admin demo ---
  loginAdminBtn?.addEventListener("click", async () => {
    const { autofillLogin } = await import("./login-autofill");
    const { loginUser, registerUser } = await import("../../lib/firebase/auth");
    const { getDocument, updateDocument, setDocument } = await import("../../lib/firebase/firestore");
    const { getEffectiveDomain } = await import("../../lib/domain-check");

    const ADMIN_EMAIL = "admin@demo.com";
    const ADMIN_PASS = "Admin123!";

    // Autocompletar con datos de admin
    autofillLogin({ email: ADMIN_EMAIL, password: ADMIN_PASS });

    loginAdminBtn.textContent = "⏳ Creando usuario admin...";

    // 1. Intentar login primero
    let result = await loginUser(ADMIN_EMAIL, ADMIN_PASS);

    // 2. Si no existe, registrarlo
    if (!result.success) {
      loginAdminBtn.textContent = "⏳ Registrando usuario admin...";
      result = await registerUser(ADMIN_EMAIL, ADMIN_PASS, "Admin Demo");
    }

    if (result.success && result.user) {
      loginAdminBtn.textContent = "⏳ Configurando sitio...";

      // 3. Asignar rol admin en el sitio actual
      const domain = getEffectiveDomain();
      try {
        const siteResult = await getDocument("sites", domain);
        if (siteResult.success && siteResult.data) {
          const site = siteResult.data as any;
          const roles = site.roles || {};
          roles[result.user.uid] = "admin";
          await updateDocument("sites", domain, { roles });
        }
      } catch {
        // Si falla, intentar crear el sitio primero
        try {
          await setDocument("sites", domain, {
            domain,
            siteName: "Mi Sitio Admin Demo",
            siteDescription: "Sitio de prueba para admin",
            ownerId: result.user.uid,
            status: "active",
            roles: { [result.user.uid]: "admin" },
          });
        } catch {
          // Ignorar
        }
      }

      loginAdminBtn.textContent = "✅ Redirigiendo...";
      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);
    } else {
      loginAdminBtn.textContent = "❌ Error: " + ("error" in result ? result.error : "desconocido");
      setTimeout(() => {
        loginAdminBtn.textContent = "Login como admin demo";
      }, 3000);
    }
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
  const loginSection = document.getElementById("devtools-login-section");
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

  // --- Detectar login ---
  if (loginSection) {
    const isLogin = !!document.getElementById("login-form");
    loginSection.classList.toggle("hidden", !isLogin);
  }

  // --- Detectar onboarding ---
  if (onboardingSection) {
    const isOnboarding = !!document.querySelector(".onboarding-container");
    onboardingSection.classList.toggle("hidden", !isOnboarding);
  }
}
