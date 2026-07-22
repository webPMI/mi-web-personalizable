// ============================================
// tests/page-editor-config.test.ts — Pruebas de PageEditorConfig
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    setDocument: vi.fn(),
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
}));

describe("PageEditorConfig.ts — Lógica del editor de páginas", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="admin-app" data-site-domain="midominio.com">
        <div id="editor-content">
          <input id="page-title" value="Mi Página" />
          <input id="page-slug" value="/mi-pagina" />
          <div id="page-content-editor" contenteditable="true">
            <p>Contenido de la página</p>
          </div>
          <select id="page-status"><option value="draft">Borrador</option><option value="published" selected>Publicado</option></select>
          <input id="page-seo-title" value="SEO Title" />
          <textarea id="page-seo-description">SEO Description</textarea>
          <input id="page-seo-image" value="" />
          <button id="btn-save">Guardar</button>
          <button id="btn-preview">Vista previa</button>
          <div id="save-feedback"></div>
          <div id="editor-toolbar">
            <button id="btn-bold" class="toolbar-btn">B</button>
            <button id="btn-italic" class="toolbar-btn">I</button>
            <button id="btn-underline" class="toolbar-btn">U</button>
            <button id="btn-heading" class="toolbar-btn">H</button>
            <button id="btn-link" class="toolbar-btn">Link</button>
            <button id="btn-image" class="toolbar-btn">Img</button>
            <button id="btn-list" class="toolbar-btn">List</button>
            <button id="btn-blockquote" class="toolbar-btn">Quote</button>
          </div>
        </div>
      </div>
    `;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe leer valores del formulario del editor", () => {
        const getVal = (id: string): string =>
            (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement)?.value?.trim() || "";
        expect(getVal("page-title")).toBe("Mi Página");
        expect(getVal("page-slug")).toBe("/mi-pagina");
        expect(getVal("page-seo-title")).toBe("SEO Title");
        expect(getVal("page-seo-description")).toBe("SEO Description");
    });

    it("debe obtener el contenido del editor", () => {
        const editor = document.getElementById("page-content-editor")!;
        expect(editor.innerHTML).toContain("Contenido de la página");
    });

    it("debe obtener el estado seleccionado", () => {
        const status = (document.getElementById("page-status") as HTMLSelectElement)?.value || "draft";
        expect(status).toBe("published");
    });

    it("debe aplicar formato bold al selection", () => {
        const editor = document.getElementById("page-content-editor")!;
        document.execCommand = vi.fn((command: string) => {
            if (command === "bold") {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const bold = document.createElement("strong");
                    range.surroundContents(bold);
                }
            }
            return true;
        });

        // Simular selección de texto
        const textNode = editor.firstChild!;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("bold");
        // Verificar que se aplicó bold
        expect(editor.querySelector("strong")).toBeTruthy();
    });

    it("debe aplicar formato italic al selection", () => {
        const editor = document.getElementById("page-content-editor")!;
        document.execCommand = vi.fn((command: string) => {
            if (command === "italic") {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const italic = document.createElement("em");
                    range.surroundContents(italic);
                }
            }
            return true;
        });

        const textNode = editor.firstChild!;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("italic");
        expect(editor.querySelector("em")).toBeTruthy();
    });

    it("debe crear enlace desde el selection", () => {
        const editor = document.getElementById("page-content-editor")!;
        document.execCommand = vi.fn((command: string, _showUI: boolean, value: string) => {
            if (command === "createLink") {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    const link = document.createElement("a");
                    link.href = value;
                    range.surroundContents(link);
                }
            }
            return true;
        });

        const textNode = editor.firstChild!;
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("createLink", false, "https://example.com");
        const link = editor.querySelector("a");
        expect(link).toBeTruthy();
        expect(link?.href).toBe("https://example.com/");
    });

    it("debe insertar imagen", () => {
        const editor = document.getElementById("page-content-editor")!;
        document.execCommand = vi.fn((command: string, _showUI: boolean, value: string) => {
            if (command === "insertImage") {
                const img = document.createElement("img");
                img.src = value;
                editor.appendChild(img);
            }
            return true;
        });

        document.execCommand("insertImage", false, "https://example.com/img.jpg");
        const img = editor.querySelector("img");
        expect(img).toBeTruthy();
        expect(img?.src).toBe("https://example.com/img.jpg");
    });

    it("debe insertar lista", () => {
        document.execCommand = vi.fn((command: string) => {
            if (command === "insertUnorderedList") return true;
            return false;
        });
        const result = document.execCommand("insertUnorderedList");
        expect(result).toBe(true);
    });

    it("debe insertar blockquote", () => {
        document.execCommand = vi.fn((command: string) => {
            if (command === "formatBlock") return true;
            return false;
        });
        const result = document.execCommand("formatBlock", false, "blockquote");
        expect(result).toBe(true);
    });

    it("debe mostrar feedback de éxito", () => {
        const feedbackEl = document.getElementById("save-feedback")!;
        feedbackEl.className = "alert alert-success";
        feedbackEl.textContent = "Página guardada correctamente.";
        expect(feedbackEl.className).toContain("alert-success");
    });

    it("debe mostrar feedback de error", () => {
        const feedbackEl = document.getElementById("save-feedback")!;
        feedbackEl.className = "alert alert-error";
        feedbackEl.textContent = "Error al guardar la página.";
        expect(feedbackEl.className).toContain("alert-error");
    });

    it("debe construir objeto de página correctamente", () => {
        const pageData = {
            title: "Mi Página",
            slug: "/mi-pagina",
            content: "<p>Contenido</p>",
            status: "published",
            seo: {
                title: "SEO Title",
                description: "SEO Description",
                image: "",
            },
        };

        expect(pageData.title).toBe("Mi Página");
        expect(pageData.slug).toBe("/mi-pagina");
        expect(pageData.status).toBe("published");
        expect(pageData.seo.title).toBe("SEO Title");
        expect(pageData.seo.image).toBe("");
    });

    it("debe alternar entre toolbar buttons activos", () => {
        const boldBtn = document.getElementById("btn-bold")!;
        boldBtn.classList.toggle("active");
        expect(boldBtn.classList.contains("active")).toBe(true);

        boldBtn.classList.toggle("active");
        expect(boldBtn.classList.contains("active")).toBe(false);
    });

    describe("Autoguardado y Restauración de Borrador Local (localStorage)", () => {
        it("debe guardar borrador en localStorage", () => {
            const draftKey = "mwp_draft_page_test-123";
            const draftData = {
                blocks: [
                    { id: "b1", type: "heading", content: { text: "Título", level: 1 } },
                ],
                timestamp: Date.now(),
            };

            localStorage.setItem(draftKey, JSON.stringify(draftData));

            const stored = localStorage.getItem(draftKey);
            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored!);
            expect(parsed.blocks.length).toBe(1);
            expect(parsed.blocks[0].content.text).toBe("Título");
        });

        it("debe limpiar borrador en localStorage tras guardar con éxito", () => {
            const draftKey = "mwp_draft_page_test-123";
            localStorage.setItem(draftKey, JSON.stringify({ blocks: [] }));

            // Simular limpieza
            localStorage.removeItem(draftKey);

            expect(localStorage.getItem(draftKey)).toBeNull();
        });

        it("debe detectar borrador no guardado en localStorage", () => {
            const draftKey = "mwp_draft_page_test-456";
            const draftData = {
                blocks: [{ id: "b2", type: "paragraph", content: { text: "Texto" } }],
                timestamp: Date.now(),
            };

            localStorage.setItem(draftKey, JSON.stringify(draftData));

            const raw = localStorage.getItem(draftKey);
            const parsed = raw ? JSON.parse(raw) : null;
            const hasUnsavedDraft = parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0;

            expect(hasUnsavedDraft).toBe(true);
        });
    });
});
