# Estrategia: Perfil de Usuario y Administración de Usuarios

> **Fecha:** Julio 2026
> **Agente:** Sector Admin
> **Estado:** Pendiente de implementación

---

## 1. Objetivo

Implementar dos nuevas secciones en el panel de administración:

1. **Perfil de usuario** (`/admin/profile`) — El usuario autenticado puede ver y editar su propia información.
2. **Gestión de usuarios del sitio** (`/admin/users`) — El administrador del sitio puede gestionar los miembros asociados a su sitio.

---

## 2. Estado Actual

| Aspecto | Estado | Archivo |
|---------|--------|---------|
| Auth (login/register/logout) | ✅ Implementado | `src/lib/firebase/auth.ts` |
| AdminLayout (navegación, estados) | ✅ Implementado | `src/components/admin/AdminLayout.astro` |
| Dashboard | ✅ Implementado | `src/pages/admin/index.astro` |
| Configuración del sitio | ✅ Implementado | `src/pages/admin/config.astro` |
| **Perfil de usuario** | ❌ No existe | — |
| **Gestión de usuarios** | ❌ No existe | — |
| `UserProfile` type | ✅ Definido | `src/types/firebase.ts` |
| Navegación admin | Solo Dashboard y Configuración | `AdminLayout.astro` |

---

## 3. Modelo de Datos

### 3.1 Colección `users/{uid}` — Perfiles de usuario

```typescript
// Este tipo YA EXISTE en src/types/firebase.ts
// Se reutiliza tal cual, no se modifica.
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: "user" | "admin" | "editor";  // rol global (se ignora inicialmente)
}
```

**Reglas:**
- Cada usuario registrado tiene un documento en `users/{uid}`.
- Se crea automáticamente al primer acceso al perfil si no existe.
- Solo el propio usuario puede leer/escribir su documento.
- `email` es readonly (se obtiene de `auth.currentUser.email`).
- `createdAt` se asigna solo en la creación, no se modifica después.

### 3.2 Subcolección `sites/{domain}/members/{uid}` — Miembros del sitio

```typescript
// Tipo NUEVO que se definirá en UserManager.ts (no en types/)
interface SiteMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "admin" | "editor" | "viewer";
  invitedBy: string;       // UID de quien invitó
  invitedAt: Timestamp;
  isActive: boolean;
}
```

**Reglas:**
- Cada sitio tiene una subcolección `members` con los usuarios asociados.
- El owner del sitio (dueño del dominio) se añade automáticamente como `admin` durante el onboarding.
- Los roles definen permisos dentro del admin:
  - `admin` — Acceso total (configuración, usuarios, contenido)
  - `editor` — Puede editar contenido pero no configuración ni usuarios
  - `viewer` — Solo lectura (dashboard, perfil propio)

### 3.3 Relación entre `UserProfile` y `SiteMember`

| Concepto | `users/{uid}` | `sites/{domain}/members/{uid}` |
|----------|---------------|-------------------------------|
| Propósito | Perfil global del usuario | Membresía en un sitio específico |
| Creado por | El propio usuario (auto-creación) | Admin del sitio (invitación) |
| Visible por | Solo el usuario | Admins del sitio + el propio miembro |
| Rol | Global (user/admin/editor) | Por sitio (admin/editor/viewer) |
| Se modifica | En `/admin/profile` | En `/admin/users` |

---

## 4. Arquitectura de Archivos

### 4.1 Nuevos archivos

| Archivo | Propósito | Líneas estimadas |
|---------|-----------|-----------------|
| `src/pages/admin/profile.astro` | Página de perfil del usuario autenticado | ~120 |
| `src/pages/admin/users.astro` | Página de gestión de miembros del sitio | ~150 |
| `src/components/admin/UserProfile.ts` | Lógica JS del perfil | ~250 |
| `src/components/admin/UserManager.ts` | Lógica JS de gestión de usuarios | ~350 |

### 4.2 Archivos a modificar

