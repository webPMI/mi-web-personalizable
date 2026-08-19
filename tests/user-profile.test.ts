// ============================================
// tests/user-profile.test.ts — UserProfile Logic
// ============================================
// Tests unitarios para src/components/admin/UserProfile.ts
// Actualizado para la implementación real (Fase 1, Sector Admin)
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mocks
// ============================================
const mockGetDocument = vi.fn();
const mockSetDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockSignOut = vi.fn();
const mockUpdatePassword = vi.fn();
const mockUpdateProfile = vi.fn();

// Mock barrel export (src/lib/firebase)
vi.mock("../src/lib/firebase", () => ({
    auth: {
        currentUser: null,
    },
    db: {},
    storage: {},
    default: {},
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Timestamp: {
            now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
        },
    };
});

// Mock firebase/auth
vi.mock("firebase/auth", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        signOut: (...args: any[]) => mockSignOut(...args),
        updatePassword: (...args: any[]) => mockUpdatePassword(...args),
        updateProfile: (...args: any[]) => mockUpdateProfile(...args),
    };
});

// Mock firestore helpers
vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: (...args: any[]) => mockGetDocument(...args),
    setDocument: (...args: any[]) => mockSetDocument(...args),
    updateDocument: (...args: any[]) => mockUpdateDocument(...args),
}));

// ============================================
// DOM Setup (coincide con profile.astro)
// ============================================
function setupProfileDOM(): void {
    document.body.innerHTML = `
    <div id="profile-loading">Cargando...</div>
    <form id="profile-form" class="hidden">
      <input id="profile-email" type="email" />
      <input id="profile-name" type="text" />
      <input id="profile-photo" type="url" />
      <input id="profile-password" type="password" />
      <input id="profile-password-confirm" type="password" />
      <div id="profile-feedback" class="hidden"></div>
      <button id="btn-profile-save">Guardar cambios</button>
      <button id="btn-profile-logout">Cerrar sesión</button>
    </form>
  `;
}

function createMockUser(overrides = {}): any {
    return {
        uid: "user-123",
        email: "test@example.com",
        displayName: "Test User",
        photoURL: "https://example.com/photo.jpg",
        ...overrides,
    };
}

/**
 * Dispara admin:ready con un usuario mock y espera a que loadProfile termine.
 */
async function initWithAdminReady(mockUser: any): Promise<void> {
    const authModule = await import("../src/lib/firebase");
    (authModule.auth as any).currentUser = mockUser;

    mockGetDocument.mockResolvedValue({
        success: true,
        data: {
            uid: mockUser.uid,
            email: mockUser.email,
            displayName: mockUser.displayName,
            photoURL: mockUser.photoURL,
        },
    });

    setupProfileDOM();

    const { initUserProfile } = await import("../src/components/admin/UserProfile");
    initUserProfile();

    // Disparar evento admin:ready en document (donde UserProfile.ts registra el listener)
    document.dispatchEvent(new CustomEvent("admin:ready", {
        detail: { siteDomain: "test.example.com", siteData: {} },
    }));

    await new Promise((r) => setTimeout(r, 100));
}

