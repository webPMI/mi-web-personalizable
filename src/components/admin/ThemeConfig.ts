// ============================================
// ThemeConfig.ts — Lógica JS de Personalización del Tema
// ============================================
// Se encarga de:
//   - Cargar la configuración del tema desde Firestore
//   - Sincronizar color picker ↔ input hex
//   - Actualizar la vista previa en vivo
//   - Guardar los cambios en Firestore
//   - Mostrar feedback visual
//
// Uso:
//   import { initThemeConfig } from "./ThemeConfig";
//   initThemeConfig();
// ============================================

import { getDocument, updateDocument, setDocument } from "../../lib/firebase/firestore";

/**
 * Inicializa el formulario de tema.
 */
export function initThemeConfig(): void {
  const adminApp = document.getElementById("admin-app");

  if (adminApp?.dataset.siteDomain) {
    setupThemeForm(adminApp.dataset.siteDomain);
    return;
  }

  window.addEventListener("admin:ready", ((event: CustomEvent) => {
    const { siteDomain } = event.detail;
    if (siteDomain) {
      setupThemeForm(siteDomain);
    }
  }) as EventListener);
}

function setupThemeForm(siteDomain: string): void {
  loadTheme(siteDomain);
  setupColorSync();
  setupRangeDisplays();
  setupLivePreview();
  setupSaveHandler(siteDomain);
}

// ============================================
// CARGA DE DATOS
// ============================================

async function loadTheme(siteDomain: string): Promise<void> {
  const themeContent = document.getElementById("theme-content");
  if (!themeContent) return;

  try {
    // Intentar cargar desde settings/theme
    const result = await getDocument("sites/" + siteDomain + "/settings", "theme");
    let data: any = null;

    if (result.success && result.data) {
      data = result.data;
    } else {
      // Fallback: cargar desde el documento principal
      try {
        const siteResult = await getDocument("sites", siteDomain);
        if (siteResult.success && siteResult.data) {
          data = (siteResult.data as any).theme || null;
        }
      } catch {
        // Ignorar
      }
    }

    fillForm(data || {});
    updateLivePreview();
    themeContent.innerHTML = "";
  } catch {
    themeContent.innerHTML = `<p class="alert alert-error">Error al cargar la configuración del tema.</p>`;
  }
}

function fillForm(data: any): void {
  // --- Colores ---
  setColorValue("color-primary", data.primaryColor || "#6366f1");
  setColorValue("color-secondary", data.secondaryColor || "#8b5cf6");
  setColorValue("color-accent", data.accentColor || "#4f46e5");
  setColorValue("color-bg", data.bgColor || "#ffffff");
  setColorValue("color-text", data.textColor || "#1a1a2e");
  setColorValue("color-text-muted", data.textMutedColor || "#6b7280");
  setColorValue("color-navbar-bg", data.navbarBg || "#ffffff");
  setColorValue("color-navbar-text", data.navbarText || "#1a1a2e");
  setColorValue("color-footer-bg", data.footerBg || "#1e1b4b");
  setColorValue("color-footer-text", data.footerText || "#e0e7ff");

  // --- Tipografía ---
  setSelectValue("font-family", data.fontFamily || "'Inter', system-ui, sans-serif");
  setSelectValue("font-headings", data.fontHeadings || "");
  setRangeValue("font-size-base", data.fontSizeBase || 16);
  setSelectValue("font-weight", data.fontWeight || "400");

  // --- Espaciado y Layout ---
  setSelectValue("theme-layout", data.layout || "centered");
  setRangeValue("max-width", data.maxWidth || 1200);
  setRangeValue("section-gap", data.sectionGap || 64);
  setRangeValue("border-radius", data.borderRadius || 8);
  setRangeValue("container-padding", data.containerPadding || 24);

  // --- Hero ---
  setSelectValue("hero-height", data.heroHeight || "medium");
  setSelectValue("hero-align", data.heroAlign || "center");
  setColorValue("hero-overlay-color", data.heroOverlayColor || "#000000");
  setRangeValue("hero-overlay-opacity", data.heroOverlayOpacity ?? 40);

  // --- Botones ---
  setRangeValue("btn-border-radius", data.btnBorderRadius || 6);
  setRangeValue("btn-padding-x", data.btnPaddingX || 24);
  setRangeValue("btn-padding-y", data.btnPaddingY || 12);
  setSelectValue("btn-style", data.btnStyle || "filled");
}

