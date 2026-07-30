// ============================================
// LanguageSelectorClient — Script cliente para cambio de idioma
// ============================================

/**
 * Cambia el idioma y recarga la página.
 * Establece tanto localStorage como cookie para
 * que el middleware SSR lo detecte.
 */
export function changeLanguage(locale: "es" | "en"): void {
  // Guardar en localStorage (para cliente)
  localStorage.setItem("app-locale", locale);

  // Establecer cookie (para SSR / middleware)
  document.cookie = `app-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;

  // Recargar para aplicar el nuevo locale
  window.location.reload();
}