// ============================================
// tests/auth-full.test.ts — Pruebas completas de Firebase Auth helpers
// Importa directamente de src/lib/firebase/auth.ts con mocks
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mocks de Firebase Auth y Firestore
// ============================================

const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockUpdateProfile = vi.fn();
const mockGoogleAuthProvider = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockTimestamp = { now: () => ({ seconds: 123, nanoseconds: 456 }) };

vi.mock("firebase/auth", () => ({
    createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
    signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
    signOut: (...args: any[]) => mockSignOut(...args),
    onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
    sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
    updateProfile: (...args: any[]) => mockUpdateProfile(...args),
    GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
    signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
}));

vi.mock("firebase/firestore", () => ({
    doc: vi.fn(() => "mock-doc-ref"),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    Timestamp: { now: () => ({ seconds: 123, nanoseconds: 456 }) },
}));

// Mock del módulo firebase.ts que exporta auth y db
vi.mock("../src/lib/firebase", () => ({
    auth: {
        currentUser: null,
    },
    db: "mock-db",
}));

// ============================================
// Importar DESPUÉS de los mocks
// ============================================
import {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getCurrentUser,
    getIdToken,
    loginWithGoogle,
    getAuthErrorMessage,
} from "../src/lib/firebase/auth";

describe("Firebase Auth — registerUser()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe registrar un usuario y crear perfil en Firestore", async () => {
        const mockUser = {
            uid: "user-123",
            email: "test@example.com",
            displayName: null,
            photoURL: null,
            getIdToken: vi.fn(),
        };

        mockCreateUserWithEmailAndPassword.mockResolvedValue({
            user: mockUser,
        });
        mockUpdateProfile.mockResolvedValue(undefined);
        mockSetDoc.mockResolvedValue(undefined);

        const result = await registerUser("test@example.com", "password123", "Test User");

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.user?.uid).toBe("user-123");
        }
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            "test@example.com",
            "password123"
        );
        expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: "Test User" });
        expect(mockSetDoc).toHaveBeenCalledWith("mock-doc-ref", expect.objectContaining({
            uid: "user-123",
            email: "test@example.com",
            displayName: "Test User",
            isActive: true,
        }));
    });

    it("debe manejar error de email ya en uso", async () => {
        mockCreateUserWithEmailAndPassword.mockRejectedValue({
            code: "auth/email-already-in-use",
        });

        const result = await registerUser("existing@example.com", "password123", "Test");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Ya existe una cuenta con este correo electrónico.");
        }
    });

    it("debe manejar error de contraseña débil", async () => {
        mockCreateUserWithEmailAndPassword.mockRejectedValue({
            code: "auth/weak-password",
        });

        const result = await registerUser("test@example.com", "123", "Test");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("La contraseña debe tener al menos 6 caracteres.");
        }
    });

    it("debe manejar error de red", async () => {
        mockCreateUserWithEmailAndPassword.mockRejectedValue({
            code: "auth/network-request-failed",
        });

        const result = await registerUser("test@example.com", "password123", "Test");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("Error de conexión");
        }
    });
});

describe("Firebase Auth — loginUser()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe iniciar sesión correctamente", async () => {
        const mockUser = { uid: "user-123", email: "test@example.com" };
        mockSignInWithEmailAndPassword.mockResolvedValue({
            user: mockUser,
        });

        const result = await loginUser("test@example.com", "password123");

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.user?.uid).toBe("user-123");
        }
    });

    it("debe manejar credenciales incorrectas", async () => {
        mockSignInWithEmailAndPassword.mockRejectedValue({
            code: "auth/wrong-password",
        });

        const result = await loginUser("test@example.com", "wrong");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Contraseña incorrecta.");
        }
    });

    it("debe manejar usuario no encontrado", async () => {
        mockSignInWithEmailAndPassword.mockRejectedValue({
            code: "auth/user-not-found",
        });

        const result = await loginUser("notfound@example.com", "password123");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("No existe una cuenta con este correo electrónico.");
        }
    });

    it("debe manejar demasiados intentos", async () => {
        mockSignInWithEmailAndPassword.mockRejectedValue({
            code: "auth/too-many-requests",
        });

        const result = await loginUser("test@example.com", "password123");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Demasiados intentos. Intenta de nuevo más tarde.");
        }
    });
});

describe("Firebase Auth — logoutUser()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe cerrar sesión correctamente", async () => {
        mockSignOut.mockResolvedValue(undefined);

        await logoutUser();

        expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
});