// ============================================
// HELPERS
// ============================================

function setColorValue(id: string, value: string): void {
  const hexInput = document.getElementById(id) as HTMLInputElement | null;
  const picker = document.getElementById(id + "-picker") as HTMLInputElement | null;
  if (hexInput) hexInput.value = value;
  if (picker) picker.value = value;
}

function setInputValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.value = value;
}

function setSelectValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLSelectElement | null;
  if (el) el.value = value;
}

function setRangeValue(id: string, value: number): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.value = String(value);
  // Actualizar display
  const display = document.getElementById(id + "-display");
  if (display) display.textContent = value + "px";
}

function getVal(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLSelectElement)?.value?.trim() || "";
}

function getRangeVal(id: string): number {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el ? parseInt(el.value, 10) || 0 : 0;
}

// ============================================
// SINCRONIZACIÓN COLOR PICKER ↔ HEX INPUT
// ============================================

function setupColorSync(): void {
  const colorIds = [
    "color-primary", "color-secondary", "color-accent",
    "color-bg", "color-text", "color-text-muted",
    "color-navbar-bg", "color-navbar-text",
    "color-footer-bg", "color-footer-text",
    "hero-overlay-color"
  ];

  colorIds.forEach((id) => {
    const hexInput = document.getElementById(id) as HTMLInputElement | null;
    const picker = document.getElementById(id + "-picker") as HTMLInputElement | null;

    if (hexInput && picker) {
      // Picker → hex input
      picker.addEventListener("input", () => {
        hexInput.value = picker.value;
        updateLivePreview();
      });

      // Hex input → picker (solo si es un hex válido)
      hexInput.addEventListener("input", () => {
        const val = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          picker.value = val;
          updateLivePreview();
        }
      });
    }
  });
}

// ============================================
// RANGES — ACTUALIZAR DISPLAY
// ============================================

function setupRangeDisplays(): void {
  const rangeIds = [
    "font-size-base", "max-width", "section-gap",
    "border-radius", "container-padding",
    "hero-overlay-opacity",
    "btn-border-radius", "btn-padding-x", "btn-padding-y"
  ];

  rangeIds.forEach((id) => {
    const range = document.getElementById(id) as HTMLInputElement | null;
    if (range) {
      range.addEventListener("input", () => {
        const display = document.getElementById(id + "-display");
        if (display) {
          const suffix = id === "hero-overlay-opacity" ? "%" : "px";
          display.textContent = range.value + suffix;
        }
        updateLivePreview();
      });
    }
  });
}

// ============================================
// VISTA PREVIA EN VIVO
// ============================================

function setupLivePreview(): void {
  // Selectores y ranges que afectan la preview
  const liveIds = [
    "font-family", "font-headings", "font-size-base", "font-weight",
    "theme-layout", "max-width", "section-gap", "border-radius", "container-padding",
    "hero-height", "hero-align",
    "btn-border-radius", "btn-padding-x", "btn-padding-y", "btn-style"
  ];

  liveIds.forEach((id) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (el) {
      el.addEventListener("change", updateLivePreview);
      el.addEventListener("input", updateLivePreview);
    }
  });
}

