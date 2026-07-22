// ============================================
// Sanitizer - Módulo Central de Sanitización
// ============================================

/**
 * Sanea y valida URLs para evitar vectores de ataque XSS (javascript:, data:, vbscript:).
 * Permite protocolos seguros (http:, https:, mailto:, tel:) y rutas relativas (/, #, ./).
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  const clean = String(url).trim();
  if (clean === "") return "";

  // Permitir rutas relativas locales (/about, #section, ./link)
  if (clean.startsWith("/") || clean.startsWith("#") || clean.startsWith("./")) {
    return clean;
  }

  // Prevenir schemes de inyección de script (javascript:, data:, vbscript:)
  const normalizedScheme = clean.toLowerCase();
  if (
    normalizedScheme.startsWith("javascript:") ||
    normalizedScheme.startsWith("data:") ||
    normalizedScheme.startsWith("vbscript:")
  ) {
    return "#";
  }

  return clean;
}

/**
 * Escapa comillas y caracteres HTML para que sea 100% seguro insertar en atributos HTML (value="...").
 */
export function escapeAttribute(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Limpia textos generales eliminando espacios innecesarios y
 * escapando caracteres HTML peligrosos para prevenir XSS.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Convierte un título en una URL/slug limpia.
 * Ejemplo: "Acerca de Nosotros!" -> "acerca-de-nosotros"
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos / acentos
    .replace(/[^a-z0-9 -]/g, "") // Remover caracteres especiales
    .replace(/\s+/g, "-") // Reemplazar espacios por guiones
    .replace(/-+/g, "-") // Reemplazar múltiples guiones por uno solo
    .replace(/^-+|-+$/g, ""); // Quitar guiones al principio y final
}

/**
 * Desinfecta automáticamente objetos completos (SiteData, formularios).
 * Aplica sanitizeUrl a claves de URL/imagen y sanitizeText a textos,
 * limpiando recursivamente objetos y arrays.
 */
export function sanitizeSiteData<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === "object" && item !== null
        ? sanitizeSiteData(item)
        : typeof item === "string"
        ? sanitizeText(item)
        : item
    ) as unknown as T;
  }

  const cleanObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (typeof value === "string") {
      const isUrlKey = /url|href|link|image|avatar|photo|bucket|twitter|github|linkedin|instagram|facebook|social/i.test(key);
      if (isUrlKey) {
        cleanObj[key] = sanitizeUrl(value);
      } else {
        cleanObj[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      cleanObj[key] = sanitizeSiteData(value);
    } else if (value !== null && typeof value === "object" && !(value instanceof Date)) {
      cleanObj[key] = sanitizeSiteData(value);
    } else {
      cleanObj[key] = value;
    }
  }

  return cleanObj as T;
}
