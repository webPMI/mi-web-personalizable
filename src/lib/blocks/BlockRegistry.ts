// ============================================
// BlockRegistry.ts — Registro Extensible de Bloques (SOLID Open/Closed)
// ============================================
// Permite registrar y renderizar módulos de bloques
// de forma desacoplada y extensible.
// Todos los estilos inline usan variables CSS del tema.
// ============================================

import type { PageBlock, BlockType, BlockStyle } from "../site";
import { sanitizeText, sanitizeUrl, escapeAttribute } from "../sanitizer";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  defaultContent: Record<string, any>;
  render: (content: Record<string, any>, style?: BlockStyle) => string;
}

export class BlockRegistry {
  private static registry = new Map<BlockType, BlockDefinition>();

  public static register(def: BlockDefinition) {
    this.registry.set(def.type, def);
  }

  public static get(type: BlockType): BlockDefinition | undefined {
    return this.registry.get(type);
  }

  public static getDefinitions(): BlockDefinition[] {
    return Array.from(this.registry.values());
  }

  public static render(block: PageBlock): string {
    const def = this.registry.get(block.type);
    if (!def) {
      // Fallback genérico si el tipo de bloque no está registrado
      return `<div class="block-fallback" style="padding: 1rem; border: 1px dashed var(--card-border, #ccc);">
        <p><strong>[Bloque: ${escapeAttribute(block.type)}]</strong></p>
      </div>`;
    }
    return def.render(block.content || {}, block.style || {});
  }
}

// ============================================
// Registrar Bloques Estándar Iniciales
// ============================================

// 1. Bloque: Encabezado (Heading)
BlockRegistry.register({
  type: "heading",
  label: "Encabezado",
  icon: "🏷️",
  defaultContent: { text: "Nuevo Encabezado", level: 2 },
  render: (content, style = {}) => {
    const level = Math.min(Math.max(Number(content.level) || 2, 1), 6);
    const tag = `h${level}`;
    const inlineCss = buildStyleCss(style);
    const text = sanitizeText(content.text || "");
    return `<${tag} class="block-heading" data-field="text" style="color: var(--text, #1a1a2e); ${inlineCss}">${text}</${tag}>`;
  },
});

// 2. Bloque: Párrafo (Paragraph)
BlockRegistry.register({
  type: "paragraph",
  label: "Párrafo",
  icon: "📝",
  defaultContent: { text: "Escribe tu contenido aquí..." },
  render: (content, style = {}) => {
    const inlineCss = buildStyleCss(style);
    const text = sanitizeText(content.text || content.htmlText || "").replace(/\n/g, "<br />");
    return `<p class="block-paragraph" data-field="text" style="color: var(--text, #1a1a2e); line-height: var(--line-height, 1.6); ${inlineCss}">${text}</p>`;
  },
});

// 3. Bloque: Banner Hero (Hero)
BlockRegistry.register({
  type: "hero",
  label: "Banner Hero",
  icon: "🖼️",
  defaultContent: { title: "Bienvenido", subtitle: "Descripción impactante", bgImage: "", ctaText: "Comenzar", ctaLink: "#" },
  render: (content, style = {}) => {
    const inlineCss = buildStyleCss(style);
    const bgUrl = sanitizeUrl(content.bgImage);
    const bgStyle = bgUrl ? `background-image: url('${bgUrl}'); background-size: cover; background-position: center;` : "";
    const opacity = Number(content.overlayOpacity) || 0.4;
    const title = sanitizeText(content.title || "");
    const subtitle = sanitizeText(content.subtitle || "");
    const ctaText = sanitizeText(content.ctaText || "");
    const ctaLink = sanitizeUrl(content.ctaLink);

    return `
      <section class="block-hero" style="position: relative; padding: 4rem 2rem; color: var(--hero-text-color, #ffffff); text-align: var(--hero-align, center); border-radius: var(--border-radius, 8px); overflow: hidden; background-color: var(--primary, #6366f1); ${bgStyle} ${inlineCss}">
        <div class="hero-overlay" style="position: absolute; inset: 0; background: var(--hero-overlay-color, #000000); opacity: var(--hero-overlay-opacity, ${opacity}); z-index: 1;"></div>
        <div class="hero-content" style="position: relative; z-index: 2; max-width: 800px; margin: 0 auto;">
          <h1 class="hero-title" data-field="title" style="font-size: var(--hero-title-size, 2.5rem); font-weight: var(--hero-title-weight, bold); margin-bottom: 1rem; color: var(--hero-text-color, #ffffff);">${title}</h1>
          <p class="hero-subtitle" data-field="subtitle" style="font-size: var(--hero-subtitle-size, 1.25rem); margin-bottom: 1.5rem; color: var(--hero-subtitle-color, rgba(255,255,255,0.9));">${subtitle}</p>
          ${ctaText ? `<a href="${ctaLink || '#'}" class="btn btn-primary btn-lg hero-cta" data-field="ctaText" style="display: inline-block; padding: var(--btn-py, 12px) var(--btn-px, 24px); background: var(--accent, #4f46e5); color: var(--btn-text-color, #fff); text-decoration: none; border-radius: var(--btn-radius, 6px); font-weight: bold;">${ctaText}</a>` : ""}
        </div>
      </section>
    `;
  },
});

