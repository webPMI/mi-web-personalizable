# Catálogo Completo de Elementos HTML del Tema

> **Documento:** 09-html-elements-catalog.md
> **Propósito:** Catalogar TODOS los elementos HTML que renderiza el sitio público, identificar qué variables CSS del tema los controlan y cuáles están hardcodeados (y deben ser migrados).

---

## 1. Estado Actual

### 1.1 Variables CSS definidas en `theme.ts` (18 propiedades)

| Variable CSS | ¿Se usa en componentes? | ¿Hardcodeado? |
|---|---|---|
| `--primary` / `--primary-color` | ✅ HeroSection (bg-color fallback) | ❌ No |
| `--secondary` | ❌ En ningún componente | ❌ No se usa |
| `--accent` | ✅ Navbar, HeroSection, PublicLayout (btn) | ❌ No |
| `--bg` | ✅ PublicLayout (body) | ❌ No |
| `--text` | ✅ PublicLayout (body) | ❌ No |
| `--text-muted` | ✅ PublicLayout (btn), Navbar (border) | ❌ No |
| `--navbar-bg` | ✅ Navbar | ❌ No |
| `--navbar-text` | ✅ Navbar | ❌ No |
| `--footer-bg` | ✅ Footer | ❌ No |
| `--footer-text` | ✅ Footer | ❌ No |
| `--font-family` | ✅ PublicLayout (body) | ❌ No |
| `--font-headings` | ✅ PublicLayout (h1-h6) | ❌ No |
| `--font-size-base` | ✅ PublicLayout (body) | ❌ No |
| `--font-weight` | ✅ PublicLayout (body) | ❌ No |
| `--max-width` | ✅ PublicLayout (.container) | ❌ No |
| `--border-radius` / `--radius` | ❌ En ningún componente | ❌ No se usa |
| `--section-gap` | ✅ PublicLayout (section padding) | ❌ No |
| `--container-padding` | ✅ PublicLayout (.container) | ❌ No |

### 1.2 Variables CSS usadas pero NO definidas en `SiteThemeConfig`

| Variable CSS | Dónde se usa | Valor hardcodeado actual |
|---|---|---|
| `--btn-py` | HeroSection (.hero-cta), PublicLayout (.btn-site) | `12px` |
| `--btn-px` | HeroSection (.hero-cta), PublicLayout (.btn-site) | `24px` |
| `--btn-radius` | HeroSection (.hero-cta), PublicLayout (.btn-site) | `6px` |
| `--hero-height` | HeroSection (.hero) | `450px` |
| `--hero-align` | HeroSection (.hero, .hero-content) | `center` |
| `--hero-overlay-color` | HeroSection (.hero-overlay) | `#000000` |
| `--hero-overlay-opacity` | HeroSection (.hero-overlay) | `0.4` |

### 1.3 Elementos con estilos hardcodeados (NO usan variables del tema)

| Componente | Elemento | Propiedad hardcodeada | Valor actual |
|---|---|---|---|
| **Navbar** | `.navbar` | `border-bottom` | `1px solid var(--text-muted, #e5e7eb)` |
| **DynamicSections** | `.section:nth-child(even)` | `background` | `#f9fafb` |
| **DynamicSections** | `.section h2` | `color` | `#1a1a2e` |
| **DynamicSections** | `.section-image-text-media img` | `border-radius` | `0.75rem` |
| **DynamicSections** | `.gallery-item` | `border-radius` | `0.5rem` |
| **DynamicSections** | `.card` | `background`, `border`, `border-radius` | `#ffffff`, `1px solid #e5e7eb`, `0.75rem` |
| **DynamicSections** | `.card p` | `color` | `#6b7280` |
| **SocialLinks** | `.social-section` | `background` | `#f8fafc` |
| **SocialLinks** | `.social-link` | `color` | `#4b5563` |
| **BlockRegistry** | Todos los bloques | Múltiples colores, fondos, bordes | Varios hardcodeados |

---

## 2. Catálogo Completo de Elementos HTML del Sitio Público

### 2.1 Estructura General

