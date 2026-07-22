# Escalabilidad — Más Temas, Categorías y Variantes

> **Documento:** 07-scaling.md
> **Propósito:** Describir cómo escalar el sistema de temas para soportar más temas, categorías, variantes y personalización avanzada.

---

## 1. Escenario Actual vs. Futuro

| Aspecto | Actual (v1) | Futuro (v2/v3) |
|---------|-------------|----------------|
| **Temas** | 3 | 20+ |
| **Categorías** | 3 (general, business, portfolio) | 8+ (blog, landing, ecommerce, etc.) |
| **Variantes por tema** | 1 | Múltiples (claro/oscuro, compact/espaciado) |
| **Personalización** | Solo colores/fuentes/layout | + CSS custom, + JS snippets |
| **Usuarios** | Decenas | Cientos/miles |

---

## 2. Categorías de Temas

### 2.1 Categorías actuales

| Categoría | ID | Descripción |
|-----------|----|-------------|
| General | `general` | Temas versátiles para cualquier propósito |
| Negocios | `business` | Temas profesionales y corporativos |
| Portfolio | `portfolio` | Temas creativos para mostrar trabajo |

### 2.2 Categorías futuras propuestas

| Categoría | ID | Descripción |
|-----------|----|-------------|
| Blog | `blog` | Optimizados para lectura y contenido |
| Landing Page | `landing` | Enfocados en conversión y CTAs |
| E-commerce | `ecommerce` | Para tiendas online |
| One Page | `onepage` | Sitios de una sola página |
| Restaurant | `restaurant` | Para restaurantes y cafeterías |
| Education | `education` | Para cursos y plataformas educativas |
| Event | `event` | Para eventos, conferencias, bodas |
| Personal | `personal` | CV, bio, link-in-bio |

### 2.3 Implementación de categorías

```sql
-- Tabla de categorías (opcional, para gestión)
CREATE TABLE IF NOT EXISTS theme_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

-- Seed de categorías
INSERT OR REPLACE INTO theme_categories (id, name, description, sort_order) VALUES
('general', 'General', 'Temas versátiles para cualquier propósito', 1),
('business', 'Negocios', 'Temas profesionales y corporativos', 2),
('portfolio', 'Portfolio', 'Temas creativos para mostrar trabajo', 3),
('blog', 'Blog', 'Optimizados para lectura y contenido', 4),
('landing', 'Landing Page', 'Enfocados en conversión y CTAs', 5),
('ecommerce', 'E-commerce', 'Para tiendas online', 6),
('onepage', 'One Page', 'Sitios de una sola página', 7);
```

### 2.4 Filtrado por categoría en frontend

```typescript
// Añadir filtro de categorías en la UI
async function renderDefaultThemes(category?: string): Promise<void> {
  const themes = await loadDefaultThemes();

  let filtered = themes;
  if (category) {
    filtered = themes.filter((t) => t.category === category);
  }

  // Renderizar filtros
  renderCategoryFilters(themes);
  // Renderizar tarjetas filtradas
  renderThemeCards(filtered);
}

function renderCategoryFilters(themes: DefaultTheme[]): void {
  const categories = [...new Set(themes.map((t) => t.category))];
  // Renderizar tabs o dropdown con categorías
}
```

---

## 3. Variantes de Tema

### 3.1 Concepto

Un mismo tema puede tener variantes (claro/oscuro, compacto/espaciado, etc.) sin crear un tema completamente nuevo.

### 3.2 Estructura en D1

```sql
-- Añadir columna variant_group a default_themes
ALTER TABLE default_themes ADD COLUMN variant_group TEXT DEFAULT '';

-- O crear tabla separada para variantes
CREATE TABLE IF NOT EXISTS theme_variants (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  name TEXT NOT NULL,           -- "Claro", "Oscuro", "Compacto"
  description TEXT DEFAULT '',
  config TEXT NOT NULL,         -- JSON con diferencias respecto al base
  is_default INTEGER DEFAULT 0,
  FOREIGN KEY (theme_id) REFERENCES default_themes(id)
);
```

### 3.3 Ejemplo: Tema "Moderno" con variantes

```
Moderno
├── Claro (default) → config completa
├── Oscuro → solo diferencias (bgColor, textColor, etc.)
└── Compacto → solo diferencias (sectionGap, padding, etc.)
```

### 3.4 Merge de config base + variante

```typescript
function mergeThemeWithVariant(baseConfig: ThemeConfig, variantConfig: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...baseConfig,
    ...variantConfig,
  };
}
```

---

## 4. Personalización Avanzada

### 4.1 CSS Custom

Permitir que los usuarios añadan CSS personalizado además de la configuración del tema.

```typescript
interface ThemeConfig {
  // ... campos existentes ...

  // NUEVOS CAMPOS
  customCSS?: string;           // CSS personalizado del usuario
  customFonts?: string[];       // Google Fonts adicionales
  customColors?: Record<string, string>;  // Variables CSS adicionales
}
```

### 4.2 Google Fonts dinámicas

