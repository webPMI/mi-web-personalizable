# 📋 TASK LIST — Sector Admin

> **Skill:** `sector-admin`
> **Última actualización:** 2026-08-01
> **Estado:** Pendiente de implementación (Fases 1-3)

---

## 🔴 Fase 1: Perfil de Usuario (`/admin/profile`)

**Especificación:** `docs/admin-profile-users-strategy.md` — Sección 5.1

### Archivos a crear
- [ ] `src/pages/admin/profile.astro` — Página Astro (~120 líneas)
  - Importar AdminLayout
  - Formulario HTML: email (readonly), nombre, foto URL, contraseña, confirmar contraseña
  - Botones: Guardar cambios, Cerrar sesión
  - Estados: loading, feedback (éxito/error)
- [ ] `src/components/admin/UserProfile.ts` — Lógica JS (~250 líneas)
  - `initUserProfile()` — Punto de entrada, escucha `admin:ready`
  - `loadProfile()` — Lee `users/{uid}`, crea si no existe, rellena formulario
  - `setupSaveHandler()` — Valida, guarda en Firestore + Auth, muestra feedback
  - `setupLogoutHandler()` — Cierra sesión
  - `validateProfileForm()` — Valida nombre, contraseña, confirmación
  - `showProfileFeedback()` — Muestra feedback visual

### Archivos a modificar
- [ ] `src/components/admin/AdminLayout.astro` — Añadir enlace "Perfil" en el nav
- [ ] `src/lib/i18n/modules/admin.ts` — Añadir ~20 keys de traducción (`profile-*`)

### Validación
- [ ] `npm run build` exitoso
- [ ] `npm run qa` sin regresiones
- [ ] Probar: cargar perfil, editar nombre, cambiar contraseña, cerrar sesión

---

## 🟠 Fase 2: Gestión de Usuarios (`/admin/users`)

**Especificación:** `docs/admin-profile-users-strategy.md` — Sección 5.2

### Archivos a crear
- [ ] `src/pages/admin/users.astro` — Página Astro (~150 líneas)
  - Importar AdminLayout
  - Tabla HTML: Usuario, Email, Rol, Estado, Acciones
  - Botón "Invitar miembro" + formulario de invitación (email, rol)
  - Estados: loading, empty, feedback
- [ ] `src/components/admin/UserManager.ts` — Lógica JS (~350 líneas)
  - `initUserManager()` — Punto de entrada
  - `loadMembers(siteDomain)` — Lista miembros de `sites/{domain}/members`
  - `renderMembersTable()` — Construye tabla HTML
  - `renderMemberRow()` — Fila individual con avatar, badges, selectores
  - `handleInvite()` — Crea documento en `sites/{domain}/members/{email}`
  - `handleRoleChange()` — Actualiza rol con confirmación
  - `handleToggleActive()` — Activa/desactiva miembro
  - `handleRemoveMember()` — Elimina miembro con confirmación

### Archivos a modificar
- [ ] `src/components/admin/AdminLayout.astro` — Añadir enlace "Usuarios" en el nav
- [ ] `src/lib/i18n/modules/admin.ts` — Añadir ~25 keys (`users-*`, `role-*`, `invite-*`)
- [ ] `src/styles/admin.css` — Añadir estilos para badges, tabla, toggles (~60 líneas)

### Validación
- [ ] `npm run build` exitoso
- [ ] `npm run qa` sin regresiones
- [ ] Probar: listar miembros, invitar, cambiar rol, eliminar, validar permisos

---

## 🟡 Fase 3: Permisos y Roles (RBAC)

**Especificación:** `docs/admin-profile-users-strategy.md` — Sección 5.3

### Archivos a modificar
- [ ] `src/components/admin/AdminLayout.astro`
  - Implementar `loadUserRole(siteDomain)` — Lee rol desde `members/{uid}`
  - Implementar `applyRolePermissions(role)` — Muestra/oculta nav según rol
  - Exponer `data-user-role` en `#admin-app`
- [ ] `firebase/firestore.rules` — Actualizar reglas según especificación (Sección 7)

### Validación
- [ ] Admin ve todos los enlaces del nav
- [ ] Editor NO ve enlace "Usuarios"
- [ ] Viewer solo ve Dashboard y Perfil
- [ ] `npm run build` + `npm run qa` verdes

---

## 🟢 Fase 4: Mejoras de Temas

### Pendientes
- [ ] UI de frontend para `/admin/theme` (sección de temas default)
- [ ] Panel superadmin `/admin/themes-manager` (CRUD de temas default en D1)
- [ ] Implementar verificación real con Firebase Admin SDK en API de temas

Ver `docs/theme/README.md` para especificación completa.

---

## 🔵 Fase 5: Editor de Páginas

### Pendientes
- [ ] Mejoras en `src/pages/admin/pages.astro` y subpáginas
- [ ] Editor WYSIWYG mejorado
- [ ] Vista previa en tiempo real

Ver `docs/wordpress-page-editor-spec.md` para especificación.

---

## 📊 Resumen

| Fase | Feature | Archivos nuevos | Archivos modificados | Estado |
|------|---------|----------------|---------------------|--------|
| 1 | Perfil de Usuario | 2 | 2 | ⬜ Pendiente |
| 2 | Gestión de Usuarios | 2 | 3 | ⬜ Pendiente |
| 3 | RBAC | 0 | 2 | ⬜ Pendiente |
| 4 | Mejoras Temas | — | — | ⬜ Pendiente |
| 5 | Editor Páginas | — | — | ⬜ Pendiente |

---

> **Nota para el orquestador:** Las Fases 1-3 son la prioridad actual. Cada fase debe completarse, validarse con QA Gate, y documentarse antes de pasar a la siguiente.