# Sistema de Temas por Defecto (Default Themes)

> **Estado:** ✅ Backend implementado — Frontend pendiente
> **Prioridad:** Media
> **Dependencias:** D1 Database configurada y operativa
>
> **Nota:** Este documento es la especificación original. La implementación real está en `docs/theme/` (documentación completa) y `src/lib/d1/`, `src/pages/api/admin/themes/` (código).

---

## 📋 Resumen

Sistema que permite a los administradores de sitio elegir entre temas prediseñados almacenados en D1 (Cloudflare). Solo el superadmin (`servicioweb.pmi@gmail.com`) puede crear/editar/eliminar temas default. Los demás admins pueden copiarlos a su sitio.

---

## 🗄️ Base de Datos (D1)

### Tabla: `default_themes`

```sql
CREATE TABLE IF NOT EXISTS default_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  preview_image TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  config TEXT NOT NULL  -- JSON con la configuración completa del tema
);
```

### Schema completo (añadir a `src/lib/d1/schema.sql`)

```sql
-- ============================================
-- Default Themes
-- ============================================
CREATE TABLE IF NOT EXISTS default_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  preview_image TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  config TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_default_themes_active ON default_themes(is_active);
```

---

## 🎨 Los 3 Temas por Defecto

### 1. Clásico (`classic`)

Estilo tradicional, colores sobrios, tipografía serif.

```json
{
  "name": "Clásico",
  "description": "Estilo tradicional y elegante con tipografía serif",
  "preview_image": "/images/themes/classic-preview.png",
  "config": {
    "primaryColor": "#1e3a5f",
    "secondaryColor": "#3b82f6",
    "accentColor": "#2563eb",
    "bgColor": "#fafaf9",
    "textColor": "#292524",
    "textMutedColor": "#78716c",
    "navbarBg": "#ffffff",
    "navbarText": "#292524",
    "footerBg": "#1e3a5f",
    "footerText": "#fafaf9",
    "fontFamily": "'Merriweather', Georgia, serif",
    "fontHeadings": "'Playfair Display', Georgia, serif",
    "fontSizeBase": 17,
    "fontWeight": "400",
    "layout": "centered",
    "maxWidth": 1100,
    "sectionGap": 64,
    "borderRadius": 4,
    "containerPadding": 24,
    "heroHeight": "medium",
    "heroAlign": "center",
    "heroOverlayColor": "#000000",
    "heroOverlayOpacity": 35,
    "btnBorderRadius": 4,
    "btnPaddingX": 28,
    "btnPaddingY": 12,
    "btnStyle": "filled"
  }
}
```

### 2. Moderno (`modern`)

Colores vibrantes, tipografía sans-serif, layout full-width.

```json
{
  "name": "Moderno",
  "description": "Diseño contemporáneo con colores vibrantes",
  "preview_image": "/images/themes/modern-preview.png",
  "config": {
    "primaryColor": "#6366f1",
    "secondaryColor": "#8b5cf6",
    "accentColor": "#4f46e5",
    "bgColor": "#ffffff",
    "textColor": "#1a1a2e",
    "textMutedColor": "#6b7280",
    "navbarBg": "#ffffff",
    "navbarText": "#1a1a2e",
    "footerBg": "#1e1b4b",
    "footerText": "#e0e7ff",
    "fontFamily": "'Inter', system-ui, sans-serif",
    "fontHeadings": "'Poppins', system-ui, sans-serif",
    "fontSizeBase": 16,
    "fontWeight": "400",
    "layout": "full-width",
    "maxWidth": 1200,
    "sectionGap": 80,
    "borderRadius": 8,
    "containerPadding": 24,
    "heroHeight": "large",
    "heroAlign": "center",
    "heroOverlayColor": "#000000",
    "heroOverlayOpacity": 40,
    "btnBorderRadius": 8,
    "btnPaddingX": 24,
    "btnPaddingY": 14,
    "btnStyle": "filled"
  }
}
```

### 3. Oscuro (`dark`)

Dark mode completo, acentos neón, tipografía moderna.

```json
{
  "name": "Oscuro",
  "description": "Tema oscuro moderno con acentos brillantes",
  "preview_image": "/images/themes/dark-preview.png",
  "config": {
    "primaryColor": "#818cf8",
    "secondaryColor": "#a78bfa",
    "accentColor": "#6366f1",
    "bgColor": "#0f172a",
    "textColor": "#e2e8f0",
    "textMutedColor": "#94a3b8",
    "navbarBg": "#1e293b",
    "navbarText": "#e2e8f0",
    "footerBg": "#020617",
    "footerText": "#94a3b8",
    "fontFamily": "'Inter', system-ui, sans-serif",
    "fontHeadings": "'Montserrat', system-ui, sans-serif",
    "fontSizeBase": 16,
    "fontWeight": "300",
    "layout": "centered",
    "maxWidth": 1200,
    "sectionGap": 72,
    "borderRadius": 10,
    "containerPadding": 24,
    "heroHeight": "medium",
    "heroAlign": "center",
    "heroOverlayColor": "#000000",
    "heroOverlayOpacity": 50,
    "btnBorderRadius": 10,
    "btnPaddingX": 28,
    "btnPaddingY": 14,
    "btnStyle": "filled"
  }
}
```

