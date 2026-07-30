// ============================================
// i18n Middleware — Detección de idioma server-side
// ============================================
// Detecta el locale desde:
// 1. Cookie "app-locale"
// 2. Header Accept-Language (fallback)
// 3. Valor por defecto "es"
//
// Inyecta locals.locale para que esté disponible
// en todas las páginas SSR.

import { getLocaleFromCookie, type SupportedLocale } from "./lib/i18n";

export function onRequest(context: { request: Request; locals: { locale?: string }; cookies?: any }, next: () => Promise<Response>) {
  const { request, locals } = context;

  // 1. Intentar desde cookie
  let locale: SupportedLocale = getLocaleFromCookie(request);

  // 2. Fallback a Accept-Language
  if (!locale || locale === "es") {
    const acceptLang = request.headers.get("accept-language") || "";
    if (acceptLang.startsWith("en")) {
      locale = "en";
    }
  }

  // 3. Inyectar en locals
  locals.locale = locale;

  // 4. Si no hay cookie, establecerla (lo hace el middleware de respuesta)
  return next();
}