```typescript
function loadGoogleFonts(fonts: string[]): void {
  const families = fonts
    .map((f) => f.replace(/\s+/g, "+"))
    .join("|");

  if (families) {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
}
```

### 4.3 Variables CSS globales

```typescript
function applyThemeToDocument(config: ThemeConfig): void {
  const root = document.documentElement;

  root.style.setProperty("--color-primary", config.primaryColor);
  root.style.setProperty("--color-secondary", config.secondaryColor);
  root.style.setProperty("--color-accent", config.accentColor);
  root.style.setProperty("--color-bg", config.bgColor);
  root.style.setProperty("--color-text", config.textColor);
  root.style.setProperty("--font-family", config.fontFamily);
  root.style.setProperty("--max-width", config.maxWidth + "px");
  // ... etc ...

  // CSS personalizado
  if (config.customCSS) {
    const style = document.createElement("style");
    style.textContent = config.customCSS;
    document.head.appendChild(style);
  }
}
```

---

## 5. Rendimiento con Muchos Temas

### 5.1 Paginación en API

```typescript
// GET /api/admin/themes?page=1&limit=10&category=business
export async function listActiveThemesPaginated(
  page: number = 1,
  limit: number = 10,
  category?: string
): Promise<{ themes: DefaultTheme[]; total: number }> {
  const db = getD1Client();
  const offset = (page - 1) * limit;

  let whereClause = "WHERE is_active = 1";
  const params: any[] = [];

  if (category) {
    whereClause += " AND category = ?";
    params.push(category);
  }

  // Total count
  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM default_themes ${whereClause}`
  ).bind(...params).first();

  // Paginated results
  const result = await db.prepare(
    `SELECT * FROM default_themes ${whereClause} ORDER BY sort_order ASC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return {
    themes: result.results.map(parseThemeRow),
    total: countResult?.total || 0,
  };
}
```

### 5.2 Caché en el frontend

```typescript
// Cache con TTL de 5 minutos
const themesCache = {
  data: null as DefaultTheme[] | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutos
};

async function loadDefaultThemes(): Promise<DefaultTheme[]> {
  const now = Date.now();

  if (themesCache.data && (now - themesCache.timestamp) < themesCache.ttl) {
    return themesCache.data;
  }

  // ... fetch from API ...
  themesCache.data = result.data;
  themesCache.timestamp = now;

  return themesCache.data;
}
```

### 5.3 Lazy loading de previews

```typescript
// Cargar imágenes de preview solo cuando son visibles
function setupLazyLoading(): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || "";
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll(".theme-card-preview img[data-src]").forEach((img) => {
    observer.observe(img);
  });
}
```

---

## 6. Estrategia de Versionado de Temas

### 6.1 Versionado interno

```sql
ALTER TABLE default_themes ADD COLUMN version INTEGER DEFAULT 1;
```

Cada vez que un superadmin edita un tema, la versión incrementa.

### 6.2 Compatibilidad hacia atrás

Cuando un tema se actualiza, los sitios que ya lo copiaron NO se ven afectados (porque es una copia, no una referencia).

### 6.3 Notificación de nuevas versiones

```typescript
// Comparar versión del tema copiado vs. versión actual en D1
async function checkThemeUpdates(siteDomain: string): Promise<void> {
  const siteData = await getDocument("sites", siteDomain);
  const copiedThemeVersion = siteData.data?.theme?.version || 0;

  const currentTheme = await getThemeById(siteData.data?.theme?.sourceThemeId);
  if (currentTheme && currentTheme.version > copiedThemeVersion) {
    showNotification(
      `Hay una nueva versión del tema "${currentTheme.name}". ` +
      `<a href="#" onclick="applyThemeUpdate('${currentTheme.id}')">Actualizar</a>`
    );
  }
}
```

---

## 7. Marketplace de Temas (Futuro)

### 7.1 Concepto

Un marketplace donde:
- Superadmin crea temas oficiales
- Usuarios avanzados pueden crear y compartir temas
- Los temas pueden tener ratings y reviews

### 7.2 Tablas adicionales

```sql
-- Temas de la comunidad
CREATE TABLE IF NOT EXISTS community_themes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  config TEXT NOT NULL,
  downloads INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'pending'  -- pending | approved | rejected
);

-- Reviews
CREATE TABLE IF NOT EXISTS theme_reviews (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 7.3 Consideraciones

- **Moderación**: Los temas de la comunidad deben ser aprobados por superadmin
- **Seguridad**: Validar que el config no contenga código malicioso
- **Licencias**: Definir si los temas son gratuitos, premium, o de código abierto
- **Almacenamiento**: Los temas de la comunidad pueden ir en una tabla separada o en el mismo D1

---

## 8. Roadmap de Escalabilidad

| Fase | Features | Prioridad |
|------|----------|-----------|
| **v1** | 3 temas, CRUD superadmin, copia a sitio | Alta |
| **v2** | Categorías, filtros, 10+ temas | Media |
| **v3** | Variantes (claro/oscuro), CSS custom | Media |
| **v4** | Marketplace, comunidad, ratings | Baja |
| **v5** | IA: generación automática de temas | Baja |
