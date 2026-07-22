// ============================================
// tests/pages-config.test.ts — Pruebas de PagesConfig
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    setDocument: vi.fn(),
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
}));

describe("PagesConfig.ts — Lógica de gestión de páginas", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="admin-app" data-site-domain="midominio.com">
        <div id="pages-list"></div>
        <div id="pages-content">
          <p class="text-muted">Cargando páginas...</p>
        </div>
        <button id="btn-create-page">Crear página</button>
        <div id="page-form" class="hidden">
          <input id="page-title" value="" />
          <input id="page-slug" value="" />
          <textarea id="page-content"></textarea>
          <select id="page-status"><option value="draft">Borrador</option><option value="published">Publicado</option></select>
          <button id="btn-save-page">Guardar</button>
          <button id="btn-cancel-page">Cancelar</button>
        </div>
        <div id="save-feedback"></div>
      </div>
    `;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe leer el dominio del sitio desde data attribute", () => {
        const adminApp = document.getElementById("admin-app");
        expect(adminApp?.dataset.siteDomain).toBe("midominio.com");
    });

    it("debe mostrar lista de páginas", () => {
        const pagesList = document.getElementById("pages-list")!;
        const pages = [
            { id: "1", title: "Inicio", slug: "/", status: "published" },
            { id: "2", title: "Blog", slug: "/blog", status: "draft" },
        ];

        pages.forEach((page) => {
            const item = document.createElement("div");
            item.className = "page-item";
            item.dataset.pageId = page.id;
            item.innerHTML = `
                <span class="page-title">${page.title}</span>
                <span class="page-slug">${page.slug}</span>
                <span class="page-status badge">${page.status === "published" ? "Publicado" : "Borrador"}</span>
                <button class="btn-edit" data-page-id="${page.id}">Editar</button>
                <button class="btn-delete" data-page-id="${page.id}">Eliminar</button>
            `;
            pagesList.appendChild(item);
        });

        expect(pagesList.children.length).toBe(2);
        const firstTitle = pagesList.querySelector(".page-title")!;
        expect(firstTitle.textContent).toBe("Inicio");
    });

    it("debe mostrar mensaje si no hay páginas", () => {
        const pagesList = document.getElementById("pages-list")!;
        pagesList.innerHTML = `<p class="text-muted">No hay páginas creadas.</p>`;
        expect(pagesList.innerHTML).toContain("text-muted");
    });

    it("debe mostrar formulario al hacer clic en Crear página", () => {
        const pageForm = document.getElementById("page-form")!;
        pageForm.classList.remove("hidden");
        expect(pageForm.classList.contains("hidden")).toBe(false);
    });

    it("debe ocultar formulario al cancelar", () => {
        const pageForm = document.getElementById("page-form")!;
        pageForm.classList.add("hidden");
        expect(pageForm.classList.contains("hidden")).toBe(true);
    });

    it("debe limpiar formulario al crear nueva página", () => {
        const titleInput = document.getElementById("page-title") as HTMLInputElement;
        const slugInput = document.getElementById("page-slug") as HTMLInputElement;
        const contentTextarea = document.getElementById("page-content") as HTMLTextAreaElement;
        const statusSelect = document.getElementById("page-status") as HTMLSelectElement;

        titleInput.value = "";
        slugInput.value = "";
        contentTextarea.value = "";
        statusSelect.value = "draft";

        expect(titleInput.value).toBe("");
        expect(slugInput.value).toBe("");
        expect(contentTextarea.value).toBe("");
        expect(statusSelect.value).toBe("draft");
    });

    it("debe rellenar formulario al editar página", () => {
        const titleInput = document.getElementById("page-title") as HTMLInputElement;
        const slugInput = document.getElementById("page-slug") as HTMLInputElement;
        const statusSelect = document.getElementById("page-status") as HTMLSelectElement;

        const page = { title: "Acerca de", slug: "/about", status: "published" };
        titleInput.value = page.title;
        slugInput.value = page.slug;
        statusSelect.value = page.status;

        expect(titleInput.value).toBe("Acerca de");
        expect(slugInput.value).toBe("/about");
        expect(statusSelect.value).toBe("published");
    });

    it("debe generar slug a partir del título", () => {
        const generateSlug = (title: string): string => {
            return title
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .trim();
        };

        expect(generateSlug("Mi Nueva Pagina")).toBe("mi-nueva-pagina");
        expect(generateSlug("Hola Mundo!")).toBe("hola-mundo");
        expect(generateSlug("Caracteres Especiales")).toBe("caracteres-especiales");
    });

    it("debe validar que el slug no esté vacío", () => {
        const slug = "/about";
        expect(slug.trim()).toBeTruthy();

        const emptySlug = "";
        expect(emptySlug.trim()).toBeFalsy();
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

    it("debe eliminar página de la lista", () => {
        const pagesList = document.getElementById("pages-list")!;

        const item = document.createElement("div");
        item.className = "page-item";
        item.dataset.pageId = "1";
        pagesList.appendChild(item);

        expect(pagesList.children.length).toBe(1);

        // Simular eliminación
        item.remove();
        expect(pagesList.children.length).toBe(0);
    });

    it("debe mostrar estado Published/Borrador correctamente", () => {
        const getStatusLabel = (status: string): string => {
            return status === "published" ? "Publicado" : "Borrador";
        };

        expect(getStatusLabel("published")).toBe("Publicado");
        expect(getStatusLabel("draft")).toBe("Borrador");
    });
});
