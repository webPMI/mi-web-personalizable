import { describe, it, expect, beforeEach } from "vitest";
import { t, registerTranslations, setStoredLocale } from "../src/lib/i18n";

describe("i18n Edge Cases & Security", () => {
  beforeEach(() => {
    setStoredLocale("es");
  });

  it("should replace ALL occurrences of a parameter in the same translation string", () => {
    registerTranslations("edge-cases", {
      es: { "double-param": "Hola {name}, tu usuario registrado es {name}." },
      en: { "double-param": "Hello {name}, your registered user is {name}." },
    });

    expect(t("edge-cases:double-param", { name: "Enzo" })).toBe(
      "Hola Enzo, tu usuario registrado es Enzo."
    );
  });

  it("should safely handle null or undefined parameter values without crashing", () => {
    registerTranslations("edge-cases", {
      es: { "null-param": "Valor: {val}" },
      en: { "null-param": "Value: {val}" },
    });

    expect(
      t("edge-cases:null-param", { val: undefined as unknown as string })
    ).toBe("Valor: ");
  });

  it("should handle parameters containing special characters or HTML safely", () => {
    registerTranslations("edge-cases", {
      es: { "html-param": "Mensaje: {msg}" },
      en: { "html-param": "Message: {msg}" },
    });

    const untrustedInput = "<script>alert('xss')</script>";
    expect(t("edge-cases:html-param", { msg: untrustedInput })).toBe(
      "Mensaje: <script>alert('xss')</script>"
    );
  });

  it("should handle nested brace strings in parameter values", () => {
    registerTranslations("edge-cases", {
      es: { "brace-param": "Resultado: {data}" },
      en: { "brace-param": "Result: {data}" },
    });

    expect(t("edge-cases:brace-param", { data: "{nested: value}" })).toBe(
      "Resultado: {nested: value}"
    );
  });

  it("should handle empty or whitespace-only keys gracefully", () => {
    expect(t("")).toBe("");
    expect(t("   ")).toBe("   ");
    expect(t(":")).toBe(":");
  });
});
