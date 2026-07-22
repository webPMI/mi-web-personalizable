// ============================================================
// UI Helpers — Funciones compartidas para formularios y validación
// ============================================================

/**
 * Muestra un mensaje de error en un grupo de formulario.
 * @param groupId - ID del elemento .form-group
 * @param message - Mensaje de error a mostrar
 */
export function showFieldError(groupId: string, message: string): void {
  const group = document.getElementById(groupId);
  const errEl = group?.querySelector(".field-error");
  group?.classList.add("error");
  if (errEl) errEl.textContent = message;
}

/**
 * Limpia todos los errores de formularios en la página.
 */
export function clearAllErrors(): void {
  document.querySelectorAll(".form-group.error").forEach((el) => el.classList.remove("error"));
}

/**
 * Limpia el error de un campo cuando el usuario empieza a escribir.
 * @param inputId - ID del input
 * @param groupId - ID del .form-group contenedor
 */
export function clearErrorOnInput(inputId: string, groupId: string): void {
  const input = document.getElementById(inputId);
  const group = document.getElementById(groupId);
  input?.addEventListener("input", () => {
    group?.classList.remove("error");
  });
}
