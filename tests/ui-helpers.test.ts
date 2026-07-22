import { describe, it, expect } from "vitest";

describe("UI Render Helpers & Section Edge Cases", () => {
  it("should sort sections safely when order property is undefined or missing", () => {
    const sections = [
      { id: "sec-3", order: 3, title: "Tercero" },
      { id: "sec-1", order: undefined as unknown as number, title: "Sin orden" },
      { id: "sec-2", order: 1, title: "Primero" },
    ];

    const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    expect(sorted.map((s) => s.id)).toEqual(["sec-1", "sec-2", "sec-3"]);
  });

  it("should parse gallery content safely and exclude empty items", () => {
    const rawContent = "  https://img1.png, , https://img2.png  ,  ";
    const galleryUrls = rawContent
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    expect(galleryUrls).toEqual(["https://img1.png", "https://img2.png"]);
  });

  it("should parse card items safely without creating blank cards from trailing delimiters", () => {
    const rawContent = "Tarjeta 1 | Desc 1 || Tarjeta 2 | Desc 2 || ";
    const cards = rawContent
      .split("||")
      .map((card) => card.trim())
      .filter(Boolean)
      .map((card) => {
        const [title, desc] = card.split("|").map((s) => s.trim());
        return { title, desc };
      });

    expect(cards).toEqual([
      { title: "Tarjeta 1", desc: "Desc 1" },
      { title: "Tarjeta 2", desc: "Desc 2" },
    ]);
  });
});
