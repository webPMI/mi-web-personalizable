// ============================================
// API: /api/admin/themes/[...slug].ts
// ============================================
// Endpoints REST para el sistema de temas default.
// Soporta: GET, POST, PUT, DELETE con verificación de superadmin.
// ============================================

import type { APIRoute } from "astro";
import {
  listActiveThemes,
  getThemeById,
  createTheme,
  updateTheme,
  deleteTheme,
} from "../../../../lib/d1/themes";

export const prerender = false;

const SUPERADMIN_EMAIL = "servicioweb.pmi@gmail.com";

// ============================================
// Helpers de autenticación
// ============================================

/**
 * Verifica que el usuario sea superadmin.
 * En producción, usar Firebase Admin SDK.
 * Por ahora, validación simplificada.
 */
async function verifySuperadmin(request: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);

    // En desarrollo, aceptar un token de prueba
    if (import.meta.env.DEV && token === "dev-token") {
      return { uid: "dev-uid", email: SUPERADMIN_EMAIL };
    }

    // TODO: Implementar verificación real con Firebase Admin SDK
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // const email = decodedToken.email?.toLowerCase();
    // if (email !== SUPERADMIN_EMAIL) return null;
    // return { uid: decodedToken.uid, email };

    console.warn("[API] Firebase Admin SDK no configurado. Usando verificación mock.");
    return { uid: "mock-uid", email: SUPERADMIN_EMAIL };
  } catch {
    return null;
  }
}

/**
 * Verifica que el usuario sea un admin genérico autenticado.
 */
async function verifyAdmin(request: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.slice(7);

    if (import.meta.env.DEV && token === "dev-token") {
      return { uid: "dev-uid", email: "dev@example.com" };
    }

    // TODO: Implementar verificación real
    return { uid: "mock-uid", email: "mock@example.com" };
  } catch {
    return null;
  }
}

// ============================================
// Validación de datos
// ============================================

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const THEME_ID_REGEX = /^[a-z0-9-]+$/;

interface ValidationError {
  field: string;
  message: string;
}

function validateThemeInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.id || typeof body.id !== "string") {
    errors.push({ field: "id", message: "El campo 'id' es requerido" });
  } else if (!THEME_ID_REGEX.test(body.id)) {
    errors.push({ field: "id", message: "El campo 'id' solo puede contener letras minúsculas, números y guiones" });
  }

  if (!body.name || typeof body.name !== "string") {
    errors.push({ field: "name", message: "El campo 'name' es requerido" });
  } else if (body.name.length > 100) {
    errors.push({ field: "name", message: "El campo 'name' no puede exceder 100 caracteres" });
  }

  if (body.config) {
    // Validar colores hex
    const colorFields = ["primaryColor", "secondaryColor", "accentColor", "bgColor", "textColor", "textMutedColor", "navbarBg", "navbarText", "footerBg", "footerText"];
    for (const field of colorFields) {
      if (body.config[field] && !HEX_COLOR_REGEX.test(body.config[field])) {
        errors.push({ field: `config.${field}`, message: `'${field}' debe ser un color hex válido (#RRGGBB)` });
      }
    }

    // Validar rangos numéricos
    if (body.config.fontSizeBase !== undefined && (body.config.fontSizeBase < 14 || body.config.fontSizeBase > 20)) {
      errors.push({ field: "config.fontSizeBase", message: "fontSizeBase debe estar entre 14 y 20" });
    }
    if (body.config.maxWidth !== undefined && (body.config.maxWidth < 800 || body.config.maxWidth > 1400)) {
      errors.push({ field: "config.maxWidth", message: "maxWidth debe estar entre 800 y 1400" });
    }
  }

  return errors;
}

// ============================================
// Response helpers
// ============================================

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, status: number, code?: string): Response {
  return jsonResponse({ success: false, error, code }, status);
}

// ============================================
// Endpoints
// ============================================

