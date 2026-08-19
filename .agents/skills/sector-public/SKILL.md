---
name: sector-public
description: Agente de la Sección Pública. Se activa cuando la tarea involucra páginas, componentes, layout o lógica del frontend público (index, [...slug], PublicLayout, Navbar, Footer, Hero, bloques dinámicos, blog, SEO).
---

# 🌐 Protocolo del Agente Sector Public

Cuando el orquestador active este skill, seguir esta ruta directa de 5 pasos:

---

## ⚡ Ruta Directa de Trabajo en 5 Pasos

### 1. Diagnóstico Inicial
Leer el contexto proporcionado por el orquestador y verificar el estado actual:
- Leer `TASK_LIST.md` para entender el progreso del sector public
- Leer `.agents/skills/sector-public/TASK_LIST.md` para tareas pendientes específicas
- Identificar qué archivos están involucrados (solo del sector public)

### 2. Análisis de Archivos del Sector
Antes de tocar código, leer los archivos relevantes del sector:
- **Páginas:** `src/pages/index.astro`, `src/pages/[...slug].astro`, `src/pages/404.astro`, `src/pages/login.astro`
- **Componentes:** `src/components/public/*.astro` (Navbar, HeroSection, DynamicSections, SocialLinks, Footer, PublicLayout)
- **Datos:** `src/lib/site.ts` (getSiteData, getPageBySlug, listSitePages)
- **Bloques:** `src/lib/blocks/` (BlockRegistry, tipos de bloque)
- **i18n:** `src/lib/i18n/modules/public.ts`
- **Utilidades:** `src/lib/ui-helpers.ts`, `src/lib/domain-check.ts`

### 3. Arquitectura del Sector Public

```
src/pages/
├── index.astro               ← Landing page (usa PublicLayout + siteData)
├── [...slug].astro           ← Páginas dinámicas (renderiza bloques desde Firestore)
├── 404.astro                 ← Página 404 personalizada
└── login.astro               ← Página de login

src/components/public/
├── PublicLayout.astro        ← Layout público 100% dinámico desde Firestore
├── Navbar.astro              ← Barra de navegación (navLinks, logo, sitename)
├── HeroSection.astro         ← Sección hero (heroTitle, heroSubtitle, heroImage, CTA)
├── DynamicSections.astro     ← Secciones dinámicas configurables
├── SocialLinks.astro         ← Links de redes sociales
└── Footer.astro              ← Footer del sitio

src/lib/
├── site.ts                   ← getSiteData(), getPageBySlug(), listSitePages()
├── theme.ts                  ← getThemeCssVariables(), applyThemeToElement()
├── blocks/                   ← BlockRegistry + tipos de bloque WYSIWYG
├── domain-check.ts           ← getCurrentDomain(), checkDomain()
└── cache.ts                  ← Caché en memoria para SiteData y páginas

src/styles/
└── (variables CSS del tema aplicadas por PublicLayout)
```

**Flujo de datos:**
```
Firestore sites/{domain}
        │
        ▼
   getSiteData()  ← src/lib/site.ts
        │
        ▼
   PublicLayout.astro
        │
        ├──► Navbar.astro (navLinks, siteName, logo)
        ├──► HeroSection.astro (heroTitle, heroSubtitle, heroImage, CTA)
        ├──► DynamicSections.astro (sections[])
        ├──► SocialLinks.astro (socialLinks[])
        └──► Footer.astro (siteName, socialLinks)
```

**Reglas del sector:**
- **NO tocar** archivos en `src/pages/admin/`, `src/components/admin/`
- **NO modificar** `src/lib/sanitizer.ts` (es del Sector QA)
- **NO modificar** `src/lib/firebase/` sin coordinación del orquestador
- **SÍ modificar** `src/lib/site.ts` para nuevas funciones de datos públicos
- **SÍ modificar** `src/lib/i18n/modules/public.ts` para nuevas traducciones
- **SÍ usar** `src/lib/i18n/modules/common.ts` para traducciones compartidas (solo lectura)

### 4. Patrones de Código del Sector

#### 4.1 Página Pública (Astro)

```astro
---
// src/pages/index.astro
import PublicLayout from "../components/public/PublicLayout.astro";
import { getSiteData, getCurrentDomain } from "../lib/site";

const domain = getCurrentDomain(Astro.request);
const siteData = await getSiteData(domain);

if (!siteData) {
  return Astro.redirect("/404");
}
---

<PublicLayout siteData={siteData} currentPath={Astro.url.pathname}>
  <!-- Contenido específico de la página -->
</PublicLayout>
```

