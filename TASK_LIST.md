# 📋 Task List - mi-web-personalizable

> Checklist de tareas pendientes y plan de desarrollo.
> **Tres agentes trabajando en paralelo:**
> - **Agent Sector Public** → Sección pública del sitio (`/`, `PublicLayout`)
> - **Agent Sector Admin** → Panel de administración (`/admin`, `/admin/config`, `/admin/profile`, `/admin/users`)
> - **Agent Sector QA** → Suite de pruebas, sanitización, seguridad y auditoría sintética (`tests/`, `npm run qa`)
> Generado: Julio 2026

---

## ✅ Completado

### Fase 1: Sistema i18n y Scripts
- [x] Crear `CLAUDE.md` con Golden Rules para agentes de IA
- [x] Crear Golden Rules de i18n (prefijos semánticos, namespaces, paridad es/en)
- [x] Crear `scripts/i18n-check.mjs` - Valida paridad y duplicados
- [x] Crear `scripts/i18n-find.mjs` - Busca texto en traducciones
- [x] Crear `scripts/i18n-stats.mjs` - Estadísticas del sistema
- [x] Añadir scripts a `package.json` (`i18n:check`, `i18n:find`, `i18n:stats`)

### Fase 2: HomePage y Datos del Sitio
- [x] Crear `src/lib/site.ts` con `getSiteData()` y `SiteData`
- [x] Crear `src/lib/site.ts` con `getSiteByOwnerId()` (búsqueda por ownerId)
- [x] Modificar `onboarding.ts` para guardar `siteName`/`siteDescription` en el documento principal
- [x] Crear `src/components/HomePage.astro` (reemplazo de PublicPage) — *Eliminado en Fase 5*
- [x] Actualizar `src/pages/index.astro` para usar HomePage + getSiteData
- [x] Arreglar detección de dominio en localhost (fallback a `localhost.com` y búsqueda por ownerId)

### Fase 3: Infraestructura
- [x] Añadir índice de Firestore para `sites.ownerId` en `firestore.indexes.json`
- [x] Añadir `getRegisteredDomain()` en `domain-check.ts` para redirección post-registro

### Fase 4: Refactorización del Admin Panel (Agent Sector Admin)
- [x] Crear `src/components/admin/AdminLayout.astro` — Layout compartido con auth, navegación y estados
- [x] Crear `src/components/admin/AdminDashboard.ts` — Lógica JS del Dashboard
- [x] Crear `src/components/admin/SiteConfig.ts` — Lógica JS de Configuración (cargar/guardar en Firestore)
- [x] Crear `src/pages/admin/config.astro` — Nueva página de configuración del sitio
- [x] Reescribir `src/pages/admin/index.astro` — Versión liviana (~44 líneas) que usa AdminLayout
- [x] Registrar módulo `admin` en `src/lib/i18n.ts` (import + registerTranslations)

### Fase 5: PublicLayout Dinámico (Agent Sector Public)
- [x] Ampliar interfaz `SiteData` en `src/lib/site.ts` (navLinks, hero, sections, socialLinks, theme, seo)
- [x] Crear `src/components/public/PublicLayout.astro` — Layout público 100% dinámico desde Firestore
- [x] Actualizar `src/pages/index.astro` para usar PublicLayout con SiteData completo
- [x] Sincronizar `src/types/firebase.ts` — Marcar `SiteSettings` como `@deprecated`
- [x] Eliminar archivos obsoletos (`PublicPage.astro`, `HomePage.astro`)
- [x] Build exitoso — 3 páginas generadas sin errores

### Fase 6: Infraestructura de Testing, Sanitización y QA Sintético (Agent Sector QA)
- [x] Instalación y configuración de Vitest + jsdom (`vitest.config.ts`, `tests/setup.ts`)
- [x] Creación del ejecutor sintético token-efficient `scripts/qa-runner.mjs` (`npm run qa`)
- [x] Creación del módulo central de sanitización `src/lib/sanitizer.ts` (`sanitizeUrl`, `escapeAttribute`, `sanitizeText`, `sanitizeSiteData`)
- [x] Corrección defensiva de Firestore (`sanitizeData` contra valores `undefined`)
- [x] Normalización de dominios `normalizeDomain` en `domain-check.ts` y `site.ts`
- [x] Creación de la Skill del Agente QA en `.agents/skills/qa-auditor/SKILL.md`
- [x] Creación de suite con **54 pruebas unitarias en 9 archivos de test** (`tests/`)
- [x] Auditoría QA 100% en verde (`npm run qa`) y build de producción limpio (`npm run build`)

