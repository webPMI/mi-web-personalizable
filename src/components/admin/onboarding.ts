import { registerUser } from "../../lib/firebase/auth";
import { setDocument, createDocument } from "../../lib/firebase/firestore";
import { t, getStoredLocale, setStoredLocale, type SupportedLocale } from "../../lib/i18n";
import { getEffectiveDomain, checkDomain } from "../../lib/domain-check";

// Prefijos de namespace para traducciones
const O = "onboarding";
const C = "common";

// Claves de localStorage
const STORAGE_KEY_STEP = "onboarding-step";
const STORAGE_KEY_LOCALE = "onboarding-locale";

let currentStep = 1;
let selectedLocale: SupportedLocale = getStoredLocale();

// --- Persistencia del progreso ---

/**
 * Guarda el paso actual en localStorage
 */
function persistStep(step: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_STEP, String(step));
  } catch {
    // localStorage no disponible
  }
}

/**
 * Recupera el paso guardado en localStorage
 */
function getStoredStep(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STEP);
    if (stored) {
      const step = parseInt(stored, 10);
      if (step >= 1 && step <= 3) return step;
    }
  } catch {
    // localStorage no disponible
  }
  return 1;
}

/**
 * Limpia el progreso guardado
 */
function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_STEP);
  } catch {
    // localStorage no disponible
  }
}

