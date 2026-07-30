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
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { AuthResponse } from "../types/firebase";

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

    // Crear documento de perfil en users/{uid}
    const user = userCredential.user;
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName,
      photoURL: user.photoURL || "",
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

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

// --- Obtener usuario actual ---
export function getCurrentUser() {
  return auth.currentUser;
}

// --- Obtener token ID ---
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// --- Inicio de sesión con Google ---
export async function loginWithGoogle(): Promise<AuthResponse> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Crear documento de perfil en users/{uid} si no existe
    // (para usuarios nuevos que se registran por primera vez con Google)
    try {
      const { getDoc } = await import("firebase/firestore");
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch {
      // Si falla la creación del perfil, no bloqueamos el login
      console.warn("No se pudo crear/verificar el perfil en users/");
    }

    return { success: true, user };
  } catch (error: any) {
    // Si el usuario cierra el popup, no es un error real
    if (error.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Inicio de sesión cancelado." };
    }
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
}

// --- Mapeo de errores de Firebase Auth ---
export function getAuthErrorMessage(errorOrCode: any): string {
  const code = typeof errorOrCode === "object" && errorOrCode?.code ? errorOrCode.code : String(errorOrCode || "");
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
    "auth/popup-closed-by-user": "Inicio de sesión cancelado.",
  };
  return errorMap[code] || "Ha ocurrido un error inesperado.";
}
