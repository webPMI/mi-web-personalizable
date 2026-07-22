-- ============================================
-- D1 Schema — Base de datos de Cloudflare D1
-- ============================================
-- Ejecutar: npx wrangler d1 execute mi-web-personalizable-db --file=./src/lib/d1/schema.sql
-- ============================================

-- ============================================
-- Default Themes
-- ============================================
CREATE TABLE IF NOT EXISTS default_themes (
  id            TEXT PRIMARY KEY,                -- Identificador único (ej: 'classic', 'modern')
  name          TEXT NOT NULL,                   -- Nombre visible (ej: 'Clásico')
  description   TEXT DEFAULT '',                 -- Descripción corta
  preview_image TEXT DEFAULT '',                 -- URL de imagen de previsualización
  category      TEXT DEFAULT 'general',          -- Categoría (general, business, portfolio, blog, etc.)
  is_active     INTEGER DEFAULT 1,               -- 1 = visible, 0 = oculto (soft delete)
  sort_order    INTEGER DEFAULT 0,               -- Orden de visualización
  version       INTEGER DEFAULT 1,               -- Versión del tema (para control de actualizaciones)
  created_at    TEXT DEFAULT (datetime('now')),   -- Fecha de creación
  updated_at    TEXT DEFAULT (datetime('now')),   -- Fecha de última modificación
  config        TEXT NOT NULL                    -- JSON con la configuración completa del tema
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_default_themes_active ON default_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_default_themes_category ON default_themes(category);
CREATE INDEX IF NOT EXISTS idx_default_themes_sort ON default_themes(sort_order);
