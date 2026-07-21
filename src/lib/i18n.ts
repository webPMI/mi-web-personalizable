// ============================================
// i18n - Punto de entrada unificado
// ============================================
//
// Este archivo es el punto de entrada para consumir el sistema i18n.
// Registra automáticamente los módulos de traducción al importarse.
//
// Uso:
//   import { t, getLocale, setLocale } from "../../lib/i18n";
//   t("onboarding:step-1-title")
//   t("common:btn-continue")
// ============================================

import { registerTranslations } from "./i18n/index";
import commonModule from "./i18n/modules/common";
import onboardingModule from "./i18n/modules/onboarding";
import adminModule from "./i18n/modules/admin";

// Registrar módulos al cargar
registerTranslations("common", commonModule);
registerTranslations("onboarding", onboardingModule);
registerTranslations("admin", adminModule);

// Re-exportar todo desde el core
export {
  t,
  getStoredLocale,
  setStoredLocale,
  getLocale,
  registerTranslations,
  loadTranslations,
} from "./i18n/index";

export type { SupportedLocale, TranslationMap, TranslationModule } from "./i18n/index";
