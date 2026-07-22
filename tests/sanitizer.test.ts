import { describe, it, expect } from "vitest";
import {
  sanitizeUrl,
  escapeAttribute,
  sanitizeText,
  sanitizeSiteData,
} from "../src/lib/sanitizer";

// Build HTML entities at runtime to avoid editor corruption
const Q = String.fromCharCode(38, 113, 117, 111, 116, 59); // "
const L = String.fromCharCode(38, 108, 116, 59); // <
const G = String.fromCharCode(38, 103, 116, 59); // >
const A = String.fromCharCode(38, 97, 109, 112, 59); // &
const X = String.fromCharCode(38, 35, 120, 50, 55, 59); // &#x27;

describe("Sanitizer Module Security & Reliability", () => {
  describe("sanitizeUrl()", () => {
    it("should neutralize script execution schemes (javascript:, data:, vbscript:)", () => {
      expect(sanitizeUrl("javascript:alert(document.cookie)")).toBe("#");
      expect(sanitizeUrl("JAVASCRIPT:alert('xss')")).toBe("#");
      expect(sanitizeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe("#");
      expect(sanitizeUrl("vbscript:msgbox('xss')")).toBe("#");
    });

    it("should preserve valid HTTP, HTTPS, relative paths and hash links", () => {
      expect(sanitizeUrl("https://example.com/page")).toBe("https://example.com/page");
      expect(sanitizeUrl("http://localhost:3000")).toBe("http://localhost:3000");
      expect(sanitizeUrl("/about")).toBe("/about");
      expect(sanitizeUrl("#contact")).toBe("#contact");
      expect(sanitizeUrl("./services")).toBe("./services");
    });

    it("should handle null, undefined, and whitespace-only URLs", () => {
      expect(sanitizeUrl(null)).toBe("");
      expect(sanitizeUrl(undefined)).toBe("");
      expect(sanitizeUrl("   ")).toBe("");
    });
  });

  describe("escapeAttribute()", () => {
    it("should escape double quotes, single quotes, angle brackets, and ampersands", () => {
      expect(escapeAttribute('Texto "con comillas"')).toBe("Texto " + Q + "con comillas" + Q);
      expect(escapeAttribute("O'Connor")).toBe("O" + X + "Connor");
      expect(escapeAttribute("<script>alert(1)</script>")).toBe(L + "script" + G + "alert(1)" + L + "/script" + G);
      expect(escapeAttribute("Tom & Jerry")).toBe("Tom " + A + " Jerry");
    });

    it("should handle null and undefined safely", () => {
      expect(escapeAttribute(null)).toBe("");
      expect(escapeAttribute(undefined)).toBe("");
    });
  });

  describe("sanitizeText()", () => {
    it("should trim leading and trailing whitespace", () => {
      expect(sanitizeText("   Hola mundo   ")).toBe("Hola mundo");
    });
  });

  describe("sanitizeSiteData() automatic recursive sanitization", () => {
    it("should automatically sanitize URLs, trim texts, and strip undefined properties", () => {
      const maliciousSiteData = {
        siteName: "   Mi Sitio Web   ",
        siteDescription: "Descripci\u00f3n limpia",
        logoUrl: "javascript:alert('xss')",
        heroCtaLink: "https://example.com",
        socialLinks: {
          twitter: "javascript:evil()",
          github: "https://github.com/myrepo",
        },
        navLinks: [
          { label: '  Men\u00fa "Principal"  ', href: "/home" },
          { label: "Blog", href: "data:text/html,xss" },
        ],
        theme: {
          primaryColor: "#2563eb",
          fontFamily: undefined,
        },
      };

      const clean = sanitizeSiteData(maliciousSiteData);

      expect(clean.siteName).toBe("Mi Sitio Web");
      expect(clean.logoUrl).toBe("#");
      expect(clean.socialLinks.twitter).toBe("#");
      expect(clean.socialLinks.github).toBe("https://github.com/myrepo");
      // sanitizeText escapes double quotes to "
      expect(clean.navLinks[0].label).toBe("Men\u00fa " + Q + "Principal" + Q);
      expect(clean.navLinks[1].href).toBe("#");
      expect("fontFamily" in clean.theme).toBe(false);
    });
  });
});
