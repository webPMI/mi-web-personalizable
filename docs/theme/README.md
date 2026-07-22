# Sistema de Temas — Documentación

> **Versión:** 1.0.0
> **Última actualización:** 2026-07-22

## 📂 Estructura de la documentación

```
docs/theme/
├── README.md              ← Este archivo (índice y visión general)
├── 01-architecture.md     ← Arquitectura general del sistema
├── 02-database.md         ← Esquema D1, seed data, migraciones
├── 03-api.md              ← Endpoints, autenticación, permisos
├── 04-frontend.md         ← UI, componentes, flujo de usuario
├── 05-default-themes.md   ← Los 3 temas predefinidos (configs completas)
├── 06-superadmin.md       ← Panel y herramientas para superadmin
├── 07-scaling.md          ← Cómo escalar: más temas, categorías, variantes
└── 08-future.md           ← Mejoras futuras, optimizaciones, ideas
```

## 🎯 Visión General

El sistema de temas permite:

1. **Temas prediseñados** almacenados en D1 (Cloudflare) — 3 temas iniciales
2. **Superadmin** (`servicioweb.pmi@gmail.com`) — único usuario con permisos CRUD sobre temas default
3. **Admins de sitio** — pueden ver y copiar temas default a su sitio (Firestore)
4. **Personalización** — después de copiar, pueden ajustar colores, fuentes, layout, etc.

## 🔗 Flujo de Datos

```
D1 (Cloudflare)                    Firestore
┌─────────────────┐               ┌──────────────────┐
│ default_themes  │  ──copiar──▶  │ sites/{domain}   │
│ ┌ classic       │               │   .theme = {...} │
│ ├ modern        │               │                  │
│ └ dark          │               │ sites/{domain}/  │
└─────────────────┘               │   settings/theme │
                                  └──────────────────┘
       ▲                                      │
       │ GET /api/admin/themes                │ save
       │                                      ▼
  ┌──────────┐                       ┌──────────────┐
  │ Frontend │                       │ ThemeConfig  │
  │ /admin/  │                       │ .ts (cliente)│
  │ theme    │                       └──────────────┘
  └──────────┘
```

## 🧩 Componentes Clave

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| D1 Database | Cloudflare D1 (SQLite) | Almacenar temas default |
| API Routes | Astro API endpoints | CRUD de temas + copia |
| ThemeConfig.ts | TypeScript (cliente) | UI de personalización |
| admin/theme.astro | Astro + HTML | Página de configuración |
| Superadmin guard | Firebase Auth + email check | Restringir CRUD |

## 📐 Principios de Diseño

1. **D1 como fuente de verdad** para temas default — no tocar Firestore para esto
2. **Copia, no referencia** — al aplicar un tema se copia la config completa al sitio
3. **Superadmin rígido** — solo un email puede modificar temas default
4. **Extensible** — añadir nuevos temas es tan simple como insertar un row en D1
5. **Sin dependencias externas** — los temas son JSON planos, no requieren build step

---

## 📄 Resumen de Documentos

| Documento | Contenido | Archivos involucrados |
|-----------|-----------|----------------------|
| [01-architecture.md](./01-architecture.md) | Arquitectura, diagramas, flujos, decisiones técnicas | Todos |
| [02-database.md](./02-database.md) | Schema SQL, seed data, migraciones, operaciones | `schema.sql`, `d1/themes.ts` |
| [03-api.md](./03-api.md) | Endpoints, autenticación, validación, rate limiting | `api/admin/themes.ts`, `d1/themes.ts` |
| [04-frontend.md](./04-frontend.md) | UI, componentes, CSS, lógica cliente, estados | `theme.astro`, `ThemeConfig.ts`, `admin.css` |
| [05-default-themes.md](./05-default-themes.md) | Configs completas de los 3 temas iniciales | Seed data |
| [06-superadmin.md](./06-superadmin.md) | Panel superadmin, CRUD, seguridad, mejoras | `themes-manager.astro`, `SuperadminThemes.ts` |
| [07-scaling.md](./07-scaling.md) | Escalabilidad, categorías, variantes, marketplace | Futuras implementaciones |
| [08-future.md](./08-future.md) | IA, auto-guardado, comparación, analytics, plugins | Ideas y roadmap |
| [09-html-elements-catalog.md](./09-html-elements-catalog.md) | Catálogo completo de elementos HTML, mapa de variables CSS, elementos hardcodeados | `theme.ts`, todos los componentes públicos, `BlockRegistry.ts` |

---

## 📊 Estado Actual de Cobertura del Tema

✅ **100% de cobertura** — Todos los elementos HTML del sitio público están controlados por variables CSS del tema.

`SiteThemeConfig` pasó de **18 a ~50 propiedades**, y todos los componentes públicos y bloques WYSIWYG usan variables CSS en lugar de valores hardcodeados.

Ver [09-html-elements-catalog.md](./09-html-elements-catalog.md) para el catálogo completo.

| Categoría | Elementos totales | Cubiertos | Hardcodeados | % Cobertura |
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

---

## 🚀 Estado de Implementación

### ✅ Completado (v1.0.0)
1. ✅ Documentación completa del sistema (10 documentos + catálogo HTML + auditoría)
2. ✅ Migrar `SiteThemeConfig` de 18 a ~50 propiedades
3. ✅ Actualizar `getThemeCssVariables()` con todas las nuevas variables
4. ✅ Reemplazar estilos hardcodeados en componentes públicos por variables CSS
5. ✅ Reemplazar estilos hardcodeados en BlockRegistry por variables CSS
6. ✅ Actualizar configs de los 3 temas con nuevas propiedades (seed data)
7. ✅ Implementar schema D1 (`migrations/001-create-default-themes.sql`)
8. ✅ Implementar `src/lib/d1/client.ts` (cliente D1 con mock para desarrollo)
9. ✅ Implementar `src/lib/d1/themes.ts` (CRUD completo: list, get, create, update, delete, duplicate, paginated)
10. ✅ Crear API endpoints (`src/pages/api/admin/themes/[...slug].ts`)
11. ✅ Crear seed data (`scripts/seed-default-themes.mjs` + `scripts/seed-default-themes.sql`)
12. ✅ Auditoría completa del sistema (`docs/theme/10-audit-report.md`)

### ✅ Corregido (Build)
13. ✅ Instalado adaptador `@astrojs/cloudflare`
14. ✅ Configurado `astro.config.mjs` con output server + adaptador
15. ✅ `src/lib/d1/index.ts` — exportaciones completas
16. ✅ `src/lib/d1/schema.sql` — schema completo
17. ✅ API endpoint maneja Firebase como opcional (try/catch para Cloudflare)

### ⬜ Pendiente (Próximo Sprint)
18. ⬜ Desarrollar UI de frontend (`/admin/theme` con sección de temas)
19. ⬜ Construir panel superadmin (`/admin/themes-manager`)
20. ⬜ Arreglar tests de vitest (config de entorno)
21. ⬜ Arreglar errores en `PagesConfig.ts` (preexistentes)
22. ⬜ Implementar verificación real con Firebase Admin SDK en API
23. ⬜ Deploy a Cloudflare Pages + D1
