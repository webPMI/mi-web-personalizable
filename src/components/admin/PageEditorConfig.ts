// ============================================
// PageEditorConfig.ts — Controlador del Editor Dedicado (3 Columnas)
// ============================================
// Gestiona el estado de bloques (currentBlocks), la selección en el lienzo,
// el inserter de bloques, el simulador responsivo y el inspector lateral.
// ============================================

import { getSiteData, savePageSubcollection, listSitePages } from "../../lib/site";
import type { SiteData, CustomPage, PageBlock, BlockType, BlockStyle } from "../../lib/site";
import { BlockRegistry } from "../../lib/blocks/BlockRegistry";
import { slugify, sanitizeText, sanitizeUrl, escapeAttribute } from "../../lib/sanitizer";
import { applyThemeToElement } from "../../lib/theme";
import { MemoryCache } from "../../lib/cache";

let siteDomain: string | null = null;
let siteData: SiteData | null = null;
let editingPageId: string | null = null;
let currentBlocks: PageBlock[] = [];
let selectedBlockId: string | null = null;
let currentViewport: "desktop" | "tablet" | "mobile" = "desktop";
let currentTab: "page" | "block" = "page";

export function initPageEditorConfig() {
  const adminApp = document.getElementById("admin-app");
  if (!adminApp) return;

  const params = new URLSearchParams(window.location.search);
  editingPageId = params.get("id");

  const currentDomain = adminApp.dataset.siteDomain;
  const rawSiteData = adminApp.dataset.siteData;

  if (currentDomain && rawSiteData) {
    siteDomain = currentDomain;
    try {
      siteData = JSON.parse(rawSiteData) as SiteData;
      setupUI();
    } catch {
      // Esperar al evento admin:ready
    }
  }

  window.addEventListener("admin:ready", async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.siteDomain && detail?.siteData) {
      siteDomain = detail.siteDomain;
      siteData = detail.siteData as SiteData;
      await setupUI();
    }
  });
}

async function setupUI() {
  if (!siteData || !siteDomain) return;

  // Aplicar tema al marco del lienzo (inyectando defaults si siteData.theme está indefinido)
  const viewportFrame = document.getElementById("viewport-frame");
  if (viewportFrame) {
    applyThemeToElement(viewportFrame, siteData?.theme);
  }

  renderInserterLibrary();
  setupBlockSearch();
  setupViewportSwitcher();
  setupInspectorTabs();
  setupTitleSlugSync();
  setupFloatingToolbar();
  checkUnsavedDraft();

  // Cargar datos de la página si estamos editando
  if (editingPageId) {
    const allPages = await listSitePages(siteDomain);
    const page = allPages.find((p) => p.id === editingPageId);

    if (page) {
      populatePageFields(page);
      if (page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0) {
        currentBlocks = [...page.blocks];
      } else if (page.content) {
        // Convertir contenido plano legacy en un bloque párrafo inicial
        currentBlocks = [
          {
            id: `b-paragraph-${Date.now()}`,
            type: "paragraph",
            content: { text: page.content },
          },
        ];
      }
    }
  } else {
    // Modo Creación nueva
    const editorHeading = document.getElementById("editor-heading");
    if (editorHeading) editorHeading.textContent = "Crear Nueva Página";
  }

  renderCanvas();

  // Eventos de botones de guardado y publicación
  const btnSaveDraft = document.getElementById("btn-save-draft");
  const btnPublish = document.getElementById("btn-save-editor");

  btnSaveDraft?.addEventListener("click", async () => {
    await handleSave(false); // Guardar como borrador (no público)
  });

  btnPublish?.addEventListener("click", async () => {
    await handleSave(true); // Publicar página
  });

  // Advertencia de cambios no guardados al cerrar o recargar la pestaña
  window.addEventListener("beforeunload", (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

// ============================================
// Lógica de Barra de Formato Flotante Contextual (Bubble Toolbar Menu)
// ============================================
function setupFloatingToolbar() {
  const toolbar = document.getElementById("floating-rich-toolbar");
  const canvasContainer = document.getElementById("canvas-blocks-container");
  if (!toolbar || !canvasContainer) return;

  // Escuchar comandos de los botones de la barra flotante
  toolbar.querySelectorAll<HTMLButtonElement>(".btn-rich-fmt").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const cmd = btn.dataset.cmd;
      if (!cmd) return;

      if (cmd === "createLink") {
        const url = prompt("Introduce la URL del enlace:", "https://");
        if (url) document.execCommand("createLink", false, sanitizeUrl(url));
      } else {
        document.execCommand(cmd, false);
      }

      isDirty = true;
      autoSaveDraft();
    });
  });

  // Mostrar y posicionar la barra al seleccionar texto dentro del lienzo
  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      toolbar.classList.add("hidden");
      return;
    }

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;

    // Asegurar que la selección está dentro del contenedor del lienzo
    if (!canvasContainer.contains(commonAncestor)) {
      toolbar.classList.add("hidden");
      return;
    }

    const rect = range.getBoundingClientRect();
    const canvasRect = canvasContainer.getBoundingClientRect();

    // Posicionar la barra justo encima del texto seleccionado
    const top = rect.top - canvasRect.top - 45;
    const left = rect.left - canvasRect.left + rect.width / 2 - 120;

    toolbar.style.top = `${Math.max(0, top)}px`;
    toolbar.style.left = `${Math.max(10, left)}px`;
    toolbar.classList.remove("hidden");
  };

  document.addEventListener("selectionchange", handleSelection);
  canvasContainer.addEventListener("mouseup", handleSelection);
}

