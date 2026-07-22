// ============================================
// tests/devtools.test.ts — Pruebas de DevTools
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mocks
// ============================================

const mockSessionStorage: Record<string, string> = {};
const mockLocation = { hostname: "localhost", href: "http://localhost/" };

beforeEach(() => {
    // Limpiar sessionStorage mock
    Object.keys(mockSessionStorage).forEach((k) => delete mockSessionStorage[k]);

    // Mock sessionStorage
    Object.defineProperty(globalThis, "sessionStorage", {
        value: {
            getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => {
                mockSessionStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockSessionStorage[key];
            }),
            clear: vi.fn(() => {
                Object.keys(mockSessionStorage).forEach((k) => delete mockSessionStorage[k]);
            }),
        },
        writable: true,
        configurable: true,
    });

    // Mock window.location
    Object.defineProperty(globalThis, "window", {
        value: {
            location: { ...mockLocation, reload: vi.fn() },
            document: {
                getElementById: vi.fn(),
                querySelector: vi.fn(),
                addEventListener: vi.fn(),
            },
        },
        writable: true,
        configurable: true,
    });
});

// ============================================
// Tests: login-autofill.ts
// ============================================

describe("DevTools — login-autofill.ts", () => {
    it("debe detectar página de login correctamente", async () => {
        const { isLoginPage } = await import("../src/components/devtools/login-autofill");

        // Sin formulario de login
        vi.spyOn(document, "getElementById").mockReturnValue(null);
        expect(isLoginPage()).toBe(false);

        // Con formulario de login
        const mockForm = document.createElement("div");
        mockForm.id = "login-form";
        vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
            if (id === "login-form") return mockForm;
            return null;
        });
        expect(isLoginPage()).toBe(true);
    });

    it("debe autocompletar campos de login", async () => {
        const { autofillLogin } = await import("../src/components/devtools/login-autofill");

        const emailInput = document.createElement("input");
        emailInput.id = "email";
        const passwordInput = document.createElement("input");
        passwordInput.id = "password";

        vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
            if (id === "email") return emailInput;
            if (id === "password") return passwordInput;
            return null;
        });

        const result = autofillLogin();
        expect(result).toBe(true);
        expect(emailInput.value).toBe("demo@ejemplo.com");
        expect(passwordInput.value).toBe("Demo123!");
    });

    it("debe retornar false si no hay campos de login", async () => {
        const { autofillLogin } = await import("../src/components/devtools/login-autofill");

        vi.spyOn(document, "getElementById").mockReturnValue(null);

        const result = autofillLogin();
        expect(result).toBe(false);
    });

    it("debe usar datos personalizados si se proporcionan", async () => {
        const { autofillLogin } = await import("../src/components/devtools/login-autofill");

        const emailInput = document.createElement("input");
        emailInput.id = "email";
        const passwordInput = document.createElement("input");
        passwordInput.id = "password";

        vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
            if (id === "email") return emailInput;
            if (id === "password") return passwordInput;
            return null;
        });

        autofillLogin({ email: "test@test.com", password: "Test123!" });
        expect(emailInput.value).toBe("test@test.com");
        expect(passwordInput.value).toBe("Test123!");
    });
});

// ============================================
// Tests: onboarding-autofill.ts
// ============================================

describe("DevTools — onboarding-autofill.ts", () => {
    it("debe detectar página de onboarding correctamente", async () => {
        const { isOnboardingPage } = await import("../src/components/devtools/onboarding-autofill");

        // Sin contenedor de onboarding
        vi.spyOn(document, "querySelector").mockReturnValue(null);
        expect(isOnboardingPage()).toBe(false);

        // Con contenedor de onboarding
        const mockContainer = document.createElement("div");
        mockContainer.className = "onboarding-container";
        vi.spyOn(document, "querySelector").mockReturnValue(mockContainer);
        expect(isOnboardingPage()).toBe(true);
    });

    it("debe autocompletar campos de onboarding", async () => {
        const { autofillOnboarding } = await import("../src/components/devtools/onboarding-autofill");

        // Mock radio button
        const localeRadio = document.createElement("input");
        localeRadio.type = "radio";
        localeRadio.name = "locale";
        localeRadio.value = "es";

        // Mock input fields
        const usernameInput = document.createElement("input");
        usernameInput.id = "username";
        const nameInput = document.createElement("input");
        nameInput.id = "name";
        const emailInput = document.createElement("input");
        emailInput.id = "email";
        const passwordInput = document.createElement("input");
        passwordInput.id = "password";
        const passwordConfirmInput = document.createElement("input");
        passwordConfirmInput.id = "password-confirm";
        const siteNameInput = document.createElement("input");
        siteNameInput.id = "site-name";
        const siteDescInput = document.createElement("textarea");
        siteDescInput.id = "site-description";
        const domainInput = document.createElement("input");
        domainInput.id = "domain-input";

        vi.spyOn(document, "querySelector").mockReturnValue(localeRadio);
        vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
            const map: Record<string, HTMLElement> = {
                username: usernameInput,
                name: nameInput,
                email: emailInput,
                password: passwordInput,
                "password-confirm": passwordConfirmInput,
                "site-name": siteNameInput,
                "site-description": siteDescInput,
                "domain-input": domainInput,
            };
            return map[id] ?? null;
        });

        const result = autofillOnboarding();
        expect(result).toBe(true);
        expect(usernameInput.value).toBe("usuariodemo");
        expect(emailInput.value).toBe("demo@ejemplo.com");
        expect(siteNameInput.value).toBe("Mi Sitio Demo");
        expect(domainInput.value).toBe("localhost.com");
    });

    it("debe retornar false si no hay campos", async () => {
        const { autofillOnboarding } = await import("../src/components/devtools/onboarding-autofill");

        vi.spyOn(document, "querySelector").mockReturnValue(null);
        vi.spyOn(document, "getElementById").mockReturnValue(null);

        const result = autofillOnboarding();
        expect(result).toBe(false);
    });
});

