// ============================================
// i18n - Core del sistema de internacionalización
// ============================================

export type SupportedLocale = "es" | "en";

export interface TranslationMap {
  [key: string]: string;
}

export type TranslationModule = Record<SupportedLocale, TranslationMap>;

// --- Almacenamiento de módulos registrados ---
const registeredModules: Map<string, TranslationModule> = new Map();

/**
 * Registra un módulo de traducciones.
 * Cada módulo tiene un namespace único para evitar colisiones.
 *
 * @param namespace - Identificador único del módulo (ej: "onboarding", "admin", "public")
 * @param module - Objeto con traducciones por locale
 */
export function registerTranslations(namespace: string, module: TranslationModule): void {
  if (registeredModules.has(namespace)) {
    console.warn(`[i18n] El módulo "${namespace}" ya está registrado. Se sobrescribirá.`);
  }
  registeredModules.set(namespace, module);
}

/**
 * Obtiene el locale almacenado o el predeterminado
 */
export function getStoredLocale(): SupportedLocale {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem("app-locale");
  if (stored === "es" || stored === "en") return stored;
  return "es";
}

/**
 * Guarda el locale seleccionado
 */
export function setStoredLocale(locale: SupportedLocale): void {
  localStorage.setItem("app-locale", locale);
}

/**
 * Obtiene el locale actual
 */
export function getLocale(): SupportedLocale {
  return getStoredLocale();
}

/**
 * Traduce una clave con formato `namespace:key` al locale actual.
 *
 * @param key - Clave de traducción con formato `namespace:key` (ej: "onboarding:step-1-title")
 * @param params - Parámetros opcionales para interpolar en el texto
 * @returns El texto traducido, o la clave si no se encuentra
 *
 * @example
 * t("onboarding:step-1-title")
 * t("common:btn-continue")
 * t("onboarding:success-welcome", { name: "Juan" })
 */
export function t(key: string, params?: Record<string, string>): string {
  const locale = getStoredLocale();

  // Separar namespace y key
  const colonIndex = key.indexOf(":");
  if (colonIndex === -1) {
    console.warn(`[i18n] La clave "${key}" no tiene namespace. Usa formato "namespace:key".`);
    return key;
  }

  const namespace = key.substring(0, colonIndex);
  const actualKey = key.substring(colonIndex + 1);

  const module = registeredModules.get(namespace);
  if (!module) {
    console.warn(`[i18n] No se encontró el módulo "${namespace}" para la clave "${key}".`);
    return key;
  }

  const translations = module[locale];
  let text = translations[actualKey];

  if (text === undefined) {
    // Fallback al otro locale si no se encuentra
    const fallbackLocale = locale === "es" ? "en" : "es";
    const fallbackTranslations = module[fallbackLocale];
    text = fallbackTranslations[actualKey];
  }

  if (text === undefined) {
    console.warn(`[i18n] No se encontró la clave "${actualKey}" en el módulo "${namespace}".`);
    return key;
  }

  // Interpolar parámetros
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }

  return text;
}

/**
 * Carga y registra un módulo de traducciones de forma dinámica (lazy).
 * Útil para módulos grandes que no se necesitan en la carga inicial.
 *
 * @param namespace - Namespace del módulo
 * @param loader - Función que retorna una promesa con el módulo de traducciones
 */
export async function loadTranslations(
  namespace: string,
  loader: () => Promise<{ default: TranslationModule }>
): Promise<void> {
  try {
    const mod = await loader();
    registerTranslations(namespace, mod.default);
  } catch (error) {
    console.error(`[i18n] Error al cargar el módulo "${namespace}":`, error);
  }
}
