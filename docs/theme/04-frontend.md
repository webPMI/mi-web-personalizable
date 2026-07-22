# Frontend — UI y Componentes

> **Documento:** 04-frontend.md
> **Propósito:** Describir la interfaz de usuario, componentes, flujo de interacción y lógica cliente.
> **Estado:** ⬜ Pendiente de implementar (especificación completa para desarrollo futuro)

---

## 1. Página: `/admin/theme`

### 1.1 Estructura visual

```
┌──────────────────────────────────────────────────────────────┐
│  Panel de Administración                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🎨 Temas prediseñados                                 │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │   CLÁSICO    │  │   MODERNO    │  │   OSCURO     │ │  │
│  │  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │ │  │
│  │  │  │preview │  │  │  │preview │  │  │  │preview │  │ │  │
│  │  │  │ (img)  │  │  │  │ (img)  │  │  │  │ (img)  │  │ │  │
│  │  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │ │  │
│  │  │  Elegante    │  │  Contemporá. │  │  Dark mode   │ │  │
│  │  │  [Usar tema] │  │  [Usar tema] │  │  [Usar tema] │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                                                        │  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │                                                        │  │
│  │  Personalización manual (formulario actual)            │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Colores  │  Tipografía  │  Layout  │  Hero ... │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Sección de temas prediseñados

Se añade **antes** del formulario de personalización manual, dentro del `<AdminLayout>`.

```astro
<!-- En src/pages/admin/theme.astro, antes del formulario -->

<div class="card">
  <div class="card-header">
    <h2>🎨 Temas prediseñados</h2>
    <p class="text-muted">
      Elige un tema base para tu sitio. Puedes personalizarlo después.
    </p>
  </div>

  <div id="default-themes-container" class="themes-grid">
    <!-- Estado de carga -->
    <div class="themes-loading">
      <div class="spinner"></div>
      <p>Cargando temas...</p>
    </div>
  </div>
</div>

<hr />

<!-- Formulario actual de personalización -->
<div class="card">
  ...
