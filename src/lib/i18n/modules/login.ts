// ============================================
// i18n - Traducciones de la página de login
// ============================================

import type { TranslationModule } from "../index";

const loginModule: TranslationModule = {
  es: {
    "login-title": "Iniciar sesión",
    "login-subtitle": "Accede al panel de administración de tu sitio",
    "btn-google": "Iniciar sesión con Google",
    "divider-text": "o con correo electrónico",
    "label-email": "Correo electrónico",
    "placeholder-email": "tu@email.com",
    "label-password": "Contraseña",
    "placeholder-password": "Tu contraseña",
    "btn-login": "Iniciar sesión",
    "login-loading": "Verificando credenciales...",
    "role-checking": "Verificando permisos de acceso...",
    "access-denied-title": "Acceso denegado",
    "access-denied-desc": "No tienes permisos para acceder al panel de administración de este sitio.",
    "access-denied-contact": "Contacta al administrador del sitio si necesitas acceso.",
    "back-home": "← Volver al inicio",
    "err-email-empty": "El correo electrónico es obligatorio.",
    "err-email-invalid": "El correo electrónico no es válido.",
    "err-password-empty": "La contraseña es obligatoria.",
    "err-login-generic": "Error al iniciar sesión.",
    "err-login-canceled": "Inicio de sesión cancelado.",
    "err-login-google": "Error al iniciar sesión con Google.",
  },
  en: {
    "login-title": "Sign in",
    "login-subtitle": "Access your site's admin panel",
    "btn-google": "Sign in with Google",
    "divider-text": "or with email",
    "label-email": "Email",
    "placeholder-email": "your@email.com",
    "label-password": "Password",
    "placeholder-password": "Your password",
    "btn-login": "Sign in",
    "login-loading": "Verifying credentials...",
    "role-checking": "Checking access permissions...",
    "access-denied-title": "Access denied",
    "access-denied-desc": "You don't have permission to access this site's admin panel.",
    "access-denied-contact": "Contact the site administrator if you need access.",
    "back-home": "← Back to home",
    "err-email-empty": "Email is required.",
    "err-email-invalid": "Invalid email format.",
    "err-password-empty": "Password is required.",
    "err-login-generic": "Login error.",
    "err-login-canceled": "Login canceled.",
    "err-login-google": "Google login error.",
  },
};

export default loginModule;