// ============================================
// DevTools - Autocompletar formulario de onboarding
// ============================================

export interface AutofillData {
  username: string;
  name: string;
  email: string;
  password: string;
  siteName: string;
  siteDescription: string;
  domain: string;
  locale: "es" | "en";
}

const DEFAULT_DATA: AutofillData = {
  username: "usuariodemo",
  name: "Usuario Demo",
  email: "demo@ejemplo.com",
  password: "Demo123!",
  siteName: "Mi Sitio Demo",
  siteDescription: "Un sitio de prueba para desarrollo",
  domain: "midominio.com",
  locale: "es",
};

/**
 * Detecta si estamos en la página de onboarding
 */
export function isOnboardingPage(): boolean {
  return !!document.querySelector(".onboarding-container");
}

/**
 * Autocompleta el formulario de onboarding con datos de prueba
 */
export function autofillOnboarding(data?: Partial<AutofillData>): boolean {
  const values = { ...DEFAULT_DATA, ...data };

  // --- Seleccionar idioma ---
  const localeRadio = document.querySelector<HTMLInputElement>(
    `input[name="locale"][value="${values.locale}"]`
  );
  if (localeRadio) {
    localeRadio.checked = true;
    localeRadio.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // --- Autocompletar campos del paso 2 (cuenta) ---
  const fields: Record<string, string> = {
    username: values.username,
    name: values.name,
    email: values.email,
    password: values.password,
    "password-confirm": values.password,
  };

  let filled = 0;

  for (const [id, value] of Object.entries(fields)) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      filled++;
    }
  }

  // --- Autocompletar campos del paso 3 (sitio) ---
  const siteNameEl = document.getElementById("site-name") as HTMLInputElement | null;
  if (siteNameEl) {
    siteNameEl.value = values.siteName;
    siteNameEl.dispatchEvent(new Event("input", { bubbles: true }));
    filled++;
  }

  const siteDescEl = document.getElementById("site-description") as HTMLTextAreaElement | null;
  if (siteDescEl) {
    siteDescEl.value = values.siteDescription;
    siteDescEl.dispatchEvent(new Event("input", { bubbles: true }));
    filled++;
  }

  // --- Autocompletar campo de dominio ---
  const domainInput = document.getElementById("domain-input") as HTMLInputElement | null;
  if (domainInput) {
    domainInput.value = values.domain;
    domainInput.dispatchEvent(new Event("input", { bubbles: true }));
    filled++;
  }

  return filled > 0;
}
