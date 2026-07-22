// ============================================
// permissions.ts — Sistema de Control de Acceso por Rol (RBAC)
// ============================================
// Matriz de seguridad para verificar la autoridad del usuario
// en operaciones sobre el sitio y las páginas (crear, editar, borrar).
// ============================================

export type UserRole = "admin" | "editor" | "viewer";

export interface PermissionContext {
  userId?: string | null;
  siteOwnerId?: string | null;
  siteRoles?: Record<string, string>;
}

/**
 * Resuelve el rol del usuario para el sitio en cuestión.
 * El propietario del sitio (siteOwnerId) tiene siempre rol 'admin'.
 */
export function getUserRole(ctx: PermissionContext): UserRole | null {
  if (!ctx.userId) return null;
  
  // 1. Propietario del sitio = Admin automático
  if (ctx.siteOwnerId && ctx.userId === ctx.siteOwnerId) {
    return "admin";
  }

  // 2. Rol configurado en el mapa de roles del sitio
  if (ctx.siteRoles && ctx.siteRoles[ctx.userId]) {
    const assignedRole = ctx.siteRoles[ctx.userId];
    if (assignedRole === "admin" || assignedRole === "editor" || assignedRole === "viewer") {
      return assignedRole;
    }
  }

  return null;
}

/**
 * Comprueba si el usuario tiene permiso para crear una nueva página.
 */
export function canCreatePage(ctx: PermissionContext): boolean {
  const role = getUserRole(ctx);
  return role === "admin" || role === "editor";
}

/**
 * Comprueba si el usuario tiene permiso para editar y modificar páginas existentes.
 */
export function canEditPage(ctx: PermissionContext): boolean {
  const role = getUserRole(ctx);
  return role === "admin" || role === "editor";
}

/**
 * Comprueba si el usuario tiene permiso para publicar la página en la web.
 */
export function canPublishPage(ctx: PermissionContext): boolean {
  const role = getUserRole(ctx);
  return role === "admin" || role === "editor";
}

/**
 * Comprueba si el usuario tiene permiso para eliminar una página.
 * Exclusivo para administradores y propietarios del sitio.
 */
export function canDeletePage(ctx: PermissionContext): boolean {
  const role = getUserRole(ctx);
  return role === "admin";
}
