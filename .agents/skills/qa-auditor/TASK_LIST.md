# 🧪 QA & Testing Task List - mi-web-personalizable

> Checklist exclusivo para el **Agent Sector QA / Testing**.
> **Rol:** Auditoría sintética, prevención de regresiones, pruebas de casos de borde (*edge cases*), sanitización de datos y seguridad.
> **Comando de verificación rápida:** `npm run qa`
> Generado: Julio 2026

---

## ✅ Completado (Infraestructura y Cobertura Nivel 1)

### 1. Infraestructura de Pruebas
- [x] Configuración de Vitest + environment jsdom (`vitest.config.ts`)
- [x] Polyfill de Storage y mocks para entorno Node 22+ (`tests/setup.ts`)
- [x] Script ejecutor sintético token-efficient `npm run qa` (`scripts/qa-runner.mjs`)
- [x] Registro de Skill del Agente QA (`.agents/skills/qa-auditor/SKILL.md`)

### 2. Módulos de Sanitización y Seguridad
- [x] Crear el Módulo Central de Sanitización (`src/lib/sanitizer.ts`): `sanitizeUrl`, `escapeAttribute`, `sanitizeText`, `sanitizeSiteData`
- [x] Desinfección recursiva de Firestore contra valores `undefined` (`sanitizeData` en `firestore.ts`)
- [x] Normalización de dominios `normalizeDomain` en `domain-check.ts` y `site.ts`
- [x] Protección de formularios Admin en `SiteConfig.ts` y `onboarding.ts`
- [x] Escape defensivo contra XSS en `AdminDashboard.ts`
- [x] Ordenación defensiva y filtrado de nulos en `DynamicSections.astro`
- [x] Corrección de `<ClientRouter />` en `Layout.astro`

### 3. Suite de Pruebas Unitarias y de Frontera (54 Tests en 9 Archivos)
- [x] `tests/i18n.test.ts` (6 tests) - Motor i18n
- [x] `tests/i18n-parity.test.ts` (9 tests) - Paridad es/en y prefijos semánticos
- [x] `tests/i18n-edge-cases.test.ts` (5 tests) - Reemplazos múltiples y caracteres especiales
- [x] `tests/domain-check.test.ts` (5 tests) - Precedencia de dominios
- [x] `tests/domain-validation.test.ts` (9 tests) - Normalización de URLs y dominios
- [x] `tests/firestore-helpers.test.ts` (7 tests) - Sanitización y errores Firestore
- [x] `tests/auth-helpers.test.ts` (3 tests) - Mapeo de errores Auth
- [x] `tests/sanitizer.test.ts` (7 tests) - Sanitización XSS
- [x] `tests/ui-helpers.test.ts` (3 tests) - Ordenación y parseo de UI

---

## 📊 Estado Actual de Calidad

- **Tests unitarios pasando:** 54/54 PASS
- **Archivos de test activos:** 9 archivos
- **Auditoría sintética (`npm run qa`):** 100% PASS
- **Build de producción (`npm run build`):** 100% PASS

---

## 🚀 Próximas Tareas de QA & Testing

### 1. Auditoría de Nuevas Vistas del Panel Admin (Nivel 1 Unit Testing)
- [ ] **Tests para Perfil de Usuario (`UserProfile.ts` / `/admin/profile`)**
  - [ ] Test de auto-creación del perfil en Firestore si el documento no existe.
  - [ ] Test de validación de contraseña mínima (>=6 caracteres) y confirmación coincidente.
  - [ ] Test de sanitización del campo `photoURL` y `displayName`.
  - [ ] Test de manejo de errores de re-autenticación (`requires-recent-login`).
- [ ] **Tests para Gestión de Usuarios (`UserManager.ts` / `/admin/users`)**
  - [ ] Test de renderizado de la tabla de miembros según su rol (`admin`, `editor`, `viewer`).
  - [ ] Test de restricciones para evitar que el propietario del sitio o usuario actual se elimine.
  - [ ] Test de invitación de miembros usando sanitización de email y rol.
  - [ ] Test de actualización de estado activo/inactivo.

### 2. Testing Nivel 2: Mocks y Emulación de Firestore Rules / Auth
- [ ] Configurar el paquete `@firebase/rules-unit-testing`.
- [ ] Crear `tests/security-rules.test.ts` para verificar las reglas de Firestore:
  - [ ] Verificar que usuarios no autenticados solo puedan leer `sites/{domain}` pero no modificar nada.
  - [ ] Verificar que solo miembros con rol `admin` puedan invitar o modificar miembros en `sites/{domain}/members`.
  - [ ] Verificar que un usuario solo pueda leer y escribir su propio perfil en `users/{uid}`.

### 3. Testing Nivel 3: Pruebas E2E y Regresión Visual (Playwright)
- [ ] Configurar `@playwright/test` en el repositorio.
- [ ] Crear tests E2E para el flujo de Onboarding completo (Paso 1 Idioma ➔ Paso 2 Cuenta ➔ Paso 3 Sitio).
- [ ] Crear tests E2E para el flujo de autenticación e inicio de sesión (`/login`).
- [ ] Crear tests E2E para la edición y guardado de datos en el panel de administración (`/admin/config`).
- [ ] Crear pruebas de regresión visual para la página pública (`PublicLayout`) en escritorio y pantallas móviles.