// 4. Bloque: Tarjetas (Cards)
BlockRegistry.register({
  type: "cards",
  label: "Tarjetas",
  icon: "🎴",
  defaultContent: { items: [{ title: "Característica 1", description: "Detalle de la característica" }] },
  render: (content, style = {}) => {
    const inlineCss = buildStyleCss(style);
    const items = Array.isArray(content.items) ? content.items : [];
    const cardsHtml = items
      .map((item: any, i: number) => `
        <div class="card-item" data-card-index="${i}" style="background: var(--card-bg, #ffffff); padding: 1.5rem; border-radius: var(--card-radius, 8px); border: 1px solid var(--card-border, #e5e7eb); box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.05));">
          ${item.image ? `<img src="${sanitizeUrl(item.image)}" alt="" style="width: 100%; height: 160px; object-fit: cover; border-radius: var(--border-radius, 6px); margin-bottom: 1rem;" />` : ""}
          <h3 class="card-title" data-field="title" data-card-index="${i}" style="margin-top: 0; font-size: var(--h3-size, 1.25rem); font-weight: bold; color: var(--text, #1a1a2e);">${sanitizeText(item.title || "")}</h3>
          <p class="card-desc" data-field="description" data-card-index="${i}" style="color: var(--text-muted, #6b7280); font-size: 0.95rem; margin-bottom: 0;">${sanitizeText(item.description || "")}</p>
        </div>
      `)
      .join("");

    return `
      <div class="block-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; ${inlineCss}">
        ${cardsHtml}
      </div>
    `;
  },
});

// 5. Bloque: Llamada a la Acción (CTA Box)
BlockRegistry.register({
  type: "cta",
  label: "Llamada a la Acción",
  icon: "📢",
  defaultContent: { title: "¿Listo para empezar?", description: "Únete hoy mismo a nuestra plataforma.", btnText: "Contactar", btnLink: "#" },
  render: (content, style = {}) => {
    const inlineCss = buildStyleCss(style);
    const title = sanitizeText(content.title || "");
    const description = sanitizeText(content.description || "");
    const btnText = sanitizeText(content.btnText || "");
    const btnLink = sanitizeUrl(content.btnLink);

    return `
      <div class="block-cta" style="background: var(--primary, #6366f1); color: var(--hero-text-color, #ffffff); padding: 3rem 2rem; border-radius: var(--border-radius, 12px); text-align: var(--hero-align, center); ${inlineCss}">
        <h2 class="cta-title" data-field="title" style="font-size: var(--h2-size, 2rem); margin-bottom: 0.75rem; font-weight: bold; color: var(--hero-text-color, #ffffff);">${title}</h2>
        <p class="cta-text" data-field="description" style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 1.5rem;">${description}</p>
        ${btnText ? `<a href="${btnLink || '#'}" class="btn btn-light cta-btn" data-field="btnText" style="display: inline-block; padding: var(--btn-py, 12px) var(--btn-px, 24px); background: var(--btn-text-color, #ffffff); color: var(--accent, #4f46e5); text-decoration: none; border-radius: var(--btn-radius, 6px); font-weight: bold;">${btnText}</a>` : ""}
      </div>
    `;
  },
});

// 6. Bloque: Espaciador (Spacer)
BlockRegistry.register({
  type: "spacer",
  label: "Espaciador",
  icon: "📏",
  defaultContent: { height: 40 },
  render: (content) => {
    const parsed = Number(content.height);
    const height = Math.max(Number.isNaN(parsed) ? 40 : parsed, 10);
    return `<div class="block-spacer" style="height: ${height}px; width: 100%;"></div>`;
  },
});

/**
 * Convierte un objeto BlockStyle en CSS inline limpio
 */
function buildStyleCss(style?: BlockStyle): string {
  if (!style) return "";
  const styles: string[] = [];

  if (style.textColor) styles.push(`color: ${style.textColor}`);
  if (style.backgroundColor) styles.push(`background-color: ${style.backgroundColor}`);
  if (style.paddingY !== undefined) {
    styles.push(`padding-top: ${style.paddingY}px`);
    styles.push(`padding-bottom: ${style.paddingY}px`);
  }
  if (style.textAlign) styles.push(`text-align: ${style.textAlign}`);

  return styles.join("; ");
}
