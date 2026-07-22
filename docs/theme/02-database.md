# Base de Datos — D1 (Cloudflare)

> **Documento:** 02-database.md
> **Propósito:** Esquema SQL, seed data, migraciones y operaciones comunes.

---

## 1. Esquema SQL

### Tabla: `default_themes`

```sql
-- ============================================
-- Default Themes
-- Almacena los temas prediseñados del sistema.
-- Solo accesible via API con verificación de superadmin.
-- ============================================
CREATE TABLE IF NOT EXISTS default_themes (
  id            TEXT PRIMARY KEY,                -- Identificador único (ej: 'classic', 'modern')
  name          TEXT NOT NULL,                   -- Nombre visible (ej: 'Clásico')
  description   TEXT DEFAULT '',                 -- Descripción corta
  preview_image TEXT DEFAULT '',                 -- URL de imagen de previsualización
  category      TEXT DEFAULT 'general',          -- Categoría (general, business, portfolio, blog, etc.)
  is_active     INTEGER DEFAULT 1,               -- 1 = visible, 0 = oculto (soft delete)
  sort_order    INTEGER DEFAULT 0,               -- Orden de visualización
  created_at    TEXT DEFAULT (datetime('now')),   -- Fecha de creación
  updated_at    TEXT DEFAULT (datetime('now')),   -- Fecha de última modificación
  config        TEXT NOT NULL                    -- JSON con la configuración completa del tema
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_default_themes_active ON default_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_default_themes_category ON default_themes(category);
CREATE INDEX IF NOT EXISTS idx_default_themes_sort ON default_themes(sort_order);
```

### Estructura del campo `config` (JSON)

El campo `config` almacena un objeto JSON con la misma estructura que usa `SiteThemeConfig` en `src/lib/theme.ts`:

```typescript
interface SiteThemeConfig {
  // Colores principales
  primaryColor: string;        // #RRGGBB
  secondaryColor: string;
  accentColor: string;

  // Fondo y texto
  bgColor: string;
  textColor: string;
  textMutedColor: string;

  // Componentes
  navbarBg: string;
  navbarText: string;
  navbarBorder: string;
  footerBg: string;
  footerText: string;
  footerLinkOpacity: number;   // 0-1
  cardBg: string;
  cardBorder: string;
  cardRadius: number;          // 0-24
  cardShadow: string;
  sectionAltBg: string;
  socialBg: string;

  // Tipografía
  fontFamily: string;
  fontHeadings: string;
  fontSizeBase: number;        // 14-20
  fontWeight: string;          // "300" | "400" | "500" | "600" | "700"
  lineHeight: number;          // 1.0-2.0
  headingLineHeight: number;   // 1.0-2.0
  h1Size: string;              // ej: "2.5rem"
  h2Size: string;              // ej: "2rem"
  h3Size: string;              // ej: "1.25rem"

  // Layout
  layout: string;              // "centered" | "full-width"
  maxWidth: number;            // 800-1400
  sectionGap: number;          // 32-128
  containerPadding: number;    // 8-48
  borderRadius: number;        // 0-24

  // Hero
  heroHeight: string;          // ej: "450px"
  heroAlign: string;           // "left" | "center" | "right"
  heroOverlayColor: string;
  heroOverlayOpacity: number;  // 0-1
  heroTextColor: string;
  heroTitleSize: string;       // ej: "3rem"
  heroTitleWeight: string;     // "400" | "500" | "600" | "700" | "800"
  heroSubtitleSize: string;    // ej: "1.25rem"
  heroSubtitleColor: string;

  // Botones
  btnStyle: string;            // "filled" | "outline" | "ghost"
  btnBorderRadius: number;     // 0-24
  btnPaddingX: number;         // 8-40
  btnPaddingY: number;         // 4-20
  btnTextColor: string;
  btnHoverBg: string;

  // Enlaces
  linkHoverDecoration: string; // "underline" | "none"
  navbarLinkOpacity: number;   // 0-1
}
```

---

## 2. Seed Data — Los 3 Temas Iniciales

### Script de seed: `scripts/seed-default-themes.mjs`

