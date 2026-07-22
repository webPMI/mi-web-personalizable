// ============================================
// tests/user-profile.test.ts — UserProfile Logic
// ============================================
// Tests unitarios para src/components/admin/UserProfile.ts
// - initUserProfile, loadProfile, fillProfileForm
// - Validación de contraseña, guardado de perfil
// - Manejo de errores de re-autenticación
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mocks
// ============================================
const mockGetDocument = vi.fn();
const mockSetDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockUpdatePassword = vi.fn();
const mockUpdateProfile = vi.fn();
const mockLogoutUser = vi.fn();

// Mock the barrel export (src/lib/firebase) to avoid Firebase initialization
vi.mock("../src/lib/firebase", () => ({
    auth: {
        currentUser: null,
    },
    db: {},
    storage: {},
    default: {},
}));

// Mock firebase/firestore preserving original exports
vi.mock("firebase/firestore", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        Timestamp: {
            now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
        },
    };
});

// Mock firebase/auth preserving original exports
vi.mock("firebase/auth", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as any),
        updatePassword: (...args: any[]) => mockUpdatePassword(...args),
        updateProfile: (...args: any[]) => mockUpdateProfile(...args),
    };
});

// Mock the firestore helpers
vi.mock("../src/lib/firebase/firestore", () => ({
    getDocument: (...args: any[]) => mockGetDocument(...args),
    setDocument: (...args: any[]) => mockSetDocument(...args),
    updateDocument: (...args: any[]) => mockUpdateDocument(...args),
}));

// Mock the auth helpers
vi.mock("../src/lib/firebase/auth", () => ({
    logoutUser: (...args: any[]) => mockLogoutUser(...args),
}));

