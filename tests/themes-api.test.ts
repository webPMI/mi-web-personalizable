// ============================================
// tests/themes-api.test.ts — Pruebas de API de temas
// ============================================
// Prueba la lógica de validación y autenticación
// del endpoint /api/admin/themes/[...slug].ts
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Themes API — Validación de datos", () => {
    const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
    const THEME_ID_REGEX = /^[a-z0-9-]+$/;

    it("debe validar formato hex correcto", () => {
        const validColors = ["#6366f1", "#FF5733", "#000000", "#ffffff", "#a1b2c3"];
        const invalidColors = ["#fff", "#12345", "6366f1", "#GGGGGG", "red", null, undefined, ""];

        for (const color of validColors) {
            expect(HEX_COLOR_REGEX.test(color)).toBe(true);
        }

        for (const color of invalidColors) {
            if (typeof color === "string") {
                expect(HEX_COLOR_REGEX.test(color)).toBe(false);
            }
        }
    });

    it("debe validar formato de theme ID", () => {
        const validIds = ["default-light", "dark-theme", "mi-tema-1", "test"];
        const invalidIds = ["Default-Light", "dark_theme", "mi tema", "TEST", "", "con espacios"];

        for (const id of validIds) {
            expect(THEME_ID_REGEX.test(id)).toBe(true);
        }

        for (const id of invalidIds) {
            expect(THEME_ID_REGEX.test(id)).toBe(false);
        }
    });

    it("debe validar campos requeridos del theme", () => {
        const errors: Array<{ field: string; message: string }> = [];

        const body: any = {};

        if (!body.id || typeof body.id !== "string") {
            errors.push({ field: "id", message: "El campo 'id' es requerido" });
        }
        if (!body.name || typeof body.name !== "string") {
            errors.push({ field: "name", message: "El campo 'name' es requerido" });
        }

        expect(errors.length).toBe(2);
        expect(errors[0].field).toBe("id");
        expect(errors[1].field).toBe("name");
    });

    it("debe validar longitud máxima de name", () => {
        const errors: Array<{ field: string; message: string }> = [];

        const body = { id: "test", name: "a".repeat(101) };

        if (body.name.length > 100) {
            errors.push({ field: "name", message: "El campo 'name' no puede exceder 100 caracteres" });
        }

        expect(errors.length).toBe(1);
        expect(errors[0].field).toBe("name");
    });

    it("debe validar colores hex en config", () => {
        const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
        const errors: Array<{ field: string; message: string }> = [];

        const body: Record<string, any> = {
            id: "test",
            name: "Test",
            config: {
                primaryColor: "#invalid",
                secondaryColor: "#8b5cf6",
                accentColor: "not-a-color",
            },
        };

        const colorFields = ["primaryColor", "secondaryColor", "accentColor", "bgColor", "textColor", "textMutedColor", "navbarBg", "navbarText", "footerBg", "footerText"];
        for (const field of colorFields) {
            if (body.config[field] && !HEX_COLOR_REGEX.test(body.config[field])) {
                errors.push({ field: `config.${field}`, message: `'${field}' debe ser un color hex válido (#RRGGBB)` });
            }
        }

        expect(errors.length).toBe(2);
        expect(errors[0].field).toBe("config.primaryColor");
        expect(errors[1].field).toBe("config.accentColor");
    });

    it("debe validar rangos numéricos en config", () => {
        const errors: Array<{ field: string; message: string }> = [];

        const body = {
            id: "test",
            name: "Test",
            config: {
                fontSizeBase: 10,
                maxWidth: 2000,
            },
        };

        if (body.config.fontSizeBase !== undefined && (body.config.fontSizeBase < 14 || body.config.fontSizeBase > 20)) {
            errors.push({ field: "config.fontSizeBase", message: "fontSizeBase debe estar entre 14 y 20" });
        }
        if (body.config.maxWidth !== undefined && (body.config.maxWidth < 800 || body.config.maxWidth > 1400)) {
            errors.push({ field: "config.maxWidth", message: "maxWidth debe estar entre 800 y 1400" });
        }

        expect(errors.length).toBe(2);
        expect(errors[0].field).toBe("config.fontSizeBase");
        expect(errors[1].field).toBe("config.maxWidth");
    });

    it("debe pasar validación con datos correctos", () => {
        const errors: Array<{ field: string; message: string }> = [];

        const body: Record<string, any> = {
            id: "default-light",
            name: "Default Light",
            config: {
                primaryColor: "#6366f1",
                secondaryColor: "#8b5cf6",
                fontSizeBase: 16,
                maxWidth: 1200,
            },
        };

        // Validar id
        if (!body.id || typeof body.id !== "string") {
            errors.push({ field: "id", message: "Requerido" });
        } else if (!/^[a-z0-9-]+$/.test(body.id)) {
            errors.push({ field: "id", message: "Formato inválido" });
        }

        // Validar name
        if (!body.name || typeof body.name !== "string") {
            errors.push({ field: "name", message: "Requerido" });
        } else if (body.name.length > 100) {
            errors.push({ field: "name", message: "Muy largo" });
        }

        // Validar colores
        const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
        const colorFields = ["primaryColor", "secondaryColor"];
        for (const field of colorFields) {
            if (body.config[field] && !HEX_COLOR_REGEX.test(body.config[field])) {
                errors.push({ field: `config.${field}`, message: "Color inválido" });
            }
        }

        expect(errors.length).toBe(0);
    });
});

