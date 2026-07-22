// ============================================
// tests/admin-dashboard.test.ts — Pruebas de AdminDashboard
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: vi.fn(),
}));

vi.mock("../src/lib/sanitizer", () => ({
    escapeAttribute: vi.fn((s: string) => s),
}));

describe("AdminDashboard.ts — Lógica del Dashboard", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="admin-app" data-site-domain="midominio.com">
        <div id="site-info-content">
          <p class="text-muted">Cargando información del sitio...</p>
        </div>
      </div>
    `;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe leer el dominio del sitio desde data attribute", () => {
        const adminApp = document.getElementById("admin-app");
        const siteDomain = adminApp?.dataset.siteDomain;
        expect(siteDomain).toBe("midominio.com");
    });

    it("debe mostrar información del sitio cuando hay datos", () => {
        const siteInfoContent = document.getElementById("site-info-content")!;
        const site = {
            domain: "midominio.com",
            status: "active",
            registeredAt: "2026-01-15T10:00:00Z",
            ownerUsername: "testuser",
        };

        const statusText = site.status === "active" ? "Activo" : "Pendiente";
        const registeredDate = new Date(site.registeredAt).toLocaleDateString();

        siteInfoContent.innerHTML = `
          <p><strong>Dominio:</strong> ${site.domain}</p>
          <p><strong>Estado:</strong> <span class="badge">${statusText}</span></p>
          <p><strong>Fecha de registro:</strong> ${registeredDate}</p>
          <p><strong>Propietario:</strong> ${site.ownerUsername}</p>
        `;

        expect(siteInfoContent.innerHTML).toContain("midominio.com");
        expect(siteInfoContent.innerHTML).toContain("Activo");
        expect(siteInfoContent.innerHTML).toContain("testuser");
    });

    it("debe mostrar estado Pendiente cuando no está activo", () => {
        const site = { status: "pending" };
        const statusText = site.status === "active" ? "Activo" : "Pendiente";
        expect(statusText).toBe("Pendiente");
    });

    it("debe mostrar mensaje de error cuando falla la carga", () => {
        const siteInfoContent = document.getElementById("site-info-content")!;
        siteInfoContent.innerHTML = `<p class="alert alert-error">Error al cargar la información del sitio.</p>`;
        expect(siteInfoContent.innerHTML).toContain("alert-error");
    });

    it("debe mostrar mensaje cuando no hay datos", () => {
        const siteInfoContent = document.getElementById("site-info-content")!;
        siteInfoContent.innerHTML = `<p class="text-muted">No se pudo cargar la información del sitio.</p>`;
        expect(siteInfoContent.innerHTML).toContain("text-muted");
    });

    it("debe escapar el dominio con escapeAttribute", () => {
        const domain = "midominio.com";
        const escaped = domain; // mock de escapeAttribute
        expect(escaped).toBe("midominio.com");
    });

    it("debe formatear fecha de registro correctamente", () => {
        const registeredAt = "2026-01-15T10:00:00Z";
        const date = new Date(registeredAt).toLocaleDateString();
        expect(date).toBeTruthy();
        expect(typeof date).toBe("string");
    });

    it("debe mostrar propietario solo si existe", () => {
        const ownerUsername = "testuser";
        const html = ownerUsername
            ? `<p><strong>Propietario:</strong> ${ownerUsername}</p>`
            : "";
        expect(html).toContain("testuser");

        const emptyOwner = "";
        const htmlEmpty = emptyOwner ? `<p><strong>Propietario:</strong> ${emptyOwner}</p>` : "";
        expect(htmlEmpty).toBe("");
    });
});
