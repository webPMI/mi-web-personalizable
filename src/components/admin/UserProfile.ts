// ============================================
// UserProfile.ts — Lógica JS del Perfil de Usuario (/admin/profile)
// ============================================
// Maneja:
//   - Carga del perfil desde Firestore (users/{uid})
//   - Auto-creación del documento si no existe
//   - Edición de nombre, foto URL
//   - Cambio de contraseña con validación
//   - Cierre de sesión
//   - Feedback visual de operaciones
// ============================================

import { auth } from "../../lib/firebase";
import {
  getDocument,
  updateDocument,
  setDocument,
} from "../../lib/firebase/firestore";
import { sanitizeText, sanitizeUrl } from "../../lib/sanitizer";
import { updateProfile, updatePassword, signOut } from "firebase/auth";

let currentUid: string | null = null;

export function initUserProfile(): void {
  document.addEventListener("admin:ready", ((e: CustomEvent) => {
    const { siteDomain, siteData } = e.detail;
    setupProfile(siteDomain, siteData);
  }) as EventListener);
}

function setupProfile(_siteDomain: string, _siteData: any): void {
  currentUid = auth.currentUser?.uid || null;
  if (!currentUid) {
    showFeedback("error", "No se detectó una sesión activa.");
    return;
  }

  loadProfile();
  setupSaveHandler();
  setupLogoutHandler();
}

// ─── Cargar perfil ───────────────────────────────────────

async function loadProfile(): Promise<void> {
  if (!currentUid) return;

  const loadingEl = document.getElementById("profile-loading");
  const formEl = document.getElementById("profile-form");

  try {
    const result = await getDocument("users", currentUid);

    if (result.success && result.data) {
      fillProfileForm(result.data as any);
    } else {
      // Auto-crear perfil si no existe
      const user = auth.currentUser;
      if (!user) return;

      const newProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        role: "user",
      };

      const createResult = await setDocument("users", currentUid, newProfile);
      if (createResult.success) {
        fillProfileForm(newProfile as any);
      } else {
        showFeedback("error", "No se pudo crear el perfil.");
      }
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    showFeedback("error", "Error al cargar el perfil.");
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (formEl) formEl.classList.remove("hidden");
  }
}

function fillProfileForm(data: any): void {
  const user = auth.currentUser;
  if (!user) return;

  const emailInput = document.getElementById("profile-email") as HTMLInputElement;
  const nameInput = document.getElementById("profile-name") as HTMLInputElement;
  const photoInput = document.getElementById("profile-photo") as HTMLInputElement;

  if (emailInput) emailInput.value = user.email || data.email || "";
  if (nameInput) nameInput.value = data.displayName || "";
  if (photoInput) photoInput.value = data.photoURL || "";
}

// ─── Guardar perfil ──────────────────────────────────────

function setupSaveHandler(): void {
  const form = document.getElementById("profile-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUid) return;

    // Validar
    const nameInput = document.getElementById("profile-name") as HTMLInputElement;
    const photoInput = document.getElementById("profile-photo") as HTMLInputElement;
    const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
    const confirmInput = document.getElementById("profile-password-confirm") as HTMLInputElement;

    const name = sanitizeText(nameInput?.value || "");
    const photo = sanitizeUrl(photoInput?.value || "");
    const password = passwordInput?.value || "";
    const confirm = confirmInput?.value || "";

    // Validación nombre
    if (!name) {
      showFeedback("error", "El nombre es obligatorio.");
      return;
    }

    // Validación foto URL
    if (photo && !isValidUrl(photo)) {
      showFeedback("error", "La URL de la foto no es válida.");
      return;
    }

    // Validación contraseña (solo si se intenta cambiar)
    if (password || confirm) {
      if (password.length < 6) {
        showFeedback("error", "La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (password !== confirm) {
        showFeedback("error", "Las contraseñas no coinciden.");
        return;
      }
    }

    // Mostrar estado de carga
    const btn = document.getElementById("btn-profile-save") as HTMLButtonElement;
    const originalText = btn?.textContent || "";
    if (btn) {
      btn.textContent = "Guardando...";
      btn.disabled = true;
    }

    try {
      // Actualizar Firestore
      const updateResult = await updateDocument("users", currentUid, {
        displayName: name,
        photoURL: photo,
        updatedAt: new Date(),
      });

      if (!updateResult.success) {
        // Si falla update, intentar set (por si no existe)
        const setResult = await setDocument("users", currentUid, {
          uid: currentUid,
          email: auth.currentUser?.email || "",
          displayName: name,
          photoURL: photo,
          isActive: true,
          updatedAt: new Date(),
        });
        if (!setResult.success) throw new Error("set failed");
      }

      // Actualizar perfil en Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: photo,
        });
      }

      // Cambiar contraseña si se proporcionó
      if (password) {
        try {
          await updatePassword(auth.currentUser!, password);
        } catch (pwError: any) {
          if (pwError.code === "auth/requires-recent-login") {
            showFeedback(
              "error",
              "Por seguridad, debes volver a iniciar sesión antes de cambiar la contraseña."
            );
            return;
          }
          throw pwError;
        }
      }

      showFeedback("success", "Cambios guardados correctamente.");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      showFeedback("error", "Error al guardar el perfil.");
    } finally {
      if (btn) {
        btn.textContent = originalText || "Guardar cambios";
        btn.disabled = false;
      }
    }
  });
}

// ─── Cerrar sesión ───────────────────────────────────────

function setupLogoutHandler(): void {
  const btn = document.getElementById("btn-profile-logout");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/";
  });
}

// ─── Utilidades ──────────────────────────────────────────

function showFeedback(type: "success" | "error", message: string): void {
  const el = document.getElementById("profile-feedback");
  if (!el) return;

  el.textContent = message;
  el.className = `feedback feedback-${type}`;
  el.classList.remove("hidden");

  setTimeout(() => {
    el.classList.add("hidden");
  }, 5000);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}