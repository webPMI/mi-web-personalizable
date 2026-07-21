// ============================================
// admin - Traducciones del panel de administración
// ============================================
//
// Prefijos usados:
//   title-*    → Títulos de página
//   nav-*      → Navegación
//   label-*    → Etiquetas de formulario
//   placeholder-* → Placeholders
//   btn-*      → Botones
//   success-*  → Mensajes de éxito
//   err-*      → Mensajes de error
//   loading-*  → Estados de carga
//   empty-*    → Estados vacíos
//   desc-*     → Descripciones
//   section-*  → Secciones del formulario
//   hint-*     → Ayudas
// ============================================

import type { TranslationModule } from "../index";

const admin: TranslationModule = {
  es: {
    // --- Títulos ---
    "title-dashboard": "Dashboard",
    "title-config": "Configuración del Sitio",

    // --- Navegación ---
    "nav-dashboard": "Dashboard",
    "nav-config": "Configuración",

    // --- Estados globales ---
    "loading-auth": "Verificando autenticación...",
    "title-unauthenticated": "Acceso restringido",
    "desc-unauthenticated": "Debes iniciar sesión para acceder al panel de administración.",
    "btn-back-home": "Volver al inicio",
    "title-no-site": "No hay sitio registrado",
    "desc-no-site": "El dominio {domain} no tiene un sitio registrado. Si acabas de registrarte, espera unos segundos y recarga la página.",
    "btn-refresh": "Recargar página",
    "btn-logout": "Cerrar sesión",

    // --- Dashboard ---
    "dashboard-managing": "Gestionando: {domain}",
    "dashboard-title": "Panel de Administración",
    "dashboard-section-site": "Información del Sitio",
    "dashboard-loading-site": "Cargando información del sitio...",
    "dashboard-label-domain": "Dominio",
    "dashboard-label-status": "Estado",
    "dashboard-label-registered": "Fecha de registro",
    "dashboard-label-owner": "Propietario",
    "dashboard-status-active": "Activo",
    "dashboard-status-pending": "Pendiente",
    "dashboard-error-load": "No se pudo cargar la información del sitio.",
    "dashboard-error-fatal": "Error al cargar la información del sitio.",
    "dashboard-section-upcoming": "Próximamente",
    "dashboard-upcoming-posts": "Gestión de contenido (posts, páginas)",
    "dashboard-upcoming-theme": "Personalización de tema y diseño",
    "dashboard-upcoming-members": "Gestión de miembros y roles",
    "dashboard-upcoming-analytics": "Analíticas del sitio",
    "dashboard-upcoming-seo": "Configuración SEO",

    // --- Configuración: General ---
    "config-title": "Configuración del Sitio",
    "config-desc": "Aquí puedes gestionar toda la configuración de tu sitio web.",
    "config-section-general": "Información General",
    "config-label-site-name": "Nombre del sitio",
    "config-placeholder-site-name": "Mi sitio web",
    "config-label-site-description": "Descripción",
    "config-placeholder-site-description": "Breve descripción de tu sitio",
    "config-label-locale": "Idioma principal",
    "config-option-es": "Español",
    "config-option-en": "English",
    "config-loading": "Cargando configuración...",
    "config-no-data": "No hay configuración guardada aún.",
    "config-error-load": "Error al cargar la configuración.",
    "config-error-save": "Error al guardar la configuración.",
    "btn-save": "Guardar cambios",
    "btn-saving": "Guardando...",
    "success-saved": "Cambios guardados correctamente.",

    // --- Configuración: Redes Sociales ---
    "config-section-social": "Redes Sociales",
    "config-desc-social": "Enlaces a tus perfiles en redes sociales. Se mostrarán en la página pública.",
    "config-label-twitter": "Twitter / X",
    "config-placeholder-twitter": "https://twitter.com/tuusuario",
    "config-label-github": "GitHub",
    "config-placeholder-github": "https://github.com/tuusuario",
    "config-label-linkedin": "LinkedIn",
    "config-placeholder-linkedin": "https://linkedin.com/in/tuusuario",
    "config-label-instagram": "Instagram",
    "config-placeholder-instagram": "https://instagram.com/tuusuario",

    // --- Configuración: Hero ---
    "config-section-hero": "Hero (Portada)",
    "config-desc-hero": "Personaliza la sección principal de tu página de inicio.",
    "config-label-hero-title": "Título del Hero",
    "config-placeholder-hero-title": "Bienvenido a mi sitio",
    "config-label-hero-subtitle": "Subtítulo",
    "config-placeholder-hero-subtitle": "Una breve descripción impactante",
    "config-label-hero-image": "URL de imagen de fondo",
    "config-placeholder-hero-image": "https://ejemplo.com/imagen.jpg",
    "config-label-hero-cta-text": "Texto del botón CTA",
    "config-placeholder-hero-cta-text": "Comenzar ahora",
    "config-label-hero-cta-link": "Enlace del botón CTA",
    "config-placeholder-hero-cta-link": "/about",

    // --- Configuración: Navbar ---
    "config-section-navbar": "Barra de Navegación",
    "config-desc-navbar": "Configura los enlaces que aparecen en el menú de navegación.",
    "config-label-nav-label": "Texto del enlace",
    "config-placeholder-nav-label": "Inicio",
    "config-label-nav-href": "URL del enlace",
    "config-placeholder-nav-href": "/",
    "config-btn-add-nav": "Añadir enlace",
    "config-btn-remove-nav": "Eliminar",

    // --- Configuración: SEO ---
    "config-section-seo": "SEO (Optimización para buscadores)",
    "config-desc-seo": "Configura cómo aparece tu sitio en los resultados de búsqueda.",
    "config-label-seo-title": "Título por defecto",
    "config-placeholder-seo-title": "Mi Sitio Web - Inicio",
    "config-label-seo-description": "Descripción por defecto",
    "config-placeholder-seo-description": "Descripción breve para los buscadores",
    "config-label-seo-image": "URL de imagen Open Graph",
    "config-placeholder-seo-image": "https://ejemplo.com/og-image.jpg",

    // --- Configuración: Tema ---
    "config-section-theme": "Tema y Apariencia",
    "config-desc-theme": "Personaliza los colores y la apariencia de tu sitio.",
    "config-label-theme-primary": "Color primario",
    "config-placeholder-theme-primary": "#6366f1",
    "config-label-theme-font": "Fuente tipográfica",
    "config-placeholder-theme-font": "Inter, sans-serif",
    "config-label-theme-layout": "Diseño",
    "config-option-layout-centered": "Centrado",
    "config-option-layout-full": "Ancho completo",
  },

  en: {
    // --- Titles ---
    "title-dashboard": "Dashboard",
    "title-config": "Site Configuration",

    // --- Navigation ---
    "nav-dashboard": "Dashboard",
    "nav-config": "Settings",

    // --- Global states ---
    "loading-auth": "Checking authentication...",
    "title-unauthenticated": "Access Restricted",
    "desc-unauthenticated": "You must log in to access the admin panel.",
    "btn-back-home": "Back to home",
    "title-no-site": "No site registered",
    "desc-no-site": "The domain {domain} does not have a registered site. If you just registered, wait a few seconds and reload the page.",
    "btn-refresh": "Reload page",
    "btn-logout": "Log out",

    // --- Dashboard ---
    "dashboard-managing": "Managing: {domain}",
    "dashboard-title": "Admin Panel",
    "dashboard-section-site": "Site Information",
    "dashboard-loading-site": "Loading site information...",
    "dashboard-label-domain": "Domain",
    "dashboard-label-status": "Status",
    "dashboard-label-registered": "Registration date",
    "dashboard-label-owner": "Owner",
    "dashboard-status-active": "Active",
    "dashboard-status-pending": "Pending",
    "dashboard-error-load": "Could not load site information.",
    "dashboard-error-fatal": "Error loading site information.",
    "dashboard-section-upcoming": "Coming Soon",
    "dashboard-upcoming-posts": "Content management (posts, pages)",
    "dashboard-upcoming-theme": "Theme and design customization",
    "dashboard-upcoming-members": "Member and role management",
    "dashboard-upcoming-analytics": "Site analytics",
    "dashboard-upcoming-seo": "SEO configuration",

    // --- Settings: General ---
    "config-title": "Site Configuration",
    "config-desc": "Here you can manage all your site settings.",
    "config-section-general": "General Information",
    "config-label-site-name": "Site name",
    "config-placeholder-site-name": "My website",
    "config-label-site-description": "Description",
    "config-placeholder-site-description": "Brief description of your site",
    "config-label-locale": "Main language",
    "config-option-es": "Español",
    "config-option-en": "English",
    "config-loading": "Loading settings...",
    "config-no-data": "No settings saved yet.",
    "config-error-load": "Error loading settings.",
    "config-error-save": "Error saving settings.",
    "btn-save": "Save changes",
    "btn-saving": "Saving...",
    "success-saved": "Changes saved successfully.",

    // --- Settings: Social Links ---
    "config-section-social": "Social Links",
    "config-desc-social": "Links to your social media profiles. They will be shown on the public page.",
    "config-label-twitter": "Twitter / X",
    "config-placeholder-twitter": "https://twitter.com/yourusername",
    "config-label-github": "GitHub",
    "config-placeholder-github": "https://github.com/yourusername",
    "config-label-linkedin": "LinkedIn",
    "config-placeholder-linkedin": "https://linkedin.com/in/yourusername",
    "config-label-instagram": "Instagram",
    "config-placeholder-instagram": "https://instagram.com/yourusername",

    // --- Settings: Hero ---
    "config-section-hero": "Hero Section",
    "config-desc-hero": "Customize the main section of your homepage.",
    "config-label-hero-title": "Hero Title",
    "config-placeholder-hero-title": "Welcome to my site",
    "config-label-hero-subtitle": "Subtitle",
    "config-placeholder-hero-subtitle": "A short impactful description",
    "config-label-hero-image": "Background image URL",
    "config-placeholder-hero-image": "https://example.com/image.jpg",
    "config-label-hero-cta-text": "CTA button text",
    "config-placeholder-hero-cta-text": "Get started",
    "config-label-hero-cta-link": "CTA button link",
    "config-placeholder-hero-cta-link": "/about",

    // --- Settings: Navbar ---
    "config-section-navbar": "Navigation Bar",
    "config-desc-navbar": "Configure the links that appear in the navigation menu.",
    "config-label-nav-label": "Link text",
    "config-placeholder-nav-label": "Home",
    "config-label-nav-href": "Link URL",
    "config-placeholder-nav-href": "/",
    "config-btn-add-nav": "Add link",
    "config-btn-remove-nav": "Remove",

    // --- Settings: SEO ---
    "config-section-seo": "SEO (Search Engine Optimization)",
    "config-desc-seo": "Configure how your site appears in search results.",
    "config-label-seo-title": "Default title",
    "config-placeholder-seo-title": "My Website - Home",
    "config-label-seo-description": "Default description",
    "config-placeholder-seo-description": "Brief description for search engines",
    "config-label-seo-image": "Open Graph image URL",
    "config-placeholder-seo-image": "https://example.com/og-image.jpg",

    // --- Settings: Theme ---
    "config-section-theme": "Theme & Appearance",
    "config-desc-theme": "Customize the colors and appearance of your site.",
    "config-label-theme-primary": "Primary color",
    "config-placeholder-theme-primary": "#6366f1",
    "config-label-theme-font": "Font family",
    "config-placeholder-theme-font": "Inter, sans-serif",
    "config-label-theme-layout": "Layout",
    "config-option-layout-centered": "Centered",
    "config-option-layout-full": "Full width",
  },
};

export default admin;