function updateLivePreview(): void {
  const preview = document.getElementById("theme-preview");
  if (!preview) return;

  // --- Colores ---
  const primary = getVal("color-primary") || "#6366f1";
  const secondary = getVal("color-secondary") || "#8b5cf6";
  const accent = getVal("color-accent") || "#4f46e5";
  const bg = getVal("color-bg") || "#ffffff";
  const text = getVal("color-text") || "#1a1a2e";
  const textMuted = getVal("color-text-muted") || "#6b7280";
  const navbarBg = getVal("color-navbar-bg") || "#ffffff";
  const navbarText = getVal("color-navbar-text") || "#1a1a2e";
  const footerBg = getVal("color-footer-bg") || "#1e1b4b";
  const footerText = getVal("color-footer-text") || "#e0e7ff";
  const overlayColor = getVal("hero-overlay-color") || "#000000";
  const overlayOpacity = getRangeVal("hero-overlay-opacity") / 100;

  // --- Tipografía ---
  const fontFamily = getVal("font-family") || "'Inter', system-ui, sans-serif";
  const fontHeadings = getVal("font-headings") || fontFamily;
  const fontSizeBase = getRangeVal("font-size-base") || 16;
  const fontWeight = getVal("font-weight") || "400";

  // --- Layout ---
  const layout = getVal("theme-layout") || "centered";
  const maxWidth = getRangeVal("max-width") || 1200;
  const sectionGap = getRangeVal("section-gap") || 64;
  const borderRadius = getRangeVal("border-radius") || 8;
  const containerPadding = getRangeVal("container-padding") || 24;

  // --- Hero ---
  const heroHeight = getVal("hero-height") || "medium";
  const heroAlign = getVal("hero-align") || "center";

  // --- Botones ---
  const btnBorderRadius = getRangeVal("btn-border-radius") || 6;
  const btnPaddingX = getRangeVal("btn-padding-x") || 24;
  const btnPaddingY = getRangeVal("btn-padding-y") || 12;
  const btnStyle = getVal("btn-style") || "filled";

  // Aplicar estilos al preview
  preview.style.setProperty("--preview-primary", primary);
  preview.style.setProperty("--preview-secondary", secondary);
  preview.style.setProperty("--preview-accent", accent);
  preview.style.setProperty("--preview-bg", bg);
  preview.style.setProperty("--preview-text", text);
  preview.style.setProperty("--preview-text-muted", textMuted);
  preview.style.setProperty("--preview-font", fontFamily);
  preview.style.setProperty("--preview-font-headings", fontHeadings);
  preview.style.setProperty("--preview-font-size", fontSizeBase + "px");
  preview.style.setProperty("--preview-font-weight", fontWeight);
  preview.style.setProperty("--preview-max-width", (layout === "full-width" ? "100%" : maxWidth + "px"));
  preview.style.setProperty("--preview-section-gap", sectionGap + "px");
  preview.style.setProperty("--preview-radius", borderRadius + "px");
  preview.style.setProperty("--preview-container-padding", containerPadding + "px");
  preview.style.setProperty("--preview-btn-radius", btnBorderRadius + "px");
  preview.style.setProperty("--preview-btn-px", btnPaddingX + "px");
  preview.style.setProperty("--preview-btn-py", btnPaddingY + "px");

  // Navbar
  const previewNavbar = document.getElementById("preview-navbar");
  if (previewNavbar) {
    previewNavbar.style.background = navbarBg;
    previewNavbar.style.color = navbarText;
  }

  // Hero
  const previewHero = document.getElementById("preview-hero");
  if (previewHero) {
    const heights: Record<string, string> = {
      small: "200px",
      medium: "300px",
      large: "400px",
      fullscreen: "500px"
    };
    previewHero.style.height = heights[heroHeight] || "300px";
    previewHero.style.justifyContent = heroAlign === "center" ? "center" : heroAlign === "left" ? "flex-start" : "flex-end";
    previewHero.style.textAlign = heroAlign;
  }

  const previewOverlay = document.getElementById("preview-hero-overlay");
  if (previewOverlay) {
    previewOverlay.style.background = overlayColor;
    previewOverlay.style.opacity = String(overlayOpacity);
  }

  const previewHeroContent = document.getElementById("preview-hero-content");
  if (previewHeroContent) {
    previewHeroContent.style.textAlign = heroAlign;
    previewHeroContent.style.alignItems = heroAlign === "center" ? "center" : heroAlign === "left" ? "flex-start" : "flex-end";
  }

  // Footer
  const previewFooter = document.getElementById("preview-footer");
  if (previewFooter) {
    previewFooter.style.background = footerBg;
    previewFooter.style.color = footerText;
  }

  // Botones
  const previewBtns = preview.querySelectorAll(".preview-btn");
  previewBtns.forEach((btn) => {
    const b = btn as HTMLElement;
    b.style.borderRadius = btnBorderRadius + "px";
    b.style.padding = btnPaddingY + "px " + btnPaddingX + "px";
    b.style.fontSize = fontSizeBase + "px";

    if (btnStyle === "filled") {
      b.style.background = accent;
      b.style.color = "#ffffff";
      b.style.border = "none";
    } else if (btnStyle === "outline") {
      b.style.background = "transparent";
      b.style.color = accent;
      b.style.border = "2px solid " + accent;
    } else {
      b.style.background = "transparent";
      b.style.color = accent;
      b.style.border = "none";
    }
  });

  // Preview general
  preview.style.background = bg;
  preview.style.color = text;
  preview.style.fontFamily = fontFamily;
  preview.style.fontSize = fontSizeBase + "px";
  preview.style.fontWeight = fontWeight as any;

  // Títulos
  const previewHeadings = preview.querySelectorAll("h2, h3");
  previewHeadings.forEach((h) => {
    (h as HTMLElement).style.fontFamily = fontHeadings;
  });
}

