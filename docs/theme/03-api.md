# API — Endpoints del Sistema de Temas

> **Documento:** 03-api.md
> **Propósito:** Definir todos los endpoints, autenticación, validación y respuestas.

---

## 1. Base URL

```
/api/admin/themes
```

Todas las rutas son relativas a esta base. El servidor corre en Cloudflare Pages + Functions.

---

## 2. Autenticación

### 2.1 Header requerido

```
Authorization: Bearer <firebase-id-token>
```

### 2.2 Verificación de superadmin

Para operaciones de escritura (POST, PUT, DELETE), se verifica que el token pertenezca a `servicioweb.pmi@gmail.com`.

```typescript
const SUPERADMIN_EMAIL = "servicioweb.pmi@gmail.com";

async function verifySuperadmin(request: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email?.toLowerCase();

    if (email !== SUPERADMIN_EMAIL) return null;

    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}
```

### 2.3 Verificación de admin genérico

Para operaciones de solo lectura (GET) y copia, se verifica que el usuario tenga un sitio asociado.

```typescript
async function verifyAdmin(request: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || "" };
  } catch {
    return null;
  }
}
```

---

## 3. Endpoints

### 3.1 `GET /api/admin/themes`

Lista todos los temas default activos.

**Autenticación:** Cualquier admin autenticado

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "classic",
      "name": "Clásico",
      "description": "Estilo tradicional y elegante con tipografía serif.",
      "preview_image": "/images/themes/classic-preview.png",
      "category": "business",
      "sort_order": 1,
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
  ]
}
```

**Respuesta error (401):**
```json
{
  "success": false,
  "error": "No autorizado"
}
```

---

### 3.2 `GET /api/admin/themes/:id`

Obtiene un tema específico por ID.

**Autenticación:** Cualquier admin autenticado

**Parámetros de ruta:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del tema (ej: 'classic', 'modern') |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "classic",
    "name": "Clásico",
    "description": "...",
    "preview_image": "...",
    "category": "business",
    "sort_order": 1,
    "config": { ... }
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "error": "Tema no encontrado"
}
```

---

### 3.3 `POST /api/admin/themes`

Crea un nuevo tema default.

**Autenticación:** Solo superadmin

**Body:**
```json
{
  "id": "mi-tema",
  "name": "Mi Tema",
  "description": "Descripción del tema",
  "preview_image": "/images/themes/mi-tema.png",
  "category": "general",
  "sort_order": 4,
  "config": {
    "primaryColor": "#...",
    "secondaryColor": "#...",
    ...
  }
}
```

**Validaciones:**
- `id`: solo letras minúsculas, números y guiones (`^[a-z0-9-]+$`)
- `name`: requerido, máximo 100 caracteres
- `config`: debe ser un JSON válido con todos los campos requeridos
- `config.colors`: todos deben ser hex válidos (`^#[0-9a-fA-F]{6}$`)
- `config.fontSizeBase`: entre 14 y 20
- `config.maxWidth`: entre 800 y 1400

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Tema 'Mi Tema' creado correctamente",
  "data": {
    "id": "mi-tema",
    "name": "Mi Tema"
  }
}
```

**Respuesta error (400):**
```json
{
  "success": false,
  "error": "El campo 'id' solo puede contener letras minúsculas, números y guiones"
}
```

**Respuesta error (409):**
```json
{
  "success": false,
  "error": "Ya existe un tema con el ID 'mi-tema'"
}
```

---

### 3.4 `PUT /api/admin/themes/:id`

Actualiza un tema existente.

**Autenticación:** Solo superadmin

**Body:** (todos los campos son opcionales, solo se actualizan los enviados)
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "config": { ... }
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Tema 'classic' actualizado correctamente"
}
```

---

### 3.5 `DELETE /api/admin/themes/:id`

Elimina (soft delete) un tema.

**Autenticación:** Solo superadmin

**Query params:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| permanent | boolean | false | Si es true, hace hard delete |

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Tema 'classic' eliminado correctamente"
}
```

---

### 3.6 `POST /api/admin/themes/:id/copy`

Copia un tema default al sitio del usuario.

**Autenticación:** Cualquier admin autenticado con sitio

**Body:**
```json
{
  "siteDomain": "midominio.com"
}
```

**Validaciones:**
- `siteDomain`: requerido, debe ser un dominio válido
- El usuario debe ser owner o tener rol en el sitio
- El tema debe existir y estar activo

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Tema 'Clásico' copiado a midominio.com"
}
```