| Archivo | Cambio | Líneas a tocar |
|---------|--------|---------------|
| `src/components/admin/AdminLayout.astro` | Añadir enlaces "Perfil" y "Usuarios" en la navegación + detección de rol | ~15 |
| `src/lib/i18n/modules/admin.ts` | Añadir ~40 keys de traducción para perfil y usuarios | ~80 |
| `src/styles/admin.css` | Añadir estilos para badges de roles, tabla de miembros, formulario de invitación | ~60 |

### 4.3 Archivos que NO se modifican

- `src/lib/firebase/auth.ts` — Se reutiliza tal cual
- `src/lib/firebase/firestore.ts` — Se reutiliza tal cual
- `src/types/firebase.ts` — `UserProfile` ya está definido, no se toca
- `src/lib/site.ts` — No tocar (es del Sector Public)
- `src/components/public/` — No tocar

---

## 5. Especificación Detallada por Fase

---

### Fase 1: Perfil de Usuario (`/admin/profile`)

#### 5.1.1 `src/pages/admin/profile.astro` — Estructura HTML

```astro
---
import AdminLayout from "../../components/admin/AdminLayout.astro";
---

<AdminLayout>
  <div class="card">
    <div class="card-header">Mi Perfil</div>
    <p class="text-muted">Gestiona tu información personal y contraseña.</p>

    <form id="profile-form">
      <!-- SECCIÓN: Información personal -->
      <h3 class="section-title">Información Personal</h3>

      <div class="form-group">
        <label for="profile-email">Email</label>
        <input type="email" id="profile-email" disabled />
        <p class="field-hint">El email no se puede modificar.</p>
      </div>

      <div class="form-group" id="fg-profile-name">
        <label for="profile-name">Nombre visible</label>
        <input type="text" id="profile-name" placeholder="Tu nombre" />
      </div>

      <div class="form-group">
        <label for="profile-photo">URL de foto de perfil</label>
        <input type="url" id="profile-photo" placeholder="https://ejemplo.com/foto.jpg" />
      </div>

      <hr />

      <!-- SECCIÓN: Cambiar contraseña -->
      <h3 class="section-title">Cambiar Contraseña</h3>

      <div class="form-group" id="fg-profile-password">
        <label for="profile-password">Nueva contraseña</label>
        <input type="password" id="profile-password" placeholder="Mínimo 6 caracteres" />
        <p class="field-error">La contraseña debe tener al menos 6 caracteres.</p>
      </div>

      <div class="form-group" id="fg-profile-password-confirm">
        <label for="profile-password-confirm">Confirmar nueva contraseña</label>
        <input type="password" id="profile-password-confirm" placeholder="Repite la contraseña" />
        <p class="field-error">Las contraseñas no coinciden.</p>
      </div>

      <hr />

      <!-- Feedback -->
      <div id="profile-feedback" class="hidden"></div>

      <!-- Botones -->
      <div style="display: flex; gap: var(--space-sm); align-items: center;">
        <button type="submit" id="btn-profile-save" class="btn btn-primary btn-lg">
          Guardar cambios
        </button>
        <button type="button" id="btn-profile-logout" class="btn btn-secondary">
          Cerrar sesión
        </button>
      </div>
    </form>
  </div>

  <!-- Estado de carga -->
  <div id="profile-content">
    <p class="text-muted">Cargando perfil...</p>
  </div>
</AdminLayout>

<script>
  import { initUserProfile } from "../../components/admin/UserProfile";
  initUserProfile();
</script>
```

#### 5.1.2 `src/components/admin/UserProfile.ts` — Lógica JS

**Funciones a implementar:**

| Función | Propósito |
|---------|-----------|
| `initUserProfile()` | Punto de entrada. Se suscribe a `admin:ready` o lee `data-site-domain` del DOM |
| `setupProfile(siteDomain)` | Inicia la carga y configura los handlers |
| `loadProfile()` | Obtiene `auth.currentUser.uid`, lee `users/{uid}`, si no existe lo crea con `setDocument()`, rellena el formulario |
| `fillProfileForm(data)` | Asigna valores a los inputs del formulario |
| `setupSaveHandler()` | Handler del submit: valida, recolecta datos, guarda en Firestore + Firebase Auth |
| `setupLogoutHandler()` | Handler del botón "Cerrar sesión" |
| `validateProfileForm()` | Valida nombre requerido, contraseña >= 6 chars, confirmación coincidente |
| `showProfileFeedback(type, msg)` | Muestra feedback visual |