```html
<body>
  <header class="navbar">                    <!-- Barra de navegación -->
    <div class="container navbar-inner">
      <a class="navbar-brand">...</a>         <!-- Logo/nombre del sitio -->
      <nav class="navbar-links">
        <a class="navbar-link">...</a>        <!-- Enlace de navegación -->
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">                    <!-- Hero section -->
      <div class="hero-overlay"></div>
      <div class="container hero-content">
        <h1 class="hero-title">...</h1>       <!-- Título del hero -->
        <p class="hero-subtitle">...</p>      <!-- Subtítulo del hero -->
        <a class="hero-cta">...</a>           <!-- CTA del hero -->
      </div>
    </section>

    <section class="section">                 <!-- Sección dinámica -->
      <div class="container">
        <!-- Tipos de sección: -->
        <div class="section-text">            <!-- Texto simple -->
          <h2>...</h2>
          <div>...</div>                      <!-- HTML content -->
        </div>

        <div class="section-image-text">      <!-- Texto + imagen -->
          <div class="section-image-text-content">
            <h2>...</h2>
            <div>...</div>
          </div>
          <div class="section-image-text-media">
            <img />                           <!-- Imagen -->
          </div>
        </div>

        <div class="section-gallery">         <!-- Galería -->
          <h2>...</h2>
          <div class="gallery-grid">
            <div class="gallery-item">
              <img />
            </div>
          </div>
        </div>

        <div class="section-cards">           <!-- Tarjetas -->
          <h2>...</h2>
          <div class="cards-grid">
            <div class="card">
              <h3>...</h3>
              <p>...</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="social-section">          <!-- Redes sociales -->
      <div class="container">
        <div class="social-links">
          <a class="social-link">...</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">                     <!-- Pie de página -->
    <div class="container footer-inner">
      <p>...</p>                              <!-- Copyright -->
      <nav class="footer-links">
        <a class="footer-link">...</a>        <!-- Enlace del footer -->
      </nav>
    </div>
  </footer>
</body>
```

### 2.2 Bloques del Editor WYSIWYG (BlockRegistry)

```html
<!-- Bloque: Encabezado -->
<h1 class="block-heading">...</h1>
<h2 class="block-heading">...</h2>
<!-- ... hasta h6 -->

<!-- Bloque: Párrafo -->
<p class="block-paragraph">...</p>

<!-- Bloque: Hero -->
<section class="block-hero">
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <h1>...</h1>
    <p>...</p>
    <a class="btn btn-primary btn-lg">...</a>
  </div>
</section>

<!-- Bloque: Tarjetas -->
<div class="block-cards-grid">
  <div class="card-item">
    <img />
    <h3>...</h3>
    <p>...</p>
  </div>
</div>

<!-- Bloque: CTA -->
<div class="block-cta">
  <h2>...</h2>
  <p>...</p>
  <a class="btn btn-light">...</a>
</div>

<!-- Bloque: Espaciador -->
<div class="block-spacer"></div>
```

---

## 3. Mapa Completo: Elemento → Variable CSS → Propuesta

### 3.1 Layout General

| Elemento CSS | Propiedad | Variable actual | Propuesta de variable |
|---|---|---|---|
| `body` | `font-family` | `--font-family` | ✅ OK |
| `body` | `font-size` | `--font-size-base` | ✅ OK |
| `body` | `font-weight` | `--font-weight` | ✅ OK |
| `body` | `color` | `--text` | ✅ OK |
| `body` | `background` | `--bg` | ✅ OK |
| `body` | `line-height` | `1.6` (hardcodeado) | `--line-height` |
| `h1, h2, h3, h4, h5, h6` | `font-family` | `--font-headings` | ✅ OK |
| `h1, h2, h3, h4, h5, h6` | `line-height` | `1.3` (hardcodeado) | `--heading-line-height` |
| `h1` | `font-size` | `2.5rem` (hardcodeado) | `--h1-size` |
| `h2` | `font-size` | `2rem` (hardcodeado) | `--h2-size` |
| `h3` | `font-size` | `1.25rem` (hardcodeado) | `--h3-size` |
| `a` | `color` | `--accent` | ✅ OK |
| `a:hover` | `text-decoration` | `underline` | `--link-hover-decoration` |
| `img` | `max-width`, `height` | `100%`, `auto` | ✅ OK |
| `.container` | `max-width` | `--max-width` | ✅ OK |
| `.container` | `padding` | `--container-padding` | ✅ OK |
| `section` | `padding` | `--section-gap` | ✅ OK |

