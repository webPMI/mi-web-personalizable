// ============================================
// SiteConfig.ts — Lógica JS de Configuración del Sitio
// ============================================
// Se encarga de:
//   - Cargar la configuración actual desde Firestore
//   - Validar los campos del formulario
//   - Guardar los cambios en Firestore (crear o actualizar)
//   - Mostrar feedback visual (guardando... / guardado ✓ / error)
//
// Uso:
//   import { initSiteConfig } from "./SiteConfig";
//   initSiteConfig();
//
// Compatibilidad con AdminLayout:
//   - Si AdminLayout ya disparó "admin:ready", lee data-site-domain del DOM
//   - Si no, se suscribe al evento "admin:ready"
// ============================================

import { getDocument, updateDocument, setDocument } from "../../lib/firebase/firestore";

/**
 * Inicializa el formulario de configuración.
 */
export function initSiteConfig(): void {
  const adminApp = document.getElementById("admin-app");

  // Si ya estamos en estado authenticated (el evento ya se disparó)
  if (adminApp?.dataset.siteDomain) {
    setupForm(adminApp.dataset.siteDomain);
    return;
  }

  // Suscribirse al evento de AdminLayout
  window.addEventListener("admin:ready", ((event: CustomEvent) => {
    const { siteDomain } = event.detail;
    if (siteDomain) {
      setupForm(siteDomain);
    }
  }) as EventListener);
}

/**
 * Configura el formulario: carga datos y asigna eventos.
 */
function setupForm(siteDomain: string): void {
  loadSettings(siteDomain);
  setupNavLinksUI();
  setupSaveHandler(siteDomain);
}

// ============================================
// CARGA DE DATOS
// ============================================

/**
 * Carga la configuración actual desde Firestore y rellena el formulario.
 * Intenta primero la subcolección settings/general, con fallback al documento principal.
 */
async function loadSettings(siteDomain: string): Promise<void> {
  const settingsContent = document.getElementById("settings-content");
  if (!settingsContent) return;

  try {
    // 1. Intentar cargar desde la subcolección settings/general
    const result = await getDocument("sites/" + siteDomain + "/settings", "general");
    let data: any = null;

    if (result.success && result.data) {
      data = result.data;
    } else {
      // 2. Fallback: cargar desde el documento principal del sitio
      try {
        const siteResult = await getDocument("sites", siteDomain);
        if (siteResult.success && siteResult.data) {
          data = siteResult.data;
        }
      } catch {
        // Ignorar error del fallback
      }
    }

    // Rellenar el formulario con los datos obtenidos (o vacío si no hay datos)
    fillForm(data || {});

    // Ocultar el mensaje de carga
    settingsContent.innerHTML = "";
  } catch {
    settingsContent.innerHTML = `<p class="alert alert-error">Error al cargar la configuración.</p>`;
  }
}

/**
 * Rellena todos los campos del formulario con los datos proporcionados.
 */
function fillForm(data: any): void {
  // --- General ---
  setInputValue("site-name", data.siteName);
  setInputValue("site-description", data.siteDescription);
  setSelectValue("site-locale", data.locale || "es");

  // --- Redes Sociales ---
  const social = data.socialLinks || {};
  setInputValue("social-twitter", social.twitter);
  setInputValue("social-github", social.github);
  setInputValue("social-linkedin", social.linkedin);
  setInputValue("social-instagram", social.instagram);

  // --- Hero ---
  setInputValue("hero-title", data.heroTitle);
  setInputValue("hero-subtitle", data.heroSubtitle);
  setInputValue("hero-image", data.heroImage);
  setInputValue("hero-cta-text", data.heroCtaText);
  setInputValue("hero-cta-link", data.heroCtaLink);

  // --- Navbar ---
  const navLinks = data.navLinks || [];
  renderNavLinks(navLinks);

  // --- SEO ---
  const seo = data.seo || {};
  setInputValue("seo-title", seo.defaultTitle);
  setInputValue("seo-description", seo.defaultDescription);
  setInputValue("seo-image", seo.defaultImage);

  // --- Tema ---
  const theme = data.theme || {};
  setInputValue("theme-primary", theme.primaryColor);
  setInputValue("theme-font", theme.fontFamily);
  setSelectValue("theme-layout", theme.layout || "centered");
}

/** Helper para asignar valor a un input */
function setInputValue(id: string, value: string | undefined | null): void {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) el.value = value || "";
}

/** Helper para asignar valor a un select */
function setSelectValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  if (el) el.value = value;
}

// ============================================
// NAVBAR — ENLACES DINÁMICOS
// ============================================

/**
 * Configura el botón "Añadir enlace" del navbar.
 */
function setupNavLinksUI(): void {
  const addBtn = document.getElementById("btn-add-nav-link");
  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    addNavLinkRow("", "");
  });
}

/**
 * Renderiza los enlaces del navbar en el contenedor.
 */
function renderNavLinks(links: Array<{ label: string; href: string }>): void {
  const container = document.getElementById("nav-links-container");
  if (!container) return;

  container.innerHTML = "";

  if (links.length === 0) {
    // Mostrar una fila vacía por defecto
    addNavLinkRow("", "");
    return;
  }

  links.forEach((link) => {
    addNavLinkRow(link.label, link.href);
  });
}

/**
 * Añade una fila de enlace al navbar.
 */
