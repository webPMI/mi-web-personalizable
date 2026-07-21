// ============================================================
// Helpers de Authentication
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import type { AuthResponse } from "../../types/firebase";

// --- Registro ---
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName });
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

// --- Inicio de sesión ---
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

// --- Cerrar sesión ---
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// --- Observador de estado de autenticación ---
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// --- Restablecer contraseña ---
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

// --- Obtener token ID ---
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// --- Mapeo de errores de Firebase Auth ---
function getAuthErrorMessage(code: string): string {
  const errorMap: Record<string, string> = {
    "auth/user-not-found": "No existe una cuenta con este correo electrónico.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/email-already-in-use": "Ya existe una cuenta con este correo electrónico.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo más tarde.",
    "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
    "auth/operation-not-allowed": "Esta operación no está permitida.",
    "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  };
  return errorMap[code] || "Ha ocurrido un error inesperado.";
}