**Flujo de `loadProfile()` en detalle:**

```
1. Obtener uid = auth.currentUser?.uid
   └─ Si no hay uid → mostrar error "No autenticado"

2. Intentar getDocument("users", uid)
   ├─ Si existe → extraer displayName, photoURL
   └─ Si NO existe → crear con setDocument("users", uid, {
        uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || "",
        photoURL: auth.currentUser.photoURL || "",
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

3. fillProfileForm(data)
   ├─ profile-email.value = auth.currentUser.email (readonly)
   ├─ profile-name.value = data.displayName
   └─ profile-photo.value = data.photoURL

4. Ocultar loading state
```

**Flujo de `setupSaveHandler()` en detalle:**

```
1. Prevenir submit por defecto
2. Validar:
   ├─ displayName no vacío
   ├─ Si password no vacío:
   │   ├─ password.length >= 6
   │   └─ password === passwordConfirm
   └─ Si alguna falla → mostrar error y return

3. Mostrar "Guardando..." en el botón

4. Recolectar datos:
   const data = {
     displayName: profileName.value.trim(),
     photoURL: profilePhoto.value.trim(),
     updatedAt: Timestamp.now()
   }

5. Guardar en Firestore:
   const result = await updateDocument("users", uid, data)
   └─ Si falla → intentar setDocument (por si no existe)

6. Si hay nueva contraseña:
   const user = auth.currentUser
   await updatePassword(user, newPassword)
   └─ Si falla → mostrar error específico
   └─ Si el usuario necesita re-autenticación →
      mostrar mensaje "Debes volver a iniciar sesión"

7. Actualizar perfil de Firebase Auth:
   await updateProfile(auth.currentUser, {
     displayName: data.displayName,
     photoURL: data.photoURL
   })

8. Mostrar feedback "Cambios guardados correctamente"

9. Restaurar botón
```

**Manejo de errores específicos:**

| Error | Mensaje |
|-------|---------|
| `auth/requires-recent-login` | "Por seguridad, debes volver a iniciar sesión antes de cambiar la contraseña." |
| `auth/weak-password` | "La contraseña debe tener al menos 6 caracteres." |
| Firestore error | "Error al guardar el perfil. Intenta de nuevo." |
| No autenticado | "No se detectó una sesión activa." |

---

### Fase 2: Gestión de Usuarios (`/admin/users`)

#### 5.2.1 `src/pages/admin/users.astro` — Estructura HTML

```astro
---
import AdminLayout from "../../components/admin/AdminLayout.astro";
---

<AdminLayout>
  <div class="card">
    <div class="card-header">Usuarios del Sitio</div>
    <p class="text-muted">Gestiona los miembros que tienen acceso a este sitio.</p>

    <!-- Tabla de miembros -->
    <div id="users-table-container">
      <table class="table" id="users-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="users-table-body">
          <!-- Se renderiza desde JS -->
        </tbody>
      </table>
    </div>

    <!-- Estado vacío -->
    <div id="users-empty" class="hidden text-center mt-lg">
      <p class="text-muted">No hay miembros registrados en este sitio.</p>
    </div>

    <hr />

    <!-- Botón invitar -->
    <button type="button" id="btn-invite-user" class="btn btn-primary">
      + Invitar miembro
    </button>

    <!-- Formulario de invitación (oculto por defecto) -->
    <div id="invite-form-container" class="hidden mt-md" style="max-width: 480px;">
      <h3 class="section-title">Invitar nuevo miembro</h3>

      <div class="form-group">
        <label for="invite-email">Email del invitado</label>
        <input type="email" id="invite-email" placeholder="correo@ejemplo.com" />
      </div>

      <div class="form-group">
        <label for="invite-role">Rol</label>
        <select id="invite-role">
          <option value="admin">Admin</option>
          <option value="editor" selected>Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <div style="display: flex; gap: var(--space-sm);">
        <button type="button" id="btn-invite-send" class="btn btn-primary">Enviar invitación</button>
        <button type="button" id="btn-invite-cancel" class="btn btn-secondary">Cancelar</button>
      </div>

      <div id="invite-feedback" class="hidden mt-sm"></div>
    </div>

    <!-- Feedback general -->
    <div id="users-feedback" class="hidden mt-md"></div>
  </div>

  <!-- Estado de carga -->
  <div id="users-content">
    <p class="text-muted">Cargando miembros...</p>
  </div>
</AdminLayout>

<script>
  import { initUserManager } from "../../components/admin/UserManager";
  initUserManager();
</script>
```

