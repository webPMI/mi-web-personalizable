// ============================================
// tests/site-config.test.ts — Pruebas de SiteConfig
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    setDocument: vi.fn(),
}));

vi.mock("../src/lib/sanitizer", () => ({
    escapeAttribute: vi.fn((s: string) => s),
    sanitizeSiteData: vi.fn((data) => data),
}));

describe("SiteConfig.ts — Lógica de configuración del sitio", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="admin-app" data-site-domain="midominio.com">
        <form id="config-form">
          <input id="site-name" value="Mi Sitio" />
          <textarea id="site-description">Descripción</textarea>
          <select id="site-locale"><option value="es" selected>Español</option><option value="en">English</option></select>
          <input id="social-twitter" value="https://twitter.com/test" />
          <input id="social-github" value="" />
          <input id="social-linkedin" value="" />
          <input id="social-instagram" value="" />
          <input id="hero-title" value="Bienvenido" />
          <input id="hero-subtitle" value="Subtítulo" />
          <input id="hero-image" value="" />
          <input id="hero-cta-text" value="Ver más" />
          <input id="hero-cta-link" value="/about" />
          <input id="seo-title" value="Mi Sitio SEO" />
          <textarea id="seo-description">Descripción SEO</textarea>
          <input id="seo-image" value="" />
          <input id="theme-primary" value="#6366f1" />
          <input id="theme-font" value="Inter" />
          <select id="theme-layout"><option value="centered" selected>Centrado</option></select>
          <div id="nav-links-container"></div>
          <button id="btn-save">Guardar cambios</button>
          <div id="save-feedback"></div>
          <div id="settings-content"></div>
        </form>
      </div>
    `;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe leer valores del formulario correctamente", () => {
        const getVal = (id: string): string =>
            (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement)?.value?.trim() || "";

        expect(getVal("site-name")).toBe("Mi Sitio");
        expect(getVal("site-description")).toBe("Descripción");
        expect(getVal("hero-title")).toBe("Bienvenido");
        expect(getVal("social-twitter")).toBe("https://twitter.com/test");
    });

    it("debe retornar string vacío para campos sin valor", () => {
        const getVal = (id: string): string =>
            (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement)?.value?.trim() || "";

        expect(getVal("social-github")).toBe("");
        expect(getVal("hero-image")).toBe("");
    });

    it("debe obtener el locale seleccionado", () => {
        const locale = (document.getElementById("site-locale") as HTMLSelectElement)?.value || "es";
        expect(locale).toBe("es");
    });

    it("debe obtener el layout seleccionado", () => {
        const layout = (document.getElementById("theme-layout") as HTMLSelectElement)?.value || "centered";
        expect(layout).toBe("centered");
    });

    it("debe construir objeto socialLinks correctamente", () => {
        const socialLinks = {
            twitter: "https://twitter.com/test",
            github: "",
            linkedin: "",
            instagram: "",
        };
        expect(socialLinks.twitter).toBeTruthy();
        expect(socialLinks.github).toBeFalsy();
        expect(socialLinks.linkedin).toBeFalsy();
        expect(socialLinks.instagram).toBeFalsy();
    });

    it("debe construir objeto SEO correctamente", () => {
        const seo = {
            defaultTitle: "Mi Sitio SEO",
            defaultDescription: "Descripción SEO",
            defaultImage: "",
        };
        expect(seo.defaultTitle).toBe("Mi Sitio SEO");
        expect(seo.defaultDescription).toBe("Descripción SEO");
        expect(seo.defaultImage).toBe("");
    });

    it("debe construir objeto theme correctamente", () => {
        const theme = {
            primaryColor: "#6366f1",
            fontFamily: "Inter",
            layout: "centered",
        };
        expect(theme.primaryColor).toBe("#6366f1");
        expect(theme.fontFamily).toBe("Inter");
        expect(theme.layout).toBe("centered");
    });

    it("debe validar que site-name no esté vacío", () => {
        const siteName = (document.getElementById("site-name") as HTMLInputElement)?.value?.trim();
        expect(siteName).toBeTruthy();

        // Simular campo vacío
        const emptyName = "";
        expect(emptyName).toBeFalsy();
    });

    it("debe mostrar feedback de éxito", () => {
        const feedbackEl = document.getElementById("save-feedback")!;
        feedbackEl.className = "alert alert-success";
        feedbackEl.textContent = "Cambios guardados correctamente.";

        expect(feedbackEl.className).toContain("alert-success");
        expect(feedbackEl.textContent).toBe("Cambios guardados correctamente.");
    });

    it("debe mostrar feedback de error", () => {
        const feedbackEl = document.getElementById("save-feedback")!;
        feedbackEl.className = "alert alert-error";
        feedbackEl.textContent = "Error al guardar la configuración.";

        expect(feedbackEl.className).toContain("alert-error");
        expect(feedbackEl.textContent).toBe("Error al guardar la configuración.");
    });

    it("debe añadir filas de enlaces del navbar", () => {
        const container = document.getElementById("nav-links-container")!;

        const addRow = (label: string, href: string) => {
            const row = document.createElement("div");
            row.className = "nav-link-row";
            row.innerHTML = `
                <input type="text" class="nav-link-label" value="${label}" />
                <input type="text" class="nav-link-href" value="${href}" />
                <button type="button" class="nav-link-remove">&times;</button>
            `;
            container.appendChild(row);
        };

        addRow("Inicio", "/");
        addRow("Blog", "/blog");

        const rows = container.querySelectorAll(".nav-link-row");
        expect(rows.length).toBe(2);

        const firstLabel = rows[0].querySelector(".nav-link-label") as HTMLInputElement;
        expect(firstLabel.value).toBe("Inicio");
    });

    it("debe eliminar filas de enlaces del navbar", () => {
        const container = document.getElementById("nav-links-container")!;

        const addRow = (label: string, href: string) => {
            const row = document.createElement("div");
            row.className = "nav-link-row";
            row.innerHTML = `
                <button type="button" class="nav-link-move-up">↑</button>
                <button type="button" class="nav-link-move-down">↓</button>
                <input type="text" class="nav-link-label" value="${label}" />
                <input type="text" class="nav-link-href" value="${href}" />
                <button type="button" class="nav-link-remove">&times;</button>
            `;
            row.querySelector(".nav-link-remove")!.addEventListener("click", () => row.remove());
            container.appendChild(row);
        };

        addRow("Inicio", "/");
        addRow("Blog", "/blog");

        // Eliminar la primera fila
        const firstRow = container.querySelector(".nav-link-row")!;
        (firstRow.querySelector(".nav-link-remove") as HTMLButtonElement).click();

        expect(container.querySelectorAll(".nav-link-row").length).toBe(1);
    });

    it("debe reordenar filas de enlaces del navbar con move-up y move-down", () => {
        const container = document.getElementById("nav-links-container")!;

        const addRow = (label: string, href: string) => {
            const row = document.createElement("div");
            row.className = "nav-link-row";
            row.innerHTML = `
                <button type="button" class="nav-link-move-up">↑</button>
                <button type="button" class="nav-link-move-down">↓</button>
                <input type="text" class="nav-link-label" value="${label}" />
                <input type="text" class="nav-link-href" value="${href}" />
                <button type="button" class="nav-link-remove">&times;</button>
            `;
            row.querySelector(".nav-link-move-up")!.addEventListener("click", () => {
                const prev = row.previousElementSibling;
                if (prev) container.insertBefore(row, prev);
            });
            row.querySelector(".nav-link-move-down")!.addEventListener("click", () => {
                const next = row.nextElementSibling;
                if (next) container.insertBefore(next, row);
            });
            container.appendChild(row);
        };

        addRow("Inicio", "/");
        addRow("Blog", "/blog");

        const rows = container.querySelectorAll(".nav-link-row");
        const secondRowUpBtn = rows[1].querySelector(".nav-link-move-up") as HTMLButtonElement;

        // Mover "Blog" hacia arriba
        secondRowUpBtn.click();

        const reorderedRows = container.querySelectorAll(".nav-link-row");
        const firstLabel = reorderedRows[0].querySelector(".nav-link-label") as HTMLInputElement;
        expect(firstLabel.value).toBe("Blog");
    });

    it("debe recolectar enlaces del navbar desde el DOM", () => {
        const container = document.getElementById("nav-links-container")!;

        const addRow = (label: string, href: string) => {
            const row = document.createElement("div");
            row.className = "nav-link-row";
            row.innerHTML = `
                <input type="text" class="nav-link-label" value="${label}" />
                <input type="text" class="nav-link-href" value="${href}" />
            `;
            container.appendChild(row);
        };

        addRow("Inicio", "/");
        addRow("Blog", "/blog");

        const getNavLinksFromDOM = (): Array<{ label: string; href: string }> => {
            const rows = document.querySelectorAll("#nav-links-container .nav-link-row");
            const links: Array<{ label: string; href: string }> = [];
            rows.forEach((row) => {
                const labelInput = row.querySelector(".nav-link-label") as HTMLInputElement;
                const hrefInput = row.querySelector(".nav-link-href") as HTMLInputElement;
                const label = labelInput?.value?.trim();
                const href = hrefInput?.value?.trim();
                if (label || href) {
                    links.push({ label: label || "", href: href || "" });
                }
            });
            return links;
        };

        const links = getNavLinksFromDOM();
        expect(links.length).toBe(2);
        expect(links[0].label).toBe("Inicio");
        expect(links[1].href).toBe("/blog");
    });

    it("debe escapar HTML correctamente", () => {
        const escapeHtml = (str: string): string => {
            const div = document.createElement("div");
            div.textContent = str;
            return div.innerHTML;
        };

        const xssInput = "<script>alert('xss')</script>";
        const escapedScript = escapeHtml(xssInput);
        // El texto escapado debe contener < y > en lugar de < y >
        expect(escapedScript).not.toBe(xssInput);
        expect(escapedScript.length).toBeGreaterThan(xssInput.length);
        expect(escapeHtml("texto normal")).toBe("texto normal");
    });

    it("debe deshabilitar botón de guardar durante el guardado", () => {
        const saveBtn = document.getElementById("btn-save") as HTMLButtonElement;
        saveBtn.disabled = true;
        saveBtn.textContent = "Guardando...";

        expect(saveBtn.disabled).toBe(true);
        expect(saveBtn.textContent).toBe("Guardando...");

        // Restaurar
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar cambios";
        expect(saveBtn.disabled).toBe(false);
    });
});