export function initOnboarding() {
  const container = document.querySelector(".onboarding-container");
  const domain = container?.getAttribute("data-domain") || getEffectiveDomain();

  // Actualizar el dominio en el DOM si data-domain tiene valor
  if (container && domain) {
    const domainStrong = document.querySelector("#config-domain-info strong");
    if (domainStrong) {
      domainStrong.textContent = domain;
    }
  }

  // --- Elementos del DOM ---
  const formWrapper = document.getElementById("form-wrapper");
  const loadingState = document.getElementById("loading-state");
  const successState = document.getElementById("success-state");
  const displayNameSpan = document.getElementById("display-name");

  const usernameInput = document.getElementById("username") as HTMLInputElement | null;
  const nameInput = document.getElementById("name") as HTMLInputElement | null;
  const emailInput = document.getElementById("email") as HTMLInputElement | null;
  const passwordInput = document.getElementById("password") as HTMLInputElement | null;
  const passwordConfirmInput = document.getElementById("password-confirm") as HTMLInputElement | null;
  const siteNameInput = document.getElementById("site-name") as HTMLInputElement | null;
  const siteDescInput = document.getElementById("site-description") as HTMLTextAreaElement | null;
  const domainInput = document.getElementById("domain-input") as HTMLInputElement | null;
  const btnCheckDomain = document.getElementById("btn-check-domain") as HTMLButtonElement | null;
  const domainStatus = document.getElementById("domain-status");
  const btnSubmit = document.getElementById("btn-submit") as HTMLButtonElement | null;

  // --- Paso 1: Idioma ---
  const localeRadios = document.querySelectorAll<HTMLInputElement>('input[name="locale"]');
  const btnStep1Next = document.getElementById("btn-step-1-next");

  // --- Paso 2: Cuenta ---
  const btnStep2Next = document.getElementById("btn-step-2-next");
  const btnStep2Back = document.getElementById("btn-step-2-back");

  // --- Paso 3: Sitio ---
  const btnStep3Back = document.getElementById("btn-step-3-back");

  // --- Aplicar idioma guardado ---
  applyStoredLocale();

  // --- Restaurar paso guardado ---
  const savedStep = getStoredStep();
  if (savedStep > 1) {
    goToStep(savedStep);
  }

  // --- Selección de idioma ---
  localeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        selectedLocale = radio.value as SupportedLocale;
        setStoredLocale(selectedLocale);
        applyLocale(selectedLocale);
      }
    });
  });

  // --- Ir al paso 2 ---
  btnStep1Next?.addEventListener("click", () => {
    goToStep(2);
  });

  // --- Ir al paso 3 ---
  btnStep2Next?.addEventListener("click", () => {
    // Validar paso 2 antes de avanzar
    const username = (usernameInput?.value || "").trim();
    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const password = passwordInput?.value || "";
    const passwordConfirm = passwordConfirmInput?.value || "";

    clearAllErrors();

    let hasError = false;

    if (!username) {
      showFieldError("fg-username", t(`${O}:err-username-required`));
      usernameInput?.focus();
      hasError = true;
    }

    if (!name) {
      showFieldError("fg-name", t(`${O}:err-name-required`));
      if (!hasError) nameInput?.focus();
      hasError = true;
    }

    if (!email) {
      showFieldError("fg-email", t(`${O}:err-email-required`));
      if (!hasError) emailInput?.focus();
      hasError = true;
    } else if (!email.includes("@") || !email.includes(".")) {
      showFieldError("fg-email", t(`${O}:err-email-invalid`));
      if (!hasError) emailInput?.focus();
      hasError = true;
    }

    if (!password) {
      showFieldError("fg-password", t(`${O}:err-password-required`));
      if (!hasError) passwordInput?.focus();
      hasError = true;
    } else if (password.length < 6) {
      showFieldError("fg-password", t(`${O}:err-password-min`));
      if (!hasError) passwordInput?.focus();
      hasError = true;
    }

    if (!passwordConfirm) {
      showFieldError("fg-password-confirm", t(`${O}:err-password-confirm-required`));
      if (!hasError) passwordConfirmInput?.focus();
      hasError = true;
    } else if (password && password !== passwordConfirm) {
      showFieldError("fg-password-confirm", t(`${O}:err-password-confirm-mismatch`));
      if (!hasError) passwordConfirmInput?.focus();
      hasError = true;
    }

    if (!hasError) {
      goToStep(3);
    }
  });

  // --- Volver al paso 1 ---
  btnStep2Back?.addEventListener("click", () => {
    goToStep(1);
  });

  // --- Volver al paso 2 ---
  btnStep3Back?.addEventListener("click", () => {
    goToStep(2);
  });

  // --- Lógica del campo de dominio personalizado ---

  /**
   * Valida que el dominio tenga un formato básico correcto
   */
  function isValidDomain(value: string): boolean {
    // Acepta: ejemplo.com, sub.ejemplo.com, ejemplo.es, etc.
    // No acepta: espacios, caracteres especiales no permitidos
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(value);
  }

  /**
   * Pre-fill del dominio detectado al entrar al paso 3
   */
  function prefillDomain() {
    if (!domainInput) return;
    // Solo pre-fill si el campo está vacío
    if (!domainInput.value.trim()) {
      domainInput.value = domain;
      // Disparar evento input para que se actualicen bindings
      domainInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /**
   * Verifica disponibilidad del dominio contra Firestore
   */
  async function handleCheckDomain() {
    if (!domainInput || !domainStatus) return;

    const domainValue = domainInput.value.trim().toLowerCase();

    // Validar formato
    if (!domainValue) {
      domainStatus.textContent = t(`${O}:err-domain-required`);
      domainStatus.className = "domain-status error";
      return;
    }

    if (!isValidDomain(domainValue)) {
      domainStatus.textContent = t(`${O}:err-domain-invalid`);
      domainStatus.className = "domain-status error";
      return;
    }

    // Mostrar estado de verificación
    domainStatus.textContent = "⏳ Verificando...";
    domainStatus.className = "domain-status checking";
    if (btnCheckDomain) btnCheckDomain.disabled = true;

    const site = await checkDomain(domainValue);

    if (btnCheckDomain) btnCheckDomain.disabled = false;

    if (site) {
      // Dominio ocupado
      domainStatus.textContent = t(`${O}:domain-unavailable`, { domain: domainValue });
      domainStatus.className = "domain-status unavailable";
    } else {
      // Dominio disponible
      domainStatus.textContent = t(`${O}:domain-available`, { domain: domainValue });
      domainStatus.className = "domain-status available";
    }
  }

  // Pre-fill del dominio al navegar al paso 3
  // Detectamos cuando se llega al paso 3 mediante un observer
  const stepObserver = new MutationObserver(() => {
    const step3 = document.getElementById("step-3");
    if (step3 && !step3.classList.contains("hidden")) {
      prefillDomain();
    }
  });

  const stepsContainer = document.getElementById("step-3")?.parentElement;
  if (stepsContainer) {
    stepObserver.observe(stepsContainer, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  }

  // Click en botón "Verificar disponibilidad"
  btnCheckDomain?.addEventListener("click", handleCheckDomain);

  // Enter en el input de dominio también dispara verificación
  domainInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheckDomain();
    }
  });

  // Limpiar estado del dominio al escribir
  domainInput?.addEventListener("input", () => {
    if (domainStatus) {
      domainStatus.textContent = "";
      domainStatus.className = "domain-status";
    }
    const group = document.getElementById("fg-domain");
    group?.classList.remove("error");
  });

  // --- Toggle mostrar/ocultar contraseña ---
  function setupPasswordToggle(toggleId: string, inputId: string) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    toggle?.addEventListener("click", () => {
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggle.textContent = isPassword ? t(`${O}:password-toggle-hide`) : t(`${O}:password-toggle-show`);
    });
  }
  setupPasswordToggle("toggle-password", "password");
  setupPasswordToggle("toggle-password-confirm", "password-confirm");

  // --- Indicador de fortaleza de contraseña ---
  const strengthBars = [
    document.getElementById("ps-1"),
    document.getElementById("ps-2"),
    document.getElementById("ps-3"),
  ];
  const passwordHint = document.getElementById("password-hint");

  function updatePasswordStrength(password: string) {
    const len = password.length;

    strengthBars.forEach((bar) => {
      if (bar) bar.className = "";
    });

    if (len === 0) {
      if (passwordHint) {
        passwordHint.textContent = t(`${O}:password-hint-min`);
        passwordHint.className = "password-hint";
      }
      return;
    }

    let level = 0;
    if (len >= 6) level = 1;
    if (len >= 8) level = 2;
    if (len >= 10) level = 3;

    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const variety = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (len >= 6 && variety >= 1) level = Math.max(level, 2);
    if (len >= 8 && variety >= 2) level = 3;

    let label = t(`${O}:password-hint-weak`);
    let cssClass = "weak";
    if (level === 2) { label = t(`${O}:password-hint-medium`); cssClass = "medium"; }
    if (level === 3) { label = t(`${O}:password-hint-strong`); cssClass = "strong"; }

    for (let i = 0; i < level; i++) {
      const bar = strengthBars[i];
      if (bar) {
        bar.className = `active ${cssClass}`;
      }
    }

    if (passwordHint) {
      if (len < 6) {
        passwordHint.textContent = t(`${O}:password-hint-missing`, { n: String(6 - len) });
        passwordHint.className = "password-hint";
      } else {
        passwordHint.textContent = t(`${O}:password-hint-label`, { level: label.toLowerCase() });
        passwordHint.className = `password-hint ${level >= 2 ? "valid" : ""}`;
      }
    }
  }

  passwordInput?.addEventListener("input", () => {
    if (passwordInput) updatePasswordStrength(passwordInput.value);
  });

  // --- Inicializar fortaleza de contraseña si hay valor ---
  if (passwordInput && passwordInput.value) {
    updatePasswordStrength(passwordInput.value);
  }

  // --- Limpiar errores al escribir ---
  function clearErrorOnInput(inputId: string, groupId: string) {
    const input = document.getElementById(inputId);
    const group = document.getElementById(groupId);
    input?.addEventListener("input", () => {
      group?.classList.remove("error");
    });
  }
  clearErrorOnInput("username", "fg-username");
  clearErrorOnInput("name", "fg-name");
  clearErrorOnInput("email", "fg-email");
  clearErrorOnInput("password", "fg-password");
  clearErrorOnInput("password-confirm", "fg-password-confirm");
  clearErrorOnInput("site-name", "fg-site-name");
  clearErrorOnInput("site-description", "fg-site-description");
  clearErrorOnInput("domain-input", "fg-domain");

  // --- Mostrar error en un campo ---
  function showFieldError(groupId: string, message: string) {
    const group = document.getElementById(groupId);
    const errEl = group?.querySelector(".field-error");
    group?.classList.add("error");
    if (errEl) errEl.textContent = message;
  }

  function clearAllErrors() {
    document.querySelectorAll(".form-group.error").forEach((el) => el.classList.remove("error"));
  }

  // --- Submit ---
  btnSubmit?.addEventListener("click", async () => {
    clearAllErrors();

    const username = (usernameInput?.value || "").trim();
    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const password = passwordInput?.value || "";
    const passwordConfirm = passwordConfirmInput?.value || "";
    const siteName = (siteNameInput?.value || "").trim();
    const siteDescription = (siteDescInput?.value || "").trim();
    const selectedDomain = (domainInput?.value || "").trim().toLowerCase();

    let hasError = false;

    if (!selectedDomain) {
      showFieldError("fg-domain", t(`${O}:err-domain-required`));
      if (!hasError) domainInput?.focus();
      hasError = true;
    } else if (!isValidDomain(selectedDomain)) {
      showFieldError("fg-domain", t(`${O}:err-domain-invalid`));
      if (!hasError) domainInput?.focus();
      hasError = true;
    }

    if (!username) {
      showFieldError("fg-username", t(`${O}:err-username-required`));
      usernameInput?.focus();
      hasError = true;
    }

    if (!name) {
      showFieldError("fg-name", t(`${O}:err-name-required`));
      if (!hasError) nameInput?.focus();
      hasError = true;
    }

    if (!email) {
      showFieldError("fg-email", t(`${O}:err-email-required`));
      if (!hasError) emailInput?.focus();
      hasError = true;
    } else if (!email.includes("@") || !email.includes(".")) {
      showFieldError("fg-email", t(`${O}:err-email-invalid`));
      if (!hasError) emailInput?.focus();
      hasError = true;
    }

    if (!password) {
      showFieldError("fg-password", t(`${O}:err-password-required`));
      if (!hasError) passwordInput?.focus();
      hasError = true;
    } else if (password.length < 6) {
      showFieldError("fg-password", t(`${O}:err-password-min`));
      if (!hasError) passwordInput?.focus();
      hasError = true;
    }

    if (!passwordConfirm) {
      showFieldError("fg-password-confirm", t(`${O}:err-password-confirm-required`));
      if (!hasError) passwordConfirmInput?.focus();
      hasError = true;
    } else if (password && password !== passwordConfirm) {
      showFieldError("fg-password-confirm", t(`${O}:err-password-confirm-mismatch`));
      if (!hasError) passwordConfirmInput?.focus();
      hasError = true;
    }

    if (!siteName) {
      showFieldError("fg-site-name", t(`${O}:err-site-name-required`));
      if (!hasError) siteNameInput?.focus();
      hasError = true;
    }

    if (hasError) return;

    // Ocultar step 3 y mostrar loading
    document.getElementById("step-3")?.classList.add("hidden");
    loadingState?.classList.remove("hidden");
    btnSubmit.disabled = true;

    const authResult = await registerUser(email, password, name);

    if (!authResult.success) {
      loadingState?.classList.add("hidden");
      document.getElementById("step-3")?.classList.remove("hidden");
      btnSubmit.disabled = false;
      showFieldError("fg-email", (authResult as any).error || t(`${O}:err-auth-error`));
      emailInput?.focus();
      return;
    }

    const ownerId = authResult.user?.uid;
    if (!ownerId) {
      loadingState?.classList.add("hidden");
      document.getElementById("step-3")?.classList.remove("hidden");
      btnSubmit.disabled = false;
      showFieldError("fg-email", t(`${O}:err-auth-error`));
      return;
    }

    // Usar el dominio seleccionado como ID del documento para evitar duplicados
    // y asignar rol admin al creador
    const siteResult = await setDocument("sites", selectedDomain, {
      domain: selectedDomain,
      ownerId,
      ownerUsername: username,
      siteName,
      siteDescription: siteDescription || "",
      status: "active",
      locale: selectedLocale,
      registeredAt: new Date().toISOString(),
      roles: {
        [ownerId]: "admin",
      },
    });

    if (!siteResult.success) {
      loadingState?.classList.add("hidden");
      document.getElementById("step-3")?.classList.remove("hidden");
      btnSubmit.disabled = false;
      showFieldError("fg-site-name", t(`${O}:err-domain-error`));
      return;
    }

    loadingState?.classList.add("hidden");
    successState?.classList.remove("hidden");
    if (displayNameSpan) displayNameSpan.textContent = name;

    // Guardar el dominio registrado para que /admin pueda leerlo
    // (útil en localhost donde el dominio real difiere del registrado)
    try {
      sessionStorage.setItem("registered-domain", selectedDomain);
    } catch {
      // sessionStorage no disponible
    }

    setTimeout(() => {
      window.location.href = "/admin";
    }, 2000);
  });
}

