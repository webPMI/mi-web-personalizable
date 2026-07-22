// ============================================
// tests/ui-helpers-dom.test.ts — Pruebas de UI Helpers con DOM
// Importa directamente de src/lib/ui-helpers.ts
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Configurar DOM antes de importar
// ============================================
document.body.innerHTML = `
  <div id="fg-username" class="form-group">
    <input id="username" type="text" />
    <span class="field-error"></span>
  </div>
  <div id="fg-email" class="form-group">
    <input id="email" type="email" />
    <span class="field-error"></span>
  </div>
  <div id="fg-password" class="form-group error">
    <input id="password" type="password" />
    <span class="field-error">Error previo</span>
  </div>
`;

import {
    showFieldError,
    clearAllErrors,
    clearErrorOnInput,
} from "../src/lib/ui-helpers";

describe("UI Helpers — showFieldError()", () => {
    beforeEach(() => {
        // Resetear DOM
        document.getElementById("fg-username")?.classList.remove("error");
        const errEl = document.querySelector("#fg-username .field-error");
        if (errEl) errEl.textContent = "";
    });

    it("debe mostrar error en un grupo de formulario", () => {
        showFieldError("fg-username", "El usuario es requerido");

        const group = document.getElementById("fg-username");
        expect(group?.classList.contains("error")).toBe(true);

        const errEl = group?.querySelector(".field-error");
        expect(errEl?.textContent).toBe("El usuario es requerido");
    });

    it("debe no hacer nada si el grupo no existe", () => {
        // No debe lanzar error
        expect(() => showFieldError("fg-nonexistent", "Error")).not.toThrow();
    });

    it("debe no hacer nada si no hay .field-error en el grupo", () => {
        document.body.innerHTML += `<div id="fg-no-error" class="form-group"></div>`;
        expect(() => showFieldError("fg-no-error", "Error")).not.toThrow();
    });
});

describe("UI Helpers — clearAllErrors()", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="fg-1" class="form-group error"></div>
      <div id="fg-2" class="form-group error"></div>
      <div id="fg-3" class="form-group"></div>
    `;
    });

    it("debe limpiar todos los errores de formularios", () => {
        clearAllErrors();

        expect(document.getElementById("fg-1")?.classList.contains("error")).toBe(false);
        expect(document.getElementById("fg-2")?.classList.contains("error")).toBe(false);
        expect(document.getElementById("fg-3")?.classList.contains("error")).toBe(false);
    });

    it("debe no hacer nada si no hay grupos con error", () => {
        document.body.innerHTML = `<div id="fg-clean" class="form-group"></div>`;
        expect(() => clearAllErrors()).not.toThrow();
    });
});

describe("UI Helpers — clearErrorOnInput()", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="fg-test" class="form-group error">
        <input id="test-input" type="text" />
      </div>
    `;
    });

    it("debe limpiar el error cuando el usuario escribe", () => {
        clearErrorOnInput("test-input", "fg-test");

        const input = document.getElementById("test-input") as HTMLInputElement;
        const group = document.getElementById("fg-test");

        // Disparar evento input
        input?.dispatchEvent(new Event("input", { bubbles: true }));

        expect(group?.classList.contains("error")).toBe(false);
    });

    it("debe no hacer nada si el input no existe", () => {
        expect(() => clearErrorOnInput("nonexistent-input", "fg-test")).not.toThrow();
    });

    it("debe no hacer nada si el grupo no existe", () => {
        expect(() => clearErrorOnInput("test-input", "fg-nonexistent")).not.toThrow();
    });
});
