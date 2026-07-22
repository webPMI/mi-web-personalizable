# Superadmin — Panel y Herramientas

> **Documento:** 06-superadmin.md
> **Propósito:** Describir las herramientas, panel y flujos exclusivos del superadmin para gestionar temas.
> **Estado:** ⬜ Pendiente de implementar (especificación completa para desarrollo futuro)
>
> **Nota:** Las funciones CRUD del backend (API + D1) ya están implementadas. Falta la UI del panel superadmin.

---

## 1. Identidad del Superadmin

| Campo | Valor |
|-------|-------|
| **Email** | `servicioweb.pmi@gmail.com` |
| **Rol** | Superadmin |
| **Permisos** | CRUD completo sobre temas default |
| **Autenticación** | Firebase Auth (Google) |

---

## 2. ¿Dónde se gestionan los temas?

### Opción A: Panel oculto en `/admin/themes-manager`

Ruta protegida que solo se muestra si el usuario autenticado es superadmin.

```astro
---
// src/pages/admin/themes-manager.astro
// Solo accesible para servicioweb.pmi@gmail.com
---

<AdminLayout>
  <div class="card">
    <h2>Gestión de Temas Globales</h2>
    <p class="text-muted">
      Panel exclusivo para superadmin. Gestiona los temas prediseñados
      que verán todos los administradores de sitio.
    </p>

    <!-- Lista de temas con opciones de edición -->
    <div id="superadmin-themes-container">
      <!-- Renderizado dinámico -->
    </div>

    <!-- Botón para crear nuevo tema -->
    <button id="btn-create-theme" class="btn btn-primary">
      + Nuevo tema
    </button>
  </div>
</AdminLayout>

<script>
  import { initSuperadminThemes } from "../../components/admin/SuperadminThemes";
  initSuperadminThemes();
</script>
```

### Opción B: Botón "Gestionar temas" en `/admin/theme`

Si el usuario es superadmin, aparece un botón adicional en la sección de temas prediseñados que abre un modal de gestión.

**Recomendación:** Implementar **Opción A** primero (panel dedicado), y luego **Opción B** como mejora.

---

## 3. Funcionalidades del Panel Superadmin

### 3.1 Listar temas (con inactivos)

```typescript
// Diferente del GET público: incluye temas inactivos
async function listAllThemes(): Promise<DefaultTheme[]> {
  const db = getD1Client();
  const result = await db.prepare(
    "SELECT * FROM default_themes ORDER BY sort_order ASC, name ASC"
  ).all();
  return result.results.map(parseThemeRow);
}
```

### 3.2 Crear tema

Formulario con todos los campos del tema:

```
┌─────────────────────────────────────────────┐
│  Crear nuevo tema                           │
│                                             │
│  ID: [solo-minusculas-y-guiones]            │
│  Nombre: [máx 100 caracteres]               │
│  Descripción: [textarea]                    │
│  Categoría: [select: general|business|...]  │
│  Orden: [number]                            │
│  Preview image URL: [input]                 │
│                                             │
│  ─── Configuración del tema ───             │
│  (mismos campos que el formulario           │
│   de personalización)                       │
│                                             │
│  [Crear tema]  [Cancelar]                   │
└─────────────────────────────────────────────┘
```

### 3.3 Editar tema

Mismo formulario que crear, pero precargado con los valores existentes.

### 3.4 Eliminar tema

```
┌─────────────────────────────────────┐
│  ¿Eliminar tema "Clásico"?          │
│                                     │
│  ○ Soft delete (ocultar)           │
│  ● Hard delete (eliminar永久)      │
│                                     │
│  [Cancelar]  [Eliminar]             │
└─────────────────────────────────────┘
```

### 3.5 Duplicar tema

Botón "Duplicar" que crea una copia con ID `{tema}-copy` y nombre `{tema} (copia)`.

---

## 4. Componente: `SuperadminThemes.ts`

