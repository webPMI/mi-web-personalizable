// ============================================
// tests/i18n-modules.test.ts — Pruebas de módulos i18n
// ============================================
import { describe, it, expect } from "vitest";

// ============================================
// Interfaces (replicando i18n/index.ts)
// ============================================

interface TranslationModule {
    es: Record<string, string>;
    en: Record<string, string>;
}

// ============================================
// Módulos de traducción (copias inline para test)
// ============================================

const commonModule: TranslationModule = {
    es: {
        "btn-continue": "Continuar",
        "btn-back": "Atrás",
        "btn-save": "Guardar",
        "btn-cancel": "Cancelar",
        "btn-delete": "Eliminar",
        "btn-edit": "Editar",
        "btn-close": "Cerrar",
        "btn-confirm": "Confirmar",
        "loading": "Cargando...",
        "error-generic": "Ha ocurrido un error.",
        "error-not-found": "No encontrado.",
        "success-generic": "Operación completada con éxito.",
        "yes": "Sí",
        "no": "No",
        "or": "o",
        "and": "y",
    },
    en: {
        "btn-continue": "Continue",
        "btn-back": "Back",
        "btn-save": "Save",
        "btn-cancel": "Cancel",
        "btn-delete": "Delete",
        "btn-edit": "Edit",
        "btn-close": "Close",
        "btn-confirm": "Confirm",
        "loading": "Loading...",
        "error-generic": "An error has occurred.",
        "error-not-found": "Not found.",
        "success-generic": "Operation completed successfully.",
        "yes": "Yes",
        "no": "No",
        "or": "or",
        "and": "and",
    },
};

const adminModule: TranslationModule = {
    es: {
        "title-dashboard": "Dashboard",
        "title-config": "Configuración del Sitio",
        "title-pages": "Administración de Páginas",
        "nav-dashboard": "Dashboard",
        "nav-config": "Configuración",
        "nav-pages": "Páginas",
        "loading-auth": "Verificando autenticación...",
        "btn-logout": "Cerrar sesión",
        "btn-back-home": "Volver al inicio",
        "btn-refresh": "Recargar página",
        "btn-save": "Guardar cambios",
        "btn-saving": "Guardando...",
        "btn-create-page": "Crear nueva página",
        "btn-confirm-delete": "Sí, eliminar",
        "btn-preview": "Vista previa",
        "btn-move-up": "Mover arriba",
        "btn-move-down": "Mover abajo",
        "btn-duplicate": "Duplicar",
        "btn-remove-block": "Eliminar bloque",
        "btn-restore-draft": "Restaurar borrador",
        "btn-save-draft": "Guardar borrador",
        "btn-publish-page": "Publicar página",
        "btn-discard-draft": "Descartar borrador",
        "btn-back-pages": "← Volver a Páginas",
        "success-saved": "Cambios guardados correctamente.",
        "success-page-created": "Página creada correctamente.",
        "success-page-updated": "Página actualizada correctamente.",
        "success-page-deleted": "Página eliminada correctamente.",
        "empty-pages": "No has creado ninguna página aún.",
    },
    en: {
        "title-dashboard": "Dashboard",
        "title-config": "Site Configuration",
        "title-pages": "Page Management",
        "nav-dashboard": "Dashboard",
        "nav-config": "Settings",
        "nav-pages": "Pages",
        "loading-auth": "Checking authentication...",
        "btn-logout": "Log out",
        "btn-back-home": "Back to home",
        "btn-refresh": "Reload page",
        "btn-save": "Save changes",
        "btn-saving": "Saving...",
        "btn-create-page": "Create new page",
        "btn-confirm-delete": "Yes, delete",
        "btn-preview": "Preview",
        "btn-move-up": "Move up",
        "btn-move-down": "Move down",
        "btn-duplicate": "Duplicate",
        "btn-remove-block": "Delete block",
        "btn-restore-draft": "Restore draft",
        "btn-save-draft": "Save draft",
        "btn-publish-page": "Publish page",
        "btn-discard-draft": "Discard draft",
        "btn-back-pages": "← Back to Pages",
        "success-saved": "Changes saved successfully.",
        "success-page-created": "Page created successfully.",
        "success-page-updated": "Page updated successfully.",
        "success-page-deleted": "Page deleted successfully.",
        "empty-pages": "You haven't created any pages yet.",
    },
};