#### 5.2.2 `src/components/admin/UserManager.ts` — Lógica JS

**Funciones a implementar:**

| Función | Propósito |
|---------|-----------|
| `initUserManager()` | Punto de entrada. Se suscribe a `admin:ready` |
| `setupUserManager(siteDomain)` | Inicia carga y configura handlers |
| `loadMembers(siteDomain)` | Lee `sites/{domain}/members` con `listDocuments()`, renderiza tabla |
| `renderMembersTable(members, currentUid)` | Construye el HTML de la tabla con filas de miembros |
| `renderMemberRow(member, isOwner)` | Crea una fila HTML para un miembro |
| `setupInviteUI()` | Muestra/oculta el formulario de invitación |
| `handleInvite(siteDomain)` | Crea un nuevo documento en `sites/{domain}/members/{uid}` |
| `handleRoleChange(siteDomain, uid, newRole)` | Actualiza el rol de un miembro |
| `handleToggleActive(siteDomain, uid, isActive)` | Activa/desactiva un miembro |
| `handleRemoveMember(siteDomain, uid)` | Elimina un miembro (con confirmación) |
| `showUsersFeedback(type, msg)` | Muestra feedback visual |

**Flujo de `loadMembers()` en detalle:**

```
1. Obtener currentUid = auth.currentUser?.uid

2. listDocuments("sites/" + siteDomain + "/members")
   ├─ Si éxito → members = result.data
   └─ Si error → mostrar feedback de error

3. Determinar quién es el owner:
   - Leer siteData del DOM (adminApp.dataset.siteData)
   - ownerId = siteData.ownerId

4. renderMembersTable(members, currentUid, ownerId)
   ├─ Si members.length === 0 → mostrar empty state
   └─ Si hay miembros → construir tabla:
       Por cada member:
       ├─ ¿Es el owner? → mostrar badge "Propietario", no permitir acciones destructivas
       ├─ ¿Es el usuario actual? → mostrar badge "Tú"
       ├─ Columna Rol: selector <select> con opciones admin/editor/viewer
       │   └─ Si es owner → disabled
       ├─ Columna Estado: toggle activo/inactivo
       │   └─ Si es owner → disabled
       └─ Columna Acciones: botón "Eliminar"
           └─ Si es owner o usuario actual → ocultar

5. Ocultar loading state
```

**Flujo de `handleInvite()` en detalle:**

```
1. Obtener email y rol del formulario
2. Validar email no vacío
3. Buscar si el email ya existe en la lista actual de miembros
   ├─ Si existe → mostrar error "Este usuario ya es miembro del sitio"
   └─ Si no existe → continuar

4. NOTA: No podemos obtener el UID solo con el email desde el cliente.
   Estrategia: usar el email como ID temporal del documento.
   El documento se crea con:
   {
     uid: email,        // temporal, se actualizará cuando el usuario se registre
     email: email,
     displayName: email.split('@')[0],  // nombre temporal
     role: rolSeleccionado,
     invitedBy: currentUid,
     invitedAt: Timestamp.now(),
     isActive: true
   }

5. setDocument("sites/" + siteDomain + "/members", email, data)
   ├─ Si éxito → recargar lista, mostrar feedback "Invitación enviada"
   └─ Si error → mostrar error específico

6. Limpiar formulario y ocultarlo
```

**Flujo de `handleRoleChange()`:**

```
1. Mostrar confirmación si se degrada a un admin:
   "¿Estás seguro de cambiar el rol de {name}?"
2. updateDocument("sites/" + siteDomain + "/members", uid, { role: newRole })
3. Si éxito → actualizar la fila en la tabla sin recargar todo
4. Si error → revertir el selector al valor anterior
```