// ============================================
// GUARDADO
// ============================================

function setupSaveHandler(siteDomain: string): void {
  const form = document.getElementById("theme-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("btn-save") as HTMLButtonElement;
    const feedbackEl = document.getElementById("save-feedback");

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
    }
    if (feedbackEl) {
      feedbackEl.className = "hidden";
      feedbackEl.textContent = "";
    }

    try {
      const data = collectThemeData();

      // Guardar en subcolección settings/theme
      const result = await updateDocument(
        "sites/" + siteDomain + "/settings",
        "theme",
        data
      );

      if (!result.success) {
        const createResult = await setDocument(
          "sites/" + siteDomain + "/settings",
          "theme",
          data
        );
        if (!createResult.success) {
          showFeedback("error", "Error al guardar el tema.");
          return;
        }
      }

      // También actualizar el campo theme en el documento principal
      const mainUpdate = await updateDocument("sites", siteDomain, { theme: data });
      if (!mainUpdate.success) {
        await setDocument("sites", siteDomain, {
          domain: siteDomain,
          theme: data,
          status: "active",
        });
      }

      showFeedback("success", "Tema guardado correctamente.");
    } catch {
      showFeedback("error", "Error al guardar el tema.");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
      }
    }
  });
}

function collectThemeData(): Record<string, any> {
  return {
    // Colores
    primaryColor: getVal("color-primary"),
    secondaryColor: getVal("color-secondary"),
    accentColor: getVal("color-accent"),
    bgColor: getVal("color-bg"),
    textColor: getVal("color-text"),
    textMutedColor: getVal("color-text-muted"),
    navbarBg: getVal("color-navbar-bg"),
    navbarText: getVal("color-navbar-text"),
    footerBg: getVal("color-footer-bg"),
    footerText: getVal("color-footer-text"),

    // Tipografía
    fontFamily: getVal("font-family"),
    fontHeadings: getVal("font-headings"),
    fontSizeBase: getRangeVal("font-size-base"),
    fontWeight: getVal("font-weight"),

    // Layout
    layout: getVal("theme-layout"),
    maxWidth: getRangeVal("max-width"),
    sectionGap: getRangeVal("section-gap"),
    borderRadius: getRangeVal("border-radius"),
    containerPadding: getRangeVal("container-padding"),

    // Hero
    heroHeight: getVal("hero-height"),
    heroAlign: getVal("hero-align"),
    heroOverlayColor: getVal("hero-overlay-color"),
    heroOverlayOpacity: getRangeVal("hero-overlay-opacity"),

    // Botones
    btnBorderRadius: getRangeVal("btn-border-radius"),
    btnPaddingX: getRangeVal("btn-padding-x"),
    btnPaddingY: getRangeVal("btn-padding-y"),
    btnStyle: getVal("btn-style"),
  };
}

function showFeedback(type: "success" | "error", message: string): void {
  const feedbackEl = document.getElementById("save-feedback");
  if (!feedbackEl) return;

  feedbackEl.className = `alert alert-${type}`;
  feedbackEl.textContent = message;
}