const onboardingModule: TranslationModule = {
    es: {
        "step-1-title": "Selecciona tu idioma",
        "step-2-title": "Tu cuenta",
        "step-3-title": "Información de tu sitio",
        "lang-es": "Español",
        "lang-en": "English",
        "label-username": "Nombre de usuario",
        "label-name": "Nombre completo",
        "label-email": "Correo electrónico",
        "label-password": "Contraseña",
        "label-password-confirm": "Confirmar contraseña",
        "label-domain": "Tu dominio",
        "label-site-name": "Nombre del sitio",
        "label-site-description": "Descripción breve",
        "btn-create-account": "Crear cuenta y registrar sitio",
        "btn-check-domain": "Verificar disponibilidad",
        "success-title": "¡Todo listo!",
        "success-welcome": "Bienvenido, {name}",
        "success-domain-registered": "Tu dominio {domain} ha sido registrado.",
        "success-redirecting": "Redirigiendo al panel de administración...",
        "loading-text": "Creando tu cuenta y registrando el sitio...",
        "err-email-invalid": "Introduce un correo electrónico válido.",
        "err-password-min": "La contraseña debe tener al menos 6 caracteres.",
        "err-password-confirm-mismatch": "Las contraseñas no coinciden.",
        "err-domain-required": "El dominio es obligatorio.",
        "err-domain-invalid": "Introduce un dominio válido (ej: tudominio.com).",
        "err-domain-taken": "Este dominio ya está registrado. Prueba con otro.",
        "domain-available": "✅ {domain} está disponible",
        "domain-unavailable": "❌ {domain} no está disponible",
    },
    en: {
        "step-1-title": "Select your language",
        "step-2-title": "Your account",
        "step-3-title": "Your site information",
        "lang-es": "Español",
        "lang-en": "English",
        "label-username": "Username",
        "label-name": "Full name",
        "label-email": "Email address",
        "label-password": "Password",
        "label-password-confirm": "Confirm password",
        "label-domain": "Your domain",
        "label-site-name": "Site name",
        "label-site-description": "Short description",
        "btn-create-account": "Create account & register site",
        "btn-check-domain": "Check availability",
        "success-title": "All set!",
        "success-welcome": "Welcome, {name}",
        "success-domain-registered": "Your domain {domain} has been registered.",
        "success-redirecting": "Redirecting to the admin panel...",
        "loading-text": "Creating your account and registering the site...",
        "err-email-invalid": "Enter a valid email address.",
        "err-password-min": "Password must be at least 6 characters.",
        "err-password-confirm-mismatch": "Passwords do not match.",
        "err-domain-required": "Domain is required.",
        "err-domain-invalid": "Enter a valid domain (e.g. yourdomain.com).",
        "err-domain-taken": "This domain is already taken. Try another one.",
        "domain-available": "✅ {domain} is available",
        "domain-unavailable": "❌ {domain} is not available",
    },
};

const publicModule: TranslationModule = {
    es: {
        "404-title": "Página no encontrada",
        "404-description": "La página que buscas no existe o ha sido movida.",
        "404-cta-home": "Volver al inicio",
        "404-cta-login": "Iniciar sesión",
        "404-error-code": "Error 404",
        "404-suggestion": "Puede que la dirección esté mal escrita o que la página haya sido eliminada.",
    },
    en: {
        "404-title": "Page not found",
        "404-description": "The page you are looking for does not exist or has been moved.",
        "404-cta-home": "Go back home",
        "404-cta-login": "Sign in",
        "404-error-code": "Error 404",
        "404-suggestion": "The address may be misspelled or the page may have been removed.",
    },
};

// ============================================
// Helpers de test
// ============================================

function getKeys(obj: Record<string, string>): string[] {
    return Object.keys(obj).sort();
}

function checkParity(module: TranslationModule, moduleName: string): string[] {
    const esKeys = getKeys(module.es);
    const enKeys = getKeys(module.en);
    const missingInEn = esKeys.filter((k) => !enKeys.includes(k));
    const missingInEs = enKeys.filter((k) => !esKeys.includes(k));
    return [...missingInEn.map((k) => `${moduleName}:es->en:${k}`), ...missingInEs.map((k) => `${moduleName}:en->es:${k}`)];
}