**Flujo de `handleRemoveMember()`:**

```
1. Confirmación: "¿Eliminar a {name}? Esta acción no se puede deshacer."
2. deleteDocument("sites/" + siteDomain + "/members", uid)
3. Si éxito → eliminar la fila de la tabla con animación
4. Si error → mostrar feedback de error
```

---

### Fase 3: Navegación y Permisos

#### 5.3.1 Cambios en `AdminLayout.astro`

**Navegación actual:**
```html
<nav class="admin-nav" id="admin-nav">
  <a href="/admin" id="nav-dashboard" class="active">Dashboard</a>
  <a href="/admin/config" id="nav-config">Configuración</a>
</nav>
```

**Navegación nueva:**
```html
<nav class="admin-nav" id="admin-nav">
  <a href="/admin" id="nav-dashboard" class="active">Dashboard</a>
  <a href="/admin/config" id="nav-config">Configuración</a>
  <a href="/admin/profile" id="nav-profile">Perfil</a>
  <a href="/admin/users" id="nav-users" class="requires-role">Usuarios</a>
</nav>
```

**Lógica JS adicional en AdminLayout:**

```typescript
// Después de showState("authenticated", siteDomain, siteData):
// 1. Cargar el rol del usuario actual desde members
async function loadUserRole(siteDomain: string): Promise<string | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  
  // Intentar obtener el documento del miembro
  const result = await getDocument("sites/" + siteDomain + "/members", uid);
  if (result.success && result.data) {
    return (result.data as any).role;
  }
  
  // Si no existe, el usuario es el owner (creado durante onboarding)
  // Buscar en siteData.ownerId
  const siteData = adminApp?.dataset.siteData;
  if (siteData) {
    const parsed = JSON.parse(siteData);
    if (parsed.ownerId === uid) return "admin";
  }
  
  return null;
}

// 2. Mostrar/ocultar enlaces según rol
function applyRolePermissions(role: string | null): void {
  const adminLinks = document.querySelectorAll(".requires-role");
  adminLinks.forEach(link => {
    if (role === "admin") {
      link.classList.remove("hidden");
    } else {
      link.classList.add("hidden");
    }
  });
  
  // Exponer rol en el DOM
  if (adminApp) {
    adminApp.dataset.userRole = role || "";
  }
}
```

**Data attributes expuestos en `#admin-app`:**
- `data-site-domain` → dominio del sitio (ya existe)
- `data-site-data` → JSON con datos del sitio (ya existe)
- `data-user-role` → rol del usuario: "admin" | "editor" | "viewer" (NUEVO)

---

## 6. Traducciones (i18n)

Todas las nuevas keys se añaden al namespace `admin` en `src/lib/i18n/modules/admin.ts`.

### Keys de Perfil

```typescript
// --- Perfil de Usuario ---
"profile-title": "Mi Perfil",
"profile-desc": "Gestiona tu información personal y contraseña.",
"profile-section-personal": "Información Personal",
"profile-label-email": "Email",
"profile-hint-email": "El email no se puede modificar.",
"profile-label-name": "Nombre visible",
"profile-placeholder-name": "Tu nombre",
"profile-label-photo": "URL de foto de perfil",
"profile-placeholder-photo": "https://ejemplo.com/foto.jpg",
"profile-section-password": "Cambiar Contraseña",
"profile-label-password": "Nueva contraseña",
"profile-placeholder-password": "Mínimo 6 caracteres",
"profile-label-password-confirm": "Confirmar nueva contraseña",
"profile-placeholder-password-confirm": "Repite la contraseña",
"profile-btn-save": "Guardar cambios",
"profile-btn-saving": "Guardando...",
"profile-btn-logout": "Cerrar sesión",
"profile-success-saved": "Cambios guardados correctamente.",
"profile-error-save": "Error al guardar el perfil.",
"profile-error-password-match": "Las contraseñas no coinciden.",
"profile-error-password-length": "La contraseña debe tener al menos 6 caracteres.",
"profile-error-name-required": "El nombre es obligatorio.",
"profile-error-recent-login": "Por seguridad, debes volver a iniciar sesión antes de cambiar la contraseña.",
"profile-loading": "Cargando perfil...",
```

