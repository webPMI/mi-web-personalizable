// ============================================
// i18n - Traducciones del onboarding
// ============================================

import type { TranslationModule } from "../index";

const onboarding: TranslationModule = {
  es: {
    // --- Paso 1: Idioma ---
    "step-1-title": "Selecciona tu idioma",
    "step-1-description": "Elige el idioma que prefieras para tu sitio web.",
    "lang-es": "Español",
    "lang-en": "English",
    "lang-es-desc": "Idioma por defecto para tu sitio",
    "lang-en-desc": "Default language for your site",

    // --- Paso 2: Cuenta ---
    "step-2-title": "Tu cuenta",
    "label-username": "Nombre de usuario",
    "placeholder-username": "Ej: juanperez",
    "label-name": "Nombre completo",
    "placeholder-name": "Ej: Juan Pérez",
    "label-email": "Correo electrónico",
    "placeholder-email": "tu@email.com",
    "label-password": "Contraseña",
    "placeholder-password": "Mínimo 6 caracteres",
    "label-password-confirm": "Confirmar contraseña",
    "placeholder-password-confirm": "Repite la contraseña",
    "password-toggle-show": "Mostrar",
    "password-toggle-hide": "Ocultar",
    "password-hint-min": "Mínimo 6 caracteres",
    "password-hint-weak": "Débil",
    "password-hint-medium": "Media",
    "password-hint-strong": "Fuerte",
    "password-hint-missing": "Faltan {n} caracteres",
    "password-hint-label": "Contraseña {level}",

    // --- Paso 3: Sitio ---
    "step-3-title": "Información de tu sitio",
    "label-domain": "Tu dominio",
    "placeholder-domain": "Ej: tudominio.com",
    "hint-domain": "Puedes usar el dominio detectado o escribir uno personalizado.",
    "err-domain-required": "El dominio es obligatorio.",
    "err-domain-invalid": "Introduce un dominio válido (ej: tudominio.com).",
    "err-domain-taken": "Este dominio ya está registrado. Prueba con otro.",
    "btn-check-domain": "Verificar disponibilidad",
    "domain-available": "✅ {domain} está disponible",
    "domain-unavailable": "❌ {domain} no está disponible",
    "label-site-name": "Nombre del sitio",
    "placeholder-site-name": "Ej: Mi Blog Personal",
    "label-site-description": "Descripción breve",
    "placeholder-site-description": "Ej: Un blog sobre tecnología y desarrollo web",

    // --- Botón submit ---
    "btn-create-account": "Crear cuenta y registrar sitio",

    // --- Estados ---
    "loading-text": "Creando tu cuenta y registrando el sitio...",
    "success-title": "¡Todo listo!",
    "success-welcome": "Bienvenido, {name}",
    "success-domain-registered": "Tu dominio {domain} ha sido registrado.",
    "success-redirecting": "Redirigiendo al panel de administración...",

    // --- Errores de validación ---
    "err-username-required": "El nombre de usuario es obligatorio.",
    "err-name-required": "El nombre completo es obligatorio.",
    "err-email-required": "El correo electrónico es obligatorio.",
    "err-email-invalid": "Introduce un correo electrónico válido.",
    "err-password-required": "La contraseña es obligatoria.",
    "err-password-min": "La contraseña debe tener al menos 6 caracteres.",
    "err-password-confirm-required": "Debes confirmar la contraseña.",
    "err-password-confirm-mismatch": "Las contraseñas no coinciden.",
    "err-site-name-required": "El nombre del sitio es obligatorio.",
    "err-auth-error": "Error al crear la cuenta.",
    "err-domain-error": "Error al registrar el dominio. Contacta con soporte.",

    // --- Configuración del sitio ---
    "config-title": "Configura tu sitio web",
    "config-domain-info": "Vas a registrar y configurar el dominio: {domain}",
  },
  en: {
    // --- Step 1: Language ---
    "step-1-title": "Select your language",
    "step-1-description": "Choose the language you prefer for your website.",
    "lang-es": "Español",
    "lang-en": "English",
    "lang-es-desc": "Default language for your site",
    "lang-en-desc": "Default language for your site",

    // --- Step 2: Account ---
    "step-2-title": "Your account",
    "label-username": "Username",
    "placeholder-username": "e.g. johndoe",
    "label-name": "Full name",
    "placeholder-name": "e.g. John Doe",
    "label-email": "Email address",
    "placeholder-email": "you@email.com",
    "label-password": "Password",
    "placeholder-password": "Minimum 6 characters",
    "label-password-confirm": "Confirm password",
    "placeholder-password-confirm": "Repeat password",
    "password-toggle-show": "Show",
    "password-toggle-hide": "Hide",
    "password-hint-min": "Minimum 6 characters",
    "password-hint-weak": "Weak",
    "password-hint-medium": "Medium",
    "password-hint-strong": "Strong",
    "password-hint-missing": "{n} characters left",
    "password-hint-label": "Password {level}",

    // --- Step 3: Site ---
    "step-3-title": "Your site information",
    "label-domain": "Your domain",
    "placeholder-domain": "e.g. yourdomain.com",
    "hint-domain": "You can use the detected domain or enter a custom one.",
    "err-domain-required": "Domain is required.",
    "err-domain-invalid": "Enter a valid domain (e.g. yourdomain.com).",
    "err-domain-taken": "This domain is already taken. Try another one.",
    "btn-check-domain": "Check availability",
    "domain-available": "✅ {domain} is available",
    "domain-unavailable": "❌ {domain} is not available",
    "label-site-name": "Site name",
    "placeholder-site-name": "e.g. My Personal Blog",
    "label-site-description": "Short description",
    "placeholder-site-description": "e.g. A blog about technology and web development",

    // --- Submit button ---
    "btn-create-account": "Create account & register site",

    // --- States ---
    "loading-text": "Creating your account and registering the site...",
    "success-title": "All set!",
    "success-welcome": "Welcome, {name}",
    "success-domain-registered": "Your domain {domain} has been registered.",
    "success-redirecting": "Redirecting to the admin panel...",

    // --- Validation errors ---
    "err-username-required": "Username is required.",
    "err-name-required": "Full name is required.",
    "err-email-required": "Email address is required.",
    "err-email-invalid": "Enter a valid email address.",
    "err-password-required": "Password is required.",
    "err-password-min": "Password must be at least 6 characters.",
    "err-password-confirm-required": "You must confirm your password.",
    "err-password-confirm-mismatch": "Passwords do not match.",
    "err-site-name-required": "Site name is required.",
    "err-auth-error": "Error creating account.",
    "err-domain-error": "Error registering domain. Contact support.",

    // --- Site configuration ---
    "config-title": "Set up your website",
    "config-domain-info": "You are about to register and configure the domain: {domain}",
  },
};

export default onboarding;
