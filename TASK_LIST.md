# 📋 Task List - mi-web-personalizable

> Checklist de tareas pendientes y plan de desarrollo.
> **Dos agentes trabajando en paralelo:**
> - **Agent Sector Public** (actual) → Sección pública del sitio
> - **Agent Sector Admin** → Panel de administración
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

---

## 📐 Documentación para Ambos Agentes

### Separación de Responsabilidades

| Área | Agente | Archivos |
|------|--------|----------|
| **Página pública** (`/`) | **Sector Public** | `src/pages/index.astro`, `src/components/public/PublicLayout.astro`, `src/lib/site.ts` |
| **Panel admin** (`/admin`, `/admin/config`) | **Sector Admin** | `src/pages/admin/*.astro`, `src/components/admin/*` |
| **Onboarding** | **Sector Admin** | `src/components/admin/OnboardingWizard.astro`, `src/components/admin/onboarding.ts` |
| **DevTools** | **Sector Public** | `src/components/devtools/*` |
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

### Archivos que NO debe modificar el Agent Sector Public
- `src/components/admin/AdminLayout.astro`
- `src/components/admin/AdminDashboard.ts`
- `src/components/admin/SiteConfig.ts`
- `src/pages/admin/index.astro`
- `src/pages/admin/config.astro`
- `src/lib/i18n/modules/admin.ts`

### Archivos que NO debe modificar el Agent Sector Admin
- `src/components/public/PublicLayout.astro`
- `src/components/devtools/*`
- `src/lib/site.ts` (solo lectura para conocer SiteData)

### Tipos Compartidos
- **`SiteData`** en `src/lib/site.ts` → Tipo principal para datos del sitio. Usar este para todo.
- **`SiteSettings`** en `src/types/firebase.ts` → **Deprecated**. Mantenido solo por compatibilidad.

---

## 📊 Progreso

- **Completado:** 24 tareas (fases 1-5)
- **Pendientes:** Próximas features de la sección pública
- **Estado actual:** PublicLayout implementado y build exitoso

---

## 🚀 Próximas Features (Sección Pública)

Ideas para futuras iteraciones:

- [ ] **Página 404 personalizada** con datos del sitio
- [ ] **Modo oscuro** basado en `theme`
- [ ] **Analytics** básico (contador de visitas)
- [ ] **Blog público** (consumir desde Firestore)
- [ ] **Caché de SiteData** para reducir lecturas a Firestore
- [ ] **Soporte para múltiples páginas** (routing dinámico desde navLinks)
