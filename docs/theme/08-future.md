# Mejoras Futuras, Optimizaciones e Ideas

> **Documento:** 08-future.md
> **Propósito:** Recopilar ideas, mejoras, optimizaciones y features futuros para el sistema de temas.

---

## 1. 🎨 Generación de Temas con IA

### 1.1 Descripción

Usar una API de IA (OpenAI, Claude, etc.) para generar temas automáticamente a partir de una descripción textual.

### 1.2 Flujo

```
Usuario: "Quiero un tema elegante, azul marino y dorado, para un bufete de abogados"

→ IA genera:
  - Paleta de colores coherente
  - Sugerencia de tipografía
  - Config completa del tema
  - Nombre y descripción

→ Superadmin revisa y publica
```

### 1.3 Prompt de ejemplo

```typescript
async function generateThemeWithAI(description: string): Promise<Partial<DefaultTheme>> {
  const prompt = `
    Genera un tema para un sitio web con esta descripción: "${description}"

    Responde SOLO con un JSON válido con esta estructura:
    {
      "name": "Nombre del tema",
      "description": "Descripción corta",
      "category": "general|business|portfolio|blog|landing",
      "config": {
        "primaryColor": "#hex",
        "secondaryColor": "#hex",
        "accentColor": "#hex",
        "bgColor": "#hex",
        "textColor": "#hex",
        "textMutedColor": "#hex",
        "navbarBg": "#hex",
        "navbarText": "#hex",
        "footerBg": "#hex",
        "footerText": "#hex",
        "fontFamily": "fuente recomendada",
        "fontHeadings": "fuente para títulos",
        "fontSizeBase": 16,
        "fontWeight": "400",
        "layout": "centered|full-width",
        "maxWidth": 1200,
        "sectionGap": 64,
        "borderRadius": 8,
        "containerPadding": 24,
        "heroHeight": "medium",
        "heroAlign": "center",
        "heroOverlayColor": "#000000",
        "heroOverlayOpacity": 40,
        "btnBorderRadius": 8,
        "btnPaddingX": 24,
        "btnPaddingY": 12,
        "btnStyle": "filled"
      }
    }
  `;

  // Llamar a API de IA
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}
```

### 1.4 Consideraciones

- **Costo**: Cada generación cuesta ~$0.01-0.03 en API calls
- **Calidad**: Revisión humana necesaria (superadmin)
- **Cache**: Guardar generaciones para reutilizar
- **UX**: Botón "Generar con IA" en el panel de superadmin

---

## 2. 🔄 Sincronización Bidireccional

### 2.1 Problema actual

Cuando un admin modifica colores/fuentes en el formulario, los cambios solo existen en el frontend hasta que guarda.

### 2.2 Mejora propuesta

Auto-guardado con debounce:

```typescript
let autoSaveTimer: ReturnType<typeof setTimeout>;

function setupAutoSave(siteDomain: string): void {
  const form = document.getElementById("theme-form");
  if (!form) return;

  form.addEventListener("input", () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      autoSaveTheme(siteDomain);
    }, 2000); // 2 segundos después del último cambio
  });
}

async function autoSaveTheme(siteDomain: string): Promise<void> {
  const data = collectThemeData();
  await updateDocument("sites/" + siteDomain + "/settings", "theme", data);
  showFeedback("success", "Auto-guardado ✓", 1500);
}
```

### 2.3 Indicador visual

```
[💾 Guardado automáticamente hace 5 segundos]
```

---

## 3. 🎭 Modo Comparación

### 3.1 Descripción

Permitir al admin comparar dos temas lado a lado antes de decidir.

### 3.2 UI

```
┌─────────────────────┐  ┌─────────────────────┐
│   TEMA ACTUAL       │  │   TEMA SELECCIONADO │
│                     │  │                     │
│  [Preview actual]   │  │  [Preview del nuevo]│
│                     │  │                     │
│  Clásico            │  │  Moderno            │
│                     │  │                     │
│  [Mantener actual]  │  │  [Aplicar este]     │
└─────────────────────┘  └─────────────────────┘
```

### 3.3 Implementación

```typescript
async function compareThemes(currentThemeId: string, newThemeId: string): Promise<void> {
  const current = await loadCurrentTheme();
  const newTheme = await getThemeById(newThemeId);

  // Renderizar dos previews lado a lado
  renderComparisonView(current, newTheme);
}
```

---

## 4. 📱 Temas Responsive por Dispositivo

### 4.1 Concepto

Configuraciones de tema diferentes para desktop, tablet y mobile.

### 4.2 Estructura

```typescript
interface ThemeConfig {
  // ... campos actuales ...

  // Configuraciones específicas por dispositivo
  mobile?: Partial<ThemeConfig>;
  tablet?: Partial<ThemeConfig>;
}
```

