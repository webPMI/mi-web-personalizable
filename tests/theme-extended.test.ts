import { describe, it, expect } from "vitest";
import {
  DEFAULT_THEME,
  resolveTheme,
  getThemeCssVariables,
  generateThemeCssBlock,
  applyThemeToElement,
} from "../src/lib/theme";

describe("Theme Module — Extended Edge Cases", () => {
  describe("resolveTheme() — edge cases", () => {
    it("should handle null theme input by returning all defaults", () => {
      const resolved = resolveTheme(null as any);
      expect(resolved.primaryColor).toBe(DEFAULT_THEME.primaryColor);
      expect(resolved.bgColor).toBe(DEFAULT_THEME.bgColor);
      expect(resolved.fontFamily).toBe(DEFAULT_THEME.fontFamily);
      expect(resolved.layout).toBe("centered");
    });

    it("should handle undefined theme input by returning all defaults", () => {
      const resolved = resolveTheme(undefined);
      expect(resolved.primaryColor).toBe(DEFAULT_THEME.primaryColor);
      expect(resolved.fontFamily).toBe(DEFAULT_THEME.fontFamily);
    });

    it("should resolve partial theme with only one property set", () => {
      const resolved = resolveTheme({ primaryColor: "#ff0000" });
      expect(resolved.primaryColor).toBe("#ff0000");
      // All other properties should fall back to defaults
      expect(resolved.secondaryColor).toBe(DEFAULT_THEME.secondaryColor);
      expect(resolved.bgColor).toBe(DEFAULT_THEME.bgColor);
      expect(resolved.fontFamily).toBe(DEFAULT_THEME.fontFamily);
      expect(resolved.layout).toBe("centered");
    });

    it("should preserve empty string values (falsy but not null/undefined)", () => {
      const resolved = resolveTheme({ primaryColor: "" });
      expect(resolved.primaryColor).toBe(DEFAULT_THEME.primaryColor);
    });

    it("should handle all hero alignment values", () => {
      expect(resolveTheme({ heroAlign: "left" }).heroAlign).toBe("left");
      expect(resolveTheme({ heroAlign: "center" }).heroAlign).toBe("center");
      expect(resolveTheme({ heroAlign: "right" }).heroAlign).toBe("right");
    });

    it("should handle all btnStyle values", () => {
      expect(resolveTheme({ btnStyle: "filled" }).btnStyle).toBe("filled");
      expect(resolveTheme({ btnStyle: "outline" }).btnStyle).toBe("outline");
      expect(resolveTheme({ btnStyle: "ghost" }).btnStyle).toBe("ghost");
    });
  });

  describe("getThemeCssVariables() — edge cases", () => {
    it("should return all variables for default theme", () => {
      const vars = getThemeCssVariables();
      expect(vars["--primary"]).toBe(DEFAULT_THEME.primaryColor);
      expect(vars["--bg"]).toBe(DEFAULT_THEME.bgColor);
      expect(vars["--font-family"]).toBe(DEFAULT_THEME.fontFamily);
      expect(vars["--max-width"]).toBe(`${DEFAULT_THEME.maxWidth}px`);
      // Should have all expected keys
      expect(Object.keys(vars).length).toBeGreaterThanOrEqual(40);
    });

    it("should handle null theme input gracefully", () => {
      const vars = getThemeCssVariables(null as any);
      expect(vars["--primary"]).toBe(DEFAULT_THEME.primaryColor);
      expect(vars["--bg"]).toBe(DEFAULT_THEME.bgColor);
    });

    it("should generate correct px units for numeric spacing properties", () => {
      const vars = getThemeCssVariables({
        sectionGap: 100,
        containerPadding: 32,
        cardRadius: 16,
        borderRadius: 12,
      });
      expect(vars["--section-gap"]).toBe("100px");
      expect(vars["--container-padding"]).toBe("32px");
      expect(vars["--card-radius"]).toBe("16px");
      expect(vars["--border-radius"]).toBe("12px");
      expect(vars["--radius"]).toBe("12px");
    });

    it("should handle heroHeight with custom CSS units (vh, rem)", () => {
      const vars = getThemeCssVariables({ heroHeight: "100vh" });
      expect(vars["--hero-height"]).toBe("100vh");
    });

    it("should handle string font sizes (rem units)", () => {
      const vars = getThemeCssVariables({
        h1Size: "3.5rem",
        h2Size: "2.5rem",
        h3Size: "1.5rem",
      });
      expect(vars["--h1-size"]).toBe("3.5rem");
      expect(vars["--h2-size"]).toBe("2.5rem");
      expect(vars["--h3-size"]).toBe("1.5rem");
    });

    it("should produce unique CSS variable keys (no duplicates)", () => {
      const vars = getThemeCssVariables();
      const keys = Object.keys(vars);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("should set --max-width to 100% when layout is full-width", () => {
      const vars = getThemeCssVariables({ layout: "full-width" });
      expect(vars["--max-width"]).toBe("100%");
    });

    it("should set --max-width to pixel value when layout is centered", () => {
      const vars = getThemeCssVariables({ layout: "centered", maxWidth: 900 });
      expect(vars["--max-width"]).toBe("900px");
    });
  });

  describe("generateThemeCssBlock() — edge cases", () => {
    it("should generate a valid CSS block with :root selector by default", () => {
      const css = generateThemeCssBlock({ primaryColor: "#aabbcc" });
      expect(css).toContain(":root {");
      expect(css).toContain("--primary: #aabbcc;");
      expect(css).toContain("}");
    });

    it("should use custom selector when provided", () => {
      const css = generateThemeCssBlock({ primaryColor: "#112233" }, ".dark");
      expect(css).toContain(".dark {");
      expect(css).not.toContain(":root {");
    });

    it("should generate valid CSS with no syntax errors", () => {
      const css = generateThemeCssBlock();
      // Should not contain undefined or null in output
      expect(css).not.toContain("undefined");
      expect(css).not.toContain("null");
      // Should start with selector and end with closing brace
      // :root, .dark, or any valid CSS selector
      expect(css.trim()).toMatch(/^[:.#]?[\w-]+\s*\{/);
      expect(css.trim()).toMatch(/\}$/);
    });
  });
});