// ============================================
// d1/index.ts — Exportaciones del módulo D1
// ============================================

export { getD1Client, resetD1Client } from "./client";
export type { D1Database, D1PreparedStatement, D1Result } from "./client";

export {
  listActiveThemes,
  listAllThemes,
  getThemeById,
  getThemeByIdAll,
  createTheme,
  updateTheme,
  deleteTheme,
  duplicateTheme,
  listActiveThemesPaginated,
} from "./themes";
export type { DefaultTheme, DefaultThemeInput } from "./themes";
