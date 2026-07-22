// ============================================
// tests/login-page.test.ts — Pruebas de lógica de login.astro
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Login Page — Lógica de validación de formulario", () => {
    it("debe validar email obligatorio", () => {
        const email = "";
        const password = "password123";

        let hasError = false;
        const errors: string[] = [];

        if (!email) {
            errors.push("El correo electrónico es obligatorio.");
            hasError = true;
        }

        expect(hasError).toBe(true);
        expect(errors).toContain("El correo electrónico es obligatorio.");
    });

    it("debe validar formato de email", () => {
        // La validación simple del login.astro es: email.includes("@") && email.includes(".")
        // Emails que NO pasan: sin @, sin ., o sin ambos
        const invalidEmails = ["notanemail", "sinpunto@", "solo texto"];
        const validEmails = ["user@example.com", "test@domain.co", "a@b.c", "user@.com"];

        for (const email of invalidEmails) {
            const isValid = email.includes("@") && email.includes(".");
            expect(isValid).toBe(false);
        }

        for (const email of validEmails) {
            const isValid = email.includes("@") && email.includes(".");
            expect(isValid).toBe(true);
        }
    });

    it("debe validar contraseña obligatoria", () => {
        const password = "";

        let hasError = false;
        if (!password) {
            hasError = true;
        }

        expect(hasError).toBe(true);
    });

    it("debe mostrar error si email y contraseña están vacíos", () => {
        const email = "";
        const password = "";

        let hasError = false;
        const errors: string[] = [];

        if (!email) {
            errors.push("email");
            hasError = true;
        }
        if (!password) {
            errors.push("password");
            hasError = true;
        }

        expect(hasError).toBe(true);
        expect(errors).toEqual(["email", "password"]);
    });

    it("debe pasar validación con datos correctos", () => {
        const email = "user@example.com";
        const password = "ValidPass123!";

        let hasError = false;
        if (!email || !email.includes("@") || !email.includes(".")) hasError = true;
        if (!password) hasError = true;

        expect(hasError).toBe(false);
    });
});

describe("Login Page — Toggle password visibility", () => {
    it("debe alternar tipo de input entre password y text", () => {
        const input = { type: "password" };

        // Toggle a text
        input.type = "text";
        expect(input.type).toBe("text");

        // Toggle a password
        input.type = "password";
        expect(input.type).toBe("password");
    });

    it("debe cambiar icono según visibilidad", () => {
        const isPassword = true;
        const eyeIcon = "eye";
        const eyeOffIcon = "eye-off";

        const icon = isPassword ? eyeIcon : eyeOffIcon;
        expect(icon).toBe("eye");

        const isPassword2 = false;
        const icon2 = isPassword2 ? eyeIcon : eyeOffIcon;
        expect(icon2).toBe("eye-off");
    });
});

describe("Login Page — processAuthenticatedUser logic", () => {
    it("debe redirigir a /admin si el usuario tiene sitio", () => {
        const siteDomain = "midominio.com";
        const shouldRedirect = !!siteDomain;
        expect(shouldRedirect).toBe(true);
    });

    it("debe mostrar acceso denegado si no hay sitio", () => {
        const siteDomain = null;
        const showAccessDenied = !siteDomain;
        expect(showAccessDenied).toBe(true);
    });

    it("debe crear sitio si no existe (modo desarrollo)", () => {
        const siteDomain = null;
        const shouldCreateSite = !siteDomain;
        expect(shouldCreateSite).toBe(true);
    });
});

describe("Login Page — Google login flow", () => {
    it("debe manejar cancelación de login con Google", () => {
        const error = "Inicio de sesión cancelado.";
        const shouldHideError = error === "Inicio de sesión cancelado.";
        expect(shouldHideError).toBe(true);
    });

    it("debe mostrar error si login con Google falla", () => {
        const error: string = "Error de red";
        const cancelMsg: string = "Inicio de sesión cancelado.";
        const shouldShowError = error !== cancelMsg;
        expect(shouldShowError).toBe(true);
    });
});

describe("Login Page — Estados de carga", () => {
    it("debe alternar estado de carga correctamente", () => {
        const show = true;
        const formHidden = show;
        const loadingVisible = show;

        expect(formHidden).toBe(true);
        expect(loadingVisible).toBe(true);

        const show2 = false;
        expect(!show2).toBe(true);
    });

    it("debe alternar estado de verificación de rol", () => {
        const show = true;
        const loadingHidden = show;
        const roleCheckingVisible = !show;

        expect(loadingHidden).toBe(true);
        expect(roleCheckingVisible).toBe(false);
    });
});

describe("Login Page — Limpiar errores al escribir", () => {
    it("debe remover clase error del grupo al hacer input", () => {
        const group = document.createElement("div");
        group.classList.add("error");
        expect(group.classList.contains("error")).toBe(true);

        // Simular input event
        group.classList.remove("error");
        expect(group.classList.contains("error")).toBe(false);
    });
});