/**
 * Navega a un paso específico con animación
 */
function goToStep(step: number) {
  const prevStep = currentStep;
  currentStep = step;

  // Persistir el paso
  persistStep(step);

  // Determinar dirección de la animación
  const isForward = step > prevStep;

  // Obtener elementos
  const prevEl = document.getElementById(`step-${prevStep}`);
  const nextEl = document.getElementById(`step-${step}`);

  if (!nextEl) return;

  // Si es el mismo paso, no hacer nada
  if (prevStep === step) return;

  // Configurar animación de salida del paso anterior
  if (prevEl && prevStep !== step) {
    prevEl.classList.remove("step-enter", "step-enter-forward", "step-enter-backward");
    prevEl.classList.add(isForward ? "step-exit-forward" : "step-exit-backward");

    // Limpiar clases de animación después de que termine
    setTimeout(() => {
      prevEl.classList.remove("step-exit-forward", "step-exit-backward");
      prevEl.classList.add("hidden");
    }, 300);
  }

  // Configurar animación de entrada del nuevo paso
  nextEl.classList.remove("hidden");
  nextEl.classList.remove("step-exit-forward", "step-exit-backward");
  nextEl.classList.add(isForward ? "step-enter-forward" : "step-enter-backward");

  // Forzar reflow para reiniciar la animación
  void nextEl.offsetWidth;

  // Activar animación
  requestAnimationFrame(() => {
    nextEl.classList.remove("step-enter-forward", "step-enter-backward");
    nextEl.classList.add("step-enter");
  });

  // Actualizar indicadores de pasos
  document.querySelectorAll(".step").forEach((el) => {
    const stepNum = parseInt(el.getAttribute("data-step") || "0");
    el.classList.toggle("active", stepNum === step);
    el.classList.toggle("completed", stepNum < step);
  });

  // Hacer foco en el primer input del paso si aplica
  if (step === 2) {
    setTimeout(() => {
      const usernameInput = document.getElementById("username") as HTMLInputElement | null;
      usernameInput?.focus();
    }, 350);
  }
}