function checkPrefixes(module: TranslationModule, moduleName: string): string[] {
    const errors: string[] = [];
    const allKeys = [...Object.keys(module.es), ...Object.keys(module.en)];
    const validPrefixes = [
        "btn-", "err-", "error-", "success-", "loading-", "label-", "placeholder-",
        "hint-", "title-", "desc-", "step-", "lang-", "config-", "empty-",
        "toggle-", "nav-", "section-", "tab-", "status-", "dashboard-",
        "password-", "domain-", "404-",
    ];
    // Palabras sueltas permitidas sin prefijo (common)
    const allowedBareKeys = ["yes", "no", "or", "and", "loading"];

    for (const key of allKeys) {
        const hasValidPrefix = validPrefixes.some((p) => key.startsWith(p));
        const isAllowedBare = allowedBareKeys.includes(key);
        if (!hasValidPrefix && !isAllowedBare) {
            errors.push(`${moduleName}:${key} no tiene prefijo semántico válido`);
        }
    }

    return [...new Set(errors)]; // unique
}

// ============================================
// Tests
// ============================================

describe("i18n Modules — Common", () => {
    it("debe tener las mismas keys en es y en", () => {
        const esKeys = getKeys(commonModule.es);
        const enKeys = getKeys(commonModule.en);
        expect(esKeys).toEqual(enKeys);
    });

    it("debe tener prefijos semánticos válidos", () => {
        const errors = checkPrefixes(commonModule, "common");
        expect(errors).toEqual([]);
    });

    it("debe tener traducciones no vacías", () => {
        for (const [key, value] of Object.entries(commonModule.es)) {
            expect(value.trim(), `common:es:${key} está vacío`).not.toBe("");
        }
        for (const [key, value] of Object.entries(commonModule.en)) {
            expect(value.trim(), `common:en:${key} está vacío`).not.toBe("");
        }
    });

    it("debe tener botones comunes esenciales", () => {
        expect(commonModule.es["btn-continue"]).toBe("Continuar");
        expect(commonModule.en["btn-continue"]).toBe("Continue");
        expect(commonModule.es["btn-save"]).toBe("Guardar");
        expect(commonModule.en["btn-save"]).toBe("Save");
    });

    it("debe tener palabras sueltas esenciales", () => {
        expect(commonModule.es.yes).toBe("Sí");
        expect(commonModule.en.yes).toBe("Yes");
        expect(commonModule.es.no).toBe("No");
        expect(commonModule.en.no).toBe("No");
    });
});

describe("i18n Modules — Admin", () => {
    it("debe tener las mismas keys en es y en", () => {
        const esKeys = getKeys(adminModule.es);
        const enKeys = getKeys(adminModule.en);
        expect(esKeys).toEqual(enKeys);
    });

    it("debe tener prefijos semánticos válidos", () => {
        const errors = checkPrefixes(adminModule, "admin");
        expect(errors).toEqual([]);
    });

    it("debe tener traducciones no vacías", () => {
        for (const [key, value] of Object.entries(adminModule.es)) {
            expect(value.trim(), `admin:es:${key} está vacío`).not.toBe("");
        }
        for (const [key, value] of Object.entries(adminModule.en)) {
            expect(value.trim(), `admin:en:${key} está vacío`).not.toBe("");
        }
    });

    it("debe tener interpolación consistente en ambos idiomas", () => {
        // Las keys con {domain} deben tenerlo en ambos idiomas
        const esDomainKeys = Object.entries(adminModule.es)
            .filter(([_, v]) => v.includes("{domain}"))
            .map(([k]) => k);
        const enDomainKeys = Object.entries(adminModule.en)
            .filter(([_, v]) => v.includes("{domain}"))
            .map(([k]) => k);
        expect(esDomainKeys).toEqual(enDomainKeys);
    });

    it("debe tener títulos de secciones principales", () => {
        expect(adminModule.es["title-dashboard"]).toBeDefined();
        expect(adminModule.es["title-config"]).toBeDefined();
        expect(adminModule.es["title-pages"]).toBeDefined();
    });

    it("debe tener navegación completa", () => {
        expect(adminModule.es["nav-dashboard"]).toBe("Dashboard");
        expect(adminModule.es["nav-config"]).toBe("Configuración");
        expect(adminModule.es["nav-pages"]).toBe("Páginas");
    });
});