// ============================================
// Tests: types.ts
// ============================================

describe("DevTools — types.ts", () => {
    it("debe tener la estructura DevToolsModule correcta", async () => {
        const mod = await import("../src/components/devtools/types");

        // Verificar que el módulo se exporta sin error
        expect(mod).toBeDefined();
    });
});

// ============================================
// Tests: modules/actions.ts
// ============================================

describe("DevTools — modules/actions.ts", () => {
    it("debe tener la estructura de módulo correcta", async () => {
        const { actionsModule } = await import("../src/components/devtools/modules/actions");

        expect(actionsModule.id).toBe("devtools-module-actions");
        expect(actionsModule.label).toBe("Acciones rápidas");
        expect(typeof actionsModule.render).toBe("function");
        expect(typeof actionsModule.init).toBe("function");
    });

    it("debe renderizar HTML con botones", async () => {
        const { actionsModule } = await import("../src/components/devtools/modules/actions");

        const html = actionsModule.render();
        expect(html).toContain("devtools-action-reset");
        expect(html).toContain("devtools-action-reload");
        expect(html).toContain("Reiniciar onboarding");
        expect(html).toContain("Recargar");
    });

    it("debe inicializar event listeners sin errores", async () => {
        const { actionsModule } = await import("../src/components/devtools/modules/actions");

        // Mock getElementById
        const mockBtn = document.createElement("button");
        vi.spyOn(document, "getElementById").mockReturnValue(mockBtn);

        // No debe lanzar error
        expect(() => actionsModule.init()).not.toThrow();
    });
});

// ============================================
// Tests: modules/onboarding.ts
// ============================================

describe("DevTools — modules/onboarding.ts", () => {
    it("debe tener la estructura de módulo correcta", async () => {
        const { onboardingModule } = await import("../src/components/devtools/modules/onboarding");

        expect(onboardingModule.id).toBe("devtools-module-onboarding");
        expect(onboardingModule.label).toBe("Onboarding");
        expect(typeof onboardingModule.render).toBe("function");
        expect(typeof onboardingModule.init).toBe("function");
        expect(typeof onboardingModule.onOpen).toBe("function");
    });

    it("debe renderizar HTML con botón de autocompletar", async () => {
        const { onboardingModule } = await import("../src/components/devtools/modules/onboarding");

        const html = onboardingModule.render();
        expect(html).toContain("devtools-onboarding-autofill");
        expect(html).toContain("Autocompletar formulario");
    });

    it("debe ocultar sección si no estamos en onboarding", async () => {
        const { onboardingModule } = await import("../src/components/devtools/modules/onboarding");

        // Mock DOM
        const section = document.createElement("div");
        section.id = "devtools-module-onboarding";

        vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
            if (id === "devtools-module-onboarding") return section;
            return null;
        });
        vi.spyOn(document, "querySelector").mockReturnValue(null);

        onboardingModule.onOpen?.();
        expect(section.classList.contains("hidden")).toBe(true);
    });

    it("debe mostrar sección si estamos en onboarding", async () => {
        const { onboardingModule } = await import("../src/components/devtools/modules/onboarding");

        const section = document.createElement("div");
        section.id = "devtools-module-onboarding";

        vi.spyOn(document, "getElementById").mockImplementation((id: string) => {
            if (id === "devtools-module-onboarding") return section;
            return null;
        });

        const mockContainer = document.createElement("div");
        mockContainer.className = "onboarding-container";
        vi.spyOn(document, "querySelector").mockReturnValue(mockContainer);

        onboardingModule.onOpen?.();
        expect(section.classList.contains("hidden")).toBe(false);
    });
});