**Respuesta error (403):**
```json
{
  "success": false,
  "error": "No tienes permisos para modificar este sitio"
}
```

---

## 4. Manejo de Errores

### Formato estándar de error

```json
{
  "success": false,
  "error": "Mensaje descriptivo del error",
  "code": "ERROR_CODE"  // Opcional, para identificación programática
}
```

### Códigos de error

| Código | Significado | HTTP Status |
|--------|-------------|-------------|
| `UNAUTHORIZED` | No autenticado | 401 |
| `FORBIDDEN` | No tiene permisos (no es superadmin) | 403 |
| `NOT_FOUND` | Tema no encontrado | 404 |
| `CONFLICT` | ID duplicado | 409 |
| `VALIDATION_ERROR` | Datos inválidos | 400 |
| `RATE_LIMITED` | Demasiadas requests | 429 |
| `INTERNAL_ERROR` | Error del servidor | 500 |

---

## 5. Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `GET /api/admin/themes` | 100 requests | 1 minuto |
| `GET /api/admin/themes/:id` | 100 requests | 1 minuto |
| `POST /api/admin/themes` | 10 requests | 1 minuto |
| `PUT /api/admin/themes/:id` | 10 requests | 1 minuto |
| `DELETE /api/admin/themes/:id` | 10 requests | 1 minuto |
| `POST /api/admin/themes/:id/copy` | 20 requests | 1 minuto |

### Respuesta de rate limit (429):
```json
{
  "success": false,
  "error": "Demasiadas solicitudes. Intenta de nuevo en 45 segundos.",
  "code": "RATE_LIMITED",
  "retryAfter": 45
}
```

---

## 6. Ejemplos de Uso (cURL)

### Listar temas
```bash
curl -H "Authorization: Bearer <token>" \
  https://midominio.com/api/admin/themes
```

### Obtener un tema
```bash
curl -H "Authorization: Bearer <token>" \
  https://midominio.com/api/admin/themes/classic
```

### Crear un tema (superadmin)
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "mi-tema",
    "name": "Mi Tema",
    "description": "Descripción",
    "config": { ... }
  }' \
  https://midominio.com/api/admin/themes
```

### Copiar un tema a un sitio
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"siteDomain": "midominio.com"}' \
  https://midominio.com/api/admin/themes/classic/copy
```

---

## 7. Implementación Técnica

### Archivo: `src/pages/api/admin/themes/[...slug].ts`

El endpoint usa una ruta dinámica con `[...slug]` para manejar todos los métodos HTTP en un solo archivo:

```typescript
import type { APIRoute } from "astro";
export const prerender = false;

// GET /api/admin/themes — Lista todos los temas activos
// GET /api/admin/themes/:id — Obtiene un tema específico
export const GET: APIRoute = async ({ request, params }) => { ... };

// POST /api/admin/themes — Crea un nuevo tema (solo superadmin)
// POST /api/admin/themes/:id/copy — Copia un tema a un sitio
export const POST: APIRoute = async ({ request, params }) => { ... };

// PUT /api/admin/themes/:id — Actualiza un tema (solo superadmin)
export const PUT: APIRoute = async ({ request, params }) => { ... };

// DELETE /api/admin/themes/:id — Elimina un tema (solo superadmin)
export const DELETE: APIRoute = async ({ request, params, url }) => { ... };
```

### Archivo: `src/lib/d1/themes.ts`

Funciones exportadas:

| Función | Descripción |
|---------|-------------|
| `listActiveThemes()` | Lista temas activos ordenados |
| `listAllThemes()` | Lista todos (incluyendo inactivos) — solo superadmin |
| `getThemeById(id)` | Obtiene un tema activo por ID |
| `getThemeByIdAll(id)` | Obtiene cualquier tema por ID (incluso inactivos) |
| `createTheme(input)` | Crea un nuevo tema con validación de duplicados |
| `updateTheme(id, updates)` | Actualiza campos parciales, incrementa versión |
| `deleteTheme(id, permanent)` | Soft delete (default) o hard delete |
| `duplicateTheme(sourceId, newId?)` | Duplica un tema existente |
| `listActiveThemesPaginated(page, limit, category?)` | Lista paginada con filtro por categoría |
