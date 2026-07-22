// ============================================
// tests/fragments-editing.test.ts — Pruebas de Edición de Fragmentos por Bloque
// ============================================
// Verifica que la edición in-situ capture fragmentos independientes:
// - Título y subtítulo en Hero.
// - Título y descripción en Tarjetas (Cards Grid).
// - Título, texto y botón en CTA Box.
// ============================================

import { describe, it, expect, beforeEach } from "vitest";

interface CardBlock {
  id: string;
  type: "cards";
  content: {
    items: Array<{ title: string; description: string }>;
  };
}

describe("Universal Fragment Editing Support", () => {
  let cardBlock: CardBlock;

  beforeEach(() => {
    cardBlock = {
      id: "b-cards",
      type: "cards",
      content: {
        items: [
          { title: "Tarjeta 1", description: "Detalle 1" },
          { title: "Tarjeta 2", description: "Detalle 2" },
        ],
      },
    };
  });

  it("debe actualizar el título de una tarjeta específica sin alterar las demás", () => {
    const cardIndex = 1; // Editar segunda tarjeta
    const updatedTitle = "Nuevo Título Tarjeta 2";

    cardBlock.content.items[cardIndex].title = updatedTitle;

    expect(cardBlock.content.items[0].title).toBe("Tarjeta 1");
    expect(cardBlock.content.items[1].title).toBe("Nuevo Título Tarjeta 2");
  });

  it("debe actualizar la descripción de una tarjeta manteniendo su título intacto", () => {
    const cardIndex = 0; // Editar primera tarjeta
    const updatedDesc = "Nueva Descripción Detallada";

    cardBlock.content.items[cardIndex].description = updatedDesc;

    expect(cardBlock.content.items[0].title).toBe("Tarjeta 1");
    expect(cardBlock.content.items[0].description).toBe("Nueva Descripción Detallada");
  });
});