function addNavLinkRow(label: string, href: string): void {
  const container = document.getElementById("nav-links-container");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "nav-link-row";

  row.innerHTML = `
    <input type="text" class="nav-link-label" placeholder="Texto (ej: Inicio)" value="${escapeHtml(label)}" />
    <input type="text" class="nav-link-href" placeholder="URL (ej: /)" value="${escapeHtml(href)}" />
    <button type="button" class="btn btn-danger btn-sm nav-link-remove" title="Eliminar enlace">&times;</button>
  `;

  const removeBtn = row.querySelector(".nav-link-remove") as HTMLButtonElement;
  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  container.appendChild(row);
}

/** Helper para escapar HTML y evitar inyección */
function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Obtiene los enlaces del navbar desde el DOM.
 */
function getNavLinksFromDOM(): Array<{ label: string; href: string }> {
  const rows = document.querySelectorAll("#nav-links-container .nav-link-row");
  const links: Array<{ label: string; href: string }> = [];

  rows.forEach((row) => {
    const labelInput = row.querySelector(".nav-link-label") as HTMLInputElement;
    const hrefInput = row.querySelector(".nav-link-href") as HTMLInputElement;
    const label = labelInput?.value?.trim();
    const href = hrefInput?.value?.trim();
    if (label || href) {
      links.push({ label: label || "", href: href || "" });
    }
  });

  return links;
}

// ============================================
// GUARDADO
// ============================================

/**
 * Configura el manejador de envío del formulario.
 */
function setupSaveHandler(siteDomain: string): void {
  const form = document.getElementById("config-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const siteNameInput = document.getElementById("site-name") as HTMLInputElement;
    const saveBtn = document.getElementById("btn-save") as HTMLButtonElement;
    const feedbackEl = document.getElementById("save-feedback");

    // Validar campos
    if (!validateForm(siteNameInput)) return;

    // Mostrar estado "guardando..."
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
    }
    if (feedbackEl) {
      feedbackEl.className = "hidden";
      feedbackEl.textContent = "";
    }

    try {
      // Recolectar datos del formulario
      const data = collectFormData();

      // Guardar en la subcolección settings/general
      const result = await updateDocument(
        "sites/" + siteDomain + "/settings",
        "general",
        data
      );

      if (!result.success) {
        // Si falló la actualización, probablemente el documento no existe → crearlo
        const createResult = await setDocument(
          "sites/" + siteDomain + "/settings",
          "general",
          data
        );
        if (!createResult.success) {
          showFeedback("error", "Error al guardar la configuración.");
          return;
        }
      }

      // También actualizar el documento principal del sitio
      const mainData: Record<string, any> = {
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        locale: data.locale,
        socialLinks: data.socialLinks,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroImage: data.heroImage,
        heroCtaText: data.heroCtaText,
        heroCtaLink: data.heroCtaLink,
        navLinks: data.navLinks,
        seo: data.seo,
        theme: data.theme,
      };

      const mainUpdate = await updateDocument("sites", siteDomain, mainData);

      if (!mainUpdate.success) {
        // Si no existe el documento principal, crearlo
        await setDocument("sites", siteDomain, {
          domain: siteDomain,
          ...mainData,
          status: "active",
        });
      }

      showFeedback("success", "Cambios guardados correctamente.");
    } catch {
      showFeedback("error", "Error al guardar la configuración.");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
      }
    }
  });
}

/**
 * Recolecta todos los datos del formulario en un objeto estructurado.
 */
function collectFormData(): Record<string, any> {
  const getVal = (id: string): string =>
    (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement)?.value?.trim() || "";

  return {
    // General
    siteName: getVal("site-name"),
    siteDescription: getVal("site-description"),
    locale: (document.getElementById("site-locale") as HTMLSelectElement)?.value || "es",

    // Redes Sociales
    socialLinks: {
      twitter: getVal("social-twitter"),
      github: getVal("social-github"),
      linkedin: getVal("social-linkedin"),
      instagram: getVal("social-instagram"),
    },

    // Hero
    heroTitle: getVal("hero-title"),
    heroSubtitle: getVal("hero-subtitle"),
    heroImage: getVal("hero-image"),
    heroCtaText: getVal("hero-cta-text"),
    heroCtaLink: getVal("hero-cta-link"),

    // Navbar
    navLinks: getNavLinksFromDOM(),

    // SEO
    seo: {
      defaultTitle: getVal("seo-title"),
      defaultDescription: getVal("seo-description"),
      defaultImage: getVal("seo-image"),
    },

    // Tema
    theme: {
      primaryColor: getVal("theme-primary"),
      fontFamily: getVal("theme-font"),
      layout: (document.getElementById("theme-layout") as HTMLSelectElement)?.value || "centered",
    },
  };
}

// ============================================
// VALIDACIÓN Y FEEDBACK
// ============================================

/**
 * Valida los campos del formulario.
 */
function validateForm(siteNameInput: HTMLInputElement): boolean {
  let isValid = true;

  // Limpiar errores previos
  document.querySelectorAll(".form-group.error").forEach((el) => {
    el.classList.remove("error");
  });

  // Validar nombre del sitio
  if (!siteNameInput?.value?.trim()) {
    const fg = siteNameInput?.closest(".form-group");
    fg?.classList.add("error");
    isValid = false;
  }

  return isValid;
}

/**
 * Muestra feedback visual al usuario.
 */
function showFeedback(type: "success" | "error", message: string): void {
  const feedbackEl = document.getElementById("save-feedback");
  if (!feedbackEl) return;

  feedbackEl.className = `alert alert-${type}`;
  feedbackEl.textContent = message;
}
