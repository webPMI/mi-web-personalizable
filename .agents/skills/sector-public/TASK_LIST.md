# 📋 TASK LIST — Sector Public

> **Skill:** `sector-public`
> **Última actualización:** 2026-08-01
> **Estado:** Pendiente de implementación

---

## 🔴 Fase 1: Página 404 Personalizada

### Objetivo
La página 404 actual (`src/pages/404.astro`) debe mostrar datos dinámicos del sitio (nombre, tema, enlaces) en lugar de contenido estático.

### Archivos a modificar
- [ ] `src/pages/404.astro`
  - Usar `PublicLayout` con datos del sitio
  - Detectar el dominio desde la URL de la request
  - Si `siteData` existe → mostrar 404 con el tema del sitio
  - Si `siteData` no existe → mostrar 404 genérica

### Validación
- [ ] 404 muestra el mismo navbar/footer/colores que el sitio
- [ ] 404 en dominio desconocido muestra versión genérica
- [ ] `npm run build` exitoso
- [ ] `npm run qa` sin regresiones

---

## 🟠 Fase 2: Modo Oscuro

### Objetivo
Implementar toggle de modo oscuro/claro controlado desde la configuración del tema en Firestore.

### Archivos a crear
- [ ] `src/components/public/ThemeToggle.astro` — Componente de toggle oscuro/claro
  - Leer preferencia de `siteData.theme.darkMode`
  - Guardar preferencia en localStorage
  - Aplicar clase `dark` al `<html>`
  - Detectar preferencia del sistema (`prefers-color-scheme`)

### Archivos a modificar
- [ ] `src/components/public/PublicLayout.astro` — Añadir ThemeToggle + variables CSS para modo oscuro
- [ ] `src/lib/theme.ts` — Añadir `getDarkModeCssVariables()` para variables oscuras
- [ ] `src/styles/` — Definir variables CSS para modo oscuro (`.dark { ... }`)

### Variables CSS a añadir
```css
:root {
  /* Variables claro (existentes) */
}
.dark {
  --bg: #1a1a2e;
  --text: #e0e0e0;
  --navbar-bg: #16213e;
  --footer-bg: #0f3460;
  /* etc. */
}
```

### Validación
- [ ] Toggle cambia entre modo claro y oscuro
- [ ] Preferencia persiste en localStorage
- [ ] Respeta `prefers-color-scheme` del sistema
- [ ] Todos los componentes públicos responden al cambio
- [ ] `npm run build` + `npm run qa` verdes

---

## 🟡 Fase 3: Caché de SiteData (In-Memory / Session)

### Objetivo
Reducir lecturas a Firestore implementando caché en memoria con TTL.

### Archivos a modificar
- [ ] `src/lib/cache.ts` — Implementar/mejorar caché en memoria
  - `getCachedSiteData(domain)` — Cache-first con TTL de 5 minutos
  - `invalidateSiteCache(domain)` — Invalidar al modificar datos
  - `getCachedPage(siteDomain, slug)` — Caché para páginas individuales
  - `invalidateAllSiteCache(domain)` — Invalidación masiva

### Estrategia de invalidación
- Admin guarda cambios → `AdminLayout` llama a endpoint que invalida caché
- TTL expira → siguiente lectura va a Firestore
- Build/despliegue → caché limpia

### Validación
- [ ] Primera lectura va a Firestore
- [ ] Segunda lectura (dentro de TTL) va a caché
- [ ] Después de TTL, vuelve a Firestore
- [ ] Invalidación manual funciona
- [ ] `npm run build` + `npm run qa` verdes

---

## 🟢 Fase 4: Blog Público Dinámico

### Objetivo
Permitir que los sitios tengan un blog con entradas almacenadas en `sites/{domain}/posts`.

### Archivos a crear
- [ ] `src/pages/blog/[...slug].astro` — Ruta de blog dinámica
- [ ] `src/components/public/BlogList.astro` — Lista de entradas
- [ ] `src/components/public/BlogPost.astro` — Entrada individual
- [ ] `src/lib/blog.ts` — `getBlogPosts()`, `getBlogPost()`, `listBlogPosts()`

### Archivos a modificar
- [ ] `src/lib/site.ts` — Añadir soporte para subcolección `posts`
- [ ] `src/lib/i18n/modules/public.ts` — Keys de blog
- [ ] `src/pages/[...slug].astro` — Detectar si es ruta de blog

### Estructura de datos
```typescript
// sites/{domain}/posts/{postId}
interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;       // HTML sanitizado
  featuredImage?: string;
  author: string;
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  tags: string[];
  isPublished: boolean;
}
```

### Validación
- [ ] Lista de posts con paginación
- [ ] Post individual con contenido renderizado
- [ ] Posts no publicados no visibles
- [ ] `npm run build` + `npm run qa` verdes

---

## 🔵 Fase 5: SEO Dinámico

### Objetivo
Generar meta tags, Open Graph, y Twitter Cards desde datos en Firestore.

### Archivos a modificar
- [ ] `src/components/public/PublicLayout.astro` — Añadir `<SEO />` component
- [ ] `src/components/public/SEO.astro` — Componente de meta tags dinámicos
- [ ] `src/lib/site.ts` — Extender `SiteData.seo` con más campos

### Meta tags a generar
- `title`, `description`
- `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- `canonical` URL
- `robots` (index/noindex)

### Validación
- [ ] Meta tags se generan correctamente en `<head>`
- [ ] Valores por defecto si no hay SEO configurado
- [ ] `npm run build` + `npm run qa` verdes

---

## 🟣 Fase 6: Sitemap.xml y RSS

### Sitemap
- [ ] `src/pages/sitemap.xml.ts` — Endpoint que genera sitemap dinámico
  - Listar todas las páginas públicas
  - Incluir entradas de blog
  - Respetar `noindex` de SEO config

### RSS Feed
- [ ] `src/pages/rss.xml.ts` — Endpoint que genera feed RSS
  - Solo entradas de blog publicadas
  - Últimas 20 entradas

---

## 📊 Resumen

| Fase | Feature | Archivos nuevos | Archivos modificados | Prioridad | Estado |
|------|---------|----------------|---------------------|-----------|--------|
| 1 | 404 Personalizada | 0 | 1 | 🔴 Alta | ⬜ |
| 2 | Modo Oscuro | 1 | 3 | 🔴 Alta | ⬜ |
| 3 | Caché SiteData | 0 | 1 | 🔴 Alta | ⬜ |
| 4 | Blog Dinámico | 4 | 3 | 🟡 Media | ⬜ |
| 5 | SEO Dinámico | 1 | 2 | 🟡 Media | ⬜ |
| 6 | Sitemap + RSS | 2 | 0 | 🟢 Baja | ⬜ |

---

> **Nota para el orquestador:** Las Fases 1-3 son prioritarias y deben completarse antes de abordar features más grandes como el blog. Cada fase requiere QA Gate antes del cierre.