### Keys de Usuarios

```typescript
// --- Gestión de Usuarios ---
"users-title": "Usuarios del Sitio",
"users-desc": "Gestiona los miembros que tienen acceso a este sitio.",
"users-table-user": "Usuario",
"users-table-email": "Email",
"users-table-role": "Rol",
"users-table-status": "Estado",
"users-table-actions": "Acciones",
"users-empty": "No hay miembros registrados en este sitio.",
"users-loading": "Cargando miembros...",
"users-btn-invite": "+ Invitar miembro",
"users-label-owner": "Propietario",
"users-label-you": "Tú",
"users-label-active": "Activo",
"users-label-inactive": "Inactivo",
"users-btn-remove": "Eliminar",
"users-confirm-remove": "¿Eliminar a {name}? Esta acción no se puede deshacer.",
"users-confirm-role-change": "¿Estás seguro de cambiar el rol de {name}?",
"users-error-load": "Error al cargar los miembros.",
"users-error-invite": "Error al invitar al miembro.",
"users-error-remove": "Error al eliminar el miembro.",
"users-error-role": "Error al actualizar el rol.",
"users-success-invite": "Invitación enviada correctamente.",
"users-success-remove": "Miembro eliminado correctamente.",
"users-success-role": "Rol actualizado correctamente.",
"users-error-already-member": "Este usuario ya es miembro del sitio.",

// --- Roles ---
"role-admin": "Admin",
"role-editor": "Editor",
"role-viewer": "Viewer",

// --- Invitación ---
"invite-title": "Invitar nuevo miembro",
"invite-label-email": "Email del invitado",
"invite-placeholder-email": "correo@ejemplo.com",
"invite-label-role": "Rol",
"invite-btn-send": "Enviar invitación",
"invite-btn-cancel": "Cancelar",
```

---

## 7. Reglas de Firestore (Seguridad)

### `firestore.rules` — Reglas actualizadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Función helper: verifica si el usuario es admin del sitio
    function isSiteAdmin(domain) {
      return request.auth != null && (
        exists(/databases/$(database)/documents/sites/$(domain)/members/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/sites/$(domain)/members/$(request.auth.uid)).data.role == 'admin'
      );
    }

    // Sitios
    match /sites/{domain} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;

      // Miembros del sitio
      match /members/{uid} {
        allow read: if request.auth != null && (
          request.auth.uid == uid ||
          isSiteAdmin(domain)
        );
        allow create: if request.auth != null && isSiteAdmin(domain);
        allow update: if request.auth != null && (
          // El propio usuario puede actualizar su displayName/photoURL
          (request.auth.uid == uid && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'photoURL', 'updatedAt'])) ||
          // O un admin puede actualizar cualquier campo
          isSiteAdmin(domain)
        );
        allow delete: if request.auth != null && isSiteAdmin(domain);
      }
    }

    // Perfiles de usuario
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 8. Estilos CSS Necesarios

Se añadirán al final de `src/styles/admin.css`:

```css
/* --- Badges de roles --- */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-admin {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-editor {
  background: #fef3c7;
  color: #92400e;
}

.badge-viewer {
  background: #f3f4f6;
  color: #6b7280;
}

.badge-owner {
  background: #dcfce7;
  color: #16a34a;
}

.badge-inactive {
  background: #fee2e2;
  color: #dc2626;
}

/* --- Tabla de usuarios --- */
#users-table .user-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

#users-table .user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

#users-table .user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

#users-table select.role-select {
  padding: 2px 6px;
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius);
  font-size: var(--font-sm);
  background: var(--color-white);
}

/* --- Toggle activo/inactivo --- */
.toggle-btn {
  padding: 2px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--font-sm);
  cursor: pointer;
  background: var(--color-white);
}

.toggle-btn.active {
  background: #dcfce7;
  color: #16a34a;
  border-color: #bbf7d0;
}

.toggle-btn.inactive {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

/* --- Botón eliminar en tabla --- */
.btn-remove-member {
  padding: 2px 8px;
  font-size: var(--font-sm);
  color: var(--color-danger);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
}

.btn-remove-member:hover {
  background: #fee2e2;
  border-color: #fecaca;
}
```

