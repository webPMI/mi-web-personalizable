// ============================================
// i18n - Traducciones de la página pública (404, etc.)
// ============================================

import type { TranslationModule } from "../index";

const publicModule: TranslationModule = {
  es: {
    "404-title": "Página no encontrada",
    "404-description": "La página que buscas no existe o ha sido movida.",
    "404-cta-home": "Volver al inicio",
    "404-cta-login": "Iniciar sesión",
    "404-error-code": "Error 404",
    "404-suggestion": "Puede que la dirección esté mal escrita o que la página haya sido eliminada.",
  },
  en: {
    "404-title": "Page not found",
    "404-description": "The page you are looking for does not exist or has been moved.",
    "404-cta-home": "Go back home",
    "404-cta-login": "Sign in",
    "404-error-code": "Error 404",
    "404-suggestion": "The address may be misspelled or the page may have been removed.",
  },
};

export default publicModule;