describe("i18n Modules — Onboarding", () => {
    it("debe tener las mismas keys en es y en", () => {
        const esKeys = getKeys(onboardingModule.es);
        const enKeys = getKeys(onboardingModule.en);
        expect(esKeys).toEqual(enKeys);
    });

    it("debe tener prefijos semánticos válidos", () => {
        const errors = checkPrefixes(onboardingModule, "onboarding");
        expect(errors).toEqual([]);
    });

    it("debe tener traducciones no vacías", () => {
        for (const [key, value] of Object.entries(onboardingModule.es)) {
            expect(value.trim(), `onboarding:es:${key} está vacío`).not.toBe("");
        }
        for (const [key, value] of Object.entries(onboardingModule.en)) {
            expect(value.trim(), `onboarding:en:${key} está vacío`).not.toBe("");
        }
    });

    it("debe tener interpolación consistente en ambos idiomas", () => {
        const esNameKeys = Object.entries(onboardingModule.es)
            .filter(([_, v]) => v.includes("{name}"))
            .map(([k]) => k);
        const enNameKeys = Object.entries(onboardingModule.en)
            .filter(([_, v]) => v.includes("{name}"))
            .map(([k]) => k);
        expect(esNameKeys).toEqual(enNameKeys);

        const esDomainKeys = Object.entries(onboardingModule.es)
            .filter(([_, v]) => v.includes("{domain}"))
            .map(([k]) => k);
        const enDomainKeys = Object.entries(onboardingModule.en)
            .filter(([_, v]) => v.includes("{domain}"))
            .map(([k]) => k);
        expect(esDomainKeys).toEqual(enDomainKeys);
    });

    it("debe tener los 3 pasos del onboarding", () => {
        expect(onboardingModule.es["step-1-title"]).toContain("idioma");
        expect(onboardingModule.es["step-2-title"]).toContain("cuenta");
        expect(onboardingModule.es["step-3-title"]).toContain("sitio");
    });

    it("debe tener mensajes de error de validación", () => {
        expect(onboardingModule.es["err-email-invalid"]).toContain("correo");
        expect(onboardingModule.es["err-password-min"]).toContain("6 caracteres");
        expect(onboardingModule.es["err-domain-required"]).toContain("dominio");
    });
});

describe("i18n Modules — Public (404)", () => {
    it("debe tener las mismas keys en es y en", () => {
        const esKeys = getKeys(publicModule.es);
        const enKeys = getKeys(publicModule.en);
        expect(esKeys).toEqual(enKeys);
    });

    it("debe tener prefijos semánticos válidos", () => {
        const errors = checkPrefixes(publicModule, "public");
        expect(errors).toEqual([]);
    });

    it("debe tener traducciones no vacías", () => {
        for (const [key, value] of Object.entries(publicModule.es)) {
            expect(value.trim(), `public:es:${key} está vacío`).not.toBe("");
        }
        for (const [key, value] of Object.entries(publicModule.en)) {
            expect(value.trim(), `public:en:${key} está vacío`).not.toBe("");
        }
    });

    it("debe tener título y descripción 404", () => {
        expect(publicModule.es["404-title"]).toBe("Página no encontrada");
        expect(publicModule.en["404-title"]).toBe("Page not found");
        expect(publicModule.es["404-description"]).toContain("no existe");
        expect(publicModule.en["404-description"]).toContain("does not exist");
    });

    it("debe tener CTA para volver al inicio", () => {
        expect(publicModule.es["404-cta-home"]).toContain("inicio");
        expect(publicModule.en["404-cta-home"]).toContain("home");
    });
});

describe("i18n Modules — Paridad global entre todos los módulos", () => {
    const modules: [string, TranslationModule][] = [
        ["common", commonModule],
        ["admin", adminModule],
        ["onboarding", onboardingModule],
        ["public", publicModule],
    ];

    it("no debe tener keys faltantes en ningún módulo", () => {
        const allErrors: string[] = [];
        for (const [name, mod] of modules) {
            const errors = checkParity(mod, name);
            allErrors.push(...errors);
        }
        expect(allErrors).toEqual([]);
    });

    it("no debe tener prefijos inválidos en ningún módulo", () => {
        const allErrors: string[] = [];
        for (const [name, mod] of modules) {
            const errors = checkPrefixes(mod, name);
            allErrors.push(...errors);
        }
        expect(allErrors).toEqual([]);
    });

    it("debe tener al menos 5 keys por módulo", () => {
        for (const [name, mod] of modules) {
            expect(
                Object.keys(mod.es).length,
                `${name}:es tiene menos de 5 keys`
            ).toBeGreaterThanOrEqual(5);
            expect(
                Object.keys(mod.en).length,
                `${name}:en tiene menos de 5 keys`
            ).toBeGreaterThanOrEqual(5);
        }
    });

    it("debe tener el mismo número de keys en es y en por módulo", () => {
        for (const [name, mod] of modules) {
            expect(
                Object.keys(mod.es).length,
                `${name}: número de keys es/en no coincide`
            ).toBe(Object.keys(mod.en).length);
        }
    });
});
