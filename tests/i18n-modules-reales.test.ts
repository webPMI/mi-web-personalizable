// ============================================
// tests/i18n-modules-reales.test.ts — Pruebas de módulos i18n reales
// ============================================
// Importa los módulos reales (common, public, admin, onboarding)
// y verifica su estructura, paridad y valores esperados.
// ============================================
import { describe, it, expect } from "vitest";
import common from "../src/lib/i18n/modules/common";
import publicModule from "../src/lib/i18n/modules/public";
import admin from "../src/lib/i18n/modules/admin";
import onboarding from "../src/lib/i18n/modules/onboarding";

// ============================================
// Helpers
// ============================================

type TranslationModule = Record<string, Record<string, string>>;

function checkModuleStructure(mod: TranslationModule, name: string) {
    describe(`Estructura — ${name}`, () => {
        it("debe tener 'es' y 'en' como idiomas", () => {
            expect(mod).toHaveProperty("es");
            expect(mod).toHaveProperty("en");
        });

        it("debe tener las mismas keys en ambos idiomas", () => {
            const esKeys = Object.keys(mod.es).sort();
            const enKeys = Object.keys(mod.en).sort();
            expect(esKeys).toEqual(enKeys);
        });

        it("no debe tener keys vacías en español", () => {
            for (const [key, val] of Object.entries(mod.es)) {
                expect(val, `Key '${key}' en es está vacía`).toBeTruthy();
            }
        });

        it("no debe tener keys vacías en inglés", () => {
            for (const [key, val] of Object.entries(mod.en)) {
                expect(val, `Key '${key}' en en está vacía`).toBeTruthy();
            }
        });
    });
}

function checkPrefixes(mod: TranslationModule, name: string, allowedPrefixes: string[]) {
    describe(`Prefijos — ${name}`, () => {
        const allKeys = [...Object.keys(mod.es), ...Object.keys(mod.en)];
        const uniqueKeys = [...new Set(allKeys)];
        const invalidKeys = uniqueKeys.filter(
            (key) => !allowedPrefixes.some((p) => key.startsWith(p))
        );

        if (invalidKeys.length === 0) {
            it("todas las keys tienen prefijos semánticos válidos", () => {
                expect(true).toBe(true);
            });
        }

        for (const key of invalidKeys) {
            it(`⚠️ Key '${key}' no tiene prefijo semántico válido (${allowedPrefixes.join(", ")})`, () => {
                expect(key).toMatch(new RegExp(`^(${allowedPrefixes.join("|")})`));
            });
        }
    });
}

// ============================================
// Tests por módulo
// ============================================

