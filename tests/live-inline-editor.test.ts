// ============================================
// tests/live-inline-editor.test.ts — Pruebas de Edición In-situ (Inline Contenteditable)
// ============================================
// Verifica la edición directa en el lienzo y la sincronización bidireccional:
// - Atributo contenteditable activado en elementos de texto.
// - Actualización de block.content en tiempo real.
// - Sincronización con los campos del inspector de bloque.
// ============================================

import { describe, it, expect, beforeEach } from "vitest";

interface Block {
  id: string;
  type: "heading" | "paragraph" | "hero" | "cta";
  content: Record<string, any>;
}

function enableInlineEditing(
  container: HTMLElement,
  blocks: Block[],
  onUpdate: (blockId: string, updatedField: string, value: string) => void
) {
  const items = container.querySelectorAll<HTMLElement>(".block-canvas-item");
  items.forEach((item) => {
    const id = item.dataset.id;
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    const textElements = item.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, button, .cta-title, .cta-text");
    textElements.forEach((textEl) => {
      textEl.setAttribute("contenteditable", "true");

      textEl.addEventListener("input", () => {
        const updatedText = textEl.innerText.trim();
        if (block.type === "heading" || block.type === "paragraph") {
          block.content.text = updatedText;
          onUpdate(block.id, "text", updatedText);
        } else if (block.type === "hero") {
          if (textEl.tagName.startsWith("H")) {
            block.content.title = updatedText;
            onUpdate(block.id, "title", updatedText);
          } else {
            block.content.subtitle = updatedText;
            onUpdate(block.id, "subtitle", updatedText);
          }
        }
      });
    });
  });
}

describe("Live Inline Editing & Bidirectional Sync", () => {
  let container: HTMLDivElement;
  let blocks: Block[];

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "editor-canvas-container";

    blocks = [
      { id: "b1", type: "heading", content: { text: "Título Original", level: 1 } },
      { id: "b2", type: "paragraph", content: { text: "Párrafo Inicial" } },
      { id: "b3", type: "hero", content: { title: "Hero Título", subtitle: "Hero Subtítulo" } },
    ];

    container.innerHTML = `
      <div class="block-canvas-item" data-id="b1">
        <h1>${blocks[0].content.text}</h1>
      </div>
      <div class="block-canvas-item" data-id="b2">
        <p>${blocks[1].content.text}</p>
      </div>
      <div class="block-canvas-item" data-id="b3">
        <h1 class="hero-title">${blocks[2].content.title}</h1>
        <p class="hero-subtitle">${blocks[2].content.subtitle}</p>
      </div>
    `;
    document.body.appendChild(container);
  });

  it("debe habilitar el atributo contenteditable en todos los elementos de texto", () => {
    enableInlineEditing(container, blocks, () => {});

    const h1 = container.querySelector('[data-id="b1"] h1') as HTMLElement;
    const p = container.querySelector('[data-id="b2"] p') as HTMLElement;

    expect(h1.getAttribute("contenteditable")).toBe("true");
    expect(p.getAttribute("contenteditable")).toBe("true");
  });

  it("debe actualizar block.content al editar un título in-situ", () => {
    const updates: Array<{ id: string; field: string; val: string }> = [];

    enableInlineEditing(container, blocks, (id, field, val) => {
      updates.push({ id, field, val });
    });

    const h1 = container.querySelector('[data-id="b1"] h1') as HTMLElement;
    h1.innerText = "Nuevo Título Editado";
    h1.dispatchEvent(new Event("input"));

    expect(blocks[0].content.text).toBe("Nuevo Título Editado");
    expect(updates.length).toBe(1);
    expect(updates[0]).toEqual({ id: "b1", field: "text", val: "Nuevo Título Editado" });
  });

  it("debe actualizar block.content al editar un párrafo in-situ", () => {
    enableInlineEditing(container, blocks, () => {});

    const p = container.querySelector('[data-id="b2"] p') as HTMLElement;
    p.innerText = "Párrafo modificado directamente en el lienzo";
    p.dispatchEvent(new Event("input"));

    expect(blocks[1].content.text).toBe("Párrafo modificado directamente en el lienzo");
  });

  it("debe actualizar título y subtítulo en bloques complejos como Hero", () => {
    enableInlineEditing(container, blocks, () => {});

    const heroTitle = container.querySelector('[data-id="b3"] .hero-title') as HTMLElement;
    const heroSubtitle = container.querySelector('[data-id="b3"] .hero-subtitle') as HTMLElement;

    heroTitle.innerText = "Super Hero Editado";
    heroTitle.dispatchEvent(new Event("input"));

    heroSubtitle.innerText = "Subtítulo actualizado live";
    heroSubtitle.dispatchEvent(new Event("input"));

    expect(blocks[2].content.title).toBe("Super Hero Editado");
    expect(blocks[2].content.subtitle).toBe("Subtítulo actualizado live");
  });
});
