---
name: sector-admin
description: Agente del Panel de Administración. Se activa cuando la tarea involucra páginas, componentes, lógica o API del panel admin (/admin, AdminLayout, SiteConfig, UserProfile, UserManager, temas, onboarding).
---

# 🛠️ Protocolo del Agente Sector Admin

Cuando el orquestador active este skill, seguir esta ruta directa de 5 pasos:

---

## ⚡ Ruta Directa de Trabajo en 5 Pasos

### 1. Diagnóstico Inicial
Leer el contexto proporcionado por el orquestador y verificar el estado actual:
- Leer `TASK_LIST.md` para entender el progreso del sector admin
- Leer `.agents/skills/sector-admin/TASK_LIST.md` para tareas pendientes específicas
- Identificar qué archivos están involucrados (solo del sector admin)

### 2. Análisis de Archivos del Sector
Antes de tocar código, leer los archivos relevantes del sector:
- **Páginas:** `src/pages/admin/*.astro`
- **Componentes JS:** `src/components/admin/*.ts`
- **Layout:** `src/components/admin/AdminLayout.astro`
- **Estilos:** `src/styles/admin.css`
- **i18n:** `src/lib/i18n/modules/admin.ts`
- **API:** `src/pages/api/admin/**`

### 3. Arquitectura del Sector Admin

```
src/pages/admin/
├── index.astro          ← Dashboard (usa AdminLayout)
├── config.astro         ← Configuración del sitio (SiteConfig.ts)
├── profile.astro        ← Perfil de usuario (UserProfile.ts) ⬜ PENDIENTE
├── theme.astro          ← Personalización del tema (ThemeConfig.ts)
├── users.astro          ← Gestión de usuarios (UserManager.ts) ⬜ PENDIENTE
└── pages.astro          ← Editor de páginas
    └── pages/           ← Subpáginas del editor

src/components/admin/
├── AdminLayout.astro    ← Layout compartido (auth, nav, estados)
├── AdminDashboard.ts    ← Lógica JS del Dashboard
├── SiteConfig.ts        ← Lógica JS de Configuración
├── ThemeConfig.ts       ← Lógica JS de Temas
├── UserProfile.ts       ← Lógica JS de Perfil ⬜ PENDIENTE
├── UserManager.ts       ← Lógica JS de Usuarios ⬜ PENDIENTE
└── onboarding.ts        ← Lógica del wizard de onboarding

src/pages/api/admin/
└── themes/              ← API de temas (CRUD en D1)
```

**Reglas del sector:**
- **NO tocar** archivos en `src/components/public/`, `src/pages/index.astro`
- **NO modificar** `src/lib/site.ts` (es del Sector Public)
- **NO modificar** `src/lib/sanitizer.ts` (es del Sector QA)
- **SÍ modificar** `src/lib/i18n/modules/admin.ts` para nuevas traducciones
- **SÍ usar** `src/lib/i18n/modules/common.ts` para traducciones compartidas (solo lectura)

### 4. Patrones de Código del Sector

#### 4.1 Página Admin (Astro + JS vanilla)

```astro
---
// src/pages/admin/nueva-pagina.astro
import AdminLayout from "../../components/admin/AdminLayout.astro";
---

<AdminLayout>
  <div class="card">
    <div class="card-header">{t('admin:title-nueva-pagina')}</div>
    <!-- Contenido HTML -->
  </div>
</AdminLayout>

<script>
  import { initNuevaLogica } from "../../components/admin/NuevaLogica";
  initNuevaLogica();
</script>
```

#### 4.2 Componente JS Admin

```typescript
// src/components/admin/NuevaLogica.ts
import { auth } from "../../lib/firebase/auth";
import { getDocument, updateDocument, setDocument, listDocuments } from "../../lib/firebase/firestore";
import { t } from "../../lib/i18n";

export function initNuevaLogica(): void {
  // 1. Esperar evento admin:ready del AdminLayout
  document.addEventListener("admin:ready", ((e: CustomEvent) => {
    const { siteDomain, siteData } = e.detail;
    setup(siteDomain, siteData);
  }) as EventListener);
}

function setup(siteDomain: string, siteData: any): void {
  // 2. Verificar autenticación
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  // 3. Configurar handlers
  // 4. Cargar datos
  // 5. Renderizar
}
```

#### 4.3 Traducciones Admin (i18n)

Todas las keys nuevas van en `src/lib/i18n/modules/admin.ts` con prefijos semánticos:
- `profile-*` para perfil de usuario
- `users-*` para gestión de usuarios
- `role-*` para roles
- `invite-*` para invitaciones

**Regla i18n:** Antes de crear una key nueva, buscar en `common.ts` si ya existe un valor equivalente.

#### 4.4 Data Attributes del AdminLayout

El `AdminLayout` expone en el DOM (`#admin-app`):
- `data-site-domain` → dominio del sitio
- `data-site-data` → JSON con datos del sitio
- `data-user-role` → rol del usuario (admin/editor/viewer) ⬜ PENDIENTE

Evento: `CustomEvent('admin:ready', { detail: { siteDomain, siteData } })`

### 5. Checklist de Calidad (antes de devolver al orquestador)

- [ ] Build exitoso: `npm run build`
- [ ] Traducciones completas (es y en) con prefijos semánticos
- [ ] Sin imports de `src/components/public/` ni `src/pages/index.astro`
- [ ] Sin modificaciones a `src/lib/site.ts`
- [ ] Eventos `admin:ready` manejados correctamente
- [ ] Estados de loading/empty/error cubiertos
- [ ] Formularios con validación y feedback visual
- [ ] Sin valores hardcodeados que deberían ser i18n

---

## 📋 Tareas Pendientes (Ver TASK_LIST.md)

Las tareas prioritarias del Sector Admin están en `.agents/skills/sector-admin/TASK_LIST.md`:

### 🔴 Prioridad Alta: Perfil y Usuarios
- [ ] Fase 1: Perfil de Usuario (`/admin/profile`)
  - [ ] `src/pages/admin/profile.astro`
  - [ ] `src/components/admin/UserProfile.ts`
- [ ] Fase 2: Gestión de Usuarios (`/admin/users`)
  - [ ] `src/pages/admin/users.astro`
  - [ ] `src/components/admin/UserManager.ts`
- [ ] Fase 3: Permisos y Roles (RBAC)
  - [ ] `loadUserRole()` + `applyRolePermissions()` en AdminLayout
  - [ ] Actualizar `firebase/firestore.rules`

### 🟡 Prioridad Media: Temas
- [ ] UI de frontend para `/admin/theme`
- [ ] Panel superadmin `/admin/themes-manager`

Estrategia detallada en `docs/admin-profile-users-strategy.md`.

---

## 🔗 Referencias

| Recurso | Ruta | Propósito |
|---------|------|-----------|
| Estrategia perfil/usuarios | `docs/admin-profile-users-strategy.md` | Especificación completa de perfil y usuarios |
| Documentación de temas | `docs/theme/README.md` | Sistema de temas (D1 + Firestore) |
| Golden Rules | `AGENTS.md` | Reglas generales, i18n, rendimiento |
| Tareas del sector | `.agents/skills/sector-admin/TASK_LIST.md` | Checklist específico del admin |

---

> **Principio:** El Sector Admin construye y mantiene el panel de administración. No toca componentes públicos, no hace testing (eso es QA), no modifica documentación (eso es el orquestador). Reporta resultados limpios al orquestador.