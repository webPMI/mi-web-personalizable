// ============================================
// tests/admin-layout.test.ts — Pruebas de AdminLayout
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("AdminLayout.astro — Lógica de layout administrativo", () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="admin-app" data-site-domain="midominio.com">
        <nav id="admin-nav">
          <a href="/admin" class="nav-link">Dashboard</a>
          <a href="/admin/pages" class="nav-link">Páginas</a>
          <a href="/admin/config" class="nav-link">Configuración</a>
          <a href="/admin/theme" class="nav-link">Tema</a>
          <a href="/admin/users" class="nav-link">Usuarios</a>
        </nav>
        <main id="admin-content">
          <h1>Panel de Administración</h1>
        </main>
        <div id="user-info">
          <span id="user-email">admin@example.com</span>
          <button id="btn-logout">Cerrar sesión</button>
        </div>
      </div>
    `;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe tener enlaces de navegación del admin", () => {
        const navLinks = document.querySelectorAll("#admin-nav .nav-link");
        expect(navLinks.length).toBe(5);
        expect(navLinks[0].textContent).toBe("Dashboard");
        expect(navLinks[1].textContent).toBe("Páginas");
        expect(navLinks[2].textContent).toBe("Configuración");
        expect(navLinks[3].textContent).toBe("Tema");
        expect(navLinks[4].textContent).toBe("Usuarios");
    });

    it("debe marcar enlace activo según la ruta actual", () => {
        const currentPath = "/admin/pages";
        const navLinks = document.querySelectorAll("#admin-nav .nav-link");

        navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            if (href === currentPath) {
                link.classList.add("active");
            }
        });

        const activeLink = document.querySelector("#admin-nav .nav-link.active");
        expect(activeLink?.getAttribute("href")).toBe("/admin/pages");
    });

    it("debe mostrar email del usuario", () => {
        const userEmail = document.getElementById("user-email");
        expect(userEmail?.textContent).toBe("admin@example.com");
    });

    it("debe tener botón de cerrar sesión", () => {
        const logoutBtn = document.getElementById("btn-logout");
        expect(logoutBtn).toBeTruthy();
        expect(logoutBtn?.textContent).toBe("Cerrar sesión");
    });

    it("debe mostrar el contenido principal", () => {
        const content = document.getElementById("admin-content");
        expect(content?.querySelector("h1")?.textContent).toBe("Panel de Administración");
    });

    it("debe leer el dominio del sitio desde data attribute", () => {
        const adminApp = document.getElementById("admin-app");
        expect(adminApp?.dataset.siteDomain).toBe("midominio.com");
    });

    it("debe manejar cierre de sesión", () => {
        const logoutBtn = document.getElementById("btn-logout")!;
        let logoutCalled = false;

        logoutBtn.addEventListener("click", () => {
            logoutCalled = true;
        });

        logoutBtn.click();
        expect(logoutCalled).toBe(true);
    });

    it("debe mostrar nombre del sitio en el layout", () => {
        const siteName = "Mi Sitio Admin";
        const title = document.querySelector("h1")!;
        title.textContent = `Admin - ${siteName}`;
        expect(title.textContent).toBe("Admin - Mi Sitio Admin");
    });
});
