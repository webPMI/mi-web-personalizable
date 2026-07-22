// ============================================
// scripts/seed-default-themes.mjs
// ============================================
// Seed data para los 3 temas iniciales del sistema.
// Ejecutar: node scripts/seed-default-themes.mjs
// O: npx wrangler d1 execute mi-web-personalizable-db --file=./scripts/seed-default-themes.sql
// ============================================

const THEMES = [
  {
    id: "classic",
    name: "Clásico",
    description: "Estilo tradicional y elegante con tipografía serif. Ideal para negocios, despachos y sitios corporativos.",
    preview_image: "/images/themes/classic-preview.png",
    category: "business",
    sort_order: 1,
    config: {
      // Colores principales
      primaryColor: "#1e3a5f",
      secondaryColor: "#3b82f6",
      accentColor: "#2563eb",

      // Fondo y texto
      bgColor: "#fafaf9",
      textColor: "#292524",
      textMutedColor: "#78716c",

      // Componentes
      navbarBg: "#ffffff",
      navbarText: "#292524",
      navbarBorder: "#e5e7eb",
      footerBg: "#1e3a5f",
      footerText: "#fafaf9",
      footerLinkOpacity: 0.7,
      cardBg: "#ffffff",
      cardBorder: "#e5e7eb",
      cardRadius: 4,
      cardShadow: "0 1px 2px rgba(0,0,0,0.05)",
      sectionAltBg: "#f5f5f4",
      socialBg: "#f5f5f4",

      // Tipografía
      fontFamily: "'Merriweather', Georgia, serif",
      fontHeadings: "'Playfair Display', Georgia, serif",
      fontSizeBase: 17,
      fontWeight: "400",
      lineHeight: 1.7,
      headingLineHeight: 1.3,
      h1Size: "2.5rem",
      h2Size: "2rem",
      h3Size: "1.25rem",

      // Layout
      layout: "centered",
      maxWidth: 1100,
      sectionGap: 64,
      containerPadding: 24,
      borderRadius: 4,

      // Hero
      heroHeight: "450px",
      heroAlign: "center",
      heroOverlayColor: "#000000",
      heroOverlayOpacity: 0.35,
      heroTextColor: "#ffffff",
      heroTitleSize: "3rem",
      heroTitleWeight: "700",
      heroSubtitleSize: "1.25rem",
      heroSubtitleColor: "rgba(255,255,255,0.9)",

      // Botones
      btnStyle: "filled",
      btnBorderRadius: 4,
      btnPaddingX: 28,
      btnPaddingY: 12,
      btnTextColor: "#ffffff",
      btnHoverBg: "rgba(30, 58, 95, 0.08)",

      // Enlaces
      linkHoverDecoration: "underline",
      navbarLinkOpacity: 0.8,
    },
  },
  {
    id: "modern",
    name: "Moderno",
    description: "Diseño contemporáneo con colores vibrantes. Perfecto para startups, tech y portfolios creativos.",
    preview_image: "/images/themes/modern-preview.png",
    category: "general",
    sort_order: 2,
    config: {
      // Colores principales
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#4f46e5",

      // Fondo y texto
      bgColor: "#ffffff",
      textColor: "#1a1a2e",
      textMutedColor: "#6b7280",

      // Componentes
      navbarBg: "#ffffff",
      navbarText: "#1a1a2e",
      navbarBorder: "#e5e7eb",
      footerBg: "#1e1b4b",
      footerText: "#e0e7ff",
      footerLinkOpacity: 0.7,
      cardBg: "#ffffff",
      cardBorder: "#e5e7eb",
      cardRadius: 12,
      cardShadow: "0 1px 3px rgba(0,0,0,0.05)",
      sectionAltBg: "#f9fafb",
      socialBg: "#f8fafc",

      // Tipografía
      fontFamily: "'Inter', system-ui, sans-serif",
      fontHeadings: "'Poppins', system-ui, sans-serif",
      fontSizeBase: 16,
      fontWeight: "400",
      lineHeight: 1.6,
      headingLineHeight: 1.3,
      h1Size: "2.5rem",
      h2Size: "2rem",
      h3Size: "1.25rem",

      // Layout
      layout: "full-width",
      maxWidth: 1200,
      sectionGap: 80,
      containerPadding: 24,
      borderRadius: 8,

      // Hero
      heroHeight: "600px",
      heroAlign: "center",
      heroOverlayColor: "#000000",
      heroOverlayOpacity: 0.4,
      heroTextColor: "#ffffff",
      heroTitleSize: "3rem",
      heroTitleWeight: "800",
      heroSubtitleSize: "1.25rem",
      heroSubtitleColor: "rgba(255,255,255,0.9)",

      // Botones
      btnStyle: "filled",
      btnBorderRadius: 8,
      btnPaddingX: 24,
      btnPaddingY: 14,
      btnTextColor: "#ffffff",
      btnHoverBg: "rgba(79, 70, 229, 0.08)",

      // Enlaces
      linkHoverDecoration: "underline",
      navbarLinkOpacity: 0.8,
    },
  },
  {
    id: "dark",
    name: "Oscuro",
    description: "Tema oscuro moderno con acentos brillantes. Ideal para portfolios, gaming y sitios con personalidad.",
    preview_image: "/images/themes/dark-preview.png",
    category: "portfolio",
    sort_order: 3,
    config: {
      // Colores principales
      primaryColor: "#818cf8",
      secondaryColor: "#a78bfa",
      accentColor: "#6366f1",

      // Fondo y texto
      bgColor: "#0f172a",
      textColor: "#e2e8f0",
      textMutedColor: "#94a3b8",

      // Componentes
      navbarBg: "#1e293b",
      navbarText: "#e2e8f0",
      navbarBorder: "#334155",
      footerBg: "#020617",
      footerText: "#94a3b8",
      footerLinkOpacity: 0.7,
      cardBg: "#1e293b",
      cardBorder: "#334155",
      cardRadius: 12,
      cardShadow: "0 4px 6px rgba(0,0,0,0.2)",
      sectionAltBg: "#0f172a",
      socialBg: "#1e293b",

      // Tipografía
      fontFamily: "'Inter', system-ui, sans-serif",
      fontHeadings: "'Montserrat', system-ui, sans-serif",
      fontSizeBase: 16,
      fontWeight: "300",
      lineHeight: 1.7,
      headingLineHeight: 1.3,
      h1Size: "2.5rem",
      h2Size: "2rem",
      h3Size: "1.25rem",

      // Layout
      layout: "centered",
      maxWidth: 1200,
      sectionGap: 72,
      containerPadding: 24,
      borderRadius: 10,

      // Hero
      heroHeight: "450px",
      heroAlign: "center",
      heroOverlayColor: "#000000",
      heroOverlayOpacity: 0.5,
      heroTextColor: "#ffffff",
      heroTitleSize: "3rem",
      heroTitleWeight: "700",
      heroSubtitleSize: "1.25rem",
      heroSubtitleColor: "rgba(255,255,255,0.85)",

      // Botones
      btnStyle: "filled",
      btnBorderRadius: 10,
      btnPaddingX: 28,
      btnPaddingY: 14,
      btnTextColor: "#ffffff",
      btnHoverBg: "rgba(129, 140, 248, 0.1)",

      // Enlaces
      linkHoverDecoration: "underline",
      navbarLinkOpacity: 0.8,
    },
  },
];

