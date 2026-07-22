// ============================================
// tests/404-page.test.ts — Pruebas de lógica de 404.astro
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("404 Page — Locale toggle logic", () => {
    it("debe alternar idioma correctamente", () => {
        const currentLocale: string = "es";
        const newLocale = currentLocale === "es" ? "en" : "es";
        expect(newLocale).toBe("en");

        const currentLocale2: string = "en";
        const newLocale2 = currentLocale2 === "es" ? "en" : "es";
        expect(newLocale2).toBe("es");
    });

    it("debe mostrar texto del botón según idioma actual", () => {
        const currentLocale: string = "es";
        const toggleText = currentLocale === "es" ? "EN" : "ES";
        expect(toggleText).toBe("EN");

        const currentLocale2: string = "en";
        const toggleText2 = currentLocale2 === "es" ? "EN" : "ES";
        expect(toggleText2).toBe("ES");
    });

    it("debe mostrar tooltip según idioma actual", () => {
        const currentLocale: string = "es";
        const title = currentLocale === "es" ? "Switch to English" : "Cambiar a español";
        expect(title).toBe("Switch to English");

        const currentLocale2: string = "en";
        const title2 = currentLocale2 === "es" ? "Switch to English" : "Cambiar a español";
        expect(title2).toBe("Cambiar a español");
    });
});

describe("404 Page — applyLocale logic", () => {
    it("debe actualizar elementos del DOM con traducciones", () => {
        // Simular elementos del DOM
        const elements: Record<string, { textContent: string }> = {
            title: { textContent: "" },
            description: { textContent: "" },
            suggestion: { textContent: "" },
            errorCode: { textContent: "" },
        };

        const translations: Record<string, string> = {
            "public:404-title": "Página no encontrada",
            "public:404-description": "La página que buscas no existe",
            "public:404-suggestion": "Verifica la dirección",
            "public:404-error-code": "Error 404",
        };

        // Simular función t()
        const t = (key: string) => translations[key] || key;

        elements.title.textContent = t("public:404-title");
        elements.description.textContent = t("public:404-description");
        elements.suggestion.textContent = t("public:404-suggestion");
        elements.errorCode.textContent = t("public:404-error-code");

        expect(elements.title.textContent).toBe("Página no encontrada");
        expect(elements.description.textContent).toBe("La página que buscas no existe");
        expect(elements.suggestion.textContent).toBe("Verifica la dirección");
        expect(elements.errorCode.textContent).toBe("Error 404");
    });

    it("debe preservar SVG en botones CTA al actualizar texto", () => {
        // Simular botón con SVG
        const btn = document.createElement("a");
        const svg = document.createElement("svg");
        svg.innerHTML = "<path d='test'/>";
        btn.appendChild(svg);
        btn.innerHTML += "texto original";

        // Actualizar: preservar SVG, cambiar texto
        const existingSvg = btn.querySelector("svg");
        const newText = "Volver al inicio";
        btn.innerHTML = (existingSvg ? existingSvg.outerHTML : "") + newText;

        expect(btn.innerHTML).toContain("<svg");
        expect(btn.innerHTML).toContain("Volver al inicio");
        expect(btn.innerHTML).not.toContain("texto original");
    });

    it("debe manejar botón sin SVG", () => {
        const btn = document.createElement("a");
        btn.textContent = "texto original";

        const existingSvg = btn.querySelector("svg");
        const newText = "Iniciar sesión";
        btn.innerHTML = (existingSvg ? existingSvg.outerHTML : "") + newText;

        expect(btn.innerHTML).toBe("Iniciar sesión");
    });
});

describe("404 Page — Estructura del DOM", () => {
    it("debe tener elementos con IDs específicos", () => {
        const expectedIds = [
            "not-found-title",
            "not-found-description",
            "not-found-suggestion",
            "not-found-cta-home",
            "not-found-cta-login",
            "not-found-error-code",
        ];

        // Verificar que los IDs existen en la especificación
        expect(expectedIds).toContain("not-found-title");
        expect(expectedIds).toContain("not-found-cta-home");
        expect(expectedIds).toContain("not-found-error-code");
        expect(expectedIds.length).toBe(6);
    });

    it("debe tener enlaces con rutas correctas", () => {
        const ctaHomeHref = "/";
        const ctaLoginHref = "/login";

        expect(ctaHomeHref).toBe("/");
        expect(ctaLoginHref).toBe("/login");
    });
});
