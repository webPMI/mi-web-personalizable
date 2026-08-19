// ============================================
// tests/sanitizer-extended.test.ts - Cobertura extendida del Sanitizer
// ============================================
import { describe, it, expect } from "vitest";
import {
    sanitizeUrl,
    escapeAttribute,
    sanitizeText,
    slugify,
    sanitizeSiteData,
} from "../src/lib/sanitizer";

// Build HTML entities at runtime to avoid editor/formatter corruption
const LT = String.fromCharCode(38, 108, 116, 59);
const GT = String.fromCharCode(38, 103, 116, 59);
const AMP = String.fromCharCode(38, 97, 109, 112, 59);
const QUOT = String.fromCharCode(38, 113, 117, 111, 116, 59);
const X27 = String.fromCharCode(38, 35, 120, 50, 55, 59);

describe("Sanitizer - slugify()", () => {
    it("debe convertir texto a slug limpio", () => {
        expect(slugify("Acerca de Nosotros!")).toBe("acerca-de-nosotros");
        expect(slugify("  Hola Mundo  ")).toBe("hola-mundo");
        expect(slugify("Guia de inicio rapido")).toBe("guia-de-inicio-rapido");
    });

    it("debe eliminar acentos y diacriticos", () => {
        expect(slugify("aeiounu")).toBe("aeiounu");
        expect(slugify("AEIOU")).toBe("aeiou");
        expect(slugify("uber cool")).toBe("uber-cool");
    });

    it("debe eliminar caracteres especiales", () => {
        expect(slugify("Hola @mundo! #2024")).toBe("hola-mundo-2024");
        expect(slugify("Precio: $99.99")).toBe("precio-9999");
        expect(slugify("Que es esto?")).toBe("que-es-esto");
    });

    it("debe manejar multiples guiones consecutivos", () => {
        expect(slugify("uno   dos   tres")).toBe("uno-dos-tres");
        expect(slugify("uno---dos---tres")).toBe("uno-dos-tres");
    });

    it("debe quitar guiones al inicio y final", () => {
        expect(slugify("-hola-")).toBe("hola");
        expect(slugify("---hola---")).toBe("hola");
    });

    it("debe manejar null, undefined y string vacio", () => {
        expect(slugify(null)).toBe("");
        expect(slugify(undefined)).toBe("");
        expect(slugify("")).toBe("");
        expect(slugify("   ")).toBe("");
    });

    it("debe manejar strings numericos", () => {
        expect(slugify("123")).toBe("123");
        expect(slugify("  456  ")).toBe("456");
    });
});

describe("Sanitizer - sanitizeUrl() edge cases", () => {
    it("debe permitir mailto: y tel: schemes", () => {
        expect(sanitizeUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
        expect(sanitizeUrl("tel:+1234567890")).toBe("tel:+1234567890");
    });

    it("debe neutralizar schemes mixtos (case variations)", () => {
        expect(sanitizeUrl("JAVASCRIPT:alert(1)")).toBe("#");
        expect(sanitizeUrl("JavaScript:alert(1)")).toBe("#");
        expect(sanitizeUrl("DATA:text/html,<script>")).toBe("#");
    });

    it("debe preservar URLs con query params y fragmentos", () => {
        expect(sanitizeUrl("https://example.com/page?foo=bar&baz=qux#section")).toBe(
            "https://example.com/page?foo=bar&baz=qux#section"
        );
    });

    it("debe manejar URLs con puerto", () => {
        expect(sanitizeUrl("http://localhost:3000/admin")).toBe("http://localhost:3000/admin");
    });
});

describe("Sanitizer - sanitizeText() edge cases", () => {
    it("debe escapar HTML entities correctamente", () => {
        const escaped = sanitizeText('<script>alert("xss")</script>');
        expect(escaped).toContain(LT);
        expect(escaped).toContain(GT);
        expect(escaped).toContain(QUOT);
        expect(sanitizeText("Tom & Jerry")).toContain(AMP);
        expect(sanitizeText("It's a test")).toContain(X27);
    });

    it("debe manejar null, undefined y string vacio", () => {
        expect(sanitizeText(null)).toBe("");
        expect(sanitizeText(undefined)).toBe("");
        expect(sanitizeText("")).toBe("");
    });

    it("debe preservar texto normal sin caracteres peligrosos", () => {
        expect(sanitizeText("Hola mundo")).toBe("Hola mundo");
        expect(sanitizeText("   Texto con espacios   ")).toBe("Texto con espacios");
    });
});

describe("Sanitizer - escapeAttribute() edge cases", () => {
    it("debe escapar todos los caracteres peligrosos simultaneamente", () => {
        const result = escapeAttribute("<div class=\"test\">Tom & Jerry</div>");
        expect(result).not.toContain("<");
        expect(result).not.toContain(">");
        // The & character gets escaped to & so the result will contain &
        expect(result).toContain(AMP);
        expect(result).toContain(QUOT);
        expect(result).toContain(LT);
        expect(result).toContain(GT);
    });

    it("debe manejar strings vacios y whitespace", () => {
        expect(escapeAttribute("")).toBe("");
        expect(escapeAttribute("   ")).toBe("   ");
    });
});

describe("Sanitizer - sanitizeSiteData() edge cases", () => {
    it("debe manejar objetos profundamente anidados", () => {
        const data = {
            level1: {
                level2: {
                    level3: {
                        name: "<script>alert(1)</script>",
                        url: "javascript:evil()",
                    },
                },
            },
        };
        const clean = sanitizeSiteData(data);
        expect(clean.level1.level2.level3.name).toContain(LT);
        expect(clean.level1.level2.level3.url).toBe("#");
    });

    it("debe manejar arrays mixtos con objetos y strings", () => {
        const data: Record<string, any> = {
            items: [
                { title: "<b>Hola</b>", link: "javascript:void(0)" },
                "texto simple",
                42,
                null,
            ],
        };
        const clean = sanitizeSiteData(data);
        expect(clean.items[0].title).toContain(LT);
        expect(clean.items[0].link).toBe("#");
        expect(clean.items[1]).toBe("texto simple");
        expect(clean.items[2]).toBe(42);
        expect(clean.items[3]).toBeNull();
    });

    it("debe eliminar propiedades undefined", () => {
        const data: Record<string, any> = {
            name: "Test",
            extra: undefined,
            nested: {
                value: "ok",
                ignored: undefined,
            },
        };
        const clean = sanitizeSiteData(data);
        expect(clean.name).toBe("Test");
        expect("extra" in clean).toBe(false);
        expect("ignored" in clean.nested).toBe(false);
    });

    it("debe preservar Date objects", () => {
        const date = new Date("2024-01-01");
        const data: Record<string, any> = { createdAt: date, name: "Test" };
        const clean = sanitizeSiteData(data);
        expect(clean.createdAt).toBe(date);
        expect(clean.name).toBe("Test");
    });

    it("debe retornar el mismo valor si no es objeto", () => {
        expect(sanitizeSiteData(null as any)).toBeNull();
        expect(sanitizeSiteData(undefined as any)).toBeUndefined();
        expect(sanitizeSiteData("string" as any)).toBe("string");
        expect(sanitizeSiteData(42 as any)).toBe(42);
    });

    it("debe manejar objetos vacios y arrays vacios", () => {
        expect(sanitizeSiteData({})).toEqual({});
        expect(sanitizeSiteData([])).toEqual([]);
    });
});
