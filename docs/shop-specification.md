# 🛒 Especificación Completa de la Tienda Web (E-Commerce) v2.0

> **Versión:** 2.0.0 — Documento de Diseño y Arquitectura (Reforzado con Control de Acceso Estricto)
> **Fecha:** 2026-08-01
> **Estado:** 📐 En fase de planificación y revisión (PRE-IMPLEMENTACIÓN)
> **Agentes involucrados:** Orquestador, Sector Admin, Sector Public, QA Auditor

---

## 📋 Índice

1. [Visión General y Alcance](#1-visión-general-y-alcance)
2. [Sistema de Control de Acceso Multi-Capa](#2-sistema-de-control-de-acceso-multi-capa) ⭐ NUEVO
3. [Matriz de Roles y Permisos](#3-matriz-de-roles-y-permisos) ⭐ NUEVO
4. [Reglas de Visibilidad de Productos](#4-reglas-de-visibilidad-de-productos) ⭐ NUEVO
5. [Comportamiento Tienda Deshabilitada](#5-comportamiento-tienda-deshabilitada) ⭐ NUEVO
6. [Modelo de Datos (Firestore)](#6-modelo-de-datos-firestore)
7. [Arquitectura de la Sección Pública (Tienda)](#7-arquitectura-de-la-sección-pública-tienda)
8. [Arquitectura del Panel Admin (Gestión de Tienda)](#8-arquitectura-del-panel-admin-gestión-de-tienda)
9. [Flujos de Usuario Completos](#9-flujos-de-usuario-completos)
10. [Sistema i18n para la Tienda](#10-sistema-i18n-para-la-tienda)
11. [Plan de Implementación por Fases](#11-plan-de-implementación-por-fases)
12. [Validación y QA Gate](#12-validación-y-qa-gate)
13. [Apéndices](#13-apéndices)

---

## 1. Visión General y Alcance

### 1.1 Objetivo

Habilitar una tienda web completamente funcional dentro de `mi-web-personalizable`, permitiendo a cada sitio vender productos digitales y/o físicos con una experiencia de compra fluida para el público y un panel de gestión profesional para el administrador.

### 1.2 Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Progresivo** | La tienda es opcional. Se habilita mediante `shop.enabled`. Si está desactivada, **ninguna ruta de tienda es accesible** (404). |
| **Defensa en Profundidad** | Cada capa (Firestore, API, página Astro, frontend JS) aplica sus propias verificaciones de acceso. Si una capa falla, las demás bloquean. |
| **Consistente** | Sigue los mismos patrones de arquitectura del proyecto: Astro + JS vanilla, Firestore como backend, variables CSS del tema, i18n con namespaces. |
| **Escalable** | La estructura de subcolecciones de Firestore permite crecimiento futuro (inventario, variantes, reseñas, cupones). |
| **Seguro** | Validación del lado del servidor (API routes + Astro middlewares), sanitización de datos (sanitizer.ts), reglas de Firestore RBAC. |
| **Rendimiento** | Caché SWR para productos/categorías, paginación para listados largos, imágenes lazy-loading. |
| **Profesional** | Panel admin completo: CRUD de productos, gestión de pedidos, estadísticas básicas, filtros, búsqueda, ordenación, bulk actions, roles. |

### 1.3 Alcance (MVP — Fase Inicial)

**Incluido en MVP:**
- ✅ Toggle `shop.enabled` en ShopSettings (admin)
- ✅ Sistema de control de acceso multi-capa (Firestore Rules → API Gate → Astro Page Guard → Frontend Guard)
- ✅ Matriz de roles y permisos (admin, editor, viewer) aplicada al panel admin de tienda
- ✅ Reglas estrictas de visibilidad de productos según su estado (active, draft, archived, out_of_stock)
- ✅ CRUD completo de productos (nombre, descripción, precio, imágenes, categoría, stock, estado, visibilidad)
- ✅ Categorías de productos (gestión desde admin)
- ✅ Vitrina pública: grid de productos, filtro por categoría, búsqueda
- ✅ Página de detalle de producto individual (solo si la tienda está habilitada Y el producto está activo)
- ✅ Carrito de compras (localStorage, sin login requerido)
- ✅ Enlace "Tienda" en el Navbar público (condicional a `shop.enabled`)
- ✅ Sección de productos destacados en la landing page (opcional)
- ✅ Panel admin: `ShopManager.ts` con tabla de productos, filtros, bulk actions
- ✅ Panel admin: `ProductEditor.ts` formulario completo de producto con subida de imágenes
- ✅ Panel admin: `OrderManager.ts` vista de pedidos con cambio de estado
- ✅ Panel admin: Sidebar respeta roles (viewer no ve ciertas opciones, editor no puede cambiar config)
- ✅ Notificaciones toast para acciones (éxito/error)
- ✅ Redirección 404 en todas las rutas de tienda si `shop.enabled === false`
- ✅ API endpoints de shop retornan 403/404 si la tienda está deshabilitada

**Fuera del alcance MVP (futuras fases):**
- ❌ Pasarela de pago integrada (Stripe/PayPal)
- ❌ Cuentas de cliente (login para comprar)
- ❌ Reseñas/valoraciones de productos
- ❌ Cupones de descuento
- ❌ Variantes de producto (talla, color)
- ❌ Inventario avanzado con SKU
- ❌ Envíos y cálculo de gastos de envío
- ❌ Facturación electrónica
- ❌ Carrito persistente en Firestore (solo localStorage)

---

## 2. Sistema de Control de Acceso Multi-Capa

> **Principio fundamental:** Si el admin deshabilitó la tienda (`shop.enabled === false`), **NADIE** puede acceder a ninguna sección de la tienda, ni como cliente ni como editor. La protección se aplica en 4 capas independientes.

### 2.1 Diagrama de Capas de Protección

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PETICIÓN A RUTA DE TIENDA                          │
│                   /tienda, /tienda/[slug], /api/shop/*               │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │   CAPA 1: FIRESTORE RULES     │
                    │   (Base de datos)              │
                    │                                │
                    │   - Lectura pública SOLO si:   │
                    │     shop.enabled === true AND  │
                    │     product.status === "active"│
                    │   - Escritura requiere rol     │
                    │     admin o editor             │
                    └───────────────┬───────────────┘
                                    │ Si pasa Firestore ▼
                    ┌───────────────▼───────────────┐
                    │   CAPA 2: API GATE             │
                    │   (Endpoints /api/shop/*)      │
                    │                                │
                    │   - Verifica shop.enabled      │
                    │     antes de cualquier query   │
                    │   - Retorna 403 si disabled    │
                    │   - Sanitiza parámetros        │
                    └───────────────┬───────────────┘
                                    │ Si pasa API ▼
                    ┌───────────────▼───────────────┐
                    │   CAPA 3: ASTRO PAGE GUARD     │
                    │   (getStaticPaths / Astro.props)│
                    │                                │
                    │   - En cada página de tienda:  │
                    │     verifica shop.enabled      │
                    │   - Si disabled → 404          │
                    │   - Si producto no activo → 404│
                    └───────────────┬───────────────┘
                                    │ Si pasa página ▼
                    ┌───────────────▼───────────────┐
                    │   CAPA 4: FRONTEND GUARD       │
                    │   (JS del lado del cliente)     │
                    │                                │
                    │   - Navbar oculta enlace       │
                    │   - CartIcon no se renderiza   │
                    │   - FeaturedProducts no aparece│
                    │   - Si alguien forza URL →     │
                    │     la página ya devolvió 404  │
                    └────────────────────────────────┘
```

### 2.2 Implementación por Capa

#### Capa 1: Firestore Rules

```javascript
// firebase/firestore.rules — reglas de tienda con verificación de shop.enabled

// Función auxiliar: ¿la tienda está habilitada?
function isShopEnabled(domain) {
  return get(/databases/$(database)/documents/sites/$(domain)).data.shop.enabled == true;
}

// Productos: visibilidad pública condicionada a shop.enabled + solo activos
match /sites/{domain}/products/{productId} {
  // Lectura pública: tienda habilitada Y producto activo
  allow read: if isShopEnabled(domain) && resource.data.status == "active";

  // Lectura admin: cualquier miembro del sitio puede ver TODOS los productos
  allow read: if isSiteMember(domain);

  // Escritura: solo admin y editor
  allow create, update, delete: if isSiteMember(domain) && hasRole(domain, 'admin', 'editor');
}

// Categorías: visibilidad pública condicionada
match /sites/{domain}/categories/{categoryId} {
  allow read: if isShopEnabled(domain) && resource.data.isActive == true;
  allow read: if isSiteMember(domain);
  allow create, update, delete: if isSiteMember(domain) && hasRole(domain, 'admin', 'editor');
}

// Pedidos: nunca públicos, solo miembros del sitio
match /sites/{domain}/orders/{orderId} {
  allow read, update: if isSiteMember(domain) && hasRole(domain, 'admin', 'editor');
  allow create: if isShopEnabled(domain); // Un visitante puede crear pedido si tienda habilitada
}
```

#### Capa 2: API Gate

Cada endpoint de API debe verificar `shop.enabled` antes de procesar:

```typescript
// src/pages/api/shop/products.ts
export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain");

  if (!domain) {
    return new Response(JSON.stringify({ error: "Domain required" }), { status: 400 });
  }

  // ⚠️ CAPA 2: Verificar si la tienda está habilitada
  const siteData = await getSiteData(domain);
  if (!siteData || !siteData.shop?.enabled) {
    return new Response(JSON.stringify({ error: "Shop is disabled or site not found" }), { status: 404 });
  }

  // Sanitizar parámetros
  const category = sanitizeText(url.searchParams.get("category") || "");
  const search = sanitizeText(url.searchParams.get("search") || "");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "12"), 48);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);

  // Solo productos activos (nunca borrador/archivado desde API pública)
  const products = await getShopProducts(domain, {
    category,
    search,
    limit,
    page,
    status: "active", // Forzado, no acepta parámetro externo
  });

  return new Response(JSON.stringify(products), { status: 200 });
}
```

**Reglas de API Gate:**
- Todo endpoint público de shop (`/api/shop/*`) debe verificar `shop.enabled`
- Si disabled → retornar 404 (no 403, para no revelar que la tienda existe)
- Sanitizar TODOS los parámetros de entrada con `sanitizer.ts`
- Limitar `limit` máximo a 48 (evitar descargas masivas)
- Status de producto forzado a `"active"` en endpoints públicos (nunca aceptar status del cliente)

#### Capa 3: Astro Page Guard

Cada página de tienda verifica en el servidor (Astro) antes de renderizar:

```astro
---
// src/pages/tienda.astro
import { getSiteData } from "../lib/site";
import { getCurrentDomain } from "../lib/domain-check";
import ShopLayout from "../components/public/shop/ShopLayout.astro";
import ProductGrid from "../components/public/shop/ProductGrid.astro";
import CategoryFilter from "../components/public/shop/CategoryFilter.astro";
import SearchBar from "../components/public/shop/SearchBar.astro";

const domain = getCurrentDomain(Astro.request);
const siteData = await getSiteData(domain);

// ⚠️ CAPA 3: Guard — Tienda deshabilitada → 404
if (!siteData || !siteData.shop?.enabled) {
  return Astro.redirect("/404");
}

// Obtener solo productos activos
const { getShopProducts, getShopCategories } = await import("../lib/shop/shop-queries");
const url = new URL(Astro.request.url);
const category = url.searchParams.get("category") || "";
const search = url.searchParams.get("search") || "";
const page = parseInt(url.searchParams.get("page") || "1");

const { products, total, totalPages } = await getShopProducts(domain, {
  status: "active", // Siempre forzado
  category,
  search,
  page,
  limit: siteData.shop?.productsPerPage || 12,
});

const categories = await getShopCategories(domain);
---
```

```astro
---
// src/pages/tienda/[slug].astro — Detalle de producto
import { getSiteData } from "../../lib/site";
import { getCurrentDomain } from "../../lib/domain-check";
import { getShopProductBySlug } from "../../lib/shop/shop-queries";

const domain = getCurrentDomain(Astro.request);
const siteData = await getSiteData(domain);
const { slug } = Astro.params;

// ⚠️ CAPA 3: Guard — Tienda deshabilitada → 404
if (!siteData || !siteData.shop?.enabled) {
  return Astro.redirect("/404");
}

// ⚠️ CAPA 3: Guard — Producto no activo → 404 (aunque tienda habilitada)
const product = await getShopProductBySlug(domain, slug);
if (!product || product.status !== "active") {
  return Astro.redirect("/404");
}
---
```

#### Capa 4: Frontend Guard

El frontend JS refuerza lo que ya garantiza el backend:

```typescript
// En Navbar.astro — Condición de renderizado
{siteData?.shop?.enabled && (
  <a href="/tienda" class="navbar-link">{t('shop:label-shop-nav')}</a>
)}

// En PublicLayout.astro — FeaturedProducts condicional
{siteData?.shop?.enabled && siteData?.shop?.enableFeatured && (
  <FeaturedProducts domain={domain} currencySymbol={siteData.shop.currencySymbol || "€"} />
)}

// En CartIcon.astro — Solo visible si tienda habilitada Y carrito habilitado
{siteData?.shop?.enabled && siteData?.shop?.enableCart && (
  <CartIcon client:load />
)}
```

---

## 3. Matriz de Roles y Permisos

### 3.1 Roles del Sistema

| Rol | Descripción | Acceso al Admin | Acceso a Tienda Admin |
|-----|-------------|-----------------|----------------------|
| **admin** | Propietario del sitio | Completo | Completo (CRUD, config, pedidos) |
| **editor** | Editor de contenido | Limitado | Puede gestionar productos y pedidos, NO puede cambiar config de tienda ni eliminar productos |
| **viewer** | Solo lectura | Solo Dashboard | Solo ve productos y pedidos, no puede crear/editar/eliminar |

### 3.2 Matriz Detallada de Permisos

| Acción | admin | editor | viewer | Público |
|--------|-------|--------|--------|---------|
| **Ver dashboard de tienda** | ✅ | ✅ | ✅ | ❌ |
| **Ver lista de productos** | ✅ | ✅ | ✅ | ❌ |
| **Ver producto individual (admin)** | ✅ | ✅ | ✅ | ❌ |
| **Crear producto** | ✅ | ✅ | ❌ | ❌ |
| **Editar producto** | ✅ | ✅ (solo propios) | ❌ | ❌ |
| **Eliminar producto** | ✅ | ❌ | ❌ | ❌ |
| **Cambiar estado de producto** | ✅ | ✅ | ❌ | ❌ |
| **Bulk actions (productos)** | ✅ | ✅ (no eliminar) | ❌ | ❌ |
| **Ver categorías** | ✅ | ✅ | ✅ | ❌ |
| **Crear/Editar categoría** | ✅ | ✅ | ❌ | ❌ |
| **Eliminar categoría** | ✅ | ❌ | ❌ | ❌ |
| **Ver pedidos** | ✅ | ✅ | ✅ | ❌ |
| **Cambiar estado de pedido** | ✅ | ✅ | ❌ | ❌ |
| **Ver detalle de pedido** | ✅ | ✅ | ✅ | ❌ |
| **Añadir notas admin a pedido** | ✅ | ✅ | ❌ | ❌ |
| **Configuración de tienda** | ✅ | ❌ | ❌ | ❌ |
| **Habilitar/Deshabilitar tienda** | ✅ | ❌ | ❌ | ❌ |
| **Ver productos públicos** | ✅ | ✅ | ✅ | ✅ (solo activos) |
| **Ver detalle producto público** | ✅ | ✅ | ✅ | ✅ (solo activos) |
| **Añadir al carrito** | ✅ | ✅ | ✅ | ✅ |
| **Crear pedido (checkout)** | ✅ | ✅ | ✅ | ✅ |

### 3.3 Implementación de Roles en el Admin Panel

```typescript
// En AdminLayout.astro — loadUserRole() ya existe
// Se extiende para aplicar restricciones en la UI

async function applyRolePermissions(role: string) {
  const sidebar = document.getElementById("sidebar-nav");

  // Ocultar enlaces según rol
  if (role === "viewer") {
    // Viewer no ve "Nuevo producto", "Categorías" creables, "Configuración"
    hideSidebarItems(["shop-products-new", "shop-categories-manage", "shop-settings"]);
    disableActionButtons(["btn-new-product", "btn-save", "btn-delete"]);
  }

  if (role === "editor") {
    // Editor no ve "Configuración", "Eliminar producto", "Eliminar categoría"
    hideSidebarItems(["shop-settings"]);
    disableActionButtons(["btn-delete-product", "btn-delete-category", "btn-bulk-delete"]);
  }

  // Exponer rol en data attributes para componentes hijos
  adminApp?.setAttribute("data-user-role", role);
}
```

### 3.4 Protección de API Endpoints Admin

Cada endpoint admin de shop debe verificar el rol:

```typescript
// src/pages/api/admin/shop/products.ts
export async function POST({ request }: { request: Request }) {
  const user = await getCurrentUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const domain = await checkUserSite(user.uid, getCurrentDomain());
  if (!domain) return new Response(JSON.stringify({ error: "No site access" }), { status: 403 });

  // Verificar rol para escritura
  const role = await loadUserRole(domain, user.uid);
  if (role !== "admin" && role !== "editor") {
    return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 });
  }

  // ... procesar creación de producto
}

export async function DELETE({ request }: { request: Request }) {
  // Solo admin puede eliminar
  const role = await loadUserRole(domain, user.uid);
  if (role !== "admin") {
    return new Response(JSON.stringify({ error: "Only admin can delete products" }), { status: 403 });
  }
  // ... procesar eliminación
}
```

---

## 4. Reglas de Visibilidad de Productos

### 4.1 Estados de Producto y su Comportamiento

| Estado | Visible en Tienda Pública | Visible en Admin | Se puede comprar | Aparece en búsqueda pública |
|--------|--------------------------|------------------|------------------|----------------------------|
| `active` | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| `draft` | ❌ No (404 en detalle) | ✅ Sí (badge "Borrador") | ❌ No | ❌ No |
| `archived` | ❌ No (404 en detalle) | ✅ Sí (badge "Archivado", filtrado por defecto) | ❌ No | ❌ No |
| `out_of_stock` | ✅ Sí (con badge "Agotado") | ✅ Sí | ❌ No (botón deshabilitado) | ✅ Sí |

### 4.2 Reglas de Transición de Estados

```
                  ┌─────────┐
                  │  draft  │  ← Producto recién creado, no visible al público
                  └────┬────┘
                       │ admin/editor: "Publicar"
                       ▼
                  ┌─────────┐
          ┌───────│ active  │───────┐
          │       └────┬────┘       │
          │            │            │
          │ stock=0    │            │ admin/editor: "Archivar"
          │ automático │            │
          ▼            │            ▼
   ┌────────────┐      │     ┌──────────┐
   │out_of_stock│◄─────┘     │ archived │
   └──────┬─────┘            └────┬─────┘
          │                       │
          │ stock>0               │ admin: "Reactivar"
          │ automático            │
          └───────────────────────┘
                   ▼
              ┌─────────┐
              │ active  │
              └─────────┘
```

**Reglas de transición automática:**
- `active` + `stock === 0` → `out_of_stock` (si el admin actualiza stock a 0)
- `out_of_stock` + `stock > 0` → `active` (si el admin repone stock)
- `archived` → Solo admin puede reactivar a `active`

### 4.3 Filtrado en Queries

```typescript
// src/lib/shop/shop-queries.ts

export async function getShopProducts(domain: string, opts: ShopProductsQueryOptions) {
  const constraints: any[] = [];

  // Para queries públicas: NUNCA incluir draft ni archived
  if (opts.visibility === "public") {
    constraints.push(where("status", "in", ["active", "out_of_stock"]));
  }

  // Para queries admin: incluir todos, pero con filtro por defecto
  if (opts.visibility === "admin") {
    if (opts.status) {
      constraints.push(where("status", "==", opts.status));
    } else {
      // Por defecto, admin ve todos EXCEPTO archived (para no saturar)
      constraints.push(where("status", "in", ["active", "draft", "out_of_stock"]));
    }
  }

  // ... resto de la query
}
```

---

## 5. Comportamiento Tienda Deshabilitada

### 5.1 ¿Qué sucede cuando `shop.enabled = false`?

| Ruta/Elemento | Comportamiento |
|---------------|---------------|
| `/tienda` | Redirección 404 (Astro Page Guard) |
| `/tienda/[slug]` | Redirección 404 (Astro Page Guard) |
| `/api/shop/products` | Retorna 404 (API Gate) |
| `/api/shop/products/[slug]` | Retorna 404 (API Gate) |
| `/admin/shop` | Dashboard muestra mensaje: "La tienda está deshabilitada. [Habilitar]" con botón directo a settings |
| `/admin/shop/products` | Tabla de productos visible pero con banner: "Tienda deshabilitada — Los productos no son visibles al público" |
| `/admin/shop/products/new` | Bloqueado con mensaje: "Habilita la tienda para crear productos" (solo admin puede habilitar) |
| `/admin/shop/orders` | Accesible (pedidos existentes se pueden seguir gestionando) |
| `/admin/shop/settings` | Accesible solo para admin (donde puede re-habilitar) |
| **Navbar público** | Sin enlace "Tienda" |
| **CartIcon** | No se renderiza |
| **FeaturedProducts** | No aparece en la landing page |
| **Carrito en localStorage** | Se mantiene pero no se puede acceder al checkout |

### 5.2 Flujo de Re-Habilitación

```
admin deshabilita tienda
        │
        ▼
  shop.enabled = false
        │
        ├──► API endpoints públicos → 404
        ├──► Páginas públicas /tienda/* → 404 redirect
        ├──► Navbar → sin enlace Tienda
        ├──► Firestore rules → bloquean lecturas públicas
        │
        └──► Admin puede seguir gestionando:
              - Productos (crear, editar, pero no publicar)
              - Pedidos existentes
              - Configuración (re-habilitar)
```

---

## 6. Modelo de Datos (Firestore)

### 6.1 Extensión de SiteData

Se añade el campo `shop` al tipo `SiteData`:

```typescript
// En src/lib/site.ts — adición al interface SiteData
export interface ShopConfig {
  /** Si false, la tienda NO existe para el público. Ninguna ruta de tienda es accesible. */
  enabled: boolean;
  storeName?: string;
  storeDescription?: string;
  currency?: string;            // "EUR", "USD", "MXN", etc. Default: "EUR"
  currencySymbol?: string;      // "€", "$". Default: "€"
  productsPerPage?: number;     // Default: 12
  enableCart?: boolean;         // Default: true
  enableFeatured?: boolean;     // Mostrar destacados en landing. Default: true
  featuredProductIds?: string[];// IDs de productos destacados (referencias a products/)
  contactEmail?: string;        // Email para notificaciones de pedidos
  /** Timestamp de la última vez que se modificó la configuración */
  updatedAt?: string;
}

// SiteData existente se extiende con:
export interface SiteData {
  // ... campos existentes ...
  shop?: ShopConfig;
}
```

### 6.2 Subcolección: `sites/{domain}/products`

```typescript
export type ProductStatus = "active" | "draft" | "archived" | "out_of_stock";
export type ProductType = "physical" | "digital" | "service";
export type ProductVisibility = "public" | "hidden";

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;                 // URL amigable, único dentro del sitio
  description: string;          // Descripción corta (plain text, max 500 chars)
  longDescription?: string;     // Descripción larga (HTML sanitizado)
  price: number;                // Precio > 0, máximo 2 decimales
  compareAtPrice?: number;      // Precio anterior (debe ser > price para mostrar descuento)
  images: ShopProductImage[];   // Mínimo 1 para estado "active"
  categoryId?: string;          // Referencia al documento en categories/
  categoryName?: string;        // Denormalizado para queries rápidas
  tags?: string[];              // Máximo 10 tags
  status: ProductStatus;
  type: ProductType;
  stock?: number;               // null = ilimitado, 0 = agotado
  sku?: string;
  weight?: number;              // Peso en kg (para envíos futuros)
  isFeatured?: boolean;         // Producto destacado
  seoTitle?: string;            // Máximo 70 caracteres
  seoDescription?: string;      // Máximo 160 caracteres
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  createdBy: string;            // UID del admin/editor que lo creó
  updatedBy: string;            // UID del último que lo modificó
}

export interface ShopProductImage {
  url: string;                  // URL de Firebase Storage
  alt?: string;                 // Texto alternativo (max 125 chars)
  isMain?: boolean;             // Solo una imagen puede ser main
  order?: number;               // Orden de visualización
}
```

**Índices requeridos en Firestore:**

| Colección | Campos indexados | Tipo | Propósito |
|-----------|-----------------|------|-----------|
| `products` | `status` ASC, `createdAt` DESC | Compuesto | Listar por estado (admin) |
| `products` | `categoryId` ASC, `status` ASC | Compuesto | Filtrar por categoría |
| `products` | `isFeatured` ASC, `status` ASC | Compuesto | Productos destacados |
| `products` | `slug` ASC | Simple | Búsqueda por slug |
| `products` | `tags` | Array Contains | Búsqueda por tags |

### 6.3 Subcolección: `sites/{domain}/categories`

```typescript
export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;            // Para categorías anidadas (futuro)
  order: number;                // Orden de visualización
  productCount?: number;        // Denormalizado (se actualiza al añadir/quitar productos)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 6.4 Subcolección: `sites/{domain}/orders`

```typescript
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface ShopOrder {
  id: string;
  orderNumber: string;          // Formato: #SHOP-{TIMESTAMP}-{RANDOM4} (ej: #SHOP-1725148800-A3F2)
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: ShopOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  status: OrderStatus;
  notes?: string;
  adminNotes?: string;
  shippingAddress?: ShopAddress;
  billingAddress?: ShopAddress;
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrderItem {
  productId: string;
  productName: string;          // Denormalizado
  productImage?: string;        // Denormalizado
  price: number;                // Precio en el momento de la compra
  quantity: number;             // > 0, entero
  subtotal: number;             // price * quantity
}

export interface ShopAddress {
  fullName: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone?: string;
}
```

### 6.5 Validaciones de Datos por Campo

| Campo | Validación |
|-------|-----------|
| `product.name` | Requerido, 3-200 chars, sin HTML tags |
| `product.slug` | Requerido, único en el sitio, kebab-case, 3-150 chars |
| `product.price` | Requerido, > 0, máximo 2 decimales, máximo 999999.99 |
| `product.compareAtPrice` | Debe ser > price si se especifica |
| `product.images` | Mínimo 1 para status "active", máximo 10 |
| `product.description` | Requerido, 10-500 chars, sanitizado |
| `product.longDescription` | HTML sanitizado (solo tags seguros), máximo 50000 chars |
| `product.tags` | Máximo 10, cada tag 2-30 chars, sin duplicados |
| `product.stock` | null o entero ≥ 0 |
| `product.sku` | Alfanumérico, guiones, 3-50 chars, único en el sitio |
| `product.seoTitle` | Máximo 70 caracteres |
| `product.seoDescription` | Máximo 160 caracteres |
| `category.name` | Requerido, 2-100 chars |
| `category.slug` | Requerido, único, kebab-case |
| `order.customerEmail` | Requerido, email válido |
| `order.customerName` | Requerido, 2-150 chars |
| `order.items` | Mínimo 1 item, quantity ≥ 1 |

---

## 7. Arquitectura de la Sección Pública (Tienda)

### 7.1 Estructura de Archivos

```
src/pages/
├── tienda.astro                    ← GET /tienda (grid de productos con filtros)
├── tienda/
│   └── [slug].astro                ← GET /tienda/[slug] (detalle de producto)

src/pages/api/shop/
├── products.ts                     ← GET /api/shop/products?domain=X
└── orders.ts                       ← POST /api/shop/orders (crear pedido)

src/components/public/shop/
├── ShopLayout.astro                ← Layout común de tienda
├── ProductGrid.astro               ← Grid responsivo con skeletons y empty state
├── ProductCard.astro               ← Tarjeta con estados: normal, descuento, agotado
├── ProductDetail.astro             ← Vista completa de producto
├── FeaturedProducts.astro          ← Sección de destacados (landing)
├── CategoryFilter.astro            ← Filtro por categorías
├── CartIcon.astro                  ← Icono carrito con badge numérico
├── CartDrawer.astro                ← Panel lateral del carrito
└── SearchBar.astro                 ← Barra de búsqueda debounced
```

### 7.2 Reglas Estrictas de Renderizado Público

1. **Toda página de tienda** inicia con `if (!siteData?.shop?.enabled) return Astro.redirect("/404")`
2. **Todo producto mostrado** debe tener `status === "active" || status === "out_of_stock"`
3. **Nunca se filtra por status desde el cliente** — el servidor siempre fuerza `status: "active"`
4. **Si un producto está agotado**, se muestra con badge "Agotado" y botón de compra deshabilitado
5. **Si un producto está en descuento** (`compareAtPrice > price`), se muestra el descuento visualmente

### 7.3 Componente ProductCard — Estados

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│    ESTADO NORMAL      │  │   ESTADO DESCUENTO   │  │   ESTADO AGOTADO     │
│                      │  │                      │  │                      │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │                │  │  │  │    [OFERTA]    │  │  │  │   [AGOTADO]    │  │
│  │     IMAGEN     │  │  │  │                │  │  │  │                │  │
│  │                │  │  │  │    IMAGEN      │  │  │  │  IMAGEN (50%)  │  │
│  └────────────────┘  │  │  └────────────────┘  │  │  └────────────────┘  │
│                      │  │                      │  │                      │
│  Nombre producto     │  │  Nombre producto     │  │  Nombre producto     │
│  29,99 €             │  │  49,99€  29,99 €     │  │  29,99 €             │
│  [Añadir al carrito] │  │  [Añadir al carrito] │  │  [No disponible]    │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### 7.4 API Endpoints Públicos — Especificación

#### `GET /api/shop/products`

```
Parámetros aceptados (todos sanitizados):
  domain    (required) - Dominio del sitio
  category  (optional) - Slug o ID de categoría
  search    (optional) - Término de búsqueda (mín 2 chars, máx 100)
  page      (optional) - Número de página, default 1
  limit     (optional) - Items por página, default 12, máx 48
  sort      (optional) - "newest" | "price_asc" | "price_desc" | "name_asc"
  featured  (optional) - "true" para solo destacados

Parámetros NUNCA aceptados del cliente:
  status    - Siempre forzado a ["active", "out_of_stock"]

Respuesta 200:
{
  "products": ShopProduct[],
  "total": number,
  "page": number,
  "totalPages": number,
  "categories": ShopCategory[]  // Para renderizar filtros
}

Respuesta 404:
{ "error": "Shop is disabled or site not found" }

Respuesta 400:
{ "error": "Invalid domain parameter" }
```

#### `POST /api/shop/orders`

```
Body (JSON, validado y sanitizado):
{
  "domain": string,           // requerido
  "customerName": string,     // requerido, 2-150 chars
  "customerEmail": string,    // requerido, email válido
  "customerPhone": string,    // opcional
  "items": [{                 // requerido, mín 1
    "productId": string,
    "quantity": number        // ≥ 1
  }],
  "notes": string,            // opcional, máx 500 chars
  "shippingAddress": {        // opcional
    "fullName": string,
    "address": string,
    "city": string,
    "zipCode": string,
    "country": string
  }
}

Validaciones:
  - Verificar shop.enabled
  - Verificar que cada productId existe y está activo
  - Verificar stock disponible para cada item
  - Recalcular precios desde Firestore (NUNCA confiar en precios del cliente)
  - Sanitizar todos los campos de texto

Respuesta 201:
{
  "success": true,
  "orderNumber": "#SHOP-1725148800-A3F2",
  "orderId": "abc123"
}

Respuesta 400:
{ "error": "Validation failed", "details": [...] }

Respuesta 404:
{ "error": "Shop is disabled" }
```

---

## 8. Arquitectura del Panel Admin (Gestión de Tienda)

### 8.1 Estructura de Archivos

```
src/pages/admin/
├── shop.astro                         ← Dashboard de tienda
├── shop/
│   ├── products.astro                 ← Listado de productos (tabla avanzada)
│   ├── products/
│   │   ├── new.astro                  ← Crear producto
│   │   └── [id].astro                 ← Editar producto
│   ├── categories.astro               ← Gestión de categorías
│   ├── orders.astro                   ← Listado de pedidos
│   ├── orders/
│   │   └── [id].astro                 ← Detalle de pedido
│   └── settings.astro                 ← Configuración de tienda (solo admin)

src/pages/api/admin/shop/
├── products.ts                        ← CRUD productos
├── orders.ts                          ← Gestión de pedidos
├── categories.ts                      ← CRUD categorías
└── settings.ts                        ← GET/PUT configuración

src/components/admin/shop/
├── ShopManager.ts
├── ProductList.ts
├── ProductEditor.ts
├── OrderManager.ts
├── OrderDetail.ts
├── CategoryManager.ts
└── ShopSettings.ts

src/lib/shop/
├── types.ts
├── shop-queries.ts
├── shop-mutations.ts
├── shop-helpers.ts
├── shop-validators.ts                 ← NUEVO: Validaciones centralizadas
├── shop-access.ts                     ← NUEVO: Funciones de control de acceso
└── cart.ts
```

### 8.2 Sidebar — Visibilidad por Rol

```html
<!-- En AdminLayout.astro -->

<!-- Enlace Tienda (visible para admin, editor, viewer) -->
<a href="/admin/shop" class="sidebar-link" data-nav="shop" data-tooltip="Tienda"
   data-required-role="admin,editor,viewer">
  <!-- SVG icon -->
  <span class="sidebar-label">Tienda</span>
</a>
```

**Reglas de visibilidad en sidebar:**
- `shop-settings` → solo visible si `role === "admin"`
- `btn-delete-product` → solo visible si `role === "admin"`
- `btn-new-product` → visible para `admin` y `editor`

### 8.3 Páginas Admin — Comportamiento por Rol

#### Dashboard (`/admin/shop`) — Visible para admin, editor, viewer

- admin/editor: stats completas + accesos rápidos
- viewer: solo stats (sin botones de acción)

#### Productos (`/admin/shop/products`) — Visible para admin, editor, viewer

- admin: CRUD completo, bulk actions incluyendo eliminar
- editor: CRUD sin eliminar, bulk actions sin eliminar
- viewer: solo lectura, sin checkboxes, sin botones de acción

#### Editor de Producto — admin + editor

- admin: puede cambiar cualquier campo, incluyendo `createdBy`
- editor: solo puede editar productos que creó (`createdBy === uid`) o cualquier producto (configurable)

#### Configuración (`/admin/shop/settings`) — SOLO admin

- viewer y editor: redirigidos al dashboard con toast "Acceso restringido"

### 8.4 Validación de Roles en Componentes JS

```typescript
// src/components/admin/shop/ProductList.ts

export function initProductList(): void {
  document.addEventListener("admin:ready", ((e: CustomEvent) => {
    const { siteDomain } = e.detail;
    const role = getCurrentUserRole(); // Lee de data-user-role o __loadUserRole()

    setup(siteDomain, role);
  }) as EventListener);
}

function setup(domain: string, role: string): void {
  // Configurar UI según rol
  if (role === "viewer") {
    // Ocultar botones de acción
    document.querySelectorAll(".btn-delete, .btn-edit, .btn-new, .bulk-actions").forEach(el => {
      (el as HTMLElement).style.display = "none";
    });
    // Ocultar checkboxes
    document.querySelectorAll(".product-checkbox").forEach(el => {
      (el as HTMLElement).style.display = "none";
    });
  }

  if (role === "editor") {
    // Ocultar solo botones de eliminar
    document.querySelectorAll(".btn-delete, .btn-bulk-delete").forEach(el => {
      (el as HTMLElement).style.display = "none";
    });
  }

  loadProducts(domain, role);
}

function loadProducts(domain: string, role: string): void {
  // admin/editor ven todos los estados
  // viewer solo ve activos y agotados (misma vista que admin pero sin acciones)
}
```

---

## 9. Flujos de Usuario Completos

### 9.1 Flujo Público: Comprador

```
Visitante → Landing (FeaturedProducts) → /tienda → /tienda/[slug] → CartDrawer → Checkout → Confirmación
                                                                                      │
                                                                        ┌─────────────▼─────────────┐
                                                                        │ Validaciones en checkout:  │
                                                                        │ - shop.enabled === true    │
                                                                        │ - producto activo          │
                                                                        │ - stock suficiente         │
                                                                        │ - precio recalculado       │
                                                                        │ - email válido             │
                                                                        └───────────────────────────┘
```

### 9.2 Flujo Admin — Con Roles

```
Admin → Sidebar Tienda → Dashboard → Productos → Nuevo/Editar (CRUD completo)
                                     → Categorías → Nueva/Editar (CRUD completo)
                                     → Pedidos → Detalle → Cambiar estado
                                     → Configuración (solo admin)

Editor → Sidebar Tienda → Dashboard → Productos → Nuevo/Editar (sin eliminar)
                                      → Categorías → Nueva/Editar (sin eliminar)
                                      → Pedidos → Detalle → Cambiar estado
                                      → Configuración (ACCESO DENEGADO)

Viewer → Sidebar Tienda → Dashboard (solo stats)
                         → Productos (solo lectura)
                         → Pedidos (solo lectura)
                         → Categorías (solo lectura)
                         → Configuración (ACCESO DENEGADO)
```

---

## 10. Sistema i18n para la Tienda

### 10.1 Namespace `shop`

Se crea `src/lib/i18n/modules/shop.ts` con 120+ keys. Ver sección 6 del documento original para la lista completa.

### 10.2 Keys Adicionales para Control de Acceso

```typescript
// Añadir al namespace shop:

// === Acceso y Roles ===
"err-shop-disabled": "La tienda está deshabilitada en este momento.",
"err-shop-disabled-admin": "La tienda está deshabilitada. Los productos no son visibles al público.",
"err-insufficient-permissions": "No tienes permisos para realizar esta acción.",
"err-admin-only": "Solo el administrador puede realizar esta acción.",
"err-editor-cannot-delete": "Los editores no pueden eliminar productos. Contacta al administrador.",
"label-role-admin": "Administrador",
"label-role-editor": "Editor",
"label-role-viewer": "Visualizador",
"hint-shop-disabled-banner": "La tienda está deshabilitada. Habilítala en Configuración para que los productos sean visibles al público.",
"btn-enable-shop": "Habilitar tienda",
```

---

## 11. Plan de Implementación por Fases (Reforzado)

### Fase 0: Documentación y Acuerdo (COMPLETADA ✅)

- [x] Especificación completa v2.0 con control de acceso multi-capa
- [x] Matriz de roles y permisos
- [x] Reglas de visibilidad de productos
- [x] Comportamiento tienda deshabilitada

### Fase 1: Infraestructura y Control de Acceso (Sector Admin + Sector Public)

- [ ] **1.1** Crear `src/lib/shop/types.ts` con TODAS las interfaces
- [ ] **1.2** Crear `src/lib/shop/shop-access.ts`:
  - `checkShopEnabled(domain)` → verifica shop.enabled
  - `checkProductAccess(product, role)` → verifica si un rol puede ver/editar un producto
  - `checkRoleAccess(role, action)` → verifica permisos según matriz
- [ ] **1.3** Crear `src/lib/shop/shop-validators.ts`:
  - `validateProduct(data)` → validación completa de producto
  - `validateOrder(data)` → validación de pedido
  - `validateCategory(data)` → validación de categoría
  - `sanitizeShopInput(input)` → sanitización específica de tienda
- [ ] **1.4** Extender `SiteData` con `ShopConfig`
- [ ] **1.5** Crear `src/lib/shop/shop-queries.ts` (con filtros de visibilidad)
- [ ] **1.6** Crear `src/lib/shop/shop-mutations.ts` (con verificación de roles)
- [ ] **1.7** Crear `src/lib/shop/shop-helpers.ts`
- [ ] **1.8** Crear `src/lib/shop/cart.ts`
- [ ] **1.9** Crear namespace i18n shop (completo, 130+ keys)
- [ ] **1.10** Registrar módulo en i18n
- [ ] **1.11** Actualizar `firebase/firestore.rules` con reglas shop + isShopEnabled
- [ ] **1.12** Actualizar `firebase/firestore.indexes.json`
- [ ] **1.13** `npm run qa` + `npm run i18n:check` → 0 errores

### Fase 2: API Endpoints Admin con Control de Roles

- [ ] **2.1** `src/pages/api/admin/shop/products.ts` (CRUD con verificación de roles)
- [ ] **2.2** `src/pages/api/admin/shop/categories.ts`
- [ ] **2.3** `src/pages/api/admin/shop/orders.ts`
- [ ] **2.4** `src/pages/api/admin/shop/settings.ts`
- [ ] **2.5** `npm run build` + `npm run qa`

### Fase 3: Panel Admin UI — Productos, Categorías, Pedidos

- [ ] **3.1** `src/pages/admin/shop.astro` + `ShopManager.ts` (respeta roles)
- [ ] **3.2** `src/pages/admin/shop/products.astro` + `ProductList.ts` (respeta roles)
- [ ] **3.3** `src/pages/admin/shop/products/new.astro` + `ProductEditor.ts`
- [ ] **3.4** `src/pages/admin/shop/products/[id].astro` + `ProductEditor.ts`
- [ ] **3.5** `src/pages/admin/shop/categories.astro` + `CategoryManager.ts` (respeta roles)
- [ ] **3.6** `src/pages/admin/shop/orders.astro` + `OrderManager.ts` (respeta roles)
- [ ] **3.7** `src/pages/admin/shop/orders/[id].astro` + `OrderDetail.ts`
- [ ] **3.8** Actualizar `AdminLayout.astro` — sidebar con data-required-role
- [ ] **3.9** `npm run build` + `npm run qa`

### Fase 4: Configuración de Tienda (Solo Admin)

- [ ] **4.1** `src/pages/admin/shop/settings.astro` + `ShopSettings.ts`
- [ ] **4.2** Toggle `shop.enabled` con confirmación modal ("¿Seguro? La tienda dejará de ser visible")
- [ ] **4.3** Banner en admin cuando tienda deshabilitada
- [ ] **4.4** `npm run build` + `npm run qa`

### Fase 5: API Endpoints Públicos y Páginas de Tienda

- [ ] **5.1** `src/pages/api/shop/products.ts` (con API Gate: verifica shop.enabled + sanitiza)
- [ ] **5.2** `src/pages/api/shop/orders.ts` (POST con recalculo de precios)
- [ ] **5.3** `src/pages/tienda.astro` (con Astro Page Guard)
- [ ] **5.4** `src/pages/tienda/[slug].astro` (con Astro Page Guard + verificación de producto activo)
- [ ] **5.5** Componentes públicos: ShopLayout, ProductGrid, ProductCard, ProductDetail, etc.
- [ ] **5.6** Navbar.astro — enlace condicional
- [ ] **5.7** PublicLayout.astro — FeaturedProducts condicional
- [ ] **5.8** CartIcon, CartDrawer
- [ ] **5.9** `npm run build` + `npm run qa`

### Fase 6: Testing y QA

- [ ] **6.1** `tests/shop-access.test.ts` — Control de acceso multi-capa
- [ ] **6.2** `tests/shop-validators.test.ts` — Validaciones de datos
- [ ] **6.3** `tests/shop-roles.test.ts` — Matriz de permisos
- [ ] **6.4** `tests/shop-helpers.test.ts`
- [ ] **6.5** `tests/shop-cart.test.ts`
- [ ] **6.6** `tests/shop-queries.test.ts`
- [ ] **6.7** `tests/shop-visibility.test.ts` — Reglas de visibilidad de productos
- [ ] **6.8** `tests/shop-disabled.test.ts` — Escenarios con tienda deshabilitada
- [ ] **6.9** `tests/shop-i18n.test.ts`
- [ ] **6.10** `npm run qa` 100% PASS + `npm run build` limpio

### Fase 7: Documentación y Cierre

- [ ] Actualizar TASK_LIST.md, AGENTS.md, skills TASK_LISTs
- [ ] Mensaje de commit descriptivo

---

## 12. Validación y QA Gate

### 12.1 Criterios de Aceptación

| # | Criterio | Método |
|---|----------|--------|
| 1 | Build limpio | `npm run build` 0 errores |
| 2 | i18n parity | `npm run i18n:check` 0 errores |
| 3 | Tests 100% | `npm run qa` todos verdes |
| 4 | Tienda deshabilitada → 404 en todas las rutas públicas | Test manual/automático |
| 5 | Tienda deshabilitada → API retorna 404 | Test unitario |
| 6 | Tienda deshabilitada → Admin puede seguir gestionando | Test manual |
| 7 | Producto draft → no visible en público | Test unitario |
| 8 | Producto archived → no visible en público | Test unitario |
| 9 | Producto out_of_stock → visible pero no comprable | Test unitario |
| 10 | Viewer no puede crear/editar/eliminar | Test de roles |
| 11 | Editor no puede eliminar | Test de roles |
| 12 | Editor no puede acceder a config | Test de roles |
| 13 | Solo admin puede habilitar/deshabilitar tienda | Test de roles |
| 14 | Firestore rules bloquean lectura pública si shop disabled | Test de reglas |
| 15 | API recalcula precios (no confía en cliente) | Test unitario |
| 16 | Sin imports cruzados admin↔public | Revisión de código |
| 17 | Variables CSS del tema en componentes públicos | Revisión de código |

### 12.2 Matriz de Tests Mínimos (70+ tests)

| Archivo | Mínimo Tests | Enfoque |
|---------|-------------|---------|
| `tests/shop-access.test.ts` | 12 | Multi-capa, shop disabled, roles |
| `tests/shop-validators.test.ts` | 15 | Validación de campos, edge cases, sanitización |
| `tests/shop-roles.test.ts` | 10 | Matriz completa admin/editor/viewer |
| `tests/shop-helpers.test.ts` | 10 | Slug, precios, imágenes, helpers |
| `tests/shop-cart.test.ts` | 8 | CRUD carrito, localStorage |
| `tests/shop-queries.test.ts` | 8 | Filtros, paginación, visibilidad |
| `tests/shop-visibility.test.ts` | 8 | Reglas de estado de producto |
| `tests/shop-disabled.test.ts` | 6 | Escenarios con tienda off |
| `tests/shop-i18n.test.ts` | 3 | Paridad es/en |
| **TOTAL** | **80+** | |

---

## 13. Apéndices

### 13.1 Archivos Nuevos (42 archivos)

```
src/lib/shop/
├── types.ts
├── shop-access.ts          ← NUEVO (control de acceso)
├── shop-validators.ts      ← NUEVO (validaciones)
├── shop-queries.ts
├── shop-mutations.ts
├── shop-helpers.ts
└── cart.ts

src/lib/i18n/modules/
└── shop.ts

src/pages/
├── tienda.astro
├── tienda/[slug].astro
└── api/shop/
    ├── products.ts
    └── orders.ts

src/pages/admin/
├── shop.astro
└── shop/
    ├── products.astro
    ├── products/new.astro
    ├── products/[id].astro
    ├── categories.astro
    ├── orders.astro
    ├── orders/[id].astro
    └── settings.astro

src/pages/api/admin/shop/
├── products.ts
├── orders.ts
├── categories.ts
└── settings.ts

src/components/public/shop/  (9 archivos)
src/components/admin/shop/   (7 archivos)
src/styles/shop.css
tests/                       (9 archivos de test)
```

### 13.2 Archivos a Modificar (10 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/lib/site.ts` | Añadir `ShopConfig` a `SiteData` |
| `src/lib/i18n.ts` | Registrar namespace `shop` |
| `src/lib/sanitizer.ts` | Añadir `sanitizeShopInput()` si es necesario |
| `src/components/admin/AdminLayout.astro` | Sidebar con `data-required-role`, aplicar permisos |
| `src/components/public/Navbar.astro` | Enlace condicional "Tienda" + CartIcon |
| `src/components/public/PublicLayout.astro` | FeaturedProducts condicional |
| `src/styles/admin.css` | Estilos para shop admin |
| `firebase/firestore.rules` | Reglas shop + `isShopEnabled()` |
| `firebase/firestore.indexes.json` | Índices compuestos |
| `TASK_LIST.md` | Actualizar progreso |

---

> **📌 Estado:** Especificación v2.0 completada con control de acceso multi-capa, matriz de roles, reglas de visibilidad y comportamiento de tienda deshabilitada.
> **Siguiente paso:** Revisión y autorización para Fase 1.
> **Agentes:** Sector Admin → Sector Public → QA Auditor (orquestados secuencialmente).