---

## 🔐 Roles y Permisos

| Acción | Superadmin (`servicioweb.pmi@gmail.com`) | Admin de sitio | Editor |
|--------|------------------------------------------|----------------|--------|
| Ver temas default | ✅ | ✅ | ✅ |
| Copiar tema a su sitio | ✅ | ✅ | ❌ |
| Crear tema default | ✅ | ❌ | ❌ |
| Editar tema default | ✅ | ❌ | ❌ |
| Eliminar tema default | ✅ | ❌ | ❌ |

### Verificación de superadmin

```typescript
const SUPERADMIN_EMAIL = "servicioweb.pmi@gmail.com";

function isSuperadmin(email: string | null | undefined): boolean {
  return email?.toLowerCase() === SUPERADMIN_EMAIL;
}
```

---

## 📡 API Endpoints

### Base URL: `/api/admin/themes`

#### `GET /api/admin/themes`
Lista todos los temas default activos.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "classic",
      "name": "Clásico",
      "description": "Estilo tradicional y elegante con tipografía serif",
      "preview_image": "/images/themes/classic-preview.png",
      "config": { ... }
    }
  ]
}
```

#### `POST /api/admin/themes`
Crea un nuevo tema default. Solo superadmin.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "id": "mi-tema",
  "name": "Mi Tema",
  "description": "Descripción",
  "preview_image": "/images/themes/mi-tema.png",
  "config": { ... }
}
```

#### `PUT /api/admin/themes/:id`
Actualiza un tema existente. Solo superadmin.

#### `DELETE /api/admin/themes/:id`
Elimina un tema. Solo superadmin.

#### `POST /api/admin/themes/:id/copy`
Copia un tema default al sitio del usuario autenticado.

**Body:**
```json
{
  "siteDomain": "midominio.com"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Tema 'Clásico' copiado a midominio.com"
}
```

---

## 🖥️ UI / Frontend

### Sección en `/admin/theme`

Añadir al inicio del formulario de personalización:

```
┌─────────────────────────────────────────────┐
│  🎨 Temas prediseñados                      │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ CLÁSICO  │  │ MODERNO  │  │  OSCURO  │  │
│  │ [preview]│  │ [preview]│  │ [preview]│  │
│  │          │  │          │  │          │  │
│  │ [Usar]   │  │ [Usar]   │  │ [Usar]   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ───────────────────────────────────────    │
│  Personalización manual (formulario actual) │
└─────────────────────────────────────────────┘
```

### Comportamiento al hacer clic en "Usar"

1. Mostrar confirmación: "¿Aplicar el tema [nombre]? Se sobrescribirá tu configuración actual."
2. Llamar a `POST /api/admin/themes/:id/copy`
3. Recargar el formulario con los valores del tema
4. Mostrar feedback de éxito

---

## 📁 Archivos a Implementar

### Nuevos archivos

| Archivo | Propósito |
|---------|-----------|
| `src/pages/api/admin/themes.ts` | API endpoint CRUD para temas default |
| `src/lib/d1/themes.ts` | Funciones de acceso a D1 para temas default |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/lib/d1/schema.sql` | Añadir tabla `default_themes` |
| `src/lib/d1/index.ts` | Exportar funciones de `themes.ts` |
| `src/pages/admin/theme.astro` | Añadir sección de temas prediseñados |
| `src/components/admin/ThemeConfig.ts` | Añadir lógica de carga/copia de temas |
| `wrangler.toml` | Descomentar configuración de D1 |

---

## 🚀 Script de Seed

Para poblar la base de datos con los 3 temas iniciales:

```bash
# Comando para insertar los temas default en D1
npx wrangler d1 execute mi-web-personalizable-db --command="
  INSERT OR REPLACE INTO default_themes (id, name, description, config) VALUES
  ('classic', 'Clásico', 'Estilo tradicional y elegante con tipografía serif', '...json...'),
  ('modern', 'Moderno', 'Diseño contemporáneo con colores vibrantes', '...json...'),
  ('dark', 'Oscuro', 'Tema oscuro moderno con acentos brillantes', '...json...');
"
```

O crear un script `scripts/seed-default-themes.mjs` que lea los JSON y los inserte.

---

## ✅ Checklist de Implementación

### ✅ Completado (Backend)
- [x] Descomentar configuración de D1 en `wrangler.toml`
- [x] Añadir tabla `default_themes` a `migrations/001-create-default-themes.sql`
- [x] Crear `src/lib/d1/client.ts` con factory + mock
- [x] Crear `src/lib/d1/themes.ts` con 9 funciones CRUD
- [x] Crear `src/pages/api/admin/themes/[...slug].ts` con endpoints
- [x] Implementar verificación de superadmin en API
- [x] Crear script de seed `scripts/seed-default-themes.mjs`
- [x] Crear script de seed `scripts/seed-default-themes.sql`
- [x] Documentación completa en `docs/theme/`

### ⬜ Pendiente (Frontend)
- [ ] Añadir sección de temas prediseñados en `theme.astro`
- [ ] Añadir lógica de copia en `ThemeConfig.ts`
- [ ] Probar flujo completo: ver → copiar → personalizar
