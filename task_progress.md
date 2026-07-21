# Plan de Implementación - COMPLETADO ✅

## Fase 1: 🔴 Firestore Rules + Estructura de Datos ✅
- [x] Rediseñar firestore.rules con modelo de roles por sitio (admin/editor/user/public)
- [x] Añadir función setDocument() en firestore.ts para usar IDs personalizados
- [x] Modificar onboarding.ts para usar dominio como ID del documento
- [x] Asignar rol admin al creador del sitio durante el registro
- [x] Optimizar checkDomain() para usar getDoc directo (dominio = ID)

## Fase 2: 🟠 Dominio Personalizado en Onboarding ✅
- [x] Añadir campo de dominio en OnboardingWizard.astro (paso 3)
- [x] Añadir lógica de validación de dominio (pre-fill, verificar disponibilidad, validar en submit)
- [x] Añadir traducciones i18n para el campo de dominio
- [x] Actualizar autofill de DevTools para incluir campo domain
- [x] Añadir estilos CSS para campo de dominio

## Fase 3: 🟡 Ruta /admin con Panel de Administración ✅
- [x] Crear src/pages/admin/index.astro
- [x] Verificar autenticación y redirigir si no está logueado
- [x] Mostrar información del sitio, configuración básica
- [x] Cerrar sesión

## Hotfix: 🐛 Redirección post-registro a /admin ✅
- [x] Optimizar getSiteData() en site.ts para usar getDoc directo (dominio = ID)
- [x] Añadir getSiteByOwnerId() para buscar sitio por UID del usuario
- [x] Actualizar /admin para usar fallback: primero por dominio, luego por ownerId
- [x] Mover carga de información del sitio al cliente (loadSiteInfo + loadSettings)
- [x] Eliminar dependencia de datos server-side (siteData/siteError) que fallaban en localhost
- [x] Guardar dominio registrado en sessionStorage ("registered-domain") antes de redirigir a /admin
- [x] getEffectiveDomain() ahora lee registered-domain como prioridad máxima (one-time use)

---

## 📋 Resumen de Archivos Modificados/Creados

### Archivos modificados:
- `firebase/firestore.rules` - Roles por sitio (admin/editor/user)
- `src/lib/firebase/firestore.ts` - Nueva función setDocument()
- `src/lib/firebase/index.ts` - Exportar setDocument
- `src/lib/domain-check.ts` - Interfaz Site con ownerUsername, checkDomain optimizado
- `src/components/admin/onboarding.ts` - Validación de dominio, pre-fill, verificación
- `src/components/admin/OnboardingWizard.astro` - Campo de dominio en paso 3
- `src/components/devtools/onboarding-autofill.ts` - Campo domain en autofill
- `src/styles/onboarding.css` - Estilos para domain-field, domain-status
- `src/lib/i18n/modules/onboarding.ts` - Traducciones para campo de dominio
- **`src/lib/site.ts`** - getSiteData optimizado (getDoc directo) + nueva función getSiteByOwnerId()
- **`src/pages/admin/index.astro`** - Fallback por ownerId cuando no se encuentra por dominio

### Archivos creados:
- `src/pages/admin/index.astro` - Panel de administración con autenticación

### Build:
