// ============================================
// UserProfile.ts — Lógica JS del Perfil de Usuario
// ============================================
// Se encarga de cargar, mostrar y guardar la
// información del perfil del usuario autenticado.
// También permite cambiar la contraseña.
// ============================================

import { auth } from "../../lib/firebase";

/**
 * Obtiene el usuario autenticado desde la fuente más confiable disponible.
 * Prioriza window.__currentUser (expuesto por AdminLayout) sobre auth.currentUser,
 * ya que en navegación SPA auth.currentUser puede ser null temporalmente.
 */
function getCurrentUser(): any {
  const globalUser = (window as any).__currentUser;
  if (globalUser) return globalUser;
  return auth.currentUser;
}
import { getDocument, setDocument, updateDocument } from "../../lib/firebase/firestore";
import { logoutUser } from "../../lib/firebase/auth";
import { updatePassword, updateProfile, type User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

/**
 * Obtiene el texto traducido para una key i18n.
 * Si no encuentra traducción, devuelve el fallback.
 */
function t(key: string, fallback: string): string {
  if (typeof window !== "undefined" && (window as any).__i18n) {
    const i18n = (window as any).__i18n;
    return i18n[key] || fallback;
  }
  return fallback;
}

/**
 * Inicializa el perfil de usuario.
 * Se suscribe al evento "admin:ready" disparado por AdminLayout.
 * También detecta si ya hay sesión activa (navegación SPA).
 */
export function initUserProfile(): void {
  // Intentar cargar inmediatamente con getCurrentUser()
  const currentUser = getCurrentUser();
  if (currentUser) {
    loadProfile(currentUser);
    return;
  }

  // Suscribirse al evento de AdminLayout (primera carga)
  window.addEventListener("admin:ready", (() => {
    waitForAuthAndLoadProfile();
  }) as EventListener);

  // También intentar si ya hay siteDomain (navegación SPA)
  const adminApp = document.getElementById("admin-app");
  if (adminApp?.dataset.siteDomain) {
    waitForAuthAndLoadProfile();
  }
}

/**
 * Espera a que el usuario esté disponible y luego carga el perfil.
 */
async function waitForAuthAndLoadProfile(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const user = getCurrentUser();
    if (user) {
      await loadProfile(user);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}


/**
 * Carga el perfil del usuario desde Firestore.
 * Si no existe, lo crea automáticamente.
 */
async function loadProfile(user: User): Promise<void> {
  const loadingEl = document.getElementById("profile-loading");
  const formEl = document.getElementById("profile-form");

  if (!loadingEl || !formEl) return;

  try {
    // Intentar obtener el documento del perfil
    const result = await getDocument<any>("users", user.uid);

    if (result.success && result.data) {
      // Perfil existe — rellenar formulario
      fillProfileForm(result.data, user);
    } else {
      // Perfil no existe — crearlo
      const newProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const createResult = await setDocument("users", user.uid, newProfile);
      if (createResult.success) {
        fillProfileForm(newProfile, user);
      } else {
        // Si falla la creación, al menos mostrar datos de auth
        fillProfileFallback(user);
      }
    }
  } catch {
    // Fallback: mostrar datos de auth.currentUser
    fillProfileFallback(user);
  }

  // Ocultar loading, mostrar formulario
  loadingEl.classList.add("hidden");
  formEl.classList.remove("hidden");

  // Configurar handlers
  setupSaveHandler(user);
  setupLogoutHandler();
  setupPhotoPreview();
}

/**
 * Rellena el formulario con los datos del perfil.
 */
function fillProfileForm(data: any, user: User): void {
  const emailInput = document.getElementById("profile-email") as HTMLInputElement;
  const nameInput = document.getElementById("profile-name") as HTMLInputElement;
  const photoInput = document.getElementById("profile-photo") as HTMLInputElement;

  if (emailInput) emailInput.value = user.email || data.email || "";
  if (nameInput) nameInput.value = data.displayName || user.displayName || "";

  const photoURL = data.photoURL || user.photoURL || "";
  if (photoInput) {
    photoInput.value = photoURL;
    updatePhotoPreview(photoURL);
  }
}

/**
 * Fallback: rellena el formulario solo con datos de auth.
 */
function fillProfileFallback(user: User): void {
  const emailInput = document.getElementById("profile-email") as HTMLInputElement;
  const nameInput = document.getElementById("profile-name") as HTMLInputElement;
  const photoInput = document.getElementById("profile-photo") as HTMLInputElement;

  if (emailInput) emailInput.value = user.email || "";
  if (nameInput) nameInput.value = user.displayName || "";

  const photoURL = user.photoURL || "";
  if (photoInput) {
    photoInput.value = photoURL;
    updatePhotoPreview(photoURL);
  }
}

/**
 * Valida si una URL es una URL de imagen válida.
 */
function isValidImageUrl(url: string): boolean {
  if (!url || !url.trim()) return true; // Vacío es válido (sin foto)
  try {
    const parsed = new URL(url);
    // Solo permitir http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Actualiza la preview de la foto de perfil.
 */
function updatePhotoPreview(url: string): void {
  const previewImg = document.getElementById("profile-photo-preview") as HTMLImageElement;
  const placeholder = document.getElementById("profile-photo-placeholder");

  if (!previewImg || !placeholder) return;

  if (url && url.trim() && isValidImageUrl(url)) {
    previewImg.src = url;
    previewImg.classList.remove("hidden");
    placeholder.classList.add("hidden");
    // Si la imagen falla al cargar, mostrar placeholder
    previewImg.onerror = () => {
      previewImg.classList.add("hidden");
      placeholder.classList.remove("hidden");
    };
  } else {
    previewImg.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }
}

/**
 * Configura el preview en vivo de la foto mientras se escribe la URL.
 */
function setupPhotoPreview(): void {
  const photoInput = document.getElementById("profile-photo") as HTMLInputElement;
  if (!photoInput) return;

  photoInput.addEventListener("input", () => {
    updatePhotoPreview(photoInput.value.trim());
  });
}

/**
 * Configura el handler de guardado del formulario.
 */
function setupSaveHandler(user: User): void {
  const form = document.getElementById("profile-form") as HTMLFormElement;
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Limpiar errores previos
    clearProfileErrors();

    const nameInput = document.getElementById("profile-name") as HTMLInputElement;
    const photoInput = document.getElementById("profile-photo") as HTMLInputElement;
    const passwordInput = document.getElementById("profile-password") as HTMLInputElement;
    const passwordConfirmInput = document.getElementById("profile-password-confirm") as HTMLInputElement;
    const feedbackEl = document.getElementById("profile-feedback");
    const saveBtn = document.getElementById("btn-profile-save") as HTMLButtonElement;

    const displayName = nameInput?.value.trim() || "";
    const photoURL = photoInput?.value.trim() || "";
    const newPassword = passwordInput?.value || "";
    const passwordConfirm = passwordConfirmInput?.value || "";

    // --- Validación ---
    if (!displayName) {
      showFieldError("profile-name-error");
      return;
    }

    // Validar URL de foto
    if (photoURL && !isValidImageUrl(photoURL)) {
      showFieldError("profile-photo-url-error");
      return;
    }

    if (newPassword || passwordConfirm) {
      if (newPassword.length < 6) {
        showFieldError("profile-password-length-error");
        return;
      }
      if (newPassword !== passwordConfirm) {
        showFieldError("profile-password-match-error");
        return;
      }
    }

    // --- Guardar ---
    if (!feedbackEl || !saveBtn) return;

    const originalText = saveBtn.textContent;
    saveBtn.textContent = t("profile-btn-saving", "Guardando...");
    saveBtn.disabled = true;
    feedbackEl.classList.add("hidden");

    try {
      // 1. Guardar en Firestore (colección users)
      const updateData: any = {
        displayName,
        photoURL,
        updatedAt: Timestamp.now(),
      };

      const firestoreResult = await updateDocument("users", user.uid, updateData);

      if (!firestoreResult.success) {
        // Intentar setDocument por si no existe
        const setResult = await setDocument("users", user.uid, {
          uid: user.uid,
          email: user.email || "",
          displayName,
          photoURL,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        if (!setResult.success) {
          showProfileFeedback("error", t("profile-error-save", "Error al guardar el perfil. Intenta de nuevo."));
          restoreButton(saveBtn, originalText);
          return;
        }
      }

      // 2. Actualizar perfil en Firebase Auth
      await updateProfile(user, { displayName, photoURL });

      // 3. Actualizar también en members/{uid} si existe el sitio
      const adminApp = document.getElementById("admin-app");
      const siteDomain = adminApp?.dataset.siteDomain;
      if (siteDomain) {
        const memberUpdate = {
          displayName,
          photoURL,
          email: user.email || "",
          updatedAt: Timestamp.now(),
        };
        const memberResult = await updateDocument(`sites/${siteDomain}/members`, user.uid, memberUpdate);
        if (!memberResult.success) {
          // Si no existe el documento del miembro, intentar crearlo
          await setDocument(`sites/${siteDomain}/members`, user.uid, {
            uid: user.uid,
            email: user.email || "",
            displayName,
            photoURL,
            role: "admin",
            invitedBy: user.uid,
            invitedAt: Timestamp.now(),
            isActive: true,
            updatedAt: Timestamp.now(),
          });
        }
      }

      // 4. Cambiar contraseña si se proporcionó
      if (newPassword) {
        try {
          await updatePassword(user, newPassword);
        } catch (pwError: any) {
          if (pwError.code === "auth/requires-recent-login") {
            showProfileFeedback("error", t("profile-error-recent-login", "Por seguridad, debes volver a iniciar sesión antes de cambiar la contraseña."));
            restoreButton(saveBtn, originalText);
            return;
          }
          throw pwError;
        }
      }

      // 4. Feedback éxito
      showProfileFeedback("success", t("profile-success-saved", "Cambios guardados correctamente."));
      // Limpiar campos de contraseña
      if (passwordInput) passwordInput.value = "";
      if (passwordConfirmInput) passwordConfirmInput.value = "";

    } catch (err: any) {
      if (err.code === "auth/weak-password") {
        showProfileFeedback("error", t("profile-error-password-length", "La contraseña debe tener al menos 6 caracteres."));
      } else {
        showProfileFeedback("error", t("profile-error-save", "Error al guardar el perfil. Intenta de nuevo."));
      }
    } finally {
      restoreButton(saveBtn, originalText);
    }
  });
}

/**
 * Configura el handler del botón de cerrar sesión.
 */
function setupLogoutHandler(): void {
  const logoutBtn = document.getElementById("btn-profile-logout");
  logoutBtn?.addEventListener("click", async () => {
    await logoutUser();
  });
}

// ============================================
// Helpers
// ============================================

function showFieldError(errorId: string): void {
  const el = document.getElementById(errorId);
  if (el) el.classList.remove("hidden");
}

function clearProfileErrors(): void {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.classList.add("hidden");
  });
}

function showProfileFeedback(type: "success" | "error", message: string): void {
  const feedbackEl = document.getElementById("profile-feedback");
  if (!feedbackEl) return;

  feedbackEl.className = `alert alert-${type}`;
  feedbackEl.textContent = message;
  feedbackEl.classList.remove("hidden");

  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    feedbackEl.classList.add("hidden");
  }, 5000);
}

function restoreButton(btn: HTMLButtonElement, originalText: string | null): void {
  btn.textContent = originalText || t("profile-btn-save", "Guardar cambios");
  btn.disabled = false;
}
