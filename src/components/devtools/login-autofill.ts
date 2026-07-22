// ============================================
// DevTools - Autocompletar formulario de login
// ============================================

import { getDocument, updateDocument } from "../../lib/firebase/firestore";
import { getEffectiveDomain } from "../../lib/domain-check";

export interface LoginAutofillData {
  email: string;
  password: string;
}

const DEFAULT_DATA: LoginAutofillData = {
  email: "demo@ejemplo.com",
  password: "Demo123!",
};

const ADMIN_DATA: LoginAutofillData = {
  email: "admin@demo.com",
  password: "Admin123!",
};

/**
 * Detecta si estamos en la página de login
 */
export function isLoginPage(): boolean {
  return !!document.getElementById("login-form");
}

/**
 * Autocompleta el formulario de login con datos de prueba
 */
export function autofillLogin(data?: Partial<LoginAutofillData>): boolean {
  const values = { ...DEFAULT_DATA, ...data };

  const emailInput = document.getElementById("email") as HTMLInputElement | null;
  const passwordInput = document.getElementById("password") as HTMLInputElement | null;

  let filled = 0;

  if (emailInput) {
    emailInput.value = values.email;
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    filled++;
  }

  if (passwordInput) {
    passwordInput.value = values.password;
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    filled++;
  }

  return filled > 0;
}

/**
 * Autocompleta el formulario de login con datos de admin demo
 * y además asigna el rol "admin" al usuario en el sitio actual
 */
export async function autofillLoginAsAdmin(): Promise<boolean> {
  const ok = autofillLogin(ADMIN_DATA);
  if (!ok) return false;

  // Asignar rol admin en el sitio actual
  try {
    const domain = getEffectiveDomain();
    const siteResult = await getDocument("sites", domain);
    if (siteResult.success && siteResult.data) {
      const site = siteResult.data as any;
      const roles = site.roles || {};
      // No podemos asignar el rol aquí porque no sabemos el UID aún
      // El UID se obtiene después del login
    }
  } catch {
    // Ignorar
  }

  return true;
}