// ============================================
// 1. Biblioteca Inserter Categorizada y Buscador (Columna 1)
// ============================================
function setupBlockSearch() {
  const searchInput = document.getElementById("inserter-search") as HTMLInputElement | null;
  searchInput?.addEventListener("input", () => {
    renderInserterLibrary(searchInput.value.trim().toLowerCase());
  });
}

function renderInserterLibrary(filterText = "") {
  const container = document.getElementById("inserter-list");
  if (!container) return;

  const definitions = BlockRegistry.getDefinitions();

  const categories: Record<string, { label: string; icon: string; types: BlockType[] }> = {
    text: { label: "Texto", icon: "✍️", types: ["heading", "paragraph"] },
    media: { label: "Medios", icon: "🖼️", types: ["hero", "cards"] },
    action: { label: "Acciones", icon: "⚡", types: ["cta", "spacer"] },
  };

  const filtered = definitions.filter((def) => {
    if (!filterText) return true;
    return (
      def.label.toLowerCase().includes(filterText) ||
      def.type.toLowerCase().includes(filterText)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size: 0.8rem; text-align: center; padding: 1rem 0;">Sin resultados</p>`;
    return;
  }

  let html = "";
  for (const [catKey, cat] of Object.entries(categories)) {
    const catBlocks = filtered.filter((d) => cat.types.includes(d.type));
    if (catBlocks.length > 0) {
      html += `
        <div class="inserter-category" style="margin-bottom: 0.5rem;">
          <p style="font-size: 0.75rem; font-weight: bold; color: #6b7280; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.05em;">
            ${cat.icon} ${escapeAttribute(cat.label)}
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
            ${catBlocks
              .map(
                (def) => `
                <button type="button" class="btn-insert-block btn btn-secondary btn-sm" data-type="${def.type}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.6rem 0.4rem; text-align: center; gap: 0.2rem; border-radius: 6px;">
                  <span style="font-size: 1.1rem;">${def.icon}</span>
                  <span style="font-size: 0.75rem; font-weight: 500;">${escapeAttribute(def.label)}</span>
                </button>
              `
              )
              .join("")}
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = html;

  container.querySelectorAll(".btn-insert-block").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = (btn as HTMLElement).dataset.type as BlockType;
      if (type) addBlock(type);
    });
  });
}

function addBlock(type: BlockType) {
  const def = BlockRegistry.get(type);
  if (!def) return;

  const newBlock: PageBlock = {
    id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: type,
    content: JSON.parse(JSON.stringify(def.defaultContent)),
    style: {
      paddingY: 20,
      textAlign: "left",
    },
  };

  currentBlocks.push(newBlock);
  selectedBlockId = newBlock.id;

  autoSaveDraft();
  renderCanvas();
  switchInspectorTab("block");
}

// ============================================
// 2. Simulador Responsivo (Viewport Switcher)
// ============================================
function setupViewportSwitcher() {
  const buttons = document.querySelectorAll(".btn-viewport");
  const viewportFrame = document.getElementById("viewport-frame");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vp = (btn as HTMLElement).dataset.viewport as "desktop" | "tablet" | "mobile";
      if (!vp || !viewportFrame) return;

      currentViewport = vp;
      buttons.forEach((b) => {
        const isCurrent = (b as HTMLElement).dataset.viewport === vp;
        b.classList.toggle("active", isCurrent);
        (b as HTMLElement).style.background = isCurrent ? "#ffffff" : "transparent";
        (b as HTMLElement).style.boxShadow = isCurrent ? "0 1px 2px rgba(0,0,0,0.05)" : "none";
      });

      if (vp === "desktop") {
        viewportFrame.style.maxWidth = "100%";
      } else if (vp === "tablet") {
        viewportFrame.style.maxWidth = "768px";
      } else if (vp === "mobile") {
        viewportFrame.style.maxWidth = "375px";
      }
    });
  });
}

// ============================================
// 3. Pestañas del Inspector (Columna 3)
// ============================================
function setupInspectorTabs() {
  const tabs = document.querySelectorAll(".btn-inspector-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = (tab as HTMLElement).dataset.tab as "page" | "block";
      if (targetTab) switchInspectorTab(targetTab);
    });
  });
}

function switchInspectorTab(tabName: "page" | "block") {
  currentTab = tabName;
  const tabs = document.querySelectorAll(".btn-inspector-tab");
  const pageTabContent = document.getElementById("tab-page-content");
  const blockTabContent = document.getElementById("tab-block-content");

  tabs.forEach((tab) => {
    const isTarget = (tab as HTMLElement).dataset.tab === tabName;
    tab.classList.toggle("active", isTarget);
    (tab as HTMLElement).style.color = isTarget ? "var(--primary-color, #6366f1)" : "#6b7280";
    (tab as HTMLElement).style.borderBottom = isTarget ? "2px solid var(--primary-color, #6366f1)" : "none";
  });

  if (tabName === "page") {
    pageTabContent?.classList.remove("hidden");
    blockTabContent?.classList.add("hidden");
  } else {
    pageTabContent?.classList.add("hidden");
    blockTabContent?.classList.remove("hidden");
    renderInspectorBlockForm();
  }
}

function setupTitleSlugSync() {
  const titleInput = document.getElementById("editor-page-title") as HTMLInputElement | null;
  const slugInput = document.getElementById("editor-page-slug") as HTMLInputElement | null;

  titleInput?.addEventListener("input", () => {
    if (!editingPageId && slugInput) {
      slugInput.value = slugify(titleInput.value);
    }
  });
}

function populatePageFields(page: CustomPage) {
  const editorHeading = document.getElementById("editor-heading");
  const titleInput = document.getElementById("editor-page-title") as HTMLInputElement | null;
  const slugInput = document.getElementById("editor-page-slug") as HTMLInputElement | null;
  const publishedInput = document.getElementById("editor-page-published") as HTMLInputElement | null;
  const showInNavInput = document.getElementById("editor-page-show-in-nav") as HTMLInputElement | null;
  const seoTitleInput = document.getElementById("editor-seo-title") as HTMLInputElement | null;
  const seoDescInput = document.getElementById("editor-seo-desc") as HTMLTextAreaElement | null;
  const btnPreview = document.getElementById("btn-preview-page") as HTMLAnchorElement | null;

  if (editorHeading) editorHeading.textContent = `Editar Página: ${page.title}`;
  if (titleInput) titleInput.value = page.title;
  if (slugInput) slugInput.value = page.slug;
  if (publishedInput) publishedInput.checked = page.published;
  if (showInNavInput) showInNavInput.checked = page.showInNav;
  if (seoTitleInput) seoTitleInput.value = page.seo?.metaTitle || page.seoTitle || "";
  if (seoDescInput) seoDescInput.value = page.seo?.metaDescription || page.seoDescription || "";

  if (btnPreview) {
    btnPreview.href = `/${page.slug}`;
    btnPreview.classList.remove("hidden");
  }
}

// ============================================
// 4. Renderizado del Lienzo Central (Canvas)
// ============================================
function renderCanvas() {
  const container = document.getElementById("canvas-blocks-container");
  const emptyState = document.getElementById("canvas-empty-state");
  if (!container) return;

  if (currentBlocks.length === 0) {
    emptyState?.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }

  emptyState?.classList.add("hidden");

  container.innerHTML = currentBlocks
    .map((block, index) => {
      const isSelected = block.id === selectedBlockId;
      const blockHtml = BlockRegistry.render(block);

      return `
        <div class="block-canvas-item ${isSelected ? "selected" : ""}" data-id="${block.id}">
          ${
            isSelected
              ? `
            <div class="block-actions-bar">
              ${index > 0 ? `<button type="button" class="block-action-btn btn-move-up" data-id="${block.id}" title="Mover arriba">⬆️</button>` : ""}
              ${index < currentBlocks.length - 1 ? `<button type="button" class="block-action-btn btn-move-down" data-id="${block.id}" title="Mover abajo">⬇️</button>` : ""}
              <button type="button" class="block-action-btn btn-duplicate-block" data-id="${block.id}" title="Duplicar">📋</button>
              <button type="button" class="block-action-btn btn-delete-block" data-id="${block.id}" title="Eliminar" style="color: #ef4444;">🗑️</button>
            </div>
          `
              : ""
          }
          <div class="block-rendered-content">${blockHtml}</div>
        </div>
      `;
    })
    .join("");

  // Asignar eventos de selección y acciones
  container.querySelectorAll(".block-canvas-item").forEach((el) => {
    const id = (el as HTMLElement).dataset.id;
    const block = currentBlocks.find((b) => b.id === id);

    // Habilitar edición in-situ (contenteditable) en todos los fragmentos de texto del bloque
    if (block) {
      const textElements = el.querySelectorAll<HTMLElement>("[data-field], h1, h2, h3, h4, h5, h6, p, .cta-title, .cta-text, .hero-title, .hero-subtitle, button, .btn-cta, .card-title, .card-desc");
      textElements.forEach((textEl) => {
        textEl.setAttribute("contenteditable", "true");
        textEl.setAttribute("spellcheck", "false");
        textEl.style.outline = "none";
        textEl.style.cursor = "text";

        // Prevenir redirección si es un enlace/botón
        textEl.addEventListener("click", (e) => e.stopPropagation());

        // Evento de edición directa in-situ
        textEl.addEventListener("input", () => {
          isDirty = true;
          const updatedText = textEl.innerHTML.trim();
          const field = textEl.dataset.field;
          const cardIndexStr = textEl.dataset.cardIndex;

          // Si pertenece a una tarjeta (cards)
          if (block.type === "cards" && cardIndexStr !== undefined) {
            const cardIdx = Number(cardIndexStr);
            if (Array.isArray(block.content.items) && block.content.items[cardIdx]) {
              if (field === "title") block.content.items[cardIdx].title = updatedText;
              if (field === "description") block.content.items[cardIdx].description = updatedText;
            }
          } else if (block.type === "heading" || block.type === "paragraph") {
            block.content.text = updatedText;
            const ctrlText = document.getElementById("ctrl-text") as HTMLInputElement | HTMLTextAreaElement | null;
            if (ctrlText && selectedBlockId === block.id) ctrlText.value = updatedText;
          } else if (block.type === "hero") {
            if (field === "title" || textEl.tagName.startsWith("H") || textEl.classList.contains("hero-title")) {
              block.content.title = updatedText;
              const ctrlTitle = document.getElementById("ctrl-title") as HTMLInputElement | null;
              if (ctrlTitle && selectedBlockId === block.id) ctrlTitle.value = updatedText;
            } else if (field === "subtitle" || textEl.tagName === "P" || textEl.classList.contains("hero-subtitle")) {
              block.content.subtitle = updatedText;
              const ctrlSub = document.getElementById("ctrl-subtitle") as HTMLInputElement | null;
              if (ctrlSub && selectedBlockId === block.id) ctrlSub.value = updatedText;
            } else if (field === "ctaText" || textEl.tagName === "A" || textEl.tagName === "BUTTON") {
              block.content.ctaText = updatedText;
              const ctrlCta = document.getElementById("ctrl-ctaText") as HTMLInputElement | null;
              if (ctrlCta && selectedBlockId === block.id) ctrlCta.value = updatedText;
            }
          } else if (block.type === "cta") {
            if (field === "title" || textEl.tagName.startsWith("H") || textEl.classList.contains("cta-title")) {
              block.content.title = updatedText;
              const ctrlTitle = document.getElementById("ctrl-title") as HTMLInputElement | null;
              if (ctrlTitle && selectedBlockId === block.id) ctrlTitle.value = updatedText;
            } else if (field === "description" || textEl.tagName === "P" || textEl.classList.contains("cta-text")) {
              block.content.description = updatedText;
              const ctrlDesc = document.getElementById("ctrl-description") as HTMLTextAreaElement | null;
              if (ctrlDesc && selectedBlockId === block.id) ctrlDesc.value = updatedText;
            } else if (field === "btnText" || textEl.tagName === "A" || textEl.tagName === "BUTTON") {
              block.content.btnText = updatedText;
              const ctrlBtnText = document.getElementById("ctrl-btnText") as HTMLInputElement | null;
              if (ctrlBtnText && selectedBlockId === block.id) ctrlBtnText.value = updatedText;
            }
          }

          autoSaveDraft();
        });
      });
    }

    el.addEventListener("click", (e) => {
      // Prevenir re-selección al hacer clic en los botones de acción
      if ((e.target as HTMLElement).closest(".block-actions-bar")) return;
      if (id) {
        selectedBlockId = id;
        renderCanvas();
        switchInspectorTab("block");
      }
    });
  });

  container.querySelectorAll(".btn-move-up").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      if (id) moveBlock(id, -1);
    });
  });

  container.querySelectorAll(".btn-move-down").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      if (id) moveBlock(id, 1);
    });
  });

  container.querySelectorAll(".btn-duplicate-block").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      if (id) duplicateBlock(id);
    });
  });

  container.querySelectorAll(".btn-delete-block").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      if (id) removeBlock(id);
    });
  });
}

function moveBlock(id: string, direction: number) {
  const index = currentBlocks.findIndex((b) => b.id === id);
  if (index < 0) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= currentBlocks.length) return;

  const temp = currentBlocks[index];
  currentBlocks[index] = currentBlocks[newIndex];
  currentBlocks[newIndex] = temp;

  renderCanvas();
}

function duplicateBlock(id: string) {
  const index = currentBlocks.findIndex((b) => b.id === id);
  if (index < 0) return;

  const original = currentBlocks[index];
  const clone: PageBlock = {
    id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: original.type,
    content: JSON.parse(JSON.stringify(original.content)),
    style: JSON.parse(JSON.stringify(original.style || {})),
  };

  currentBlocks.splice(index + 1, 0, clone);
  selectedBlockId = clone.id;

  renderCanvas();
  switchInspectorTab("block");
}

function removeBlock(id: string) {
  currentBlocks = currentBlocks.filter((b) => b.id !== id);
  if (selectedBlockId === id) {
    selectedBlockId = currentBlocks.length > 0 ? currentBlocks[0].id : null;
  }
  renderCanvas();
  renderInspectorBlockForm();
}

// ============================================
// 5. Inspector de Bloque (Formulario Dinámico)
// ============================================
function renderInspectorBlockForm() {
  const noBlockMsg = document.getElementById("no-block-selected-msg");
  const controlsContainer = document.getElementById("block-controls-container");
  const fieldsContainer = document.getElementById("block-dynamic-fields");
  const typeNameLabel = document.getElementById("selected-block-type-name");

  if (!selectedBlockId) {
    noBlockMsg?.classList.remove("hidden");
    controlsContainer?.classList.add("hidden");
    return;
  }

  const block = currentBlocks.find((b) => b.id === selectedBlockId);
  if (!block) {
    noBlockMsg?.classList.remove("hidden");
    controlsContainer?.classList.add("hidden");
    return;
  }

  noBlockMsg?.classList.add("hidden");
  controlsContainer?.classList.remove("hidden");

  const def = BlockRegistry.get(block.type);
  if (typeNameLabel) typeNameLabel.textContent = `Propiedades: ${def?.label || block.type}`;

  if (!fieldsContainer) return;

  const content = block.content || {};
  const style = block.style || {};

  // Formulario dinámico según el tipo de bloque
  let formHtml = "";

  if (block.type === "heading") {
    formHtml += `
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Texto del encabezado</label>
        <input type="text" id="ctrl-text" value="${escapeAttribute(content.text || "")}" class="form-ctrl-input" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Nivel (H1 - H6)</label>
        <select id="ctrl-level" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;">
          ${[1, 2, 3, 4, 5, 6].map((l) => `<option value="${l}" ${content.level === l ? "selected" : ""}>H${l}</option>`).join("")}
        </select>
      </div>
    `;
  } else if (block.type === "paragraph") {
    formHtml += `
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Texto del párrafo</label>
        <textarea id="ctrl-text" rows="4" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;">${escapeAttribute(content.text || "")}</textarea>
      </div>
    `;
  } else if (block.type === "hero") {
    formHtml += `
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Título principal</label>
        <input type="text" id="ctrl-title" value="${escapeAttribute(content.title || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Subtítulo</label>
        <input type="text" id="ctrl-subtitle" value="${escapeAttribute(content.subtitle || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">URL Imagen de fondo</label>
        <input type="url" id="ctrl-bgImage" value="${escapeAttribute(content.bgImage || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Texto del botón CTA</label>
        <input type="text" id="ctrl-ctaText" value="${escapeAttribute(content.ctaText || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Enlace del botón CTA</label>
        <input type="text" id="ctrl-ctaLink" value="${escapeAttribute(content.ctaLink || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
    `;
  } else if (block.type === "cta") {
    formHtml += `
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Título CTA</label>
        <input type="text" id="ctrl-title" value="${escapeAttribute(content.title || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Descripción</label>
        <textarea id="ctrl-description" rows="2" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;">${escapeAttribute(content.description || "")}</textarea>
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Texto del botón</label>
        <input type="text" id="ctrl-btnText" value="${escapeAttribute(content.btnText || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Enlace del botón</label>
        <input type="text" id="ctrl-btnLink" value="${escapeAttribute(content.btnLink || "")}" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
    `;
  } else if (block.type === "spacer") {
    formHtml += `
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; font-weight: 500;">Altura (px)</label>
        <input type="number" id="ctrl-height" value="${content.height || 40}" min="10" max="300" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
      </div>
    `;
  }

  // Estilos visuales compartidos (Color de texto, fondo, alineación, padding)
  formHtml += `
    <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e5e7eb;" />
    <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: bold; color: #4b5563;">Estilos del Bloque</h5>

    <div class="form-group" style="margin-bottom: 0.75rem;">
      <label style="font-size: 0.8rem; font-weight: 500;">Alineación de texto</label>
      <select id="ctrl-style-align" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;">
        <option value="left" ${style.textAlign === "left" ? "selected" : ""}>Izquierda</option>
        <option value="center" ${style.textAlign === "center" ? "selected" : ""}>Centrado</option>
        <option value="right" ${style.textAlign === "right" ? "selected" : ""}>Derecha</option>
      </select>
    </div>

    <div class="form-group" style="margin-bottom: 0.75rem;">
      <label style="font-size: 0.8rem; font-weight: 500;">Color de texto (Hex)</label>
      <input type="text" id="ctrl-style-textColor" value="${escapeAttribute(style.textColor || "")}" placeholder="#1e293b" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
    </div>

    <div class="form-group" style="margin-bottom: 0.75rem;">
      <label style="font-size: 0.8rem; font-weight: 500;">Color de fondo (Hex)</label>
      <input type="text" id="ctrl-style-bgColor" value="${escapeAttribute(style.backgroundColor || "")}" placeholder="#ffffff" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
    </div>

    <div class="form-group" style="margin-bottom: 0.75rem;">
      <label style="font-size: 0.8rem; font-weight: 500;">Relleno vertical (Padding Y: px)</label>
      <input type="number" id="ctrl-style-paddingY" value="${style.paddingY ?? 20}" min="0" max="150" style="width: 100%; padding: 0.4rem; border-radius: 4px; border: 1px solid #d1d5db;" />
    </div>
  `;

  fieldsContainer.innerHTML = formHtml;

  // Escuchar cambios en los inputs para actualizar el bloque en vivo
  fieldsContainer.querySelectorAll("input, textarea, select").forEach((input) => {
    input.addEventListener("input", () => {
      updateSelectedBlockFromForm();
    });
  });
}

function updateSelectedBlockFromForm() {
  if (!selectedBlockId) return;
  const block = currentBlocks.find((b) => b.id === selectedBlockId);
  if (!block) return;

  const content = block.content || {};
  const style = block.style || {};

  const ctrlText = document.getElementById("ctrl-text") as HTMLInputElement | HTMLTextAreaElement | null;
  const ctrlLevel = document.getElementById("ctrl-level") as HTMLSelectElement | null;
  const ctrlTitle = document.getElementById("ctrl-title") as HTMLInputElement | null;
  const ctrlSubtitle = document.getElementById("ctrl-subtitle") as HTMLInputElement | null;
  const ctrlBgImage = document.getElementById("ctrl-bgImage") as HTMLInputElement | null;
  const ctrlCtaText = document.getElementById("ctrl-ctaText") as HTMLInputElement | null;
  const ctrlCtaLink = document.getElementById("ctrl-ctaLink") as HTMLInputElement | null;
  const ctrlDescription = document.getElementById("ctrl-description") as HTMLTextAreaElement | null;
  const ctrlBtnText = document.getElementById("ctrl-btnText") as HTMLInputElement | null;
  const ctrlBtnLink = document.getElementById("ctrl-btnLink") as HTMLInputElement | null;
  const ctrlHeight = document.getElementById("ctrl-height") as HTMLInputElement | null;

  const ctrlStyleAlign = document.getElementById("ctrl-style-align") as HTMLSelectElement | null;
  const ctrlStyleTextColor = document.getElementById("ctrl-style-textColor") as HTMLInputElement | null;
  const ctrlStyleBgColor = document.getElementById("ctrl-style-bgColor") as HTMLInputElement | null;
  const ctrlStylePaddingY = document.getElementById("ctrl-style-paddingY") as HTMLInputElement | null;

  if (ctrlText) content.text = ctrlText.value;
  if (ctrlLevel) content.level = Number(ctrlLevel.value);
  if (ctrlTitle) content.title = ctrlTitle.value;
  if (ctrlSubtitle) content.subtitle = ctrlSubtitle.value;
  if (ctrlBgImage) content.bgImage = ctrlBgImage.value;
  if (ctrlCtaText) content.ctaText = ctrlCtaText.value;
  if (ctrlCtaLink) content.ctaLink = ctrlCtaLink.value;
  if (ctrlDescription) content.description = ctrlDescription.value;
  if (ctrlBtnText) content.btnText = ctrlBtnText.value;
  if (ctrlBtnLink) content.btnLink = ctrlBtnLink.value;
  if (ctrlHeight) content.height = Number(ctrlHeight.value);

  if (ctrlStyleAlign) style.textAlign = ctrlStyleAlign.value as any;
  if (ctrlStyleTextColor) style.textColor = ctrlStyleTextColor.value.trim();
  if (ctrlStyleBgColor) style.backgroundColor = ctrlStyleBgColor.value.trim();
  if (ctrlStylePaddingY) style.paddingY = Number(ctrlStylePaddingY.value);

  block.content = content;
  block.style = style;

  renderCanvas();
}

let isDirty = false;

// ============================================
// 6. Guardar Cambios en Subcolección Firestore
// ============================================
async function handleSave(overridePublish?: boolean) {
  if (!siteDomain || !siteData) return;

  const titleInput = document.getElementById("editor-page-title") as HTMLInputElement | null;
  const slugInput = document.getElementById("editor-page-slug") as HTMLInputElement | null;
  const publishedInput = document.getElementById("editor-page-published") as HTMLInputElement | null;
  const showInNavInput = document.getElementById("editor-page-show-in-nav") as HTMLInputElement | null;
  const seoTitleInput = document.getElementById("editor-seo-title") as HTMLInputElement | null;
  const seoDescInput = document.getElementById("editor-seo-desc") as HTMLTextAreaElement | null;
  const feedback = document.getElementById("save-feedback");
  const btnSave = document.getElementById("btn-save-editor") as HTMLButtonElement | null;
  const btnSaveDraft = document.getElementById("btn-save-draft") as HTMLButtonElement | null;
  const btnPreview = document.getElementById("btn-preview-page") as HTMLAnchorElement | null;

  const title = titleInput?.value.trim() || "";
  const rawSlug = slugInput?.value.trim() || "";
  const slug = slugify(rawSlug || title);
  
  // Determinar estado de publicación (overridePublish tiene prioridad)
  const published = typeof overridePublish === "boolean" ? overridePublish : (publishedInput?.checked ?? true);
  if (publishedInput) publishedInput.checked = published;

  const showInNav = showInNavInput?.checked ?? false;
  const seoTitle = seoTitleInput?.value.trim() || "";
  const seoDescription = seoDescInput?.value.trim() || "";

  // Validación de campos
  let hasErrors = false;
  const errTitle = document.getElementById("err-editor-title");
  const errSlug = document.getElementById("err-editor-slug");

  if (!title) {
    errTitle?.classList.add("visible");
    hasErrors = true;
  } else {
    errTitle?.classList.remove("visible");
  }

  if (!slug) {
    errSlug?.classList.add("visible");
    hasErrors = true;
  } else {
    errSlug?.classList.remove("visible");
  }

  // Verificar conflicto de slug con otras páginas
  const allPages = await listSitePages(siteDomain);
  const slugConflict = allPages.some(
    (p) => p.slug.toLowerCase() === slug.toLowerCase() && p.id !== editingPageId
  );

  if (slugConflict) {
    if (feedback) {
      feedback.className = "alert alert-danger visible";
      feedback.textContent = "Ya existe una página con este slug.";
    }
    return;
  }

  if (hasErrors) return;

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = published ? "Publicando..." : "Guardando...";
  }
  if (btnSaveDraft) btnSaveDraft.disabled = true;

  const now = new Date().toISOString();
  const pageId = editingPageId || `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Construir objeto CustomPage con la secuencia de bloques
  const pageDataToSave: CustomPage = {
    id: pageId,
    title,
    slug,
    content: currentBlocks.length > 0 ? "Contenido formateado en bloques" : "",
    published,
    status: published ? "published" : "draft",
    showInNav,
    blocks: currentBlocks,
    seoTitle,
    seoDescription,
    seo: {
      metaTitle: seoTitle,
      metaDescription: seoDescription,
    },
    createdAt: editingPageId ? (allPages.find((p) => p.id === editingPageId)?.createdAt || now) : now,
    updatedAt: now,
  };

  try {
    // 1. Guardar en la subcolección sites/{domain}/pages
    const result = await savePageSubcollection(siteDomain, pageDataToSave);

    if (result.success) {
      editingPageId = pageId;
      isDirty = false;

      // 2. Intentar sincronizar navLinks en el documento del sitio de forma segura y aislada
      try {
        let updatedNavLinks = [...(siteData.navLinks || [])];
        const pageHref = `/${slug}`;
        const existingLinkIndex = updatedNavLinks.findIndex(
          (l) => l.href === pageHref || (editingPageId && l.label === title)
        );

        if (showInNav && published) {
          if (existingLinkIndex >= 0) {
            updatedNavLinks[existingLinkIndex] = { label: title, href: pageHref };
          } else {
            updatedNavLinks.push({ label: title, href: pageHref });
          }
        } else if (!showInNav && existingLinkIndex >= 0) {
          updatedNavLinks.splice(existingLinkIndex, 1);
        }

        siteData.navLinks = updatedNavLinks;
        const adminApp = document.getElementById("admin-app");
        if (adminApp) adminApp.dataset.siteData = JSON.stringify(siteData);

        // Actualizar en Firestore en segundo plano sin bloquear la respuesta de la página
        updateDocument("sites", siteDomain, {
          navLinks: updatedNavLinks,
        }).catch(() => {
          // Ignorar fallo de navLinks si las reglas impiden actualizar la raíz del sitio
        });
      } catch {
        // Ignorar fallos de menú
      }

      if (feedback) {
        feedback.className = "alert alert-success visible";
        feedback.textContent = published
          ? "¡Página publicada correctamente!"
          : "Página guardada como borrador (no visible para visitantes).";
        setTimeout(() => feedback.classList.add("hidden"), 4000);
      }

      if (btnPreview) {
        btnPreview.href = `/${slug}`;
        btnPreview.classList.remove("hidden");
      }

      // Limpiar borrador local guardado tras persistencia exitosa
      clearLocalDraft();
      updateDraftStatus(published ? "Publicada en Firestore" : "Guardada como borrador");

      // Invalidar caché en memoria para refrescar vista pública y navegación
      MemoryCache.invalidate(`pages-list:${siteDomain}`);
      MemoryCache.invalidate(`page:${siteDomain}:${slug}`);
      MemoryCache.invalidate(`site:${siteDomain}`);

      if (window.history.pushState) {
        window.history.pushState({}, "", `/admin/pages/editor?id=${editingPageId}`);
      }
    } else {
      if (feedback) {
        feedback.className = "alert alert-danger visible";
        feedback.textContent = result.error || "Error al guardar la página.";
      }
    }
  } catch (err) {
    if (feedback) {
      feedback.className = "alert alert-danger visible";
      feedback.textContent = "Error inesperado al guardar la página.";
    }
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = "🚀 Publicar Página";
    }
    if (btnSaveDraft) btnSaveDraft.disabled = false;
  }
}

// ============================================
// 7. Auto-guardado y Restauración de Borrador Local (localStorage)
// ============================================
function getDraftStorageKey(): string {
  return `mwp_draft_page_${editingPageId || "new"}`;
}

function autoSaveDraft() {
  isDirty = true;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const draftData = {
      blocks: currentBlocks,
      timestamp: Date.now(),
    };
    localStorage.setItem(getDraftStorageKey(), JSON.stringify(draftData));
    updateDraftStatus("Borrador guardado en navegador");
  } catch {
    // Ignorar errores de cuota de localStorage
  }
}

function clearLocalDraft() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(getDraftStorageKey());
    const banner = document.getElementById("draft-restore-banner");
    banner?.classList.add("hidden");
  } catch {
    // Ignorar
  }
}

function updateDraftStatus(msg: string) {
  const indicator = document.getElementById("draft-status-indicator");
  if (indicator) {
    indicator.textContent = msg;
  }
}

function checkUnsavedDraft() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = localStorage.getItem(getDraftStorageKey());
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed.blocks || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) return;

    const banner = document.getElementById("draft-restore-banner");
    const btnRestore = document.getElementById("btn-restore-draft-action");
    const btnDiscard = document.getElementById("btn-discard-draft-action");

    if (banner) {
      banner.classList.remove("hidden");

      if (btnRestore) {
        btnRestore.onclick = () => {
          currentBlocks = [...parsed.blocks];
          renderCanvas();
          banner.classList.add("hidden");
          updateDraftStatus("Borrador local restaurado");
        };
      }

      if (btnDiscard) {
        btnDiscard.onclick = () => {
          clearLocalDraft();
          updateDraftStatus("");
        };
      }
    }
  } catch {
    // Ignorar
  }
}
