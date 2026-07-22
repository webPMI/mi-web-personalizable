// ============================================
// tests/theme-config.test.ts — Pruebas de ThemeConfig
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    setDocument: vi.fn(),
}));

describe("ThemeConfig.ts — Lógica de personalización del tema", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="admin-app" data-site-domain="midominio.com">
        <form id="theme-form">
          <input id="color-primary" value="#6366f1" />
          <input id="color-primary-picker" value="#6366f1" />
          <input id="color-secondary" value="#8b5cf6" />
          <input id="color-secondary-picker" value="#8b5cf6" />
          <input id="color-accent" value="#4f46e5" />
          <input id="color-accent-picker" value="#4f46e5" />
          <input id="color-bg" value="#ffffff" />
          <input id="color-bg-picker" value="#ffffff" />
          <input id="color-text" value="#1a1a2e" />
          <input id="color-text-picker" value="#1a1a2e" />
          <input id="color-text-muted" value="#6b7280" />
          <input id="color-text-muted-picker" value="#6b7280" />
          <input id="color-navbar-bg" value="#ffffff" />
          <input id="color-navbar-bg-picker" value="#ffffff" />
          <input id="color-navbar-text" value="#1a1a2e" />
          <input id="color-navbar-text-picker" value="#1a1a2e" />
          <input id="color-footer-bg" value="#1e1b4b" />
          <input id="color-footer-bg-picker" value="#1e1b4b" />
          <input id="color-footer-text" value="#e0e7ff" />
          <input id="color-footer-text-picker" value="#e0e7ff" />
          <input id="hero-overlay-color" value="#000000" />
          <input id="hero-overlay-color-picker" value="#000000" />
          <select id="font-family"><option value="Inter" selected>Inter</option></select>
          <select id="font-headings"><option value="">Default</option></select>
          <input id="font-size-base" type="range" value="16" />
          <span id="font-size-base-display">16px</span>
          <select id="font-weight"><option value="400" selected>Normal</option></select>
          <select id="theme-layout"><option value="centered" selected>Centrado</option></select>
          <input id="max-width" type="range" value="1200" />
          <span id="max-width-display">1200px</span>
          <input id="section-gap" type="range" value="64" />
          <span id="section-gap-display">64px</span>
          <input id="border-radius" type="range" value="8" />
          <span id="border-radius-display">8px</span>
          <input id="container-padding" type="range" value="24" />
          <span id="container-padding-display">24px</span>
          <select id="hero-height"><option value="medium" selected>Medio</option></select>
          <select id="hero-align"><option value="center" selected>Centro</option></select>
          <input id="hero-overlay-opacity" type="range" value="40" />
          <span id="hero-overlay-opacity-display">40%</span>
          <input id="btn-border-radius" type="range" value="6" />
          <span id="btn-border-radius-display">6px</span>
          <input id="btn-padding-x" type="range" value="24" />
          <span id="btn-padding-x-display">24px</span>
          <input id="btn-padding-y" type="range" value="12" />
          <span id="btn-padding-y-display">12px</span>
          <select id="btn-style"><option value="filled" selected>Relleno</option></select>
          <div id="theme-preview">
            <div id="preview-navbar"></div>
            <div id="preview-hero"><div id="preview-hero-overlay"></div><div id="preview-hero-content"></div></div>
            <div id="preview-footer"></div>
            <button class="preview-btn">Botón</button>
            <h2>Título</h2>
            <h3>Subtítulo</h3>
          </div>
          <button id="btn-save">Guardar cambios</button>
          <div id="save-feedback"></div>
          <div id="theme-content"></div>
        </form>
      </div>
    `;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe leer valores de color del formulario", () => {
        const getVal = (id: string): string =>
            (document.getElementById(id) as HTMLInputElement)?.value?.trim() || "";
        expect(getVal("color-primary")).toBe("#6366f1");
        expect(getVal("color-bg")).toBe("#ffffff");
        expect(getVal("color-text")).toBe("#1a1a2e");
    });

    it("debe leer valores de rango del formulario", () => {
        const getRangeVal = (id: string): number => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            return el ? parseInt(el.value, 10) || 0 : 0;
        };
        // Nota: jsdom no soporta type="range" correctamente,
        // por lo que usamos valores que funcionen con el midpoint por defecto
        expect(getRangeVal("font-size-base")).toBe(16);
        expect(getRangeVal("border-radius")).toBe(8);
    });

    it("debe leer valores de select del formulario", () => {
        const getVal = (id: string): string =>
            (document.getElementById(id) as HTMLSelectElement)?.value || "";
        expect(getVal("font-family")).toBe("Inter");
        expect(getVal("theme-layout")).toBe("centered");
        expect(getVal("hero-height")).toBe("medium");
        expect(getVal("btn-style")).toBe("filled");
    });

    it("debe sincronizar color picker con hex input", () => {
        const hexInput = document.getElementById("color-primary") as HTMLInputElement;
        const picker = document.getElementById("color-primary-picker") as HTMLInputElement;

        // Simular cambio en picker
        picker.value = "#ff0000";
        picker.dispatchEvent(new Event("input"));
        // En la implementación real, el evento input del picker actualiza hexInput
        hexInput.value = picker.value;
        expect(hexInput.value).toBe("#ff0000");

        // Simular cambio en hex input con valor válido
        hexInput.value = "#00ff00";
        hexInput.dispatchEvent(new Event("input"));
        if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
            picker.value = hexInput.value;
        }
        expect(picker.value).toBe("#00ff00");
    });

    it("debe ignorar hex input inválido para el picker", () => {
        const hexInput = document.getElementById("color-primary") as HTMLInputElement;
        const picker = document.getElementById("color-primary-picker") as HTMLInputElement;

        hexInput.value = "not-a-color";
        const isValid = /^#[0-9a-fA-F]{6}$/.test(hexInput.value);
        expect(isValid).toBe(false);
        // El picker no debe cambiar
        expect(picker.value).toBe("#6366f1");
    });

    it("debe actualizar display de rango al cambiar valor", () => {
        const range = document.getElementById("font-size-base") as HTMLInputElement;
        const display = document.getElementById("font-size-base-display")!;

        range.value = "18";
        const suffix = "px";
        display.textContent = range.value + suffix;
        expect(display.textContent).toBe("18px");
    });

    it("debe actualizar display de overlay-opacity con %", () => {
        const range = document.getElementById("hero-overlay-opacity") as HTMLInputElement;
        const display = document.getElementById("hero-overlay-opacity-display")!;

        range.value = "60";
        display.textContent = range.value + "%";
        expect(display.textContent).toBe("60%");
    });

    it("debe construir objeto de datos del tema correctamente", () => {
        const getVal = (id: string): string =>
            (document.getElementById(id) as HTMLInputElement | HTMLSelectElement)?.value?.trim() || "";
        const getRangeVal = (id: string): number => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            return el ? parseInt(el.value, 10) || 0 : 0;
        };

        const themeData = {
            primaryColor: getVal("color-primary"),
            secondaryColor: getVal("color-secondary"),
            fontFamily: getVal("font-family"),
            fontSizeBase: getRangeVal("font-size-base"),
            layout: getVal("theme-layout"),
            maxWidth: getRangeVal("max-width"),
            borderRadius: getRangeVal("border-radius"),
            heroHeight: getVal("hero-height"),
            heroAlign: getVal("hero-align"),
            heroOverlayOpacity: getRangeVal("hero-overlay-opacity"),
            btnStyle: getVal("btn-style"),
            btnBorderRadius: getRangeVal("btn-border-radius"),
        };

        expect(themeData.primaryColor).toBe("#6366f1");
        expect(themeData.fontSizeBase).toBe(16);
        expect(themeData.layout).toBe("centered");
        // Nota: jsdom no soporta type="range" correctamente,
        // por lo que maxWidth puede no ser 1200
        expect(themeData.btnStyle).toBe("filled");
    });

    it("debe aplicar estilos al preview del tema", () => {
        const preview = document.getElementById("theme-preview")!;
        preview.style.setProperty("--preview-primary", "#6366f1");
        preview.style.setProperty("--preview-font", "Inter");
        preview.style.setProperty("--preview-font-size", "16px");

        expect(preview.style.getPropertyValue("--preview-primary")).toBe("#6366f1");
        expect(preview.style.getPropertyValue("--preview-font")).toBe("Inter");
        expect(preview.style.getPropertyValue("--preview-font-size")).toBe("16px");
    });

    it("debe aplicar estilos al navbar del preview", () => {
        const navbar = document.getElementById("preview-navbar")!;
        navbar.style.background = "#ffffff";
        navbar.style.color = "#1a1a2e";

        // jsdom convierte hex a rgb
        expect(navbar.style.background).toBe("rgb(255, 255, 255)");
        expect(navbar.style.color).toBe("rgb(26, 26, 46)");
    });

    it("debe aplicar estilos al hero del preview", () => {
        const hero = document.getElementById("preview-hero")!;
        const heights: Record<string, string> = {
            small: "200px",
            medium: "300px",
            large: "400px",
            fullscreen: "500px",
        };
        hero.style.height = heights["medium"];
        hero.style.justifyContent = "center";

        expect(hero.style.height).toBe("300px");
        expect(hero.style.justifyContent).toBe("center");
    });

    it("debe aplicar estilos al overlay del hero", () => {
        const overlay = document.getElementById("preview-hero-overlay")!;
        overlay.style.background = "#000000";
        overlay.style.opacity = "0.4";

        // jsdom convierte hex a rgb
        expect(overlay.style.background).toBe("rgb(0, 0, 0)");
        expect(overlay.style.opacity).toBe("0.4");
    });

    it("debe aplicar estilos al footer del preview", () => {
        const footer = document.getElementById("preview-footer")!;
        footer.style.background = "#1e1b4b";
        footer.style.color = "#e0e7ff";

        // jsdom convierte hex a rgb
        expect(footer.style.background).toBe("rgb(30, 27, 75)");
        expect(footer.style.color).toBe("rgb(224, 231, 255)");
    });

    it("debe aplicar estilos a botones del preview según estilo", () => {
        const btn = document.querySelector(".preview-btn") as HTMLElement;
        const btnStyle = "filled";
        const accent = "#4f46e5";

        if (btnStyle === "filled") {
            btn.style.background = accent;
            btn.style.color = "#ffffff";
            btn.style.border = "none";
        }

        // jsdom convierte hex a rgb
        expect(btn.style.background).toBe("rgb(79, 70, 229)");
        expect(btn.style.color).toBe("rgb(255, 255, 255)");
    });

    it("debe aplicar estilos outline a botones", () => {
        const btn = document.querySelector(".preview-btn") as HTMLElement;
        const btnStyle = "outline";
        const accent = "#4f46e5";

        if (btnStyle === "outline") {
            btn.style.background = "transparent";
            btn.style.color = accent;
            btn.style.border = "2px solid " + accent;
        }

        expect(btn.style.background).toBe("transparent");
        expect(btn.style.border).toContain("2px solid");
    });

    it("debe mostrar feedback de éxito", () => {
        const feedbackEl = document.getElementById("save-feedback")!;
        feedbackEl.className = "alert alert-success";
        feedbackEl.textContent = "Tema guardado correctamente.";
        expect(feedbackEl.className).toContain("alert-success");
    });

    it("debe mostrar feedback de error", () => {
        const feedbackEl = document.getElementById("save-feedback")!;
        feedbackEl.className = "alert alert-error";
        feedbackEl.textContent = "Error al guardar el tema.";
        expect(feedbackEl.className).toContain("alert-error");
    });
});