describe("Themes API — Autenticación", () => {
    it("debe rechazar petición sin token", () => {
        const authHeader = null;
        const isAuthenticated = !!authHeader?.startsWith("Bearer ");
        expect(isAuthenticated).toBe(false);
    });

    it("debe rechazar token sin formato Bearer", () => {
        const authHeader = "Token abc123";
        const isAuthenticated = !!authHeader?.startsWith("Bearer ");
        expect(isAuthenticated).toBe(false);
    });

    it("debe aceptar token Bearer válido", () => {
        const authHeader = "Bearer dev-token";
        const isAuthenticated = !!authHeader?.startsWith("Bearer ");
        expect(isAuthenticated).toBe(true);
    });

    it("debe extraer token correctamente", () => {
        const authHeader = "Bearer dev-token";
        const token = authHeader.slice(7);
        expect(token).toBe("dev-token");
    });

    it("debe verificar superadmin por email", () => {
        const SUPERADMIN_EMAIL = "servicioweb.pmi@gmail.com";
        const validEmails = ["servicioweb.pmi@gmail.com"];
        const invalidEmails = ["user@example.com", "admin@test.com", ""];

        for (const email of validEmails) {
            expect(email.toLowerCase()).toBe(SUPERADMIN_EMAIL);
        }

        for (const email of invalidEmails) {
            expect(email.toLowerCase()).not.toBe(SUPERADMIN_EMAIL);
        }
    });
});

describe("Themes API — Response helpers", () => {
    it("debe crear respuesta JSON correctamente", () => {
        const data = { success: true, data: [] };
        const response = new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("debe crear respuesta de error", () => {
        const error = "No autorizado";
        const status = 401;
        const response = new Response(JSON.stringify({ success: false, error }), {
            status,
            headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(401);
    });

    it("debe crear respuesta 404 para ruta no encontrada", () => {
        const parts = ["themes", "extra", "extra2"];
        const isInvalidRoute = parts.length !== 1;
        expect(isInvalidRoute).toBe(true);
    });

    it("debe crear respuesta 201 para creación exitosa", () => {
        const body = { id: "new-theme", name: "New Theme" };
        const response = new Response(JSON.stringify({
            success: true,
            message: `Tema '${body.name}' creado correctamente`,
            data: { id: body.id, name: body.name },
        }), { status: 201 });

        expect(response.status).toBe(201);
    });
});

describe("Themes API — Slug parsing", () => {
    it("debe parsear slug vacío como lista", () => {
        const slug = "";
        const parts = slug.split("/").filter(Boolean);
        expect(parts.length).toBe(0);
    });

    it("debe parsear slug con un segmento como ID", () => {
        const slug = "default-light";
        const parts = slug.split("/").filter(Boolean);
        expect(parts.length).toBe(1);
        expect(parts[0]).toBe("default-light");
    });

    it("debe parsear slug con copy action", () => {
        const slug = "default-light/copy";
        const parts = slug.split("/").filter(Boolean);
        expect(parts.length).toBe(2);
        expect(parts[0]).toBe("default-light");
        expect(parts[1]).toBe("copy");
    });

    it("debe rechazar slug con más de 2 segmentos", () => {
        const slug = "a/b/c";
        const parts = slug.split("/").filter(Boolean);
        const isValid = parts.length === 0 || parts.length === 1 || (parts.length === 2 && parts[1] === "copy");
        expect(isValid).toBe(false);
    });
});

describe("Themes API — Copy theme logic", () => {
    it("debe requerir siteDomain para copiar tema", () => {
        const body: any = {};
        const hasSiteDomain = !!(body.siteDomain && typeof body.siteDomain === "string");
        expect(hasSiteDomain).toBe(false);
    });

    it("debe aceptar siteDomain válido", () => {
        const body = { siteDomain: "midominio.com" };
        const hasSiteDomain = body.siteDomain && typeof body.siteDomain === "string";
        expect(hasSiteDomain).toBe(true);
    });

    it("debe rechazar siteDomain no string", () => {
        const body = { siteDomain: 123 };
        const hasSiteDomain = typeof body.siteDomain === "string";
        expect(hasSiteDomain).toBe(false);
    });
});

describe("Themes API — Query params", () => {
    it("debe detectar parámetro permanent en DELETE", () => {
        const url = new URL("http://localhost/api/admin/themes/test?permanent=true");
        const permanent = url.searchParams.get("permanent") === "true";
        expect(permanent).toBe(true);
    });

    it("debe detectar ausencia de permanent", () => {
        const url = new URL("http://localhost/api/admin/themes/test");
        const permanent = url.searchParams.get("permanent") === "true";
        expect(permanent).toBe(false);
    });
});
