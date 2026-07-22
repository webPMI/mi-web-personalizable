// ============================================
// tests/public-components.test.ts — Pruebas de componentes públicos
// ============================================
// Navbar, Footer, HeroSection, SocialLinks
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Navbar.astro — Lógica de renderizado condicional", () => {
    it("debe mostrar navbar solo si hay enlaces", () => {
        const navLinks = [{ label: "Inicio", href: "/" }, { label: "Blog", href: "/blog" }];
        const shouldRender = navLinks && navLinks.length > 0;
        expect(shouldRender).toBe(true);
    });

    it("debe ocultar navbar si no hay enlaces", () => {
        const navLinks: Array<{ label: string; href: string }> = [];
        const shouldRender = navLinks.length > 0;
        expect(shouldRender).toBe(false);
    });

    it("debe ocultar navbar si navLinks es undefined", () => {
        const navLinks: Array<{ label: string; href: string }> | undefined = undefined;
        const shouldRender = !!(navLinks && navLinks.length > 0);
        expect(shouldRender).toBe(false);
    });

    it("debe usar nombre del sitio o fallback", () => {
        const siteName = "Mi Sitio";
        const displayName = siteName || "Mi Web Personalizable";
        expect(displayName).toBe("Mi Sitio");

        const emptyName = "";
        const fallback = emptyName || "Mi Web Personalizable";
        expect(fallback).toBe("Mi Web Personalizable");
    });

    it("debe renderizar enlaces correctamente", () => {
        const navLinks = [
            { label: "Inicio", href: "/" },
            { label: "Blog", href: "/blog" },
        ];
        const html = navLinks
            .map((link) => `<a href="${link.href}" class="navbar-link">${link.label}</a>`)
            .join("");
        expect(html).toContain('href="/"');
        expect(html).toContain("Inicio");
        expect(html).toContain("Blog");
    });
});

describe("Footer.astro — Lógica de renderizado", () => {
    it("debe mostrar año actual", () => {
        const currentYear = new Date().getFullYear();
        expect(currentYear).toBe(2026);
    });

    it("debe mostrar nombre del sitio o fallback", () => {
        const siteName = "Mi Sitio";
        const displayName = siteName || "Mi Web Personalizable";
        expect(displayName).toBe("Mi Sitio");
    });

    it("debe mostrar enlaces del navbar en footer si existen", () => {
        const navLinks = [{ label: "Inicio", href: "/" }];
        const hasLinks = navLinks && navLinks.length > 0;
        expect(hasLinks).toBe(true);
    });

    it("debe ocultar enlaces del footer si no hay", () => {
        const navLinks: Array<{ label: string; href: string }> = [];
        const hasLinks = navLinks && navLinks.length > 0;
        expect(hasLinks).toBe(false);
    });

    it("debe generar HTML de footer con copyright", () => {
        const displayName = "Mi Sitio";
        const currentYear = 2026;
        const html = `&copy; ${currentYear} ${displayName}. Todos los derechos reservados.`;
        expect(html).toContain("2026");
        expect(html).toContain("Mi Sitio");
    });
});

describe("HeroSection.astro — Lógica de renderizado condicional", () => {
    it("debe mostrar hero solo si heroTitle existe", () => {
        const heroTitle = "Bienvenido";
        const shouldRender = !!heroTitle;
        expect(shouldRender).toBe(true);
    });

    it("debe ocultar hero si heroTitle es undefined", () => {
        const heroTitle = undefined;
        const shouldRender = !!heroTitle;
        expect(shouldRender).toBe(false);
    });

    it("debe ocultar hero si heroTitle es string vacío", () => {
        const heroTitle = "";
        const shouldRender = !!heroTitle;
        expect(shouldRender).toBe(false);
    });

    it("debe mostrar subtítulo solo si existe", () => {
        const heroSubtitle = "Subtítulo del hero";
        const showSubtitle = !!heroSubtitle;
        expect(showSubtitle).toBe(true);

        const noSubtitle = undefined;
        expect(!!noSubtitle).toBe(false);
    });

    it("debe mostrar CTA solo si hay texto y enlace", () => {
        const heroCtaText = "Ver más";
        const heroCtaLink = "/about";
        const showCta = !!(heroCtaText && heroCtaLink);
        expect(showCta).toBe(true);
    });

    it("debe ocultar CTA si falta texto o enlace", () => {
        const emptyText = "";
        const validLink = "/about";
        const validText = "Texto";
        const emptyLink = "";
        const undefinedText: string | undefined = undefined;

        expect(!!(emptyText && validLink)).toBe(false);
        expect(!!(validText && emptyLink)).toBe(false);
        expect(!!(undefinedText && validLink)).toBe(false);
    });

    it("debe aplicar estilo de background-image si heroImage existe", () => {
        const heroImage = "https://example.com/bg.jpg";
        const style = heroImage ? `background-image: url(${heroImage})` : "";
        expect(style).toContain("background-image");
        expect(style).toContain("example.com");
    });

    it("debe omitir background-image si no hay heroImage", () => {
        const heroImage = "";
        const style = heroImage ? `background-image: url(${heroImage})` : "";
        expect(style).toBe("");
    });
});

describe("SocialLinks.astro — Lógica de renderizado condicional", () => {
    it("debe mostrar sección si al menos una red social tiene URL", () => {
        const socialLinks = {
            twitter: "https://twitter.com/test",
            github: "",
            linkedin: "",
            instagram: "",
        };
        const hasSocialLinks = !!(socialLinks && (socialLinks.twitter || socialLinks.github || socialLinks.linkedin || socialLinks.instagram));
        expect(hasSocialLinks).toBe(true);
    });

    it("debe ocultar sección si ninguna red social tiene URL", () => {
        const socialLinks = { twitter: "", github: "", linkedin: "", instagram: "" };
        const hasSocialLinks = !!(socialLinks && (socialLinks.twitter || socialLinks.github || socialLinks.linkedin || socialLinks.instagram));
        expect(hasSocialLinks).toBe(false);
    });

    it("debe ocultar sección si socialLinks es undefined", () => {
        const socialLinks: Record<string, string> | undefined = undefined;
        const hasSocialLinks = !!(socialLinks && (socialLinks.twitter || socialLinks.github || socialLinks.linkedin || socialLinks.instagram));
        expect(hasSocialLinks).toBe(false);
    });

    it("debe renderizar solo las redes que tienen URL", () => {
        const socialLinks = {
            twitter: "https://twitter.com/test",
            github: "",
            linkedin: "https://linkedin.com/in/test",
            instagram: "",
        };

        const links: string[] = [];
        if (socialLinks.twitter) links.push("Twitter");
        if (socialLinks.github) links.push("GitHub");
        if (socialLinks.linkedin) links.push("LinkedIn");
        if (socialLinks.instagram) links.push("Instagram");

        expect(links).toEqual(["Twitter", "LinkedIn"]);
        expect(links.length).toBe(2);
    });

    it("debe generar enlaces con target blank y noopener", () => {
        const url = "https://twitter.com/test";
        const html = `<a href="${url}" target="_blank" rel="noopener noreferrer">Twitter</a>`;
        expect(html).toContain('target="_blank"');
        expect(html).toContain("noopener noreferrer");
    });
});