/**
 * GET /api/admin/themes — Lista todos los temas activos
 * GET /api/admin/themes/:id — Obtiene un tema específico
 */
export const GET: APIRoute = async ({ request, params }) => {
  const user = await verifyAdmin(request);
  if (!user) {
    return errorResponse("No autorizado", 401, "UNAUTHORIZED");
  }

  const slug = params.slug || "";
  const parts = slug.split("/").filter(Boolean);

  try {
    if (parts.length === 0) {
      // GET /api/admin/themes — Listar todos
      const themes = await listActiveThemes();
      return jsonResponse({ success: true, data: themes });
    }

    if (parts.length === 1) {
      // GET /api/admin/themes/:id
      const themeId = parts[0];
      const theme = await getThemeById(themeId);

      if (!theme) {
        return errorResponse("Tema no encontrado", 404, "NOT_FOUND");
      }

      return jsonResponse({ success: true, data: theme });
    }

    return errorResponse("Ruta no encontrada", 404, "NOT_FOUND");
  } catch (error: any) {
    console.error("[API] Error GET themes:", error);
    return errorResponse("Error interno del servidor", 500, "INTERNAL_ERROR");
  }
};

/**
 * POST /api/admin/themes — Crea un nuevo tema (solo superadmin)
 * POST /api/admin/themes/:id/copy — Copia un tema a un sitio
 */
export const POST: APIRoute = async ({ request, params }) => {
  const slug = params.slug || "";
  const parts = slug.split("/").filter(Boolean);

  // POST /api/admin/themes/:id/copy
  if (parts.length === 2 && parts[1] === "copy") {
    return handleCopyTheme(request, parts[0]);
  }

  // POST /api/admin/themes — Crear nuevo tema
  const user = await verifySuperadmin(request);
  if (!user) {
    return errorResponse("No autorizado. Solo el superadmin puede crear temas.", 403, "FORBIDDEN");
  }

  try {
    const body = await request.json();

    // Validar
    const errors = validateThemeInput(body);
    if (errors.length > 0) {
      return jsonResponse({
        success: false,
        error: errors[0].message,
        code: "VALIDATION_ERROR",
        details: errors,
      }, 400);
    }

    const result = await createTheme({
      id: body.id,
      name: body.name,
      description: body.description,
      preview_image: body.preview_image,
      category: body.category,
      sort_order: body.sort_order,
      config: body.config,
    });

    if (!result.success) {
      const status = result.error?.includes("ya existe") ? 409 : 400;
      return errorResponse(result.error || "Error al crear el tema", status, status === 409 ? "CONFLICT" : "VALIDATION_ERROR");
    }

    return jsonResponse({
      success: true,
      message: `Tema '${body.name}' creado correctamente`,
      data: { id: body.id, name: body.name },
    }, 201);
  } catch (error: any) {
    console.error("[API] Error POST themes:", error);
    return errorResponse("Error interno del servidor", 500, "INTERNAL_ERROR");
  }
};

/**
 * PUT /api/admin/themes/:id — Actualiza un tema (solo superadmin)
 */
export const PUT: APIRoute = async ({ request, params }) => {
  const user = await verifySuperadmin(request);
  if (!user) {
    return errorResponse("No autorizado. Solo el superadmin puede actualizar temas.", 403, "FORBIDDEN");
  }

  const slug = params.slug || "";
  const parts = slug.split("/").filter(Boolean);

  if (parts.length !== 1) {
    return errorResponse("Ruta no encontrada", 404, "NOT_FOUND");
  }

  const themeId = parts[0];

  try {
    const body = await request.json();

    const result = await updateTheme(themeId, {
      name: body.name,
      description: body.description,
      preview_image: body.preview_image,
      category: body.category,
      sort_order: body.sort_order,
      config: body.config,
    });

    if (!result.success) {
      return errorResponse(result.error || "Error al actualizar el tema", 400);
    }

    return jsonResponse({
      success: true,
      message: `Tema '${themeId}' actualizado correctamente`,
    });
  } catch (error: any) {
    console.error("[API] Error PUT themes:", error);
    return errorResponse("Error interno del servidor", 500, "INTERNAL_ERROR");
  }
};