describe("UserProfile Module", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
    });

    describe("initUserProfile()", () => {
        it("should register admin:ready listener on init", async () => {
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = null;

            const addEventListenerSpy = vi.spyOn(document, "addEventListener");

            const { initUserProfile } = await import("../src/components/admin/UserProfile");
            initUserProfile();

            expect(addEventListenerSpy).toHaveBeenCalledWith("admin:ready", expect.any(Function));
        });

        it("should load profile after admin:ready event fires with valid user", async () => {
            const mockUser = createMockUser();
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = mockUser;

            mockGetDocument.mockResolvedValue({
                success: true,
                data: {
                    uid: "user-123",
                    email: "test@example.com",
                    displayName: "Test User",
                    photoURL: "https://example.com/photo.jpg",
                },
            });

            setupProfileDOM();

            const { initUserProfile } = await import("../src/components/admin/UserProfile");
            initUserProfile();

            document.dispatchEvent(new CustomEvent("admin:ready", {
                detail: { siteDomain: "test.example.com", siteData: {} },
            }));

            await new Promise((r) => setTimeout(r, 100));

            expect(mockGetDocument).toHaveBeenCalledWith("users", "user-123");
        });
    });

    describe("Profile loading", () => {
        it("should create profile if it does not exist in Firestore", async () => {
            const mockUser = createMockUser();
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = mockUser;

            mockGetDocument.mockResolvedValue({ success: false, error: "Not found" });
            mockSetDocument.mockResolvedValue({ success: true, data: { id: "user-123" } });

            await initWithAdminReady(mockUser);

            expect(mockSetDocument).toHaveBeenCalledWith("users", "user-123", expect.objectContaining({
                uid: "user-123",
                email: "test@example.com",
                displayName: "Test User",
                isActive: true,
            }));
        });

        it("should show form even on network error (graceful degradation)", async () => {
            const mockUser = createMockUser();
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = mockUser;

            mockGetDocument.mockRejectedValue(new Error("Network error"));

            setupProfileDOM();

            const { initUserProfile } = await import("../src/components/admin/UserProfile");
            initUserProfile();

            document.dispatchEvent(new CustomEvent("admin:ready", {
                detail: { siteDomain: "test.example.com", siteData: {} },
            }));

            await new Promise((r) => setTimeout(r, 100));

            const formEl = document.getElementById("profile-form");
            expect(formEl?.classList.contains("hidden")).toBe(false);
        });
    });

    describe("Form validation", () => {
        it("should show error feedback when displayName is empty on save", async () => {
            await initWithAdminReady(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "";

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 50));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.classList.contains("hidden")).toBe(false);
            expect(feedback?.textContent).toContain("nombre es obligatorio");
        });

        it("should show error feedback when password is less than 6 characters", async () => {
            await initWithAdminReady(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
            passwordInput.value = "123";

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 50));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.classList.contains("hidden")).toBe(false);
            expect(feedback?.textContent).toContain("6 caracteres");
        });

        it("should show error feedback when passwords do not match", async () => {
            await initWithAdminReady(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
            passwordInput.value = "password123";

            const passwordConfirmInput = document.getElementById("profile-password-confirm") as HTMLInputElement;
            passwordConfirmInput.value = "different";

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 50));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.classList.contains("hidden")).toBe(false);
            expect(feedback?.textContent).toContain("no coinciden");
        });
    });

    describe("Save profile", () => {
        it("should save profile to Firestore on submit", async () => {
            await initWithAdminReady(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Updated Name";

            const photoInput = document.getElementById("profile-photo") as HTMLInputElement;
            photoInput.value = "https://example.com/new-photo.jpg";

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });
            mockUpdateProfile.mockResolvedValue(undefined);

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 100));

            expect(mockUpdateDocument).toHaveBeenCalledWith("users", "user-123", expect.objectContaining({
                displayName: "Updated Name",
                photoURL: "https://example.com/new-photo.jpg",
            }));
        });

        it("should handle requires-recent-login error gracefully", async () => {
            await initWithAdminReady(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
            passwordInput.value = "newpassword123";

            const passwordConfirmInput = document.getElementById("profile-password-confirm") as HTMLInputElement;
            passwordConfirmInput.value = "newpassword123";

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });
            mockUpdateProfile.mockResolvedValue(undefined);
            mockUpdatePassword.mockRejectedValue({ code: "auth/requires-recent-login" });

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 100));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.textContent).toContain("volver a iniciar sesión");
            expect(feedback?.classList.contains("feedback-error")).toBe(true);
        });

        it("should show success feedback on save", async () => {
            await initWithAdminReady(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });
            mockUpdateProfile.mockResolvedValue(undefined);

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 100));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.textContent).toContain("guardados correctamente");
            expect(feedback?.classList.contains("feedback-success")).toBe(true);
        });
    });

    describe("Logout", () => {
        it("should call signOut via firebase/auth when logout button is clicked", async () => {
            await initWithAdminReady(createMockUser());

            const logoutBtn = document.getElementById("btn-profile-logout");
            logoutBtn?.click();

            expect(mockSignOut).toHaveBeenCalled();
        });
    });
});