```typescript
// src/components/admin/SuperadminThemes.ts

import { auth } from "../../lib/firebase";
import { sanitizeText } from "../../lib/sanitizer";

const SUPERADMIN_EMAIL = "servicioweb.pmi@gmail.com";
const API_BASE = "/api/admin/themes";

interface DefaultTheme {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: string;
  is_active: number;
  sort_order: number;
  config: Record<string, any>;
}

export function initSuperadminThemes(): void {
  // Verificar que sea superadmin
  const user = auth.currentUser;
  if (!user || user.email?.toLowerCase() !== SUPERADMIN_EMAIL) {
    showError("No tienes permisos para acceder a esta página.");
    return;
  }

  loadAndRenderThemes();
  setupCreateButton();
}

async function loadAndRenderThemes(): Promise<void> {
  const container = document.getElementById("superadmin-themes-container");
  if (!container) return;

  container.innerHTML = '<div class="themes-loading"><div class="spinner"></div><p>Cargando...</p></div>';

  try {
    const token = await auth.currentUser!.getIdToken();
    const response = await fetch(API_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!result.success) {
      showError("Error al cargar temas.");
      return;
    }

    renderThemesTable(result.data, container);
  } catch {
    showError("Error de conexión.");
  }
}

function renderThemesTable(themes: DefaultTheme[], container: HTMLElement): void {
  if (themes.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay temas creados.</p>';
    return;
  }

  const rows = themes.map((theme) => `
    <tr>
      <td><strong>${sanitizeText(theme.name)}</strong></td>
      <td><code>${theme.id}</code></td>
      <td>${theme.category}</td>
      <td>${theme.sort_order}</td>
      <td>${theme.is_active ? "✅ Activo" : "❌ Inactivo"}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editTheme('${theme.id}')">✏️</button>
        <button class="btn btn-sm btn-secondary" onclick="duplicateTheme('${theme.id}')">📋</button>
        <button class="btn btn-sm btn-danger" onclick="deleteTheme('${theme.id}')">🗑️</button>
      </td>
    </tr>
  `).join("");

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>ID</th>
          <th>Categoría</th>
          <th>Orden</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function editTheme(themeId: string): Promise<void> {
  // Abrir modal con formulario precargado
  // ...
}

async function duplicateTheme(themeId: string): Promise<void> {
  // 1. Obtener tema original
  // 2. Crear copia con ID modificado
  // 3. Recargar tabla
  // ...
}

async function deleteTheme(themeId: string): Promise<void> {
  // Mostrar confirmación con opción soft/hard delete
  // ...
}

function setupCreateButton(): void {
  const btn = document.getElementById("btn-create-theme");
  btn?.addEventListener("click", () => {
    // Abrir modal de creación
  });
}

function showError(message: string): void {
  const container = document.getElementById("superadmin-themes-container");
  if (container) {
    container.innerHTML = `<div class="themes-error">${sanitizeText(message)}</div>`;
  }
}
```

---

## 5. Seguridad Adicional

### 5.1 Doble verificación en el frontend

```typescript
// En cada acción del panel superadmin
function requireSuperadmin(): boolean {
  const user = auth.currentUser;
  if (!user || user.email?.toLowerCase() !== SUPERADMIN_EMAIL) {
    alert("Acción no permitida. Solo el superadmin puede realizar esta operación.");
    return false;
  }
  return true;
}
```

### 5.2 Logging de operaciones

Registrar en consola (y opcionalmente en un log de D1):

```typescript
async function logSuperadminAction(action: string, details: Record<string, any>): Promise<void> {
  console.log(`[SUPERADMIN] ${action}`, details);

  // Opcional: guardar en tabla de logs
  // await db.prepare(
  //   "INSERT INTO admin_logs (action, details, user_email, created_at) VALUES (?, ?, ?, datetime('now'))"
  // ).bind(action, JSON.stringify(details), SUPERADMIN_EMAIL).run();
}
```

### 5.3 Confirmación para operaciones destructivas

```typescript
function confirmDestructiveAction(message: string): boolean {
  return window.confirm(`⚠️ ${message}\n\nEsta acción no se puede deshacer.`);
}
```

---

## 6. Posibles Mejoras para Superadmin

### 6.1 Vista previa en vivo de temas nuevos

Mientras el superadmin edita la configuración de un tema, mostrar una vista previa en vivo similar a la de `/admin/theme`.

### 6.2 Historial de cambios

Registrar cada modificación a un tema default con timestamp y campos cambiados.

### 6.3 Estadísticas de uso

Mostrar cuántos sitios han copiado cada tema:

```sql
SELECT
  t.id,
  t.name,
  COUNT(c.id) as usage_count
FROM default_themes t
LEFT JOIN theme_copies c ON t.id = c.theme_id
GROUP BY t.id
ORDER BY usage_count DESC;
```

### 6.4 Exportar/Importar temas

- **Exportar**: descargar un tema como JSON
- **Importar**: subir un JSON para crear un nuevo tema

### 6.5 Programar publicación

Poder establecer una fecha de publicación futura para un tema.