#### 4.2 Componente Público (Astro)

```astro
---
// src/components/public/Navbar.astro
interface Props {
  siteName: string;
  navLinks?: Array<{ label: string; href: string }>;
  logo?: string;
  currentPath: string;
}

const { siteName, navLinks = [], logo, currentPath } = Astro.props;
---

<nav class="navbar" style="background: var(--navbar-bg); color: var(--navbar-text);">
  <!-- Siempre usar variables CSS, nunca hardcodear colores -->
</nav>
```

#### 4.3 Variables CSS del Tema (Obligatorio)

Todos los componentes públicos deben usar **exclusivamente variables CSS** definidas en el tema. Nunca hardcodear colores, fuentes o tamaños.

Variables CSS disponibles (definidas por `getThemeCssVariables()` en `theme.ts`):
- **Colores:** `--primary`, `--secondary`, `--accent`, `--bg`, `--text`, `--heading`
- **Navbar:** `--navbar-bg`, `--navbar-text`
- **Hero:** `--hero-bg`, `--hero-height`, `--hero-align`, `--hero-overlay-color`, `--hero-overlay-opacity`
- **Footer:** `--footer-bg`, `--footer-text`
- **Botones:** `--btn-primary-bg`, `--btn-primary-text`, `--btn-radius`, etc.
- **Tipografía:** `--font-family`, `--font-size-base`, `--font-size-heading`, etc.

#### 4.4 Caché de SiteData (Regla de Rendimiento)

Siempre usar la capa de caché antes de consultar Firestore:
```typescript
import { getCachedSiteData } from "../lib/cache";

const siteData = await getCachedSiteData(domain); // Cache-first, TTL 5min
```

Si se modifica SiteData en el admin, invalidar la caché inmediatamente.

#### 4.5 Páginas Dinámicas con Bloques

```astro
---
// src/pages/[...slug].astro
import { getPageBySlug } from "../lib/site";
import { renderBlock } from "../lib/blocks/BlockRegistry";

const page = await getPageBySlug(domain, slug);
---

<PublicLayout siteData={siteData}>
  {page.blocks?.map(block => renderBlock(block))}
</PublicLayout>
```

### 5. Checklist de Calidad (antes de devolver al orquestador)

- [ ] Build exitoso: `npm run build`
- [ ] Variables CSS del tema usadas en todos los estilos (0 colores hardcodeados)
- [ ] Traducciones completas (es y en) con prefijos semánticos
- [ ] Sin imports de `src/components/admin/` ni `src/pages/admin/`
- [ ] Sin modificaciones a `src/lib/sanitizer.ts`
- [ ] Caché usada para lecturas de Firestore (getCachedSiteData)
- [ ] Páginas con fallback para siteData null (404 o mensaje)
- [ ] Componentes con props tipadas (interfaz Props)
- [ ] Estados de loading/empty/error cubiertos
- [ ] Sin valores hardcodeados que deberían ser i18n o variables CSS

---

## 📋 Tareas Pendientes (Ver TASK_LIST.md)

Las tareas prioritarias del Sector Public están en `.agents/skills/sector-public/TASK_LIST.md`:

### 🔴 Prioridad Alta
- [ ] Página 404 personalizada con datos dinámicos del sitio
- [ ] Soporte de Modo Oscuro controlado desde `theme` en Firestore
- [ ] Caché de SiteData (in-memory/session) para reducir lecturas

### 🟡 Prioridad Media
- [ ] Blog Público Dinámico (posts desde `sites/{domain}/posts`)
- [ ] SEO dinámico (meta tags desde Firestore)
- [ ] Sitemap.xml dinámico

### 🟢 Prioridad Baja
- [ ] AMP support
- [ ] PWA manifest dinámico
- [ ] RSS feed

---

## 🔗 Referencias

| Recurso | Ruta | Propósito |
|---------|------|-----------|
| Sistema de temas | `docs/theme/README.md` | Variables CSS, ThemeConfig, temas default |
| Catálogo HTML | `docs/theme/09-html-elements-catalog.md` | Mapa completo de elementos y variables CSS |
| Golden Rules | `AGENTS.md` | Reglas generales, i18n, rendimiento, caché |
| Tareas del sector | `.agents/skills/sector-public/TASK_LIST.md` | Checklist específico del sector public |
| BlockRegistry | `src/lib/blocks/` | Tipos de bloque y renderizado |

---

> **Principio:** El Sector Public construye y mantiene el frontend público visible para los visitantes. No toca el panel admin, no hace testing (eso es QA), no modifica documentación (eso es el orquestador). Todo estilo debe usar variables CSS del tema.