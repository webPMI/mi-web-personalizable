// ============================================
// theme.ts — Módulo Centralizado de Gestión del Tema
// ============================================
// Define la fuente única de verdad para las variables CSS y
// los valores por defecto del tema del sitio.
// Reutilizable en layouts públicos, index y el editor WYSIWYG.
// ============================================

export interface SiteThemeConfig {
  // ─── COLORES PRINCIPALES ───
  primaryColor?: string;        // Color primario
  secondaryColor?: string;      // Color secundario
  accentColor?: string;         // Color de acento (CTAs, links, hover)

  // ─── COLORES DE FONDO Y TEXTO ───
  bgColor?: string;             // Fondo general del sitio
  textColor?: string;           // Color de texto principal
  textMutedColor?: string;      // Color de texto secundario

  // ─── COLORES DE COMPONENTES ───
  navbarBg?: string;            // Fondo del navbar
  navbarText?: string;          // Color del texto en navbar
  navbarBorder?: string;        // Borde inferior del navbar
  footerBg?: string;            // Fondo del footer
  footerText?: string;          // Color del texto en footer
  footerLinkOpacity?: number;   // Opacidad de enlaces en footer (0-1)
  cardBg?: string;              // Fondo de tarjetas
  cardBorder?: string;          // Borde de tarjetas
  cardRadius?: number;          // Radio de borde de tarjetas
  cardShadow?: string;          // Sombra de tarjetas
  sectionAltBg?: string;        // Fondo alterno de secciones (even)
  socialBg?: string;            // Fondo de sección de redes sociales

  // ─── TIPOGRAFÍA ───
  fontFamily?: string;          // Fuente principal
  fontHeadings?: string;        // Fuente para títulos
  fontSizeBase?: number;        // Tamaño base (px)
  fontWeight?: string;          // Grosor de fuente base
  lineHeight?: number;          // Altura de línea base
  headingLineHeight?: number;   // Altura de línea para títulos
  h1Size?: string;              // Tamaño de h1 (ej: "2.5rem")
  h2Size?: string;              // Tamaño de h2 (ej: "2rem")
  h3Size?: string;              // Tamaño de h3 (ej: "1.25rem")

  // ─── LAYOUT ───
  layout?: "centered" | "full-width";
  maxWidth?: number;            // Ancho máximo del contenedor (px)
  sectionGap?: number;          // Espaciado entre secciones (px)
  containerPadding?: number;    // Padding horizontal del contenedor (px)
  borderRadius?: number;        // Radio de borde general (px)

  // ─── HERO ───
  heroHeight?: string;          // Altura del hero (ej: "450px", "600px", "100vh")
  heroAlign?: "left" | "center" | "right";  // Alineación del hero
  heroOverlayColor?: string;    // Color del overlay del hero
  heroOverlayOpacity?: number;  // Opacidad del overlay (0-1)
  heroTextColor?: string;       // Color del texto en hero
  heroTitleSize?: string;       // Tamaño del título del hero
  heroTitleWeight?: string;     // Grosor del título del hero
  heroSubtitleSize?: string;    // Tamaño del subtítulo del hero
  heroSubtitleColor?: string;   // Color del subtítulo del hero

  // ─── BOTONES ───
  btnStyle?: "filled" | "outline" | "ghost";  // Estilo por defecto
  btnBorderRadius?: number;     // Radio de borde de botones (px)
  btnPaddingX?: number;         // Padding horizontal de botones (px)
  btnPaddingY?: number;         // Padding vertical de botones (px)
  btnTextColor?: string;        // Color del texto en botones filled
  btnHoverBg?: string;          // Fondo de botón ghost en hover

  // ─── ENLACES ───
  linkHoverDecoration?: string; // Decoración de enlaces en hover
  navbarLinkOpacity?: number;   // Opacidad de enlaces del navbar (0-1)
}

export const DEFAULT_THEME: Required<SiteThemeConfig> = {
  // Colores principales
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#4f46e5",

  // Fondo y texto
  bgColor: "#ffffff",
  textColor: "#1a1a2e",
  textMutedColor: "#6b7280",

  // Componentes
  navbarBg: "#ffffff",
  navbarText: "#1a1a2e",
  navbarBorder: "#e5e7eb",
  footerBg: "#1e1b4b",
  footerText: "#e0e7ff",
  footerLinkOpacity: 0.7,
  cardBg: "#ffffff",
  cardBorder: "#e5e7eb",
  cardRadius: 12,
  cardShadow: "0 1px 3px rgba(0,0,0,0.05)",
  sectionAltBg: "#f9fafb",
  socialBg: "#f8fafc",

  // Tipografía
  fontFamily: "'Inter', system-ui, sans-serif",
  fontHeadings: "'Inter', system-ui, sans-serif",
  fontSizeBase: 16,
  fontWeight: "400",
  lineHeight: 1.6,
  headingLineHeight: 1.3,
  h1Size: "2.5rem",
  h2Size: "2rem",
  h3Size: "1.25rem",

  // Layout
  layout: "centered",
  maxWidth: 1200,
  sectionGap: 64,
  containerPadding: 24,
  borderRadius: 8,

  // Hero
  heroHeight: "450px",
  heroAlign: "center",
  heroOverlayColor: "#000000",
  heroOverlayOpacity: 0.4,
  heroTextColor: "#ffffff",
  heroTitleSize: "3rem",
  heroTitleWeight: "800",
  heroSubtitleSize: "1.25rem",
  heroSubtitleColor: "rgba(255,255,255,0.9)",

  // Botones
  btnStyle: "filled",
  btnBorderRadius: 6,
  btnPaddingX: 24,
  btnPaddingY: 12,
  btnTextColor: "#ffffff",
  btnHoverBg: "rgba(79, 70, 229, 0.08)",

  // Enlaces
  linkHoverDecoration: "underline",
  navbarLinkOpacity: 0.8,
};

/**
 * Normaliza las propiedades del tema inyectando los valores por defecto.
 */
export function resolveTheme(theme?: SiteThemeConfig): Required<SiteThemeConfig> {
  const t = theme || {};
  const fontFamily = t.fontFamily || DEFAULT_THEME.fontFamily;

  return {
    primaryColor: t.primaryColor || DEFAULT_THEME.primaryColor,
    secondaryColor: t.secondaryColor || DEFAULT_THEME.secondaryColor,
    accentColor: t.accentColor || DEFAULT_THEME.accentColor,
    bgColor: t.bgColor || DEFAULT_THEME.bgColor,
    textColor: t.textColor || DEFAULT_THEME.textColor,
    textMutedColor: t.textMutedColor || DEFAULT_THEME.textMutedColor,
    navbarBg: t.navbarBg || DEFAULT_THEME.navbarBg,
    navbarText: t.navbarText || DEFAULT_THEME.navbarText,
    navbarBorder: t.navbarBorder || DEFAULT_THEME.navbarBorder,
    footerBg: t.footerBg || DEFAULT_THEME.footerBg,
    footerText: t.footerText || DEFAULT_THEME.footerText,
    footerLinkOpacity: t.footerLinkOpacity ?? DEFAULT_THEME.footerLinkOpacity,
    cardBg: t.cardBg || DEFAULT_THEME.cardBg,
    cardBorder: t.cardBorder || DEFAULT_THEME.cardBorder,
    cardRadius: t.cardRadius ?? DEFAULT_THEME.cardRadius,
    cardShadow: t.cardShadow || DEFAULT_THEME.cardShadow,
    sectionAltBg: t.sectionAltBg || DEFAULT_THEME.sectionAltBg,
    socialBg: t.socialBg || DEFAULT_THEME.socialBg,
    fontFamily: fontFamily,
    fontHeadings: t.fontHeadings || fontFamily,
    fontSizeBase: t.fontSizeBase || DEFAULT_THEME.fontSizeBase,
    fontWeight: t.fontWeight || DEFAULT_THEME.fontWeight,
    lineHeight: t.lineHeight ?? DEFAULT_THEME.lineHeight,
    headingLineHeight: t.headingLineHeight ?? DEFAULT_THEME.headingLineHeight,
    h1Size: t.h1Size || DEFAULT_THEME.h1Size,
    h2Size: t.h2Size || DEFAULT_THEME.h2Size,
    h3Size: t.h3Size || DEFAULT_THEME.h3Size,
    layout: t.layout || DEFAULT_THEME.layout,
    maxWidth: t.maxWidth || DEFAULT_THEME.maxWidth,
    sectionGap: t.sectionGap || DEFAULT_THEME.sectionGap,
    containerPadding: t.containerPadding || DEFAULT_THEME.containerPadding,
    borderRadius: t.borderRadius || DEFAULT_THEME.borderRadius,
    heroHeight: t.heroHeight || DEFAULT_THEME.heroHeight,
    heroAlign: t.heroAlign || DEFAULT_THEME.heroAlign,
    heroOverlayColor: t.heroOverlayColor || DEFAULT_THEME.heroOverlayColor,
    heroOverlayOpacity: t.heroOverlayOpacity ?? DEFAULT_THEME.heroOverlayOpacity,
    heroTextColor: t.heroTextColor || DEFAULT_THEME.heroTextColor,
    heroTitleSize: t.heroTitleSize || DEFAULT_THEME.heroTitleSize,
    heroTitleWeight: t.heroTitleWeight || DEFAULT_THEME.heroTitleWeight,
    heroSubtitleSize: t.heroSubtitleSize || DEFAULT_THEME.heroSubtitleSize,
    heroSubtitleColor: t.heroSubtitleColor || DEFAULT_THEME.heroSubtitleColor,
    btnStyle: t.btnStyle || DEFAULT_THEME.btnStyle,
    btnBorderRadius: t.btnBorderRadius ?? DEFAULT_THEME.btnBorderRadius,
    btnPaddingX: t.btnPaddingX ?? DEFAULT_THEME.btnPaddingX,
    btnPaddingY: t.btnPaddingY ?? DEFAULT_THEME.btnPaddingY,
    btnTextColor: t.btnTextColor || DEFAULT_THEME.btnTextColor,
    btnHoverBg: t.btnHoverBg || DEFAULT_THEME.btnHoverBg,
    linkHoverDecoration: t.linkHoverDecoration || DEFAULT_THEME.linkHoverDecoration,
    navbarLinkOpacity: t.navbarLinkOpacity ?? DEFAULT_THEME.navbarLinkOpacity,
  };
}

/**
 * Devuelve un mapa de variables CSS personalizadas del tema.
 */
export function getThemeCssVariables(theme?: SiteThemeConfig): Record<string, string> {
  const resolved = resolveTheme(theme);
  const maxWidthCss = resolved.layout === "full-width" ? "100%" : `${resolved.maxWidth}px`;

  return {
    // Colores principales
    "--primary": resolved.primaryColor,
    "--primary-color": resolved.primaryColor,
    "--secondary": resolved.secondaryColor,
    "--accent": resolved.accentColor,

    // Fondo y texto
    "--bg": resolved.bgColor,
    "--text": resolved.textColor,
    "--text-muted": resolved.textMutedColor,

    // Componentes
    "--navbar-bg": resolved.navbarBg,
    "--navbar-text": resolved.navbarText,
    "--navbar-border": resolved.navbarBorder,
    "--footer-bg": resolved.footerBg,
    "--footer-text": resolved.footerText,
    "--footer-link-opacity": String(resolved.footerLinkOpacity),
    "--card-bg": resolved.cardBg,
    "--card-border": resolved.cardBorder,
    "--card-radius": `${resolved.cardRadius}px`,
    "--card-shadow": resolved.cardShadow,
    "--section-alt-bg": resolved.sectionAltBg,
    "--social-bg": resolved.socialBg,

    // Tipografía
    "--font-family": resolved.fontFamily,
    "--font-headings": resolved.fontHeadings,
    "--font-size-base": `${resolved.fontSizeBase}px`,
    "--font-weight": resolved.fontWeight,
    "--line-height": String(resolved.lineHeight),
    "--heading-line-height": String(resolved.headingLineHeight),
    "--h1-size": resolved.h1Size,
    "--h2-size": resolved.h2Size,
    "--h3-size": resolved.h3Size,

    // Layout
    "--max-width": maxWidthCss,
    "--border-radius": `${resolved.borderRadius}px`,
    "--radius": `${resolved.borderRadius}px`,
    "--section-gap": `${resolved.sectionGap}px`,
    "--container-padding": `${resolved.containerPadding}px`,

    // Hero
    "--hero-height": resolved.heroHeight,
    "--hero-align": resolved.heroAlign,
    "--hero-overlay-color": resolved.heroOverlayColor,
    "--hero-overlay-opacity": String(resolved.heroOverlayOpacity),
    "--hero-text-color": resolved.heroTextColor,
    "--hero-title-size": resolved.heroTitleSize,
    "--hero-title-weight": resolved.heroTitleWeight,
    "--hero-subtitle-size": resolved.heroSubtitleSize,
    "--hero-subtitle-color": resolved.heroSubtitleColor,

    // Botones
    "--btn-py": `${resolved.btnPaddingY}px`,
    "--btn-px": `${resolved.btnPaddingX}px`,
    "--btn-radius": `${resolved.btnBorderRadius}px`,
    "--btn-text-color": resolved.btnTextColor,
    "--btn-hover-bg": resolved.btnHoverBg,

    // Enlaces
    "--link-hover-decoration": resolved.linkHoverDecoration,
    "--navbar-link-opacity": String(resolved.navbarLinkOpacity),
  };
}

/**
 * Aplica directamente las variables CSS del tema a un elemento HTML en el cliente (DOM).
 */
export function applyThemeToElement(element: HTMLElement, theme?: SiteThemeConfig) {
  if (!element) return;
  const vars = getThemeCssVariables(theme);

  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }

  // Aplicar tipografía directamente al elemento
  if (vars["--font-family"]) {
    element.style.fontFamily = vars["--font-family"];
  }
}

/**
 * Genera un bloque <style> con las variables CSS para inyección SSR en Astro <head>.
 */
export function generateThemeCssBlock(theme?: SiteThemeConfig, selector = ":root"): string {
  const vars = getThemeCssVariables(theme);
  const cssLines = Object.entries(vars)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join("\n");

  return `${selector} {\n${cssLines}\n}`;
}
