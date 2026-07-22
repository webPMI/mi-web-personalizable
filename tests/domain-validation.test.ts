import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeDomain,
  getEffectiveDomain,
  getRegisteredDomain,
  clearRegisteredDomain,
  getDevToolsDomain,
} from "../src/lib/domain-check";

describe("Domain Normalization & Edge Cases", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("normalizeDomain()", () => {
    it("should strip protocol schemes (http:// and https://)", () => {
      expect(normalizeDomain("https://midominio.com")).toBe("midominio.com");
      expect(normalizeDomain("http://midominio.com")).toBe("midominio.com");
    });

    it("should convert uppercase domains to lowercase", () => {
      expect(normalizeDomain("MiDominio.COM")).toBe("midominio.com");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(normalizeDomain("   midominio.com   ")).toBe("midominio.com");
    });

    it("should strip URL path suffixes and query parameters", () => {
      expect(normalizeDomain("midominio.com/admin/config")).toBe("midominio.com");
      expect(normalizeDomain("https://midominio.com/page?id=123")).toBe("midominio.com");
    });

    it("should return empty string for null or empty domain inputs", () => {
      expect(normalizeDomain("")).toBe("");
      expect(normalizeDomain(null as unknown as string)).toBe("");
    });
  });

  describe("getRegisteredDomain() persistence control", () => {
    it("should allow reading registered domain without clearing if clearOnRead is false", () => {
      sessionStorage.setItem("registered-domain", "https://SitioRegistrado.com/ ");

      // Read without clearing
      const firstRead = getRegisteredDomain(false);
      expect(firstRead).toBe("sitioregistrado.com");

      // Second read should still find it
      const secondRead = getRegisteredDomain(false);
      expect(secondRead).toBe("sitioregistrado.com");

      // Explicit clear
      clearRegisteredDomain();
      expect(getRegisteredDomain(false)).toBeNull();
    });

    it("should auto-clear when clearOnRead is true (default behavior)", () => {
      sessionStorage.setItem("registered-domain", "OneTimeDomain.com");

      expect(getRegisteredDomain(true)).toBe("onetimedomain.com");
      expect(getRegisteredDomain(true)).toBeNull();
    });
  });

  describe("getEffectiveDomain() fallbacks", () => {
    it("should normalize devtools domain", () => {
      sessionStorage.setItem("devtools-domain", "https://DevDomain.COM/ ");
      expect(getDevToolsDomain()).toBe("devdomain.com");
      expect(getEffectiveDomain()).toBe("devdomain.com");
    });

    it("should return 'localhost.com' fallback when no session or location domain exists", () => {
      expect(getEffectiveDomain()).toBe("localhost");
    });
  });
});
