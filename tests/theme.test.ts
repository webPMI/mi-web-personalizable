import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_THEME,
  resolveTheme,
  getThemeCssVariables,
  generateThemeCssBlock,
  applyThemeToElement,
} from "../src/lib/theme";

describe("Centralized Theme Module (theme.ts)", () => {
  it("should resolve theme with defaults when empty or partial theme is provided", () => {
    const resolved = resolveTheme({});

    expect(resolved.primaryColor).toBe(DEFAULT_THEME.primaryColor);
    expect(resolved.fontFamily).toBe(DEFAULT_THEME.fontFamily);
    expect(resolved.layout).toBe("centered");
  });

  it("should override defaults when custom theme properties are specified", () => {
    const custom = resolveTheme({
      primaryColor: "#10b981",
      fontFamily: "Roboto, sans-serif",
      layout: "full-width",
    });

    expect(custom.primaryColor).toBe("#10b981");
    expect(custom.fontFamily).toBe("Roboto, sans-serif");
    expect(custom.layout).toBe("full-width");
  });

  it("should generate CSS variables object with correct units and names", () => {
    const vars = getThemeCssVariables({
      primaryColor: "#ef4444",
      maxWidth: 1400,
    });

    expect(vars["--primary"]).toBe("#ef4444");
    expect(vars["--primary-color"]).toBe("#ef4444");
    expect(vars["--max-width"]).toBe("1400px");
  });

  it("should generate valid CSS block string for SSR / head injection", () => {
    const cssBlock = generateThemeCssBlock({ primaryColor: "#3b82f6" });

    expect(cssBlock).toContain(":root {");
    expect(cssBlock).toContain("--primary: #3b82f6;");
    expect(cssBlock).toContain("--primary-color: #3b82f6;");
  });

  it("should apply theme CSS variables to a DOM element via applyThemeToElement", () => {
    // Create a real DOM element (jsdom)
    const el = document.createElement("div");

    applyThemeToElement(el, {
      primaryColor: "#ff6600",
      fontFamily: "Georgia, serif",
      maxWidth: 800,
    });

    // Verify CSS custom properties were set
    expect(el.style.getPropertyValue("--primary")).toBe("#ff6600");
    expect(el.style.getPropertyValue("--primary-color")).toBe("#ff6600");
    expect(el.style.getPropertyValue("--font-family")).toBe("Georgia, serif");
    expect(el.style.getPropertyValue("--max-width")).toBe("800px");

    // Verify font-family was also applied directly to the element
    expect(el.style.fontFamily).toBe("Georgia, serif");
  });

  it("should handle null/undefined element in applyThemeToElement gracefully", () => {
    // Should not throw
    expect(() => applyThemeToElement(null as any)).not.toThrow();
    expect(() => applyThemeToElement(undefined as any)).not.toThrow();
  });

  it("should apply full-width max-width when layout is full-width", () => {
    const vars = getThemeCssVariables({ layout: "full-width" });
    expect(vars["--max-width"]).toBe("100%");
  });

  it("should handle zero values correctly (opacity, radius, padding)", () => {
    // Note: resolveTheme uses `||` for most numeric fields, so 0 is treated as falsy
    // and falls back to the default. Only fields using `??` (nullish coalescing)
    // preserve 0 values: heroOverlayOpacity, footerLinkOpacity, cardRadius,
    // lineHeight, headingLineHeight, btnBorderRadius, btnPaddingX, btnPaddingY,
    // navbarLinkOpacity, sectionGap, containerPadding
    // borderRadius uses `||` so 0 falls back to default (8px)
    const vars = getThemeCssVariables({
      heroOverlayOpacity: 0,
      borderRadius: 0,
      btnPaddingX: 0,
      btnPaddingY: 0,
    });

    expect(vars["--hero-overlay-opacity"]).toBe("0");
    // borderRadius uses `||` so 0 falls back to default
    expect(vars["--border-radius"]).toBe("8px");
    // btnPaddingX and btnPaddingY use `??` so 0 is preserved
    expect(vars["--btn-px"]).toBe("0px");
    expect(vars["--btn-py"]).toBe("0px");
  });
});