### Fase 7: Personalización Visual del Tema (Theme Config + Public Theme)
- [x] Crear `src/pages/admin/theme.astro` — Página de personalización del tema en el admin
- [x] Crear `src/components/admin/ThemeConfig.ts` — Lógica JS: carga, sincronización color picker↔hex, preview en vivo, guardado en Firestore
- [x] Añadir estilos de theme grid, color pickers, ranges y preview en `src/styles/admin.css`
- [x] Añadir enlace "Tema" en el sidebar de `AdminLayout.astro`
- [x] Actualizar `PublicLayout.astro` para exponer todas las variables CSS del tema (colores, tipografía, layout, hero, botones)
- [x] Actualizar `Navbar.astro` para usar `--navbar-bg`, `--navbar-text`, `--accent`
- [x] Actualizar `HeroSection.astro` para usar `--hero-height`, `--hero-align`, `--hero-overlay-color`, `--hero-overlay-opacity`, `--btn-*`
- [x] Actualizar `Footer.astro` para usar `--footer-bg`, `--footer-text`, `--accent`
- [x] Build exitoso — 6 páginas generadas sin errores

---

## 📐 Documentación para Todos los Agentes

### Separación de Responsabilidades

| Área | Agente | Archivos |
|------|--------|----------|
| **Página pública** (`/`) | **Sector Public** | `src/pages/index.astro`, `src/components/public/PublicLayout.astro`, `src/lib/site.ts` |
| **Panel admin** (`/admin`, `/admin/config`) | **Sector Admin** | `src/pages/admin/*.astro`, `src/components/admin/*` |
| **Onboarding** | **Sector Admin** | `src/components/admin/OnboardingWizard.astro`, `src/components/admin/onboarding.ts` |
| **DevTools** | **Sector Public** | `src/components/devtools/*` |
| **Testing & QA** | **Sector QA** | `tests/*`, `vitest.config.ts`, `scripts/qa-runner.mjs`, `.agents/skills/qa-auditor/` |
| **i18n** | **Compartido** | `src/lib/i18n/` — Registrar nuevos módulos según necesidad |
| **Firebase** | **Compartido** | `src/lib/firebase/` — No modificar sin coordinación |

### Interfaz entre Admin Panel y PublicLayout

El Admin Panel guarda datos en Firestore que el PublicLayout debe consumir:

#### 1. Documento principal: `sites/{domain}`
El admin escribe directamente en el documento del sitio:
- `siteName`, `siteDescription`, `locale` — Configuración básica
- `navLinks`, `heroTitle`, `heroSubtitle`, `heroImage`, `heroCtaText`, `heroCtaLink` — Personalización
- `socialLinks`, `sections[]`, `theme`, `seo` — Contenido dinámico

#### 2. Evento `admin:ready` (para componentes JS)
El `AdminLayout` dispara `CustomEvent('admin:ready')` con `detail: { siteDomain, siteData }`.

#### 3. Data attributes en el DOM
El contenedor `#admin-app` expone:
- `data-site-domain` → dominio del sitio
- `data-site-data` → JSON con todos los datos del sitio

---

## 📊 Progreso Actual

- **Completado:** 40 tareas (fases 1-7)
- **Estado de Pruebas:** 115/115 tests en 14 archivos (100% PASS en `npm run qa`)
- **Estado de Build:** 100% exitoso (`npm run build`)

### 📈 Cobertura de Tests por Módulo

| Módulo | Archivo Test | Tests | Estado |
|--------|-------------|-------|--------|
| Sanitizer | `tests/sanitizer.test.ts` | 7 | ✅ |
| i18n Core | `tests/i18n.test.ts` | 6 | ✅ |
| i18n Parity | `tests/i18n-parity.test.ts` | 9 | ✅ |
| i18n Edge Cases | `tests/i18n-edge-cases.test.ts` | 5 | ✅ |
| Permissions/RBAC | `tests/permissions.test.ts` | 15 | ✅ |
| Domain Validation | `tests/domain-validation.test.ts` | 9 | ✅ |
| Domain Check | `tests/domain-check.test.ts` | 5 | ✅ |
| Cache | `tests/cache.test.ts` | 5 | ✅ |
| Firestore Helpers | `tests/firestore-helpers.test.ts` | 7 | ✅ |
| Auth Helpers | `tests/auth-helpers.test.ts` | 3 | ✅ |
| UI Helpers | `tests/ui-helpers.test.ts` | 3 | ✅ |
| Theme | `tests/theme.test.ts` | 4 | ✅ |
| Blocks | `tests/blocks.test.ts` | 17 | ✅ |
| Pages | `tests/pages.test.ts` | 20 | ✅ |