/**
 * DELETE /api/admin/themes/:id — Elimina un tema (solo superadmin)
 */
export const DELETE: APIRoute = async ({ request, params, url }) => {
  const user = await verifySuperadmin(request);
  if (!user) {
    return errorResponse("No autorizado. Solo el superadmin puede eliminar temas.", 403, "FORBIDDEN");
  }

  const slug = params.slug || "";
  const parts = slug.split("/").filter(Boolean);

  if (parts.length !== 1) {
    return errorResponse("Ruta no encontrada", 404, "NOT_FOUND");
  }

  const themeId = parts[0];
  const permanent = url.searchParams.get("permanent") === "true";

  try {
    const result = await deleteTheme(themeId, permanent);

    if (!result.success) {
      return errorResponse(result.error || "Error al eliminar el tema", 400);
    }

    return jsonResponse({
      success: true,
      message: `Tema '${themeId}' eliminado correctamente`,
    });
  } catch (error: any) {
    console.error("[API] Error DELETE themes:", error);
    return errorResponse("Error interno del servidor", 500, "INTERNAL_ERROR");
  }
};

// ============================================
// Handlers específicos
// ============================================

/**
 * POST /api/admin/themes/:id/copy
 * Copia un tema default al sitio del usuario en Firestore.
 * NOTA: Esta función requiere Firebase configurado en el cliente.
 * En Cloudflare, la copia se delega al cliente o a un worker separado.
 */
async function handleCopyTheme(request: Request, themeId: string): Promise<Response> {
  const user = await verifyAdmin(request);
  if (!user) {
    return errorResponse("No autorizado", 401, "UNAUTHORIZED");
  }

  try {
    const body = await request.json();
    const siteDomain = body.siteDomain;

    if (!siteDomain || typeof siteDomain !== "string") {
      return errorResponse("El campo 'siteDomain' es requerido", 400, "VALIDATION_ERROR");
    }

    const theme = await getThemeById(themeId);

    if (!theme) {
      return errorResponse("Tema no encontrado", 404, "NOT_FOUND");
    }

    // Intentar copiar a Firestore si está disponible en el entorno
    try {
      // Importación dinámica para evitar errores en entornos sin Firebase (Cloudflare)
      const firebaseModule = await import("../../../../lib/firebase");
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = firebaseModule;

      const themeRef = doc(db, "sites", siteDomain, "settings", "theme");
      await setDoc(themeRef, {
        ...theme.config,
        sourceThemeId: theme.id,
        sourceThemeName: theme.name,
        copiedAt: new Date().toISOString(),
        copiedBy: user.email,
      }, { merge: true });

      // También actualizar el campo theme en el documento principal
      const siteRef = doc(db, "sites", siteDomain);
      await setDoc(siteRef, {
        theme: {
          ...theme.config,
          sourceThemeId: theme.id,
          sourceThemeName: theme.name,
        },
      }, { merge: true });

      return jsonResponse({
        success: true,
        message: `Tema '${theme.name}' copiado a ${siteDomain}`,
      });
    } catch (firebaseError) {
      // Si Firebase no está disponible (ej: en Cloudflare), devolver la config para que el cliente la copie
      console.warn("[API] Firebase no disponible en este entorno. Devolviendo config para copia desde cliente.");
      return jsonResponse({
        success: true,
        message: `Tema '${theme.name}' obtenido. La copia a Firestore debe realizarse desde el cliente.`,
        data: {
          theme: theme.config,
          sourceThemeId: theme.id,
          sourceThemeName: theme.name,
        },
      });
    }
  } catch (error: any) {
    console.error("[API] Error copy theme:", error);
    return errorResponse("Error al copiar el tema", 500, "INTERNAL_ERROR");
  }
}
