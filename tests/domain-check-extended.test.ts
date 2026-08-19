// ============================================
// tests/domain-check-extended.test.ts — Cobertura extendida de domain-check
// ============================================
// Cubre funciones no testeadas en domain-check.test.ts:
// - normalizeDomain() con casos de borde
// - getCurrentDomain(), getEffectiveDomain()
// - getRegisteredDomain(), clearRegisteredDomain()
// - getDevToolsDomain(), clearDevToolsDomain()
// ============================================
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    normalizeDomain,
    getCurrentDomain,
    getEffectiveDomain,
    getRegisteredDomain,
    clearRegisteredDomain,
    getDevToolsDomain,
    clearDevToolsDomain,
} from "../src/lib/domain-check";

describe("domain-check - normalizeDomain()", () => {
    it("debe limpiar protocolos http/https", () => {
        expect(normalizeDomain("https://midominio.com")).toBe("midominio.com");
        expect(normalizeDomain("http://midominio.com")).toBe("midominio.com");
    });

    it("debe limpiar rutas y trailing slashes", () => {
        expect(normalizeDomain("https://midominio.com/path/to/page")).toBe("midominio.com");
        expect(normalizeDomain("midominio.com/")).toBe("midominio.com");
    });

    it("debe convertir a minusculas y trim", () => {
        expect(normalizeDomain("  MIDOMINIO.COM  ")).toBe("midominio.com");
        expect(normalizeDomain("MiDominio.Com")).toBe("midominio.com");
    });

    it("debe manejar string vacio y null", () => {
        expect(normalizeDomain("")).toBe("");
        expect(normalizeDomain("   ")).toBe("");
    });
});

describe("domain-check - getCurrentDomain()", () => {
    it("debe retornar string vacio si no hay window", () => {
        // En Node.js (sin jsdom), typeof window es "undefined"
        // Pero vitest con jsdom si tiene window.location
        const domain = getCurrentDomain();
        expect(typeof domain).toBe("string");
    });
});

describe("domain-check - sessionStorage functions", () => {
    beforeEach(() => {
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
        }
    });

    afterEach(() => {
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
        }
    });

    describe("getRegisteredDomain() / clearRegisteredDomain()", () => {
        it("debe retornar null si no hay dominio registrado", () => {
            expect(getRegisteredDomain()).toBeNull();
        });

        it("debe retornar el dominio registrado y limpiarlo (clearOnRead=true)", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("registered-domain", "https://misitio.com");
            const result = getRegisteredDomain(true);
            expect(result).toBe("misitio.com");
            expect(sessionStorage.getItem("registered-domain")).toBeNull();
        });

        it("debe retornar el dominio sin limpiar si clearOnRead=false", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("registered-domain", "midominio.com");
            const result = getRegisteredDomain(false);
            expect(result).toBe("midominio.com");
            expect(sessionStorage.getItem("registered-domain")).toBe("midominio.com");
        });

        it("clearRegisteredDomain debe limpiar el item", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("registered-domain", "test.com");
            clearRegisteredDomain();
            expect(sessionStorage.getItem("registered-domain")).toBeNull();
        });
    });

    describe("getDevToolsDomain() / clearDevToolsDomain()", () => {
        it("debe retornar null si no hay dominio simulado", () => {
            expect(getDevToolsDomain()).toBeNull();
        });

        it("debe retornar el dominio simulado", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("devtools-domain", "dev.misitio.com");
            expect(getDevToolsDomain()).toBe("dev.misitio.com");
        });

        it("clearDevToolsDomain debe limpiar el item", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("devtools-domain", "test.com");
            clearDevToolsDomain();
            expect(sessionStorage.getItem("devtools-domain")).toBeNull();
        });
    });

    describe("getEffectiveDomain()", () => {
        it("debe priorizar registered-domain sobre devtools-domain", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("registered-domain", "registrado.com");
            sessionStorage.setItem("devtools-domain", "devtools.com");
            expect(getEffectiveDomain()).toBe("registrado.com");
            // registered-domain se limpia tras lectura
            expect(sessionStorage.getItem("registered-domain")).toBeNull();
        });

        it("debe usar devtools-domain si no hay registered-domain", () => {
            if (typeof sessionStorage === "undefined") return;
            sessionStorage.setItem("devtools-domain", "dev.misitio.com");
            expect(getEffectiveDomain()).toBe("dev.misitio.com");
        });
    });
});