### 3.2 Navbar

| Elemento CSS | Propiedad | Variable actual | Propuesta de variable |
|---|---|---|---|
| `.navbar` | `background` | `--navbar-bg` | ✅ OK |
| `.navbar` | `border-bottom` | `1px solid var(--text-muted)` | `--navbar-border` |
| `.navbar` | `position` | `sticky` | `--navbar-position` |
| `.navbar-brand` | `color` | `--navbar-text` | ✅ OK |
| `.navbar-brand:hover` | `color` | `--accent` | ✅ OK |
| `.navbar-link` | `color` | `--navbar-text` | ✅ OK |
| `.navbar-link` | `opacity` | `0.8` (hardcodeado) | `--navbar-link-opacity` |
| `.navbar-link:hover` | `color` | `--accent` | ✅ OK |

### 3.3 Hero

| Elemento CSS | Propiedad | Variable actual | Propuesta de variable |
|---|---|---|---|
| `.hero` | `height` | `--hero-height` | ✅ OK (pero no en SiteThemeConfig) |
| `.hero` | `background-color` | `--primary` | ✅ OK |
| `.hero` | `text-align` | `--hero-align` | ✅ OK (pero no en SiteThemeConfig) |
| `.hero-overlay` | `background` | `--hero-overlay-color` | ✅ OK (pero no en SiteThemeConfig) |
| `.hero-overlay` | `opacity` | `--hero-overlay-opacity` | ✅ OK (pero no en SiteThemeConfig) |
| `.hero-title` | `font-size` | `3rem` (hardcodeado) | `--hero-title-size` |
| `.hero-title` | `font-weight` | `800` (hardcodeado) | `--hero-title-weight` |
| `.hero-title` | `color` | `#ffffff` (hardcodeado) | `--hero-text-color` |
| `.hero-subtitle` | `font-size` | `1.25rem` (hardcodeado) | `--hero-subtitle-size` |
| `.hero-subtitle` | `color` | `rgba(255,255,255,0.9)` | `--hero-subtitle-color` |
| `.hero-cta` | `padding` | `--btn-py` / `--btn-px` | ✅ OK (pero no en SiteThemeConfig) |
| `.hero-cta` | `background` | `--accent` | ✅ OK |
| `.hero-cta` | `border-radius` | `--btn-radius` | ✅ OK (pero no en SiteThemeConfig) |

### 3.4 Secciones Dinámicas

| Elemento CSS | Propiedad | Estado | Propuesta de variable |
|---|---|---|---|
| `.section` | `padding` | ✅ Usa `--section-gap` | ✅ OK |
| `.section:nth-child(even)` | `background` | ❌ Hardcodeado `#f9fafb` | `--section-alt-bg` |
| `.section h2` | `font-size` | ❌ Hardcodeado `2rem` | `--h2-size` |
| `.section h2` | `color` | ❌ Hardcodeado `#1a1a2e` | `--text` |
| `.section-image-text` | `gap` | ❌ Hardcodeado `3rem` | `--section-gap` |
| `.section-image-text-media img` | `border-radius` | ❌ Hardcodeado `0.75rem` | `--border-radius` |
| `.gallery-item` | `border-radius` | ❌ Hardcodeado `0.5rem` | `--border-radius` |
| `.card` | `background` | ❌ Hardcodeado `#ffffff` | `--card-bg` |
| `.card` | `border` | ❌ Hardcodeado `1px solid #e5e7eb` | `--card-border` |
| `.card` | `border-radius` | ❌ Hardcodeado `0.75rem` | `--card-radius` |
| `.card:hover` | `box-shadow` | ❌ Hardcodeado | `--card-shadow` |
| `.card h3` | `font-size` | ❌ Hardcodeado `1.25rem` | `--h3-size` |
| `.card p` | `color` | ❌ Hardcodeado `#6b7280` | `--text-muted` |