```javascript
// scripts/seed-default-themes.mjs
// Ejecutar: node scripts/seed-default-themes.mjs
// O: npx wrangler d1 execute mi-web-personalizable-db --file=./scripts/seed-default-themes.sql

const THEMES = [
  {
    id: "classic",
    name: "Clásico",
    description: "Estilo tradicional y elegante con tipografía serif. Ideal para negocios, despachos y sitios corporativos.",
    preview_image: "/images/themes/classic-preview.png",
    category: "business",
    sort_order: 1,
    config: {
      primaryColor: "#1e3a5f",
      secondaryColor: "#3b82f6",
      accentColor: "#2563eb",
      bgColor: "#fafaf9",
      textColor: "#292524",
      textMutedColor: "#78716c",
      navbarBg: "#ffffff",
      navbarText: "#292524",
      footerBg: "#1e3a5f",
      footerText: "#fafaf9",
      fontFamily: "'Merriweather', Georgia, serif",
      fontHeadings: "'Playfair Display', Georgia, serif",
      fontSizeBase: 17,
      fontWeight: "400",
      layout: "centered",
      maxWidth: 1100,
      sectionGap: 64,
      borderRadius: 4,
      containerPadding: 24,
      heroHeight: "medium",
      heroAlign: "center",
      heroOverlayColor: "#000000",
      heroOverlayOpacity: 35,
      btnBorderRadius: 4,
      btnPaddingX: 28,
      btnPaddingY: 12,
      btnStyle: "filled"
    }
  },
  {
    id: "modern",
    name: "Moderno",
    description: "Diseño contemporáneo con colores vibrantes. Perfecto para startups, tech y portfolios creativos.",
    preview_image: "/images/themes/modern-preview.png",
    category: "general",
    sort_order: 2,
    config: {
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#4f46e5",
      bgColor: "#ffffff",
      textColor: "#1a1a2e",
      textMutedColor: "#6b7280",
      navbarBg: "#ffffff",
      navbarText: "#1a1a2e",
      footerBg: "#1e1b4b",
      footerText: "#e0e7ff",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontHeadings: "'Poppins', system-ui, sans-serif",
      fontSizeBase: 16,
      fontWeight: "400",
      layout: "full-width",
      maxWidth: 1200,
      sectionGap: 80,
      borderRadius: 8,
      containerPadding: 24,
      heroHeight: "large",
      heroAlign: "center",
      heroOverlayColor: "#000000",
      heroOverlayOpacity: 40,
      btnBorderRadius: 8,
      btnPaddingX: 24,
      btnPaddingY: 14,
      btnStyle: "filled"
    }
  },
  {
    id: "dark",
    name: "Oscuro",
    description: "Tema oscuro moderno con acentos brillantes. Ideal para portfolios, gaming y sitios con personalidad.",
    preview_image: "/images/themes/dark-preview.png",
    category: "portfolio",
    sort_order: 3,
    config: {
      primaryColor: "#818cf8",
      secondaryColor: "#a78bfa",
      accentColor: "#6366f1",
      bgColor: "#0f172a",
      textColor: "#e2e8f0",
      textMutedColor: "#94a3b8",
      navbarBg: "#1e293b",
      navbarText: "#e2e8f0",
      footerBg: "#020617",
      footerText: "#94a3b8",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontHeadings: "'Montserrat', system-ui, sans-serif",
      fontSizeBase: 16,
      fontWeight: "300",
      layout: "centered",
      maxWidth: 1200,
      sectionGap: 72,
      borderRadius: 10,
      containerPadding: 24,
      heroHeight: "medium",
      heroAlign: "center",
      heroOverlayColor: "#000000",
      heroOverlayOpacity: 50,
      btnBorderRadius: 10,
      btnPaddingX: 28,
      btnPaddingY: 14,
      btnStyle: "filled"
    }
  }
];
```

### Comando SQL directo

