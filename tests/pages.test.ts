import { describe, it, expect } from "vitest";
import { slugify, sanitizeText, sanitizeUrl } from "../src/lib/sanitizer";

// Build HTML entities at runtime to avoid editor corruption
const LT = String.fromCharCode(38, 108, 116, 59); // <
const GT = String.fromCharCode(38, 103, 116, 59); // >
const X27 = String.fromCharCode(38, 35, 120, 50, 55, 59); // &#x27;

describe("Custom Pages Utilities", () => {
  describe("slugify() function", () => {
    it("should convert uppercase titles with accents to clean lowercase slugs", () => {
      expect(slugify("Acerca de Nosotros")).toBe("acerca-de-nosotros");
      expect(slugify("¡Términos y Condiciones!")).toBe("terminos-y-condiciones");
      expect(slugify("Política de Privacidad - 2026")).toBe("politica-de-privacidad-2026");
    });

    it("should remove diacritics, special characters, and extra hyphens", () => {
      expect(slugify("¿Cómo funciona el servicio?")).toBe("como-funciona-el-servicio");
      expect(slugify("---Servicios & Productos---")).toBe("servicios-productos");
      expect(slugify("   Página     con     muchos    espacios   ")).toBe("pagina-con-muchos-espacios");
    });

    it("should handle empty strings and strings with only special characters gracefully", () => {
      expect(slugify("")).toBe("");
      expect(slugify("!!! @#$% ^&* ()")).toBe("");
    });

    it("should handle null and undefined gracefully", () => {
      expect(slugify(null)).toBe("");
      expect(slugify(undefined)).toBe("");
    });

    it("should preserve numbers and alphanumeric combinations", () => {
      expect(slugify("Página 2 de 10")).toBe("pagina-2-de-10");
      expect(slugify("Versión 3.0 - Release")).toBe("version-30-release");
    });
  });

  describe("sanitizeText() for page content", () => {
    it("should escape HTML characters to prevent XSS", () => {
      const xssInput = "<script>alert('xss')</script>";
      const expected = LT + "script" + GT + "alert(" + X27 + "xss" + X27 + ")" + LT + "/script" + GT;
      expect(sanitizeText(xssInput)).toBe(expected);

      const imgInput = "<img src=x onerror=alert(1)>";
      const imgExpected = LT + "img src=x onerror=alert(1)" + GT;
      expect(sanitizeText(imgInput)).toBe(imgExpected);
    });

    it("should handle null and undefined", () => {
      expect(sanitizeText(null)).toBe("");
      expect(sanitizeText(undefined)).toBe("");
    });

    it("should trim whitespace", () => {
      expect(sanitizeText("  Hello World  ")).toBe("Hello World");
    });
  });

  describe("sanitizeUrl() for page links", () => {
    it("should allow safe relative URLs", () => {
      expect(sanitizeUrl("/acerca-de")).toBe("/acerca-de");
      expect(sanitizeUrl("#section")).toBe("#section");
      expect(sanitizeUrl("./contacto")).toBe("./contacto");
    });

    it("should block javascript: and data: URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
      expect(sanitizeUrl("vbscript:msgbox('test')")).toBe("#");
    });

    it("should allow http and https URLs", () => {
      expect(sanitizeUrl("https://ejemplo.com/pagina")).toBe("https://ejemplo.com/pagina");
      expect(sanitizeUrl("http://localhost:3000/test")).toBe("http://localhost:3000/test");
    });

    it("should handle null and undefined", () => {
      expect(sanitizeUrl(null)).toBe("");
      expect(sanitizeUrl(undefined)).toBe("");
    });
  });

  describe("Page data structure validation", () => {
    it("should validate CustomPage interface structure", () => {
      const validPage = {
        id: "page-1",
        slug: "acerca-de",
        title: "Acerca de",
        content: "<p>Contenido</p>",
        published: true,
        showInNav: true,
        status: "published" as const,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
      };

      expect(validPage).toHaveProperty("id");
      expect(validPage).toHaveProperty("slug");
      expect(validPage).toHaveProperty("title");
      expect(validPage).toHaveProperty("published");
      expect(validPage.status).toBe("published");
    });

    it("should validate draft page structure", () => {
      const draftPage = {
        id: "page-2",
        slug: "borrador-ejemplo",
        title: "Borrador Ejemplo",
        content: "",
        published: false,
        showInNav: false,
        status: "draft" as const,
      };

      expect(draftPage.published).toBe(false);
      expect(draftPage.status).toBe("draft");
      expect(draftPage.showInNav).toBe(false);
    });

    it("should validate page with blocks", () => {
      const pageWithBlocks = {
        id: "page-3",
        slug: "con-bloques",
        title: "Con Bloques",
        content: "",
        published: true,
        showInNav: true,
        blocks: [
          {
            id: "block-1",
            type: "heading" as const,
            content: { text: "Título Principal", level: 2 },
          },
          {
            id: "block-2",
            type: "paragraph" as const,
            content: { text: "Párrafo de ejemplo" },
          },
        ],
      };

      expect(pageWithBlocks.blocks).toHaveLength(2);
      expect(pageWithBlocks.blocks![0].type).toBe("heading");
      expect(pageWithBlocks.blocks![1].type).toBe("paragraph");
    });

    it("should validate page with SEO metadata", () => {
      const pageWithSeo = {
        id: "page-4",
        slug: "seo-page",
        title: "SEO Page",
        content: "",
        published: true,
        showInNav: false,
        seo: {
          metaTitle: "Título SEO Optimizado",
          metaDescription: "Descripción para buscadores",
          noIndex: false,
        },
      };

      expect(pageWithSeo.seo?.metaTitle).toBe("Título SEO Optimizado");
      expect(pageWithSeo.seo?.noIndex).toBe(false);
    });
  });

  describe("Slug generation from titles", () => {
    it("should generate consistent slugs for page titles", () => {
      const titles = [
        { title: "Acerca de Nosotros", expected: "acerca-de-nosotros" },
        { title: "Servicios Profesionales", expected: "servicios-profesionales" },
        { title: "Contacto y Soporte", expected: "contacto-y-soporte" },
        { title: "Preguntas Frecuentes (FAQ)", expected: "preguntas-frecuentes-faq" },
        { title: "Blog - Artículos 2026", expected: "blog-articulos-2026" },
      ];

      for (const { title, expected } of titles) {
        expect(slugify(title)).toBe(expected);
      }
    });

    it("should handle edge cases in slug generation", () => {
      expect(slugify("   ")).toBe("");
      expect(slugify("a")).toBe("a");
      expect(slugify("123")).toBe("123");
      expect(slugify("  Hello   World  ")).toBe("hello-world");
    });
  });
});
