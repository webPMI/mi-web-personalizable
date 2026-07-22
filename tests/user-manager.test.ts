// ============================================
// tests/user-manager.test.ts — UserManager Logic
// ============================================
// Tests unitarios para src/components/admin/UserManager.ts
// - initUserManager, loadMembers, renderMembersTable
// - Invitación de miembros, cambio de roles
// - Toggle activo/inactivo, eliminación
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mocks
// ============================================
const mockGetDocument = vi.fn();
const mockSetDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();
const mockListDocuments = vi.fn();

vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: (...args: any[]) => mockGetDocument(...args),
    setDocument: (...args: any[]) => mockSetDocument(...args),
    updateDocument: (...args: any[]) => mockUpdateDocument(...args),
    deleteDocument: (...args: any[]) => mockDeleteDocument(...args),
    listDocuments: (...args: any[]) => mockListDocuments(...args),
}));

vi.mock("../src/lib/firebase", () => ({
    auth: {
        currentUser: null,
    },
}));

vi.mock("firebase/firestore", () => ({
    Timestamp: {
        now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
    },
}));

// ============================================
// DOM Setup
// ============================================
function setupUserManagerDOM(siteDomain = "test-site.com", siteData?: any): void {
    document.body.innerHTML = `
    <div id="admin-app" data-site-domain="${siteDomain}" data-site-data='${JSON.stringify(siteData || { ownerId: "owner-1" })}'>
      <div id="users-loading" class="">Cargando...</div>
      <div id="users-table-container" class="hidden">
        <table>
          <tbody id="users-table-body"></tbody>
        </table>
      </div>
      <div id="users-empty" class="hidden">No hay miembros</div>
      <div id="users-feedback" class="hidden"></div>
      <button id="btn-invite-user">Invitar</button>
      <div id="invite-form-container" class="hidden">
        <input id="invite-email" type="email" />
        <select id="invite-role">
          <option value="admin">Admin</option>
          <option value="editor" selected>Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button id="btn-invite-send">Enviar invitación</button>
        <button id="btn-invite-cancel">Cancelar</button>
        <div id="invite-feedback" class="hidden"></div>
        <div id="invite-email-error" class="hidden">Email requerido</div>
      </div>
    </div>
  `;
}

function createMockMembers(): any[] {
    return [
        {
            uid: "owner-1",
            email: "owner@test.com",
            displayName: "Site Owner",
            photoURL: "",
            role: "admin",
            invitedBy: "owner-1",
            invitedAt: { seconds: 1000, nanoseconds: 0 },
            isActive: true,
        },
        {
            uid: "editor-1",
            email: "editor@test.com",
            displayName: "Editor User",
            photoURL: "https://example.com/editor.jpg",
            role: "editor",
            invitedBy: "owner-1",
            invitedAt: { seconds: 1001, nanoseconds: 0 },
            isActive: true,
        },
        {
            uid: "viewer-1",
            email: "viewer@test.com",
            displayName: "Viewer User",
            photoURL: "",
            role: "viewer",
            invitedBy: "owner-1",
            invitedAt: { seconds: 1002, nanoseconds: 0 },
            isActive: false,
        },
    ];
}