describe("Firebase Auth — resetPassword()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe enviar email de restablecimiento", async () => {
        mockSendPasswordResetEmail.mockResolvedValue(undefined);

        const result = await resetPassword("test@example.com");

        expect(result.success).toBe(true);
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), "test@example.com");
    });

    it("debe manejar email inválido", async () => {
        mockSendPasswordResetEmail.mockRejectedValue({
            code: "auth/invalid-email",
        });

        const result = await resetPassword("invalid");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("El correo electrónico no es válido.");
        }
    });

    it("debe manejar usuario no encontrado en reset", async () => {
        mockSendPasswordResetEmail.mockRejectedValue({
            code: "auth/user-not-found",
        });

        const result = await resetPassword("notfound@example.com");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("No existe una cuenta con este correo electrónico.");
        }
    });
});

describe("Firebase Auth — getCurrentUser()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe retornar el usuario actual", () => {
        // El mock de auth.currentUser es null por defecto
        const user = getCurrentUser();
        expect(user).toBeNull();
    });
});

describe("Firebase Auth — getIdToken()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe retornar null si no hay usuario", async () => {
        const token = await getIdToken();
        expect(token).toBeNull();
    });

    it("debe retornar el token si hay usuario", async () => {
        const mockUser = { getIdToken: vi.fn().mockResolvedValue("mock-token-123") };

        // Reemplazar currentUser temporalmente
        const authModule = await import("../src/lib/firebase");
        (authModule.auth as any).currentUser = mockUser;

        const token = await getIdToken();
        expect(token).toBe("mock-token-123");
        expect(mockUser.getIdToken).toHaveBeenCalledTimes(1);

        // Restaurar
        (authModule.auth as any).currentUser = null;
    });
});

describe("Firebase Auth — loginWithGoogle()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe iniciar sesión con Google y crear perfil si no existe", async () => {
        const mockUser = {
            uid: "google-uid-123",
            email: "google@example.com",
            displayName: "Google User",
            photoURL: "https://example.com/photo.jpg",
        };

        mockSignInWithPopup.mockResolvedValue({ user: mockUser });
        mockGetDoc.mockResolvedValue({ exists: () => false });
        mockSetDoc.mockResolvedValue(undefined);

        const result = await loginWithGoogle();

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.user?.uid).toBe("google-uid-123");
        }
        expect(mockSetDoc).toHaveBeenCalledWith("mock-doc-ref", expect.objectContaining({
            uid: "google-uid-123",
            email: "google@example.com",
            displayName: "Google User",
        }));
    });

    it("debe no crear perfil si ya existe", async () => {
        const mockUser = {
            uid: "existing-uid",
            email: "existing@example.com",
            displayName: "Existing User",
            photoURL: null,
        };

        mockSignInWithPopup.mockResolvedValue({ user: mockUser });
        mockGetDoc.mockResolvedValue({ exists: () => true });

        const result = await loginWithGoogle();

        expect(result.success).toBe(true);
        // No debería llamar a setDoc porque el perfil ya existe
        expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("debe manejar cierre del popup", async () => {
        mockSignInWithPopup.mockRejectedValue({
            code: "auth/popup-closed-by-user",
        });

        const result = await loginWithGoogle();

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Inicio de sesión cancelado.");
        }
    });

    it("debe manejar error de red en Google login", async () => {
        mockSignInWithPopup.mockRejectedValue({
            code: "auth/network-request-failed",
        });

        const result = await loginWithGoogle();

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("Error de conexión");
        }
    });
});

describe("Firebase Auth — getAuthErrorMessage() (cobertura extendida)", () => {
    it("debe mapear todos los códigos de error conocidos", () => {
        const testCases: Record<string, string> = {
            "auth/user-not-found": "No existe una cuenta con este correo electrónico.",
            "auth/wrong-password": "Contraseña incorrecta.",
            "auth/email-already-in-use": "Ya existe una cuenta con este correo electrónico.",
            "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
            "auth/invalid-email": "El correo electrónico no es válido.",
            "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo más tarde.",
            "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
            "auth/operation-not-allowed": "Esta operación no está permitida.",
            "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
            "auth/popup-closed-by-user": "Inicio de sesión cancelado.",
        };

        for (const [code, expectedMessage] of Object.entries(testCases)) {
            expect(getAuthErrorMessage(code)).toBe(expectedMessage);
        }
    });

    it("debe manejar objetos de error con código numérico", () => {
        expect(getAuthErrorMessage(12345)).toBe("Ha ocurrido un error inesperado.");
    });

    it("debe manejar objetos vacíos", () => {
        expect(getAuthErrorMessage({})).toBe("Ha ocurrido un error inesperado.");
    });
});
