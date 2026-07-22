import { describe, it, expect } from "vitest";
import { getAuthErrorMessage } from "../src/lib/firebase/auth";

describe("Firebase Auth Helpers & Error Mapping", () => {
  it("should map known Auth error codes correctly", () => {
    expect(getAuthErrorMessage("auth/user-not-found")).toBe(
      "No existe una cuenta con este correo electrónico."
    );
    expect(getAuthErrorMessage("auth/wrong-password")).toBe("Contraseña incorrecta.");
    expect(getAuthErrorMessage("auth/email-already-in-use")).toBe(
      "Ya existe una cuenta con este correo electrónico."
    );
    expect(getAuthErrorMessage("auth/weak-password")).toBe(
      "La contraseña debe tener al menos 6 caracteres."
    );
    expect(getAuthErrorMessage("auth/popup-closed-by-user")).toBe("Inicio de sesión cancelado.");
  });

  it("should accept Firebase Auth error objects with a code property", () => {
    const errorObj = { code: "auth/invalid-email", message: "Invalid email" };
    expect(getAuthErrorMessage(errorObj)).toBe("El correo electrónico no es válido.");
  });

  it("should return fallback message for unknown or missing codes", () => {
    expect(getAuthErrorMessage("auth/unknown-code")).toBe("Ha ocurrido un error inesperado.");
    expect(getAuthErrorMessage(null)).toBe("Ha ocurrido un error inesperado.");
    expect(getAuthErrorMessage(undefined)).toBe("Ha ocurrido un error inesperado.");
    expect(getAuthErrorMessage("")).toBe("Ha ocurrido un error inesperado.");
  });
});