describe("UserManager Module", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
    });

    // ============================================
    // initUserManager()
    // ============================================
    describe("initUserManager()", () => {
        it("should call setupUserManager if admin-app has siteDomain", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            expect(mockListDocuments).toHaveBeenCalledWith("sites/test-site.com/members");
        });

        it("should listen for admin:ready event if no siteDomain", async () => {
            document.body.innerHTML = `<div id="admin-app"></div>`;

            const addEventListenerSpy = vi.spyOn(window, "addEventListener");

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            expect(addEventListenerSpy).toHaveBeenCalledWith("admin:ready", expect.any(Function));
        });
    });

    // ============================================
    // loadMembers()
    // ============================================
    describe("loadMembers()", () => {
        it("should render members table when members exist", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "editor-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            const tableBody = document.getElementById("users-table-body");
            expect(tableBody?.children.length).toBeGreaterThan(0);
            expect(tableBody?.innerHTML).toContain("Site Owner");
            expect(tableBody?.innerHTML).toContain("Editor User");
            expect(tableBody?.innerHTML).toContain("Viewer User");
        });

        it("should show empty state when no members exist", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: [],
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            const emptyEl = document.getElementById("users-empty");
            expect(emptyEl?.classList.contains("hidden")).toBe(false);
        });

        it("should show error feedback on Firestore failure", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockRejectedValue(new Error("Network error"));

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            const feedback = document.getElementById("users-feedback");
            expect(feedback?.textContent).toContain("Error al cargar");
        });
    });

    // ============================================
    // Invite UI
    // ============================================
    describe("Invite UI", () => {
        it("should toggle invite form visibility on button click", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            // Configurar __loadUserRole para que devuelva "admin"
            (window as any).__loadUserRole = vi.fn().mockResolvedValue("admin");

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            const formContainer = document.getElementById("invite-form-container");
            expect(formContainer?.classList.contains("hidden")).toBe(true);

            const btnInvite = document.getElementById("btn-invite-user");
            btnInvite?.click();

            expect(formContainer?.classList.contains("hidden")).toBe(false);
        });

        it("should hide invite form on cancel", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            // Configurar __loadUserRole para que devuelva "admin"
            (window as any).__loadUserRole = vi.fn().mockResolvedValue("admin");

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // First show the form
            const btnInvite = document.getElementById("btn-invite-user");
            btnInvite?.click();

            // Then cancel
            const btnCancel = document.getElementById("btn-invite-cancel");
            btnCancel?.click();

            const formContainer = document.getElementById("invite-form-container");
            expect(formContainer?.classList.contains("hidden")).toBe(true);
        });
    });

    // ============================================
    // Invite send
    // ============================================
    describe("Invite send", () => {
        it("should show error when email is empty", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            // Configurar __loadUserRole para que devuelva "admin"
            (window as any).__loadUserRole = vi.fn().mockResolvedValue("admin");

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // Show form
            const btnInvite = document.getElementById("btn-invite-user");
            btnInvite?.click();

            // Click send with empty email
            const btnSend = document.getElementById("btn-invite-send");
            btnSend?.click();

            await new Promise((r) => setTimeout(r, 50));

            const emailError = document.getElementById("invite-email-error");
            expect(emailError?.classList.contains("hidden")).toBe(false);
        });

        it("should send invite and reload members on success", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            // Configurar __loadUserRole para que devuelva "admin"
            (window as any).__loadUserRole = vi.fn().mockResolvedValue("admin");

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            // First call returns members, second call returns updated members
            mockListDocuments
                .mockResolvedValueOnce({
                    success: true,
                    data: createMockMembers(),
                })
                .mockResolvedValueOnce({
                    success: true,
                    data: [...createMockMembers(), {
                        uid: "new@user.com",
                        email: "new@user.com",
                        displayName: "new",
                        role: "editor",
                        invitedBy: "owner-1",
                        invitedAt: { seconds: 2000, nanoseconds: 0 },
                        isActive: true,
                    }],
                });

            mockSetDocument.mockResolvedValue({ success: true, data: {} });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // Show form and fill email
            const btnInvite = document.getElementById("btn-invite-user");
            btnInvite?.click();

            const emailInput = document.getElementById("invite-email") as HTMLInputElement;
            emailInput.value = "new@user.com";

            // Send invite
            const btnSend = document.getElementById("btn-invite-send");
            btnSend?.click();

            await new Promise((r) => setTimeout(r, 50));

            // Should have called setDocument to create member
            expect(mockSetDocument).toHaveBeenCalledWith(
                "sites/test-site.com/members",
                "new@user.com",
                expect.objectContaining({
                    email: "new@user.com",
                    role: "editor",
                })
            );
        });

        it("should detect duplicate member by email", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            // Configurar __loadUserRole para que devuelva "admin"
            (window as any).__loadUserRole = vi.fn().mockResolvedValue("admin");

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // Show form and fill with existing email
            const btnInvite = document.getElementById("btn-invite-user");
            btnInvite?.click();

            const emailInput = document.getElementById("invite-email") as HTMLInputElement;
            emailInput.value = "editor@test.com";

            const btnSend = document.getElementById("btn-invite-send");
            btnSend?.click();

            await new Promise((r) => setTimeout(r, 50));

            const feedback = document.getElementById("invite-feedback");
            expect(feedback?.textContent).toContain("ya es miembro");
        });
    });

    // ============================================
    // Role change
    // ============================================
    describe("Role change", () => {
        it("should update role via Firestore when select changes", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });

            // Mock confirm to auto-accept
            const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // Find the role select for editor-1 and change it
            const roleSelect = document.querySelector('.role-select[data-uid="editor-1"]') as HTMLSelectElement;
            if (roleSelect) {
                roleSelect.value = "admin";
                roleSelect.dispatchEvent(new Event("change"));
            }

            await new Promise((r) => setTimeout(r, 50));

            expect(mockUpdateDocument).toHaveBeenCalledWith(
                "sites/test-site.com/members",
                "editor-1",
                { role: "admin" }
            );

            confirmSpy.mockRestore();
        });
    });

    // ============================================
    // Toggle active/inactive
    // ============================================
    describe("Toggle active status", () => {
        it("should toggle member active status", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // Click toggle on viewer-1 (currently inactive)
            const toggleBtn = document.querySelector('.toggle-btn[data-uid="viewer-1"]') as HTMLButtonElement;
            if (toggleBtn) {
                toggleBtn.click();
            }

            await new Promise((r) => setTimeout(r, 50));

            expect(mockUpdateDocument).toHaveBeenCalledWith(
                "sites/test-site.com/members",
                "viewer-1",
                { isActive: true }
            );
        });
    });

    // ============================================
    // Remove member
    // ============================================
    describe("Remove member", () => {
        it("should remove member and update table", async () => {
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "owner-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: createMockMembers(),
            });

            mockDeleteDocument.mockResolvedValue({ success: true, data: {} });

            // Mock confirm to auto-accept
            const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

            const { initUserManager } = await import("../src/components/admin/UserManager");
            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            // Click remove on editor-1
            const removeBtn = document.querySelector('.btn-remove-member[data-uid="editor-1"]') as HTMLButtonElement;
            if (removeBtn) {
                removeBtn.click();
            }

            await new Promise((r) => setTimeout(r, 50));

            expect(mockDeleteDocument).toHaveBeenCalledWith(
                "sites/test-site.com/members",
                "editor-1"
            );

            confirmSpy.mockRestore();
        });
    });

    // ============================================
    // Helpers
    // ============================================
    describe("Helper functions", () => {
        it("should generate initials from name", async () => {
            // Import the module to test helpers indirectly
            const { initUserManager } = await import("../src/components/admin/UserManager");

            // The getInitials function is not exported, but we can test it
            // through the renderMembersTable which uses it for members without photoURL
            setupUserManagerDOM("test-site.com", { ownerId: "owner-1" });

            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = { uid: "editor-1" };

            mockListDocuments.mockResolvedValue({
                success: true,
                data: [{
                    uid: "no-photo-1",
                    email: "john.doe@test.com",
                    displayName: "John Doe",
                    photoURL: "",
                    role: "editor",
                    invitedBy: "owner-1",
                    invitedAt: { seconds: 1000, nanoseconds: 0 },
                    isActive: true,
                }],
            });

            initUserManager();

            await new Promise((r) => setTimeout(r, 50));

            const tableBody = document.getElementById("users-table-body");
            expect(tableBody?.innerHTML).toContain("JD");
        });
    });
});
