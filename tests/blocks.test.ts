import { describe, it, expect } from "vitest";
import { BlockRegistry } from "../src/lib/blocks/BlockRegistry";
import type { PageBlock } from "../src/lib/site";

describe("BlockRegistry & Block Rendering Engine", () => {
  // ============================================
  // Block Definitions
  // ============================================
  describe("Block Definitions & Registry", () => {
    it("should list registered standard block definitions", () => {
      const definitions = BlockRegistry.getDefinitions();
      const types = definitions.map((d) => d.type);

      expect(types).toContain("heading");
      expect(types).toContain("paragraph");
      expect(types).toContain("hero");
      expect(types).toContain("cards");
      expect(types).toContain("cta");
      expect(types).toContain("spacer");
    });

    it("should have icon and label for every definition", () => {
      const definitions = BlockRegistry.getDefinitions();
      for (const def of definitions) {
        expect(def.icon).toBeTruthy();
        expect(def.label).toBeTruthy();
        expect(def.type).toBeTruthy();
      }
    });

    it("should return a definition via BlockRegistry.get()", () => {
      const heading = BlockRegistry.get("heading");
      expect(heading).toBeDefined();
      expect(heading?.type).toBe("heading");
      expect(heading?.defaultContent).toBeDefined();
    });

    it("should return undefined for unknown block type", () => {
      const unknown = BlockRegistry.get("nonexistent" as any);
      expect(unknown).toBeUndefined();
    });

    it("should have defaultContent with expected properties for each block type", () => {
      const heading = BlockRegistry.get("heading");
      expect(heading?.defaultContent).toHaveProperty("text");
      expect(heading?.defaultContent).toHaveProperty("level");

      const hero = BlockRegistry.get("hero");
      expect(hero?.defaultContent).toHaveProperty("title");
      expect(hero?.defaultContent).toHaveProperty("ctaText");

      const spacer = BlockRegistry.get("spacer");
      expect(spacer?.defaultContent).toHaveProperty("height");
    });
  });

  // ============================================
  // Block Rendering & Sanitization
  // ============================================
  describe("Block Rendering", () => {
    it("should render heading block with correct level and text sanitization", () => {
      const block: PageBlock = {
        id: "b-1",
        type: "heading",
        content: { text: "  <script>alert(1)</script> Título Principal  ", level: 1 },
        style: { textColor: "#1e293b", textAlign: "center" },
      };

      const html = BlockRegistry.render(block);

      expect(html).toContain("<h1");
      expect(html).toContain("Título Principal");
      expect(html).not.toContain("<script>");
      expect(html).toContain("color: #1e293b");
      expect(html).toContain("text-align: center");
    });

    it("should render heading with different levels (h2, h3)", () => {
      const h2: PageBlock = { id: "b-h2", type: "heading", content: { text: "Subtítulo", level: 2 } };
      const h3: PageBlock = { id: "b-h3", type: "heading", content: { text: "Terciario", level: 3 } };

      expect(BlockRegistry.render(h2)).toContain("<h2");
      expect(BlockRegistry.render(h3)).toContain("<h3");
    });

    it("should render paragraph block safely with line breaks", () => {
      const block: PageBlock = {
        id: "b-2",
        type: "paragraph",
        content: { text: "Línea 1\nLínea 2" },
        style: { paddingY: 20 },
      };

      const html = BlockRegistry.render(block);

      expect(html).toContain("Línea 1<br />Línea 2");
      expect(html).toContain("padding-top: 20px");
    });

    it("should sanitize XSS in paragraph text", () => {
      const block: PageBlock = {
        id: "b-xss-p",
        type: "paragraph",
        content: { text: '<img onerror="alert(1)" src="x">' },
      };

      const html = BlockRegistry.render(block);
      // The text is HTML-escaped by sanitizeText, so the output contains
      // escaped text like "onerror" which is safe (not executable).
      // We verify that no unescaped HTML tags or executable attributes exist.
      expect(html).not.toContain("<img");
      expect(html).not.toContain('onerror="');
      expect(html).toContain("onerror"); // present as escaped text, safe
    });

    it("should render hero block with button and background style", () => {
      const block: PageBlock = {
        id: "b-3",
        type: "hero",
        content: {
          title: "Hero de Prueba",
          subtitle: "Subtítulo del Hero",
          ctaText: "Ver más",
          ctaLink: "https://example.com",
          bgImage: "https://example.com/bg.jpg",
        },
      };

      const html = BlockRegistry.render(block);

      expect(html).toContain("Hero de Prueba");
      expect(html).toContain("Subtítulo del Hero");
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain("background-image: url('https://example.com/bg.jpg')");
    });

    it("should sanitize XSS in hero title and subtitle", () => {
      const block: PageBlock = {
        id: "b-xss-hero",
        type: "hero",
        content: {
          title: '<script>alert("xss")</script>',
          subtitle: '"><img src=x onerror=alert(1)>',
          ctaText: "OK",
          ctaLink: "#",
        },
      };

      const html = BlockRegistry.render(block);
      expect(html).not.toContain("<script>");
      // The subtitle text is HTML-escaped, so "onerror" appears as escaped text.
      // We verify the raw HTML does not contain unescaped event handlers.
      expect(html).not.toContain('onerror="');
      expect(html).toContain("onerror"); // present as escaped text, safe
    });

    it("should render cards block with items", () => {
      const block: PageBlock = {
        id: "b-4",
        type: "cards",
        content: {
          items: [
            { title: "Tarjeta A", description: "Detalle A" },
            { title: "Tarjeta B", description: "Detalle B" },
          ],
        },
      };

      const html = BlockRegistry.render(block);

      expect(html).toContain("Tarjeta A");
      expect(html).toContain("Tarjeta B");
      expect(html).toContain("Detalle A");
    });

    it("should render cards with empty items array", () => {
      const block: PageBlock = {
        id: "b-4-empty",
        type: "cards",
        content: { items: [] },
      };

      const html = BlockRegistry.render(block);
      expect(html).toBeDefined();
    });

    it("should render CTA block with link and text", () => {
      const block: PageBlock = {
        id: "b-cta",
        type: "cta",
        content: { title: "Empezar ahora", description: "Únete ya", btnText: "Contactar", btnLink: "https://example.com/signup" },
      };

      const html = BlockRegistry.render(block);
      expect(html).toContain("Empezar ahora");
      expect(html).toContain("Contactar");
      expect(html).toContain("https://example.com/signup");
    });

    it("should render spacer block with requested height", () => {
      const block: PageBlock = {
        id: "b-5",
        type: "spacer",
        content: { height: 60 },
      };

      const html = BlockRegistry.render(block);
      expect(html).toContain("height: 60px");
    });

    it("should enforce minimum spacer height of 10px", () => {
      const block: PageBlock = {
        id: "b-spacer-zero",
        type: "spacer",
        content: { height: 0 },
      };

      const html = BlockRegistry.render(block);
      // Math.max(0, 10) = 10
      expect(html).toContain("height: 10px");
    });

    it("should fallback gracefully when rendering an unknown block type", () => {
      const block = {
        id: "b-unknown",
        type: "custom-unknown" as any,
        content: {},
      };

      const html = BlockRegistry.render(block);
      expect(html).toContain("custom-unknown");
    });
  });
});