// ============================================
// Modo SQL directo (para wrangler d1 execute)
// ============================================
function generateSql() {
  const lines = [
    `-- Seed data for default_themes`,
    `-- Generated: ${new Date().toISOString()}`,
    ``,
  ];

  for (const theme of THEMES) {
    const configJson = JSON.stringify(theme.config).replace(/'/g, "''");
    lines.push(
      `INSERT OR REPLACE INTO default_themes (id, name, description, preview_image, category, sort_order, config) VALUES`
    );
    lines.push(
      `('${theme.id}', '${theme.name}', '${theme.description}', '${theme.preview_image}', '${theme.category}', ${theme.sort_order}, '${configJson}');`
    );
    lines.push(``);
  }

  return lines.join("\n");
}

// ============================================
// Modo JavaScript (para node scripts/seed-default-themes.mjs)
// ============================================
async function seedViaApi() {
  const API_BASE = process.env.API_BASE || "http://localhost:4321/api/admin/themes";
  const TOKEN = process.env.AUTH_TOKEN;

  if (!TOKEN) {
    console.error("❌ AUTH_TOKEN environment variable is required");
    console.error("   Usage: AUTH_TOKEN=<firebase-token> node scripts/seed-default-themes.mjs");
    process.exit(1);
  }

  console.log(`🌱 Seeding ${THEMES.length} themes via API...\n`);

  for (const theme of THEMES) {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(theme),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`  ✅ ${theme.name} (${theme.id}) — Creado`);
      } else {
        console.log(`  ⚠️  ${theme.name} (${theme.id}) — ${result.error || "Error"}`);
      }
    } catch (error) {
      console.error(`  ❌ ${theme.name} (${theme.id}) — Error de conexión:`, error);
    }
  }

  console.log(`\n✨ Seed completed!`);
}

// ============================================
// Main
// ============================================
if (process.argv[1]?.endsWith("seed-default-themes.mjs")) {
  // Si se ejecuta directamente: node scripts/seed-default-themes.mjs
  if (process.env.AUTH_TOKEN) {
    seedViaApi();
  } else {
    // Generar SQL para usar con wrangler
    console.log(generateSql());
  }
}

export { THEMES, generateSql, seedViaApi };