### 4.3 Ejemplo

```json
{
  "primaryColor": "#6366f1",
  "fontSizeBase": 16,
  "maxWidth": 1200,
  "sectionGap": 80,

  "mobile": {
    "fontSizeBase": 14,
    "sectionGap": 40,
    "containerPadding": 16
  },

  "tablet": {
    "fontSizeBase": 15,
    "sectionGap": 60
  }
}
```

### 4.4 Merge automático

```typescript
function getConfigForDevice(config: ThemeConfig, device: "desktop" | "tablet" | "mobile"): ThemeConfig {
  if (device === "desktop") return config;

  const deviceConfig = config[device];
  if (!deviceConfig) return config;

  return { ...config, ...deviceConfig };
}
```

---

## 5. 🧪 Testing Automatizado de Temas

### 5.1 Tests visuales

```typescript
// tests/themes/visual.test.ts
import { describe, it, expect } from "vitest";
import { themes } from "../../src/lib/d1/themes";

describe("Default Themes - Visual Validation", () => {
  it("should have valid hex colors", () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;

    for (const theme of themes) {
      expect(theme.config.primaryColor).toMatch(hexRegex);
      expect(theme.config.secondaryColor).toMatch(hexRegex);
      expect(theme.config.accentColor).toMatch(hexRegex);
      expect(theme.config.bgColor).toMatch(hexRegex);
      expect(theme.config.textColor).toMatch(hexRegex);
    }
  });

  it("should have sufficient contrast", () => {
    for (const theme of themes) {
      const contrast = getContrastRatio(
        theme.config.textColor,
        theme.config.bgColor
      );
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("should have valid font sizes", () => {
    for (const theme of themes) {
      expect(theme.config.fontSizeBase).toBeGreaterThanOrEqual(14);
      expect(theme.config.fontSizeBase).toBeLessThanOrEqual(20);
    }
  });
});
```

### 5.2 Screenshot testing

```typescript
// Usar Playwright para capturar screenshots de cada tema
import { chromium } from "playwright";

async function captureThemeScreenshots(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const theme of themes) {
    await page.goto(`http://localhost:4321/admin/theme?preview=${theme.id}`);
    await page.screenshot({
      path: `./screenshots/themes/${theme.id}.png`,
      fullPage: true,
    });
  }

  await browser.close();
}
```

---

## 6. 📊 Analytics de Temas

### 6.1 Qué medir

- **Temas más populares**: cuántos sitios usan cada tema
- **Tasa de conversión**: qué temas se copian más vs. se ven
- **Personalización post-copia**: qué campos modifican más los admins
- **Abandono**: cuántos admins vuelven al tema default después de personalizar

### 6.2 Tabla de analytics

```sql
CREATE TABLE IF NOT EXISTS theme_analytics (
  id TEXT PRIMARY KEY,
  theme_id TEXT NOT NULL,
  site_domain TEXT NOT NULL,
  action TEXT NOT NULL,         -- 'view' | 'copy' | 'customize' | 'revert'
  details TEXT DEFAULT '',      -- JSON con detalles adicionales
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (theme_id) REFERENCES default_themes(id)
);
```

### 6.3 Dashboard para superadmin

```
┌─────────────────────────────────────────────┐
│  📊 Analytics de Temas                      │
│                                             │
│  Tema más popular: Moderno (45 sitios)      │
│  Tema con más copias: Clásico (120 copias)  │
│  Campo más modificado: primaryColor (67%)   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  Gráfico de popularidad             │    │
│  │  ████████ Moderno                   │    │
│  │  ██████ Clásico                     │    │
│  │  ████ Oscuro                        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## 7. 🎛️ Editor Visual Drag & Drop

### 7.1 Concepto

Un editor visual donde el admin pueda:
- Arrastrar secciones para reordenar
- Hacer clic en elementos para editarlos directamente
- Ver cambios en tiempo real

### 7.2 Tecnologías posibles

- **CSS Grid + Drag & Drop API** (nativo)
- **React DnD** o **dnd-kit** (si se migra a React)
- **Fabric.js** para canvas interactivo

### 7.3 Integración con temas

```typescript
// El tema define los estilos base
// El editor visual permite reordenar/ocultar secciones
// La configuración resultante se guarda como JSON

interface VisualEditorState {
  themeId: string;
  sections: {
    id: string;
    type: "hero" | "content" | "gallery" | "contact" | "footer";
    visible: boolean;
    order: number;
    customStyles?: Partial<ThemeConfig>;
  }[];
}
```

---

## 8. 🏪 Temas Premium

### 8.1 Modelo de negocio

