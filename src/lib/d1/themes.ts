// ============================================
// d1/themes.ts — CRUD de Temas Default (D1 Database)
// ============================================
// Operaciones sobre la tabla default_themes en Cloudflare D1.
// ============================================

import { getD1Client } from "./client";

export interface DefaultTheme {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: string;
  is_active: number;
  sort_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  config: Record<string, any>;
}

export interface DefaultThemeInput {
  id: string;
  name: string;
  description?: string;
  preview_image?: string;
  category?: string;
  sort_order?: number;
  config: Record<string, any>;
}

/**
 * Lista todos los temas activos, ordenados por sort_order.
 */
export async function listActiveThemes(): Promise<DefaultTheme[]> {
  const db = getD1Client();
  const result = await db.prepare(
    "SELECT * FROM default_themes WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
  ).all();
  return (result.results || []).map(parseThemeRow);
}

/**
 * Lista todos los temas (incluyendo inactivos) — solo para superadmin.
 */
export async function listAllThemes(): Promise<DefaultTheme[]> {
  const db = getD1Client();
  const result = await db.prepare(
    "SELECT * FROM default_themes ORDER BY sort_order ASC, name ASC"
  ).all();
  return (result.results || []).map(parseThemeRow);
}

/**
 * Obtiene un tema por su ID (solo activos).
 */
export async function getThemeById(id: string): Promise<DefaultTheme | null> {
  const db = getD1Client();
  const result = await db.prepare(
    "SELECT * FROM default_themes WHERE id = ? AND is_active = 1"
  ).bind(id).first();
  return result ? parseThemeRow(result) : null;
}

/**
 * Obtiene un tema por su ID (incluyendo inactivos) — solo para superadmin.
 */
export async function getThemeByIdAll(id: string): Promise<DefaultTheme | null> {
  const db = getD1Client();
  const result = await db.prepare(
    "SELECT * FROM default_themes WHERE id = ?"
  ).bind(id).first();
  return result ? parseThemeRow(result) : null;
}

/**
 * Crea un nuevo tema default.
 */
export async function createTheme(theme: DefaultThemeInput): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getD1Client();

    // Validar que no exista
    const existing = await db.prepare("SELECT id FROM default_themes WHERE id = ?").bind(theme.id).first();
    if (existing) {
      return { success: false, error: `Ya existe un tema con el ID '${theme.id}'` };
    }

    const result = await db.prepare(
      `INSERT INTO default_themes (id, name, description, preview_image, category, sort_order, config)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      theme.id,
      theme.name,
      theme.description || "",
      theme.preview_image || "",
      theme.category || "general",
      theme.sort_order || 0,
      JSON.stringify(theme.config)
    ).run();

    return { success: result.success };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al crear el tema" };
  }
}

/**
 * Actualiza un tema existente.
 */
export async function updateTheme(
  id: string,
  updates: Partial<DefaultThemeInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getD1Client();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
    if (updates.preview_image !== undefined) { fields.push("preview_image = ?"); values.push(updates.preview_image); }
    if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
    if (updates.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(updates.sort_order); }
    if (updates.config !== undefined) { fields.push("config = ?"); values.push(JSON.stringify(updates.config)); }

    if (fields.length === 0) {
      return { success: false, error: "No hay campos para actualizar" };
    }

    // Incrementar versión
    fields.push("version = version + 1");
    fields.push("updated_at = datetime('now')");
    values.push(id);

    const result = await db.prepare(
      `UPDATE default_themes SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();

    return { success: result.success };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al actualizar el tema" };
  }
}

/**
 * Elimina un tema (soft delete por defecto, hard delete si permanent=true).
 */
export async function deleteTheme(
  id: string,
  permanent: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getD1Client();

    if (permanent) {
      const result = await db.prepare("DELETE FROM default_themes WHERE id = ?").bind(id).run();
      return { success: result.success };
    }

    const result = await db.prepare(
      "UPDATE default_themes SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return { success: result.success };
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al eliminar el tema" };
  }
}

/**
 * Duplica un tema existente con un nuevo ID.
 */
export async function duplicateTheme(
  sourceId: string,
  newId?: string
): Promise<{ success: boolean; error?: string; data?: DefaultTheme }> {
  try {
    const source = await getThemeByIdAll(sourceId);
    if (!source) {
      return { success: false, error: `Tema '${sourceId}' no encontrado` };
    }

    const duplicateId = newId || `${sourceId}-copy`;
    const result = await createTheme({
      id: duplicateId,
      name: `${source.name} (copia)`,
      description: source.description,
      preview_image: source.preview_image,
      category: source.category,
      sort_order: source.sort_order + 1,
      config: source.config,
    });

    if (result.success) {
      const created = await getThemeByIdAll(duplicateId);
      return { success: true, data: created || undefined };
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error?.message || "Error al duplicar el tema" };
  }
}

/**
 * Lista temas paginados con filtro opcional por categoría.
 */
export async function listActiveThemesPaginated(
  page: number = 1,
  limit: number = 10,
  category?: string
): Promise<{ themes: DefaultTheme[]; total: number }> {
  const db = getD1Client();
  const offset = (page - 1) * limit;

  let whereClause = "WHERE is_active = 1";
  const params: any[] = [];

  if (category) {
    whereClause += " AND category = ?";
    params.push(category);
  }

  // Total count
  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM default_themes ${whereClause}`
  ).bind(...params).first<{ total: number }>();

  // Paginated results
  const result = await db.prepare(
    `SELECT * FROM default_themes ${whereClause} ORDER BY sort_order ASC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return {
    themes: (result.results || []).map(parseThemeRow),
    total: countResult?.total || 0,
  };
}

/**
 * Parsea una fila de D1, parseando el campo config de string a objeto.
 */
function parseThemeRow(row: any): DefaultTheme {
  return {
    ...row,
    config: typeof row.config === "string" ? JSON.parse(row.config) : row.config,
  };
}