</div>
```

---

## 2. Componentes CSS

### 2.1 Grid de temas

```css
/* En src/styles/admin.css */

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.theme-card {
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  background: var(--card-bg, #ffffff);
  cursor: pointer;
}

.theme-card:hover {
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.theme-card.selected {
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.theme-card-preview {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.theme-card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.theme-card-preview .preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
}

.theme-card-body {
  padding: 1rem;
}

.theme-card-body h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.theme-card-body p {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--text-muted, #6b7280);
}

.theme-card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-use-theme {
  flex: 1;
}

/* Estado de carga */
.themes-loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted, #6b7280);
}

/* Estado vacío */
.themes-empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted, #6b7280);
}

/* Error */
.themes-error {
  text-align: center;
  padding: 1rem;
  color: #ef4444;
  background: #fef2f2;
  border-radius: 8px;
}
```

### 2.2 Modal de confirmación

```css
/* Reutilizar el modal existente de PagesConfig o crear uno genérico */

.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-modal h3 {
  margin: 0 0 0.5rem 0;
}

.confirm-modal p {
  color: var(--text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

.confirm-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
```

---

## 3. Lógica JavaScript (ThemeConfig.ts)

### 3.1 Nuevas funciones a añadir

```typescript
// ============================================
// Funciones para Temas Prediseñados
// ============================================

const DEFAULT_THEMES_API = "/api/admin/themes";

interface DefaultTheme {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: string;
  sort_order: number;
  config: Record<string, any>;
}

/**
 * Carga la lista de temas default desde la API.
 */
async function loadDefaultThemes(): Promise<DefaultTheme[]> {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const token = await user.getIdToken();
    const response = await fetch(DEFAULT_THEMES_API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const result = await response.json();
    return result.data || [];
  } catch {
    console.error("Error al cargar temas default");
    return [];
  }
}

/**
 * Renderiza las tarjetas de temas en el contenedor.
 */
async function renderDefaultThemes(): Promise<void> {
  const container = document.getElementById("default-themes-container");
  if (!container) return;

  // Mostrar loading
  container.innerHTML = `
    <div class="themes-loading">
      <div class="spinner"></div>
      <p>Cargando temas...</p>
    </div>
  `;

  const themes = await loadDefaultThemes();

  if (themes.length === 0) {
    container.innerHTML = `
      <div class="themes-empty">
        <p>No hay temas prediseñados disponibles.</p>
      </div>
    `;
    return;
  }

  const cardsHtml = themes
    .map(
      (theme) => `
      <div class="theme-card" data-theme-id="${theme.id}">
        <div class="theme-card-preview">
          ${renderThemePreview(theme)}
        </div>
        <div class="theme-card-body">
          <h3>${sanitizeText(theme.name)}</h3>
          <p>${sanitizeText(theme.description)}</p>
          <div class="theme-card-actions">
            <button
              type="button"
              class="btn btn-primary btn-use-theme"
              data-theme-id="${theme.id}"
            >
              Usar este tema
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  container.innerHTML = `<div class="themes-grid">${cardsHtml}</div>`;

  // Asignar eventos a los botones
  container.querySelectorAll(".btn-use-theme").forEach((btn) => {
    btn.addEventListener("click", () => {
      const themeId = (btn as HTMLElement).dataset.themeId;
      if (themeId) promptApplyTheme(themeId);
    });
  });
}

/**
 * Renderiza una previsualización visual del tema.
 * Si no hay imagen, muestra una preview generada con CSS.
 */
function renderThemePreview(theme: DefaultTheme): string {
  if (theme.preview_image) {
    return `<img src="${theme.preview_image}" alt="${theme.name}" />`;
  }

  // Preview generada con CSS
  const cfg = theme.config;
  return `
    <div class="preview-placeholder"
      style="
        background: ${cfg.bgColor || "#ffffff"};
        color: ${cfg.textColor || "#000000"};
        font-family: ${cfg.fontFamily || "sans-serif"};
      "
    >
      <span style="color: ${cfg.primaryColor || "#6366f1"};">${theme.name.charAt(0)}</span>
    </div>
  `;
}

/**
 * Muestra un modal de confirmación antes de aplicar el tema.
 */
function promptApplyTheme(themeId: string): void {
  const theme = cachedThemes.find((t) => t.id === themeId);
  if (!theme) return;

  // Crear overlay del modal
  const overlay = document.createElement("div");
  overlay.className = "confirm-modal-overlay";
  overlay.innerHTML = `
    <div class="confirm-modal">
      <h3>¿Aplicar tema "${sanitizeText(theme.name)}"?</h3>
      <p>
        Se sobrescribirá tu configuración actual del tema.
        Podrás seguir personalizándolo después.
      </p>
      <div class="confirm-modal-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel-theme">
          Cancelar
        </button>
        <button type="button" class="btn btn-primary" id="btn-confirm-theme">
          Aplicar tema
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Eventos
  const cancelBtn = overlay.querySelector("#btn-cancel-theme");
  const confirmBtn = overlay.querySelector("#btn-confirm-theme");

  cancelBtn?.addEventListener("click", () => overlay.remove());
  confirmBtn?.addEventListener("click", async () => {
    confirmBtn.textContent = "Aplicando...";
    (confirmBtn as HTMLButtonElement).disabled = true;
    await applyThemeToSite(themeId);
    overlay.remove();
  });

  // Cerrar al hacer clic fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

/**
 * Aplica el tema al sitio via API.
 */
async function applyThemeToSite(themeId: string): Promise<void> {
  const adminApp = document.getElementById("admin-app");
  const siteDomain = adminApp?.dataset.siteDomain;
  if (!siteDomain) {
    showFeedback("error", "No se pudo determinar el dominio del sitio.");
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      showFeedback("error", "Debes iniciar sesión.");
      return;
    }

    const token = await user.getIdToken();
    const response = await fetch(`${DEFAULT_THEMES_API}/${themeId}/copy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ siteDomain }),
    });

    const result = await response.json();

    if (result.success) {
      showFeedback("success", result.message || "Tema aplicado correctamente.");
      // Recargar el formulario con los valores del tema
      const theme = cachedThemes.find((t) => t.id === themeId);
      if (theme) {
        fillForm(theme.config);
        updateLivePreview();
      }
    } else {
      showFeedback("error", result.error || "Error al aplicar el tema.");
    }
  } catch {
    showFeedback("error", "Error de conexión al aplicar el tema.");
  }
}
```

### 3.2 Cache de temas

```typescript
// Variable global para cachear los temas cargados
let cachedThemes: DefaultTheme[] = [];

// Modificar loadDefaultThemes para cachear
async function loadDefaultThemes(): Promise<DefaultTheme[]> {
  if (cachedThemes.length > 0) return cachedThemes;
  // ... fetch ...
  cachedThemes = result.data || [];
  return cachedThemes;
}
```

### 3.3 Integración con initThemeConfig

```typescript
export function initThemeConfig(): void {
  const adminApp = document.getElementById("admin-app");

  if (adminApp?.dataset.siteDomain) {
    setupThemeForm(adminApp.dataset.siteDomain);
    renderDefaultThemes();  // <-- NUEVO
    return;
  }

  window.addEventListener("admin:ready", ((event: CustomEvent) => {
    const { siteDomain } = event.detail;
    if (siteDomain) {
      setupThemeForm(siteDomain);
      renderDefaultThemes();  // <-- NUEVO
    }
  }) as EventListener);
}
```

---

## 4. Flujo de Usuario Completo

```
1. Admin navega a /admin/theme
2. Se cargan los temas default desde la API
3. Admin ve 3 tarjetas: Clásico, Moderno, Oscuro
4. Admin hace clic en "Usar este tema" en la tarjeta "Moderno"
5. Aparece modal de confirmación: "¿Aplicar tema Moderno?"
6. Admin confirma
7. Se llama a POST /api/admin/themes/modern/copy
8. La API copia la config a Firestore (sites/{domain}/theme)
9. El formulario se recarga con los valores del tema Moderno
10. La vista previa se actualiza automáticamente
11. Admin puede ajustar colores/fuentes si lo desea
12. Admin guarda los cambios
```

---

## 5. Estados de la UI

| Estado | Qué se muestra |
|--------|---------------|
| **Loading** | Spinner + "Cargando temas..." |
| **Success** | Grid con tarjetas de temas |
| **Empty** | "No hay temas prediseñados disponibles" |
| **Error** | Mensaje de error con opción de reintentar |
| **Applying** | Botón deshabilitado + "Aplicando..." |
| **Applied** | Feedback verde + formulario recargado |

---

## 6. Responsive

### Desktop (>768px)
- Grid de 3 columnas con tarjetas grandes
- Preview de 160px de alto

### Tablet (480-768px)
- Grid de 2 columnas
- Preview de 140px de alto

### Mobile (<480px)
- Grid de 1 columna
- Preview de 120px de alto
- Botón "Usar este tema" ocupa todo el ancho

```css
@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .theme-card-preview {
    height: 140px;
  }
}

@media (max-width: 480px) {
  .themes-grid {
    grid-template-columns: 1fr;
  }
  .theme-card-preview {
    height: 120px;
  }
}
```

---

## 7. Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/theme.astro` | Añadir sección de temas prediseñados antes del formulario |
| `src/components/admin/ThemeConfig.ts` | Añadir funciones de carga, render, confirmación y copia |
| `src/styles/admin.css` | Añadir estilos para tarjetas, grid, modal de confirmación |