/**
 * Aplica el locale guardado a la UI
 */
function applyStoredLocale() {
  const stored = getStoredLocale();
  selectedLocale = stored;

  // Marcar el radio button correcto
  const radio = document.querySelector<HTMLInputElement>(`input[name="locale"][value="${stored}"]`);
  if (radio) radio.checked = true;

  applyLocale(stored);
}

/**
 * Aplica un locale a toda la UI
 */
function applyLocale(locale: SupportedLocale) {
  // Mapeo de IDs de elementos a claves de traducción (con namespace)
  const elementsToTranslate: Record<string, string> = {
    "config-title": `${O}:config-title`,
    "config-domain-info": `${O}:config-domain-info`,
    "step-label-1": `${O}:step-1-title`,
    "step-label-2": `${O}:step-2-title`,
    "step-label-3": `${O}:step-3-title`,
    "step-1-title": `${O}:step-1-title`,
    "step-1-description": `${O}:step-1-description`,
    "lang-es-label": `${O}:lang-es`,
    "lang-en-label": `${O}:lang-en`,
    "lang-es-desc": `${O}:lang-es-desc`,
    "lang-en-desc": `${O}:lang-en-desc`,
    "btn-step-1-next": `${C}:btn-continue`,
    "step-2-title": `${O}:step-2-title`,
    "label-username": `${O}:label-username`,
    "label-name": `${O}:label-name`,
    "label-email": `${O}:label-email`,
    "label-password": `${O}:label-password`,
    "label-password-confirm": `${O}:label-password-confirm`,
    "step-3-title": `${O}:step-3-title`,
    "label-site-name": `${O}:label-site-name`,
    "label-site-description": `${O}:label-site-description`,
    "btn-submit": `${O}:btn-create-account`,
    "loading-text": `${O}:loading-text`,
    "success-title": `${O}:success-title`,
    "success-redirecting": `${O}:success-redirecting`,
    "btn-step-2-next": `${C}:btn-continue`,
    "btn-step-2-back": `${C}:btn-back`,
    "btn-step-3-back": `${C}:btn-back`,
  };

  // Traducir textos de elementos
  for (const [elementId, translationKey] of Object.entries(elementsToTranslate)) {
    const el = document.getElementById(elementId);
    if (!el) continue;

    if (translationKey === `${O}:config-domain-info`) {
      const domain = document.querySelector("#config-domain-info strong")?.textContent || "";
      el.innerHTML = t(`${O}:config-domain-info`, { domain });
    } else if (translationKey === `${O}:success-welcome`) {
      const name = document.getElementById("display-name")?.textContent || "";
      el.innerHTML = `${t(`${O}:success-welcome`, { name })} <span id="display-name">${name}</span>`;
    } else if (translationKey === `${O}:success-domain-registered`) {
      const domain = document.querySelector("#success-domain-registered strong")?.textContent || "";
      el.innerHTML = t(`${O}:success-domain-registered`, { domain });
    } else {
      el.textContent = t(translationKey);
    }
  }

  // Traducir placeholders
  const placeholders: Record<string, string> = {
    "username": `${O}:placeholder-username`,
    "name": `${O}:placeholder-name`,
    "email": `${O}:placeholder-email`,
    "password": `${O}:placeholder-password`,
    "password-confirm": `${O}:placeholder-password-confirm`,
    "site-name": `${O}:placeholder-site-name`,
    "site-description": `${O}:placeholder-site-description`,
  };

  for (const [inputId, translationKey] of Object.entries(placeholders)) {
    const input = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (input) {
      input.placeholder = t(translationKey);
    }
  }

  // Traducir botones de toggle password
  const togglePassword = document.getElementById("toggle-password");
  const togglePasswordConfirm = document.getElementById("toggle-password-confirm");
  if (togglePassword) togglePassword.textContent = t(`${O}:password-toggle-show`);
  if (togglePasswordConfirm) togglePasswordConfirm.textContent = t(`${O}:password-toggle-show`);

  // Traducir hint de contraseña si hay un valor
  const passwordInput = document.getElementById("password") as HTMLInputElement | null;
  const passwordHint = document.getElementById("password-hint");
  if (passwordInput && passwordHint) {
    if (passwordInput.value.length === 0) {
      passwordHint.textContent = t(`${O}:password-hint-min`);
    }
  }

  // Los botones "Atrás" con prefijo "← "
  const btnBack2 = document.getElementById("btn-step-2-back");
  const btnBack3 = document.getElementById("btn-step-3-back");
  if (btnBack2) btnBack2.textContent = `← ${t(`${C}:btn-back`)}`;
  if (btnBack3) btnBack3.textContent = `← ${t(`${C}:btn-back`)}`;
}