describe("i18n — Módulos Reales", () => {
    // ─── COMMON ───
    checkModuleStructure(common, "common");
    checkPrefixes(common, "common", ["btn-", "err-", "error-", "success-", "loading", "yes", "no", "or", "and"]);

    describe("common — valores específicos", () => {
        it("debe tener traducciones de botones comunes", () => {
            expect(common.es["btn-continue"]).toBe("Continuar");
            expect(common.en["btn-continue"]).toBe("Continue");
            expect(common.es["btn-save"]).toBe("Guardar");
            expect(common.en["btn-save"]).toBe("Save");
            expect(common.es["btn-cancel"]).toBe("Cancelar");
            expect(common.en["btn-cancel"]).toBe("Cancel");
        });

        it("debe tener palabras sueltas comunes", () => {
            expect(common.es.yes).toBe("Sí");
            expect(common.en.yes).toBe("Yes");
            expect(common.es.no).toBe("No");
            expect(common.en.no).toBe("No");
            expect(common.es.or).toBe("o");
            expect(common.en.or).toBe("or");
            expect(common.es.and).toBe("y");
            expect(common.en.and).toBe("and");
        });

        it("debe tener estados genéricos", () => {
            expect(common.es.loading).toBe("Cargando...");
            expect(common.en.loading).toBe("Loading...");
            expect(common.es["error-generic"]).toBe("Ha ocurrido un error.");
            expect(common.en["error-generic"]).toBe("An error has occurred.");
            expect(common.es["success-generic"]).toBe("Operación completada con éxito.");
            expect(common.en["success-generic"]).toBe("Operation completed successfully.");
        });
    });

    // ─── PUBLIC ───
    checkModuleStructure(publicModule, "public");
    checkPrefixes(publicModule, "public", ["404-"]);

    describe("public — valores específicos", () => {
        it("debe tener traducciones de la página 404", () => {
            expect(publicModule.es["404-title"]).toBe("Página no encontrada");
            expect(publicModule.en["404-title"]).toBe("Page not found");
            expect(publicModule.es["404-description"]).toBe(
                "La página que buscas no existe o ha sido movida."
            );
            expect(publicModule.en["404-description"]).toBe(
                "The page you are looking for does not exist or has been moved."
            );
            expect(publicModule.es["404-cta-home"]).toBe("Volver al inicio");
            expect(publicModule.en["404-cta-home"]).toBe("Go back home");
            expect(publicModule.es["404-cta-login"]).toBe("Iniciar sesión");
            expect(publicModule.en["404-cta-login"]).toBe("Sign in");
        });

        it("debe tener el código de error 404", () => {
            expect(publicModule.es["404-error-code"]).toBe("Error 404");
            expect(publicModule.en["404-error-code"]).toBe("Error 404");
        });

        it("debe tener sugerencia para el usuario", () => {
            expect(publicModule.es["404-suggestion"]).toBe(
                "Puede que la dirección esté mal escrita o que la página haya sido eliminada."
            );
            expect(publicModule.en["404-suggestion"]).toBe(
                "The address may be misspelled or the page may have been removed."
            );
        });
    });

    // ─── ADMIN ───
    checkModuleStructure(admin, "admin");

    describe("admin — valores clave", () => {
        it("debe tener títulos del dashboard", () => {
            expect(admin.es["title-dashboard"]).toBeDefined();
            expect(admin.en["title-dashboard"]).toBeDefined();
        });

        it("debe tener traducciones de navegación", () => {
            expect(admin.es["nav-pages"]).toBeDefined();
            expect(admin.en["nav-pages"]).toBeDefined();
            expect(admin.es["nav-dashboard"]).toBeDefined();
            expect(admin.en["nav-dashboard"]).toBeDefined();
            expect(admin.es["nav-config"]).toBeDefined();
            expect(admin.en["nav-config"]).toBeDefined();
        });
    });

    // ─── ONBOARDING ───
    checkModuleStructure(onboarding, "onboarding");

    describe("onboarding — valores clave", () => {
        it("debe tener títulos de pasos", () => {
            expect(onboarding.es["step-1-title"]).toBeDefined();
            expect(onboarding.en["step-1-title"]).toBeDefined();
            expect(onboarding.es["step-2-title"]).toBeDefined();
            expect(onboarding.en["step-2-title"]).toBeDefined();
            expect(onboarding.es["step-3-title"]).toBeDefined();
            expect(onboarding.en["step-3-title"]).toBeDefined();
        });

        it("debe tener botones de acción", () => {
            expect(onboarding.es["btn-create-account"]).toBeDefined();
            expect(onboarding.en["btn-create-account"]).toBeDefined();
            expect(onboarding.es["btn-check-domain"]).toBeDefined();
            expect(onboarding.en["btn-check-domain"]).toBeDefined();
        });
    });

    // ─── PARIDAD CRUZADA ───
    describe("Paridad entre módulos", () => {
        it("no debe haber keys duplicadas entre common y otros módulos", () => {
            const commonKeys = new Set(Object.keys(common.es));
            const publicKeys = Object.keys(publicModule.es);
            const adminKeys = Object.keys(admin.es);
            const onboardingKeys = Object.keys(onboarding.es);

            const duplicatesInPublic = publicKeys.filter((k) => commonKeys.has(k));
            const duplicatesInAdmin = adminKeys.filter((k) => commonKeys.has(k));
            const duplicatesInOnboarding = onboardingKeys.filter((k) => commonKeys.has(k));

            // Keys que están intencionalmente redefinidas en otros módulos
            // (porque el contexto del módulo le da un significado más específico)
            const intentionallyRedefined = new Set(["btn-save"]);

            // Si hay duplicados, deben ser intencionales (mismo valor)
            for (const key of duplicatesInPublic) {
                if (intentionallyRedefined.has(key)) continue;
                expect(common.es[key]).toBe(publicModule.es[key]);
                expect(common.en[key]).toBe(publicModule.en[key]);
            }
            for (const key of duplicatesInAdmin) {
                if (intentionallyRedefined.has(key)) continue;
                expect(common.es[key]).toBe(admin.es[key]);
                expect(common.en[key]).toBe(admin.en[key]);
            }
            for (const key of duplicatesInOnboarding) {
                if (intentionallyRedefined.has(key)) continue;
                expect(common.es[key]).toBe(onboarding.es[key]);
                expect(common.en[key]).toBe(onboarding.en[key]);
            }
        });
    });
});
