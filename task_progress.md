# Plan de Implementación y Estado del Proyecto - ACTUALIZADO ✅

## Fase 1: 🔴 Firestore Rules + Estructura de Datos ✅
- [x] Rediseñar `firestore.rules` con modelo de roles por sitio (admin/editor/user/public)
- [x] Añadir función `setDocument()` en `firestore.ts` para usar IDs personalizados
- [x] Modificar `onboarding.ts` para usar dominio como ID del documento
- [x] Asignar rol `admin` al creador del sitio durante el registro
- [x] Optimizar `checkDomain()` para usar `getDoc` directo (dominio = ID)

## Fase 2: 🟠 Dominio Personalizado en Onboarding ✅
- [x] Añadir campo de dominio en `OnboardingWizard.astro` (paso 3)
- [x] Añadir lógica de validación de dominio (pre-fill, verificar disponibilidad, validar en submit)
- [x] Añadir traducciones i18n para el campo de dominio
- [x] Actualizar autofill de DevTools para incluir campo domain
- [x] Añadir estilos CSS para campo de dominio

## Fase 3: 🟡 Ruta /admin con Panel de Administración ✅
- [x] Crear `src/pages/admin/index.astro`
- [x] Verificar autenticación y redirigir si no está logueado
- [x] Mostrar información del sitio, configuración básica
- [x] Cerrar sesión

## Fase 4: 🔵 PublicLayout Dinámico ✅
- [x] Ampliar interfaz `SiteData` en `src/lib/site.ts`
- [x] Crear `src/components/public/PublicLayout.astro` 100% dinámico desde Firestore
- [x] Sincronizar componentes públicos (`Navbar`, `HeroSection`, `DynamicSections`, `SocialLinks`, `Footer`)

## Fase 5: 🛡️ Infraestructura de Testing, Sanitización y QA Sintético ✅
- [x] Configuración de Vitest + jsdom (`vitest.config.ts`, `tests/setup.ts`)
- [x] Creación del script ejecutor sintético token-efficient `scripts/qa-runner.mjs` (`npm run qa`)
- [x] Creación del módulo central de sanitización `src/lib/sanitizer.ts` (`sanitizeUrl`, `escapeAttribute`, `sanitizeText`, `sanitizeSiteData`)
- [x] Desinfección defensiva de Firestore (`sanitizeData` contra valores `undefined`)
- [x] Normalización de dominios `normalizeDomain` en `domain-check.ts` y `site.ts`
- [x] Creación de Skill del Agente de QA en `.agents/skills/qa-auditor/SKILL.md`
- [x] Suite de **54 pruebas unitarias en 9 archivos de test** (`tests/`)

---

## 📋 Resumen de Archivos Recientes de QA & Testing

### Archivos creados:
- `vitest.config.ts` - Configuración de Vitest con entorno jsdom
- `tests/setup.ts` - Setup de entorno con polyfill de Storage y Firebase mocks
- `scripts/qa-runner.mjs` - Ejecutor sintético de QA token-efficient (`npm run qa`)
- `src/lib/sanitizer.ts` - Módulo central de sanitización y seguridad XSS
- `.agents/skills/qa-auditor/SKILL.md` - Skill del Agente QA / Testing
- `tests/i18n.test.ts` - Pruebas del motor i18n
- `tests/i18n-parity.test.ts` - Pruebas de paridad es/en y prefijos semánticos
- `tests/i18n-edge-cases.test.ts` - Pruebas de casos al límite i18n
- `tests/domain-check.test.ts` - Pruebas de utilidades de dominio
- `tests/domain-validation.test.ts` - Pruebas de normalización de dominios
- `tests/firestore-helpers.test.ts` - Pruebas de sanitización Firestore y errores
- `tests/auth-helpers.test.ts` - Pruebas de mapeo de errores Auth
- `tests/sanitizer.test.ts` - Pruebas de sanitización de URLs, atributos y objetos
- `tests/ui-helpers.test.ts` - Pruebas de ordenación defensiva de UI

### Módulos sanitizados y protegidos:
- `src/lib/i18n/index.ts` - Reemplazo global `replaceAll` y manejo defensivo
- `src/lib/domain-check.ts` - Normalización de dominios
- `src/lib/site.ts` - Normalización de dominios al consultar `getSiteData`
- `src/lib/firebase/firestore.ts` - Auto-sanitización contra `undefined` y manejo de errores
- `src/lib/firebase/auth.ts` - Mapeo de errores robusto
- `src/components/admin/SiteConfig.ts` - Sanitización en `collectFormData` y `escapeAttribute`
- `src/components/admin/onboarding.ts` - Sanitización en creación de sitio
- `src/components/admin/AdminDashboard.ts` - Escape defensivo en `innerHTML`
- `src/components/public/DynamicSections.astro` - Ordenación defensiva y filtrado de nulos
- `src/layouts/Layout.astro` - Fix de `<ClientRouter />`

---

## 📊 Estado Actual

- **Pruebas Unitarias:** 54/54 PASS
- **Auditoría Sintética QA:** `npm run qa` ➔ 100% PASS
- **Build estático Astro:** `npm run build` ➔ 100% PASS