| Tipo | Precio | Features |
|------|--------|----------|
| Gratuito | $0 | Temas básicos, personalización limitada |
| Premium | $9.99/mes | Temas exclusivos, CSS custom, soporte prioritario |
| Enterprise | $29.99/mes | Todo lo anterior + white label + API access |

### 8.2 Implementación

```sql
ALTER TABLE default_themes ADD COLUMN price REAL DEFAULT 0;
ALTER TABLE default_themes ADD COLUMN is_premium INTEGER DEFAULT 0;
```

### 8.3 Restricciones

```typescript
async function canUseTheme(userId: string, themeId: string): Promise<boolean> {
  const theme = await getThemeById(themeId);
  if (!theme?.is_premium) return true; // Gratuito

  const subscription = await getUserSubscription(userId);
  return subscription?.status === "active";
}
```

---

## 9. 🔌 Plugins de Tema

### 9.1 Concepto

Pequeños módulos que extienden la funcionalidad de un tema:

- **Plugin de galería**: Añade un slider de imágenes
- **Plugin de testimonios**: Añade sección de reviews
- **Plugin de stats**: Añade contadores animados
- **Plugin de FAQ**: Añade acordeón de preguntas frecuentes

### 9.2 Estructura

```typescript
interface ThemePlugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, any>;
  html: string;       // Template HTML
  css: string;        // Estilos del plugin
  js: string;         // JavaScript del plugin
}
```

### 9.3 Integración

```typescript
// Los plugins se almacenan en D1
// Se activan/desactivan desde el panel de admin
// Se renderizan en el sitio público según la configuración

async function renderActivePlugins(siteDomain: string): Promise<string> {
  const site = await getDocument("sites", siteDomain);
  const activePlugins = site.data?.plugins || [];

  let html = "";
  for (const pluginId of activePlugins) {
    const plugin = await getPlugin(pluginId);
    html += plugin.html;
  }

  return html;
}
```

---

## 10. 🚀 Optimizaciones de Rendimiento

### 10.1 Server-side rendering de temas

En lugar de aplicar el tema con JavaScript en el cliente, renderizar las variables CSS en el servidor:

```astro
---
// En el layout principal del sitio público
const theme = await getSiteTheme(Astro.url.hostname);
---

<style is:global>
  :root {
    --color-primary: {theme.primaryColor};
    --color-secondary: {theme.secondaryColor};
    --color-accent: {theme.accentColor};
    --color-bg: {theme.bgColor};
    --color-text: {theme.textColor};
    --font-family: {theme.fontFamily};
    --max-width: {theme.maxWidth}px;
  }
</style>
```

### 10.2 Critical CSS inline

Extraer el CSS crítico del tema e inyectarlo inline en el `<head>` para evitar FOUC (Flash of Unstyled Content).

### 10.3 Preconnect a Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

### 10.4 Lazy loading de secciones

Las secciones que no están en el viewport inicial se cargan con IntersectionObserver.

---

## 11. 📝 Ideas Sueltas

| # | Idea | Impacto | Esfuerzo |
|---|------|---------|----------|
| 1 | **Temas estacionales**: Temas que cambian automáticamente según la época del año (Navidad, Halloween, etc.) | Medio | Alto |
| 2 | **Temas A/B testing**: Probar diferentes temas en el mismo sitio y medir conversión | Alto | Muy alto |
| 3 | **Exportar tema como ZIP**: Descargar el tema completo (HTML+CSS+JS) para usar fuera de la plataforma | Bajo | Medio |
| 4 | **Compartir tema personalizado**: Un admin puede compartir su tema modificado como plantilla | Medio | Alto |
| 5 | **Temas con audio**: Temas que incluyen música de fondo o efectos de sonido | Bajo | Medio |
| 6 | **Temas animados**: Fondos con partículas, parallax, micro-interacciones | Medio | Alto |
| 7 | **Integración con Unsplash**: Imágenes de fondo automáticas según la temática | Medio | Bajo |
| 8 | **Modo daltónico**: Paletas optimizadas para daltonismo | Alto | Bajo |
| 9 | **Temas para impresión**: Versión optimizada para imprimir el sitio | Bajo | Bajo |
| 10 | **Historial de versiones del tema**: Poder revertir cambios anteriores | Alto | Medio |

---

## 12. Priorización para Próximos Sprints

| Sprint | Features |
|--------|----------|
| **Sprint 1** | Implementación base (v1): 3 temas, CRUD, copia |
| **Sprint 2** | Auto-guardado, modo comparación, analytics básicos |
| **Sprint 3** | Categorías, filtros, 10+ temas, variantes claro/oscuro |
| **Sprint 4** | CSS custom, editor visual básico, testing automatizado |
| **Sprint 5** | IA generación, temas responsive por dispositivo |
| **Sprint 6** | Marketplace, plugins, temas premium |