// ============================================
// DOM Setup
// ============================================
function setupProfileDOM(): void {
    document.body.innerHTML = `
    <div id="profile-loading" class="">Cargando...</div>
    <form id="profile-form" class="hidden">
      <input id="profile-email" type="email" />
      <input id="profile-name" type="text" />
      <input id="profile-photo" type="url" />
      <input id="profile-password" type="password" />
      <input id="profile-password-confirm" type="password" />
      <div id="profile-feedback" class="hidden"></div>
      <button id="btn-profile-save">Guardar cambios</button>
      <button id="btn-profile-logout">Cerrar sesión</button>
      <div id="profile-name-error" class="field-error hidden">El nombre es obligatorio</div>
      <div id="profile-password-length-error" class="field-error hidden">Mínimo 6 caracteres</div>
      <div id="profile-password-match-error" class="field-error hidden">Las contraseñas no coinciden</div>
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
 * Helper: inicia el perfil con un usuario mock y espera a que cargue.
 */
async function initProfileWithUser(mockUser: any): Promise<void> {
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

    // Esperar a que loadProfile complete
    await new Promise((r) => setTimeout(r, 100));
}

describe("UserProfile Module", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
    });

    // ============================================
    // initUserProfile()
    // ============================================
    describe("initUserProfile()", () => {
        it("should call loadProfile if currentUser exists", async () => {
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

            await new Promise((r) => setTimeout(r, 100));

            expect(mockGetDocument).toHaveBeenCalledWith("users", "user-123");
        });

        it("should listen for admin:ready event if no currentUser", async () => {
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = null;

            const addEventListenerSpy = vi.spyOn(window, "addEventListener");

            const { initUserProfile } = await import("../src/components/admin/UserProfile");
            initUserProfile();

            expect(addEventListenerSpy).toHaveBeenCalledWith("admin:ready", expect.any(Function));
        });
    });

    // ============================================
    // Profile loading and creation
    // ============================================
    describe("Profile loading", () => {
        it("should create profile if it does not exist in Firestore", async () => {
            const mockUser = createMockUser();
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = mockUser;

            // No profile exists
            mockGetDocument.mockResolvedValue({ success: false, error: "Not found" });
            mockSetDocument.mockResolvedValue({ success: true, data: { id: "user-123" } });

            setupProfileDOM();

            const { initUserProfile } = await import("../src/components/admin/UserProfile");
            initUserProfile();

            await new Promise((r) => setTimeout(r, 100));

            expect(mockSetDocument).toHaveBeenCalledWith("users", "user-123", expect.objectContaining({
                uid: "user-123",
                email: "test@example.com",
                displayName: "Test User",
                isActive: true,
            }));
        });

        it("should fallback to auth data if Firestore fails", async () => {
            const mockUser = createMockUser();
            const authModule = await import("../src/lib/firebase");
            (authModule.auth as any).currentUser = mockUser;

            mockGetDocument.mockRejectedValue(new Error("Network error"));

            setupProfileDOM();

            const { initUserProfile } = await import("../src/components/admin/UserProfile");
            initUserProfile();

            await new Promise((r) => setTimeout(r, 100));

            const formEl = document.getElementById("profile-form");
            expect(formEl?.classList.contains("hidden")).toBe(false);
        });
    });

    // ============================================
    // Form validation
    // ============================================
    describe("Form validation", () => {
        it("should show error when displayName is empty on save", async () => {
            await initProfileWithUser(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "";

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 50));

            const nameError = document.getElementById("profile-name-error");
            expect(nameError?.classList.contains("hidden")).toBe(false);
        });

        it("should show error when password is less than 6 characters", async () => {
            await initProfileWithUser(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
            passwordInput.value = "123";

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 50));

            const pwLengthError = document.getElementById("profile-password-length-error");
            expect(pwLengthError?.classList.contains("hidden")).toBe(false);
        });

        it("should show error when passwords do not match", async () => {
            await initProfileWithUser(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
            passwordInput.value = "password123";

            const passwordConfirmInput = document.getElementById("profile-password-confirm") as HTMLInputElement;
            passwordConfirmInput.value = "different";

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 50));

            const pwMatchError = document.getElementById("profile-password-match-error");
            expect(pwMatchError?.classList.contains("hidden")).toBe(false);
        });

        it("should clear previous errors before new validation", async () => {
            await initProfileWithUser(createMockUser());

            // First submit with empty name (triggers error)
            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));
            await new Promise((r) => setTimeout(r, 50));

            // Second submit with valid data should clear errors
            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Valid Name";

            form.dispatchEvent(new Event("submit"));
            await new Promise((r) => setTimeout(r, 50));

            const nameError = document.getElementById("profile-name-error");
            expect(nameError?.classList.contains("hidden")).toBe(true);
        });
    });

    // ============================================
    // Save profile
    // ============================================
    describe("Save profile", () => {
        it("should save profile and update Firebase Auth profile", async () => {
            await initProfileWithUser(createMockUser());

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

        it("should handle requires-recent-login error for password change", async () => {
            await initProfileWithUser(createMockUser());

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
            expect(feedback?.classList.contains("alert-error")).toBe(true);
        });

        it("should handle weak-password error", async () => {
            await initProfileWithUser(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            // Must be >= 6 chars to pass frontend validation, but weak for Firebase
            const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
            passwordInput.value = "weakpw";

            const passwordConfirmInput = document.getElementById("profile-password-confirm") as HTMLInputElement;
            passwordConfirmInput.value = "weakpw";

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });
            mockUpdateProfile.mockResolvedValue(undefined);
            mockUpdatePassword.mockRejectedValue({ code: "auth/weak-password" });

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 100));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.textContent).toContain("6 caracteres");
        });

        it("should show success feedback on successful save", async () => {
            await initProfileWithUser(createMockUser());

            const nameInput = document.getElementById("profile-name") as HTMLInputElement;
            nameInput.value = "Test User";

            mockUpdateDocument.mockResolvedValue({ success: true, data: {} });
            mockUpdateProfile.mockResolvedValue(undefined);

            const form = document.getElementById("profile-form") as HTMLFormElement;
            form.dispatchEvent(new Event("submit"));

            await new Promise((r) => setTimeout(r, 100));

            const feedback = document.getElementById("profile-feedback");
            expect(feedback?.textContent).toContain("guardados correctamente");
            expect(feedback?.classList.contains("alert-success")).toBe(true);
        });
    });

    // ============================================
    // Logout
    // ============================================
    describe("Logout", () => {
        it("should call logoutUser when logout button is clicked", async () => {
            await initProfileWithUser(createMockUser());

            const logoutBtn = document.getElementById("btn-profile-logout");
            logoutBtn?.click();

            expect(mockLogoutUser).toHaveBeenCalled();
        });
    });
});