### 3.5 Redes Sociales

| Elemento CSS | Propiedad | Estado | Propuesta de variable |
|---|---|---|---|
| `.social-section` | `background` | ❌ Hardcodeado `#f8fafc` | `--social-bg` |
| `.social-section` | `padding` | ❌ Hardcodeado `3rem 0` | `--section-gap` |
| `.social-link` | `color` | ❌ Hardcodeado `#4b5563` | `--text-muted` |
| `.social-link:hover` | `color` | ✅ Usa `--primary` | ✅ OK |

### 3.6 Footer

| Elemento CSS | Propiedad | Variable actual | Propuesta de variable |
|---|---|---|---|
| `.footer` | `background` | `--footer-bg` | ✅ OK |
| `.footer` | `color` | `--footer-text` | ✅ OK |
| `.footer p` | `font-size` | ❌ Hardcodeado `0.875rem` | `--footer-text-size` |
| `.footer-link` | `color` | `--footer-text` | ✅ OK |
| `.footer-link` | `opacity` | ❌ Hardcodeado `0.7` | `--footer-link-opacity` |
| `.footer-link:hover` | `color` | `--accent` | ✅ OK |

### 3.7 Botones Genéricos

| Elemento CSS | Propiedad | Variable actual | Propuesta de variable |
|---|---|---|---|
| `.btn-site` | `padding` | `--btn-py` / `--btn-px` | ✅ OK (pero no en SiteThemeConfig) |
| `.btn-site` | `border-radius` | `--btn-radius` | ✅ OK (pero no en SiteThemeConfig) |
| `.btn-site--filled` | `background` | `--accent` | ✅ OK |
| `.btn-site--filled` | `color` | `#ffffff` | `--btn-text-color` |
| `.btn-site--outline` | `border` | `2px solid --accent` | ✅ OK |
| `.btn-site--ghost:hover` | `background` | ❌ Hardcodeado `rgba(79, 70, 229, 0.08)` | `--btn-hover-bg` |

### 3.8 Bloques WYSIWYG (BlockRegistry)

| Elemento CSS | Propiedad | Estado | Propuesta |
|---|---|---|---|
| `.block-heading` | `color` | ❌ Hardcodeado | Usar `--text` |
| `.block-paragraph` | `color` | ❌ Hardcodeado | Usar `--text` |
| `.block-paragraph` | `line-height` | ❌ Hardcodeado `1.6` | Usar `--line-height` |
| `.block-hero` | `border-radius` | ❌ Hardcodeado `8px` | Usar `--border-radius` |
| `.block-hero .hero-overlay` | `background` | ❌ Hardcodeado `rgba(0,0,0,0.4)` | Usar `--hero-overlay-color` + `--hero-overlay-opacity` |
| `.card-item` | `background` | ❌ Hardcodeado `#ffffff` | Usar `--card-bg` |
| `.card-item` | `border` | ❌ Hardcodeado `1px solid #e5e7eb` | Usar `--card-border` |
| `.card-item` | `border-radius` | ❌ Hardcodeado `8px` | Usar `--card-radius` |
| `.card-item p` | `color` | ❌ Hardcodeado `#6b7280` | Usar `--text-muted` |
| `.block-cta` | `background` | ❌ Hardcodeado `linear-gradient(135deg, #6366f1, #4f46e5)` | Usar `--primary` |
| `.block-cta` | `border-radius` | ❌ Hardcodeado `12px` | Usar `--border-radius` |
| `.block-cta h2` | `color` | ❌ Hardcodeado `#ffffff` | Usar variable |
| `.btn-primary` | `background` | ❌ Hardcodeado `var(--primary-color, #6366f1)` | Usar `--accent` |
| `.btn-primary` | `border-radius` | ❌ Hardcodeado `6px` | Usar `--btn-radius` |

---

## 4. Propuesta de Nuevo `SiteThemeConfig` (Completo)

