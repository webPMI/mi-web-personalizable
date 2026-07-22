import { describe, it, expect, beforeEach } from "vitest";
import {
  t,
  getStoredLocale,
  setStoredLocale,
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

  it("should translate registered keys correctly for active locale", () => {
    setStoredLocale("es");
    expect(t("common:btn-continue")).toBe("Continuar");

    setStoredLocale("en");
    expect(t("common:btn-continue")).toBe("Continue");
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
});