```sql
-- Insertar los 3 temas iniciales
INSERT OR REPLACE INTO default_themes (id, name, description, category, sort_order, config) VALUES
('classic', 'Clásico', 'Estilo tradicional y elegante con tipografía serif.', 'business', 1, '{"primaryColor":"#1e3a5f","secondaryColor":"#3b82f6","accentColor":"#2563eb","bgColor":"#fafaf9","textColor":"#292524","textMutedColor":"#78716c","navbarBg":"#ffffff","navbarText":"#292524","footerBg":"#1e3a5f","footerText":"#fafaf9","fontFamily":"''Merriweather'', Georgia, serif","fontHeadings":"''Playfair Display'', Georgia, serif","fontSizeBase":17,"fontWeight":"400","layout":"centered","maxWidth":1100,"sectionGap":64,"borderRadius":4,"containerPadding":24,"heroHeight":"medium","heroAlign":"center","heroOverlayColor":"#000000","heroOverlayOpacity":35,"btnBorderRadius":4,"btnPaddingX":28,"btnPaddingY":12,"btnStyle":"filled"}'),

('modern', 'Moderno', 'Diseño contemporáneo con colores vibrantes.', 'general', 2, '{"primaryColor":"#6366f1","secondaryColor":"#8b5cf6","accentColor":"#4f46e5","bgColor":"#ffffff","textColor":"#1a1a2e","textMutedColor":"#6b7280","navbarBg":"#ffffff","navbarText":"#1a1a2e","footerBg":"#1e1b4b","footerText":"#e0e7ff","fontFamily":"''Inter'', system-ui, sans-serif","fontHeadings":"''Poppins'', system-ui, sans-serif","fontSizeBase":16,"fontWeight":"400","layout":"full-width","maxWidth":1200,"sectionGap":80,"borderRadius":8,"containerPadding":24,"heroHeight":"large","heroAlign":"center","heroOverlayColor":"#000000","heroOverlayOpacity":40,"btnBorderRadius":8,"btnPaddingX":24,"btnPaddingY":14,"btnStyle":"filled"}'),

('dark', 'Oscuro', 'Tema oscuro moderno con acentos brillantes.', 'portfolio', 3, '{"primaryColor":"#818cf8","secondaryColor":"#a78bfa","accentColor":"#6366f1","bgColor":"#0f172a","textColor":"#e2e8f0","textMutedColor":"#94a3b8","navbarBg":"#1e293b","navbarText":"#e2e8f0","footerBg":"#020617","footerText":"#94a3b8","fontFamily":"''Inter'', system-ui, sans-serif","fontHeadings":"''Montserrat'', system-ui, sans-serif","fontSizeBase":16,"fontWeight":"300","layout":"centered","maxWidth":1200,"sectionGap":72,"borderRadius":10,"containerPadding":24,"heroHeight":"medium","heroAlign":"center","heroOverlayColor":"#000000","heroOverlayOpacity":50,"btnBorderRadius":10,"btnPaddingX":28,"btnPaddingY":14,"btnStyle":"filled"}');
```

---

## 3. Operaciones Comunes (SQL)

### Listar temas activos ordenados

```sql
SELECT id, name, description, preview_image, category, sort_order, config
FROM default_themes
WHERE is_active = 1
ORDER BY sort_order ASC, name ASC;
```

### Obtener un tema por ID

```sql
SELECT * FROM default_themes WHERE id = ? AND is_active = 1;
```

### Crear un nuevo tema

```sql
INSERT INTO default_themes (id, name, description, preview_image, category, sort_order, config)
VALUES (?, ?, ?, ?, ?, ?, ?);
```

### Actualizar un tema

```sql
UPDATE default_themes
SET name = ?, description = ?, preview_image = ?, category = ?, sort_order = ?, config = ?, updated_at = datetime('now')
WHERE id = ?;
```

### Soft delete (ocultar)

```sql
UPDATE default_themes SET is_active = 0, updated_at = datetime('now') WHERE id = ?;
```

### Hard delete (eliminar permanentemente)

```sql
DELETE FROM default_themes WHERE id = ?;
```

---

## 4. Migraciones

### Estrategia

- Las migraciones se aplican manualmente con `wrangler d1 execute`
- Cada migración es un archivo SQL numerado: `001-create-default-themes.sql`
- Se mantiene un registro en `docs/theme/migrations/`

### Migración 001: Crear tabla inicial

```sql
-- migrations/001-create-default-themes.sql
CREATE TABLE IF NOT EXISTS default_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  preview_image TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  config TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_default_themes_active ON default_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_default_themes_category ON default_themes(category);
CREATE INDEX IF NOT EXISTS idx_default_themes_sort ON default_themes(sort_order);
```

### Cómo aplicar una migración

```bash
# Aplicar migración
npx wrangler d1 execute mi-web-personalizable-db --file=./migrations/001-create-default-themes.sql

# Verificar
npx wrangler d1 execute mi-web-personalizable-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 5. Consideraciones de Rendimiento

- La tabla `default_themes` tendrá pocos rows (decenas, no miles) → índices simples son suficientes
- El campo `config` puede ser grande (~1KB), pero se lee completo siempre
- Para el futuro: si hay muchos temas, considerar paginación en el API
- Cachear la lista de temas en el frontend con SWR (stale-while-revalidate) para evitar llamadas repetitivas