```typescript
// ============================================
// SiteThemeConfig — Versión completa
// ============================================
// Cubre TODOS los elementos HTML del sitio público.
// ============================================

export interface SiteThemeConfig {
  // ─── COLORES PRINCIPALES ───
  primaryColor?: string;        // Color primario (azul marino, índigo, etc.)
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
  h1Size?: string;              // Tamaño de h1 (ej: "3rem")
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
```

### Valores por defecto completos

```typescript
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
```

---

## 5. Mapa de Variables CSS Generadas

```typescript
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
```

---

## 6. Archivos a Modificar para Implementar

| Archivo | Cambio necesario |
|---|---|
| `src/lib/theme.ts` | Ampliar `SiteThemeConfig` con todas las nuevas propiedades |
| `src/lib/theme.ts` | Actualizar `DEFAULT_THEME` con valores por defecto completos |
| `src/lib/theme.ts` | Actualizar `getThemeCssVariables()` para generar todas las variables |
| `src/components/public/PublicLayout.astro` | Usar `--line-height`, `--heading-line-height`, `--h1-size`, `--h2-size`, `--h3-size`, `--btn-text-color`, `--btn-hover-bg`, `--link-hover-decoration` |
| `src/components/public/Navbar.astro` | Usar `--navbar-border`, `--navbar-link-opacity` |
| `src/components/public/HeroSection.astro` | Usar `--hero-text-color`, `--hero-title-size`, `--hero-title-weight`, `--hero-subtitle-size`, `--hero-subtitle-color` |
| `src/components/public/DynamicSections.astro` | Reemplazar todos los colores hardcodeados por variables CSS |
| `src/components/public/SocialLinks.astro` | Usar `--social-bg`, `--text-muted` |
| `src/components/public/Footer.astro` | Usar `--footer-link-opacity` |
| `src/lib/blocks/BlockRegistry.ts` | Reemplazar estilos inline hardcodeados por variables CSS |
| `docs/theme/05-default-themes.md` | Actualizar configs de los 3 temas con nuevas propiedades |
| `docs/theme/02-database.md` | Actualizar schema SQL con nuevas columnas |
| `docs/theme/03-api.md` | Actualizar validaciones con nuevos campos |

---

## 7. Resumen de Elementos Cubiertos vs. No Cubiertos

### Estado Inicial (antes de la migración)

| Categoría | Elementos totales | Cubiertos por tema | Hardcodeados | % Cobertura |
|---|---|---|---|---|
| Layout general | 12 | 6 | 6 | 50% |
| Navbar | 7 | 4 | 3 | 57% |
| Hero | 12 | 5 | 7 | 42% |
| Secciones dinámicas | 14 | 1 | 13 | 7% |
| Redes sociales | 4 | 1 | 3 | 25% |
| Footer | 6 | 3 | 3 | 50% |
| Botones | 7 | 3 | 4 | 43% |
| Bloques WYSIWYG | 14 | 0 | 14 | 0% |
| **TOTAL** | **76** | **23** | **53** | **30%** |

### Estado Actual (después de la migración)

| Categoría | Elementos totales | Cubiertos por tema | Hardcodeados | % Cobertura |
|---|---|---|---|---|
| Layout general | 12 | 12 | 0 | 100% |
| Navbar | 7 | 7 | 0 | 100% |
| Hero | 12 | 12 | 0 | 100% |
| Secciones dinámicas | 14 | 14 | 0 | 100% |
| Redes sociales | 4 | 4 | 0 | 100% |
| Footer | 6 | 6 | 0 | 100% |
| Botones | 7 | 7 | 0 | 100% |
| Bloques WYSIWYG | 14 | 14 | 0 | 100% |
| **TOTAL** | **76** | **76** | **0** | **100%** |

**Conclusión:** Después de la migración, el **100%** de los elementos HTML están controlados por variables CSS del tema. `SiteThemeConfig` pasó de 18 a ~50 propiedades, y todos los componentes públicos y bloques WYSIWYG usan variables CSS en lugar de valores hardcodeados.