### ❌ Áreas sin cobertura de tests

| Módulo | Funciones sin test | Prioridad |
|--------|-------------------|-----------|
| `src/lib/site.ts` | `getSiteData`, `getPageBySlug`, `listSitePages`, `savePageSubcollection`, `deletePageSubcollection` | ✅ Tests creados (17 tests) |
| `src/lib/theme.ts` | `applyThemeToElement` (manipulación DOM) | 🟡 Media |
| `src/lib/domain-check.ts` | `checkDomain`, `getCurrentDomain` | 🟡 Media |
| `src/lib/cache.ts` | Edge cases: TTL exacto, datos corruptos localStorage | 🟢 Baja |

---

## 🚀 Próximas Features (Checklist Pendiente)

### 🔴 Sector Admin — Perfil y Gestión de Usuarios

Estrategia detallada en `docs/admin-profile-users-strategy.md`.

- [ ] **Fase 1: Perfil de Usuario (`/admin/profile`)**
  - [ ] Crear vista HTML `src/pages/admin/profile.astro`
  - [ ] Crear lógica JavaScript `src/components/admin/UserProfile.ts`
  - [ ] Añadir traducciones de perfil en `src/lib/i18n/modules/admin.ts`
  - [ ] Añadir enlace "Perfil" en `AdminLayout.astro`
  - [ ] Ejecutar `npm run qa` y verificar 0 regresiones

- [ ] **Fase 2: Gestión de Usuarios del Sitio (`/admin/users`)**
  - [ ] Crear vista HTML `src/pages/admin/users.astro`
  - [ ] Crear lógica JavaScript `src/components/admin/UserManager.ts`
  - [ ] Añadir traducciones de gestión de miembros en `src/lib/i18n/modules/admin.ts`
  - [ ] Añadir enlace "Usuarios" en `AdminLayout.astro`
  - [ ] Ejecutar `npm run qa` y verificar 0 regresiones

- [ ] **Fase 3: Permisos y Roles (RBAC)**
  - [ ] Implementar función `loadUserRole()` en `AdminLayout.astro`
  - [ ] Ocultar o deshabilitar pestañas del panel según rol (`admin`, `editor`, `viewer`)
  - [ ] Actualizar reglas de Firestore en `firebase/firestore.rules`
  - [ ] Ejecutar `npm run qa` y verificar 0 regresiones

---

### 🟢 Sector Public — Próximas Iteraciones

- [ ] **Página 404 personalizada** con datos dinámicos del sitio
- [ ] **Soporte de Modo Oscuro** controlado desde `theme` en Firestore
- [ ] **Caché de SiteData** (In-memory / Session) para reducir lecturas a Firestore
- [ ] **Blog Público Dinámico** (consumir entradas desde subcolección Firestore `sites/{domain}/posts`)

---

### 🟡 Sector QA / Testing (Ver `.agents/skills/qa-auditor/TASK_LIST.md`)

> El **Agent Sector QA / Testing** gestiona su checklist exclusivo y su hoja de ruta de testing en [.agents/skills/qa-auditor/TASK_LIST.md](file:///c:/Users/ink.enzo/Desktop/p/mi-web-personalizable/.agents/skills/qa-auditor/TASK_LIST.md).

- [ ] **Nivel 1 (Unitario & Edge Cases)**: Tests para `/admin/profile` y `/admin/users` (Ver `TASK_LIST.md` de QA).
- [ ] **Nivel 2 (Mocks & Firestore Rules)**: Configurar `@firebase/rules-unit-testing` (Ver `TASK_LIST.md` de QA).
- [ ] **Nivel 3 (E2E & Regresión Visual)**: Integrar `@playwright/test` (Ver `TASK_LIST.md` de QA).
