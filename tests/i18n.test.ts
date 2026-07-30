import { describe, it, expect, beforeEach } from "vitest";
import {
  t,
  getStoredLocale,
  setStoredLocale,
  getCurrentLocale,
  getLocaleFromCookie,
  registerTranslations,
} from "../src/lib/i18n";

describe("i18n Core System", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("should return stored locale or default to 'es'", () => {
    expect(getStoredLocale()).toBe("es");

    setStoredLocale("en");
    expect(getStoredLocale()).toBe("en");

    setStoredLocale("es");
    expect(getStoredLocale()).toBe("es");
  });

  it("should accept serverLocale parameter and prioritize it", () => {
    setStoredLocale("es");
    expect(getStoredLocale("en")).toBe("en");
    expect(getStoredLocale("es")).toBe("es");
    // Invalid value returns es
    expect(getStoredLocale("fr")).toBe("es");
  });

  it("getCurrentLocale should work with and without locale param", () => {
    expect(getCurrentLocale()).toBe("es");
    expect(getCurrentLocale("en")).toBe("en");
    expect(getCurrentLocale("es")).toBe("es");
  });

  it("getLocaleFromCookie should parse cookie from Request", () => {
    const reqEn = new Request("http://localhost", {
      headers: { cookie: "app-locale=en" },
    });
    expect(getLocaleFromCookie(reqEn)).toBe("en");

    const reqEs = new Request("http://localhost", {
      headers: { cookie: "app-locale=es" },
    });
    expect(getLocaleFromCookie(reqEs)).toBe("es");

    // No cookie → default "es"
    const reqNoCookie = new Request("http://localhost");
    expect(getLocaleFromCookie(reqNoCookie)).toBe("es");

    // Invalid cookie value → default "es"
    const reqInvalid = new Request("http://localhost", {
      headers: { cookie: "app-locale=fr" },
    });
    expect(getLocaleFromCookie(reqInvalid)).toBe("es");
  });

  it("should translate registered keys correctly for active locale", () => {
    setStoredLocale("es");
    expect(t("common:btn-continue")).toBe("Continuar");

    setStoredLocale("en");
    expect(t("common:btn-continue")).toBe("Continue");
  });

  it("should accept optional locale parameter in t()", () => {
    // Tercer parámetro locale explícito, ignora el stored
    setStoredLocale("es");
    expect(t("common:btn-continue", undefined, "en")).toBe("Continue");
    expect(t("common:btn-continue", undefined, "es")).toBe("Continuar");
  });

  it("should interpolate parameters correctly", () => {
    setStoredLocale("es");
    // Mock temporary custom module with params
    registerTranslations("test-module", {
      es: { "greeting": "Hola, {name}!" },
      en: { "greeting": "Hello, {name}!" },
    });

    expect(t("test-module:greeting", { name: "Enzo" })).toBe("Hola, Enzo!");

    setStoredLocale("en");
    expect(t("test-module:greeting", { name: "Enzo" })).toBe("Hello, Enzo!");
  });

  it("should fallback to alternative locale if key is missing in active locale", () => {
    registerTranslations("fallback-module", {
      es: { "only-es": "Solo Español" },
      en: {},
    });

    setStoredLocale("en");
    expect(t("fallback-module:only-es")).toBe("Solo Español");
  });

  it("should return original key if namespace or key does not exist", () => {
    expect(t("non-existent-namespace:some-key")).toBe("non-existent-namespace:some-key");
    expect(t("common:non-existent-key")).toBe("common:non-existent-key");
  });

  it("should warn and return key if format is missing colon namespace", () => {
    expect(t("keyWithoutNamespace")).toBe("keyWithoutNamespace");
  });

  it("should have login and home modules registered via barrel", () => {
    // Estos módulos se registran al importar ../src/lib/i18n
    setStoredLocale("es");
    expect(t("login:login-title")).toBe("Iniciar sesión");
    expect(t("login:btn-login")).toBe("Iniciar sesión");
    expect(t("login:err-email-empty")).toBe("El correo electrónico es obligatorio.");
    expect(t("home:title-home")).toBe("Inicio");
    expect(t("home:site-default-name")).toBe("Mi Web Personalizable");
    expect(t("home:footer-rights")).toBe("Todos los derechos reservados.");

    setStoredLocale("en");
    expect(t("login:login-title")).toBe("Sign in");
    expect(t("login:btn-login")).toBe("Sign in");
    expect(t("home:title-home")).toBe("Home");
    expect(t("home:site-default-name")).toBe("My Customizable Web");
  });
});