---

## 9. Manejo de Edge Cases

| Caso | Comportamiento |
|------|---------------|
| Usuario accede a `/admin/profile` sin estar autenticado | AdminLayout muestra "Acceso restringido" |
| Usuario accede a `/admin/users` sin ser admin | AdminLayout muestra el dashboard (el enlace no es visible) |
| Owner intenta eliminarse a sí mismo de la lista | Botón "Eliminar" oculto para el owner |
| Owner intenta cambiarse el rol | Selector de rol deshabilitado para el owner |
| Invitar a un email que ya es miembro | Mostrar error "Este usuario ya es miembro del sitio" |
| Invitar con email vacío | Validación en frontend: "El email es obligatorio" |
| Cambiar contraseña con campos vacíos | Solo se actualiza si se proporciona una nueva contraseña |
| Error `requires-recent-login` al cambiar contraseña | Mostrar mensaje específico pidiendo re-inicio de sesión |
| Firestore offline | Mostrar error "Error de conexión. Intenta de nuevo." |
| Miembro desactivado intenta acceder al admin | AdminLayout detecta `isActive: false` y muestra mensaje "Tu cuenta ha sido desactivada" |
| El documento `users/{uid}` no existe | Se crea automáticamente con los datos de `auth.currentUser` |
| El owner no tiene documento en `members` | Se asume rol admin por defecto (basado en `siteData.ownerId`) |

---

## 10. Dependencias

| Dependencia | Uso | Import |
|-------------|-----|--------|
| `auth.currentUser` | Obtener UID, email, displayName actual | `from "../../lib/firebase/auth"` |
| `updatePassword` | Cambiar contraseña | `from "firebase/auth"` |
| `updateProfile` | Actualizar displayName/photoURL en Auth | `from "firebase/auth"` |
| `getDocument` | Leer `users/{uid}` y `sites/{domain}/members/{uid}` | `from "../../lib/firebase/firestore"` |
| `updateDocument` | Actualizar perfil y miembros | `from "../../lib/firebase/firestore"` |
| `setDocument` | Crear perfil si no existe, crear invitación | `from "../../lib/firebase/firestore"` |
| `listDocuments` | Listar miembros del sitio | `from "../../lib/firebase/firestore"` |
| `deleteDocument` | Eliminar miembro | `from "../../lib/firebase/firestore"` |
| `AdminLayout` | Layout base con evento `admin:ready` | Layout de las páginas .astro |

---

## 11. Checklist de Implementación

- [ ] **Fase 1: Perfil de Usuario**
  - [ ] Crear `src/pages/admin/profile.astro` (~120 líneas)
  - [ ] Crear `src/components/admin/UserProfile.ts` (~250 líneas)
  - [ ] Añadir ~20 keys de traducción de perfil en `admin.ts`
  - [ ] Añadir enlace "Perfil" en `AdminLayout.astro`
  - [ ] Build y verificar

- [ ] **Fase 2: Gestión de Usuarios**
  - [ ] Crear `src/pages/admin/users.astro` (~150 líneas)
  - [ ] Crear `src/components/admin/UserManager.ts` (~350 líneas)
  - [ ] Añadir ~25 keys de traducción de usuarios en `admin.ts`
  - [ ] Añadir enlace "Usuarios" en `AdminLayout.astro`
  - [ ] Añadir estilos CSS para badges, tabla, toggles
  - [ ] Build y verificar

- [ ] **Fase 3: Permisos y Roles**
  - [ ] Implementar `loadUserRole()` en AdminLayout
  - [ ] Implementar `applyRolePermissions()` en AdminLayout
  - [ ] Exponer `data-user-role` en `#admin-app`
  - [ ] Mostrar/ocultar enlace "Usuarios" según rol
  - [ ] Validar permisos en UserManager (solo admins pueden invitar/editar/eliminar)
  - [ ] Build y verificar

- [ ] **