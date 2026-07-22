# Arquitectura del Sistema de Temas

> **Documento:** 01-architecture.md
> **Propósito:** Describir la arquitectura general, componentes, flujos y decisiones técnicas.
> **Estado:** ✅ Documentación actualizada — Backend implementado, frontend pendiente

---

## 1. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERNET (Cliente)                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Navegador (Frontend)                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │ /admin/theme │  │ ThemeConfig  │  │ Vista Previa     │   │   │
│  │  │ (Astro)      │  │ .ts (lógica) │  │ en vivo (CSS)    │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────────┘   │   │
│  └─────────┼─────────────────┼──────────────────────────────────┘   │
└────────────┼─────────────────┼──────────────────────────────────────┘
             │                 │
             ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Cloudflare (Edge Network)                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Astro (SSG / SSR)                         │   │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐   │   │
│  │  │ Páginas estáticas │  │ API Routes                    │   │   │
│  │  │ (SSG)            │  │ /api/admin/themes/*           │   │   │
│  │  └──────────────────┘  └───────────────┬────────────────┘   │   │
│  └─────────────────────────────────────────┼────────────────────┘   │
│                                            │                        │
│  ┌─────────────────────────────────────────┼────────────────────┐   │
│  │              D1 Database (SQLite)        │                    │   │
│  │  ┌───────────────────────────────────────▼──────────────┐    │   │
│  │  │              default_themes                          │    │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │    │   │
│  │  │  │ classic │  │ modern  │  │  dark   │  ... más     │    │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘              │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Firebase (Firestore)                            │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  sites/{domain} → .theme = { ...config copiada... }  │    │   │
│  │  │  sites/{domain}/settings/theme → { ...config... }    │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Flujo de "Copiar un Tema"

```
Usuario admin                    Frontend                    API                    D1/Firestore
    │                              │                        │                        │
    │ 1. Abre /admin/theme         │                        │                        │
    │─────────────────────────────▶│                        │                        │
    │                              │                        │                        │
    │ 2. GET /api/admin/themes     │                        │                        │
    │─────────────────────────────▶│───────────────────────▶│───────────────────────▶│
    │                              │                        │  SELECT * FROM         │
    │                              │                        │  default_themes        │
    │                              │                        │  WHERE is_active = 1   │
    │                              │                        │◀───────────────────────│
    │                              │◀───────────────────────│◀───────────────────────│
    │                              │                        │                        │
    │ 3. Ve tarjetas de temas      │                        │                        │
    │◀─────────────────────────────│                        │                        │
    │                              │                        │                        │
    │ 4. Click "Usar [tema]"       │                        │                        │
    │─────────────────────────────▶│                        │                        │
    │                              │                        │                        │
    │ 5. Confirmación:             │                        │                        │
    │    "¿Aplicar tema X?"        │                        │                        │
    │◀─────────────────────────────│                        │                        │
    │                              │                        │                        │
    │ 6. Sí, aplicar               │                        │                        │
    │─────────────────────────────▶│                        │                        │
    │                              │                        │                        │
    │ 7. POST /api/admin/          │                        │                        │
    │    themes/:id/copy           │                        │                        │
    │    { siteDomain }            │                        │                        │
    │─────────────────────────────▶│───────────────────────▶│                        │
    │                              │                        │                        │
    │                              │                        │ 8. SELECT config       │
    │                              │                        │    FROM default_themes │
    │                              │                        │    WHERE id = :id      │
    │                              │                        │◀───────────────────────│
    │                              │                        │                        │
    │                              │                        │ 9. UPDATE sites/{domain}│
    │                              │                        │    SET theme = config  │
    │                              │                        │───────────────────────▶│
    │                              │                        │◀───────────────────────│
    │                              │                        │                        │
    │                              │◀───────────────────────│ { success: true }     │
    │                              │                        │                        │
    │ 10. Recarga formulario       │                        │                        │
    │     con valores del tema     │                        │                        │
    │◀─────────────────────────────│                        │                        │
    │                              │                        │                        │
```

## 3. Decisiones Técnicas

### 3.1 ¿Por qué D1 y no Firestore para temas default?

| Razón | Explicación |
|-------|-------------|
| **Separación de responsabilidades** | D1 = datos del sistema (temas globales). Firestore = datos de usuario (sitios). |
| **Rendimiento** | D1 en Cloudflare edge es más rápido para consultas simples de solo lectura. |
| **Control de acceso** | D1 solo accesible via API con verificación de superadmin. Firestore tiene reglas más complejas. |
| **Costo** | D1 tiene un tier gratuito generoso para consultas pequeñas. |

### 3.2 ¿Por qué "copia" en lugar de "referencia"?

- **Aislamiento**: Si un tema default se actualiza, los sitios que ya lo usaron no se ven afectados.
- **Personalización**: El admin puede modificar el tema copiado sin romper el original.
- **Rendimiento**: No hay que hacer JOINs ni consultas adicionales al renderizar el sitio.

### 3.3 ¿Por qué solo un superadmin?

- **Seguridad**: Los temas default afectan a todos los sitios. Un error podría romper cientos de páginas.
- **Auditabilidad**: Un solo responsable facilita el control de cambios.
- **Simplicidad**: No necesitamos un sistema de roles complejo para esto.

## 4. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Astro + TypeScript | 5.x |
| Estilos | CSS personalizado | - |
| Base de datos global | Cloudflare D1 (SQLite) | - |
| Base de datos de usuario | Firebase Firestore | - |
| Autenticación | Firebase Auth | - |
| API | Astro API Routes (Cloudflare Functions) | - |
| Hosting | Cloudflare Pages | - |

## 5. Seguridad

### 5.1 Verificación de Superadmin

```typescript
const SUPERADMIN_EMAIL = "servicioweb.pmi@gmail.com";

async function verifySuperadmin(request: Request): Promise<boolean> {
  // 1. Obtener token de Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);

  // 2. Verificar token con Firebase Admin SDK
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase();
    return email === SUPERADMIN_EMAIL;
  } catch {
    return false;
  }
}
```

### 5.2 Rate Limiting

- `GET /api/admin/themes`: 100 requests/minuto por IP
- `POST/PUT/DELETE /api/admin/themes`: 10 requests/minuto por IP
- `POST /api/admin/themes/:id/copy`: 20 requests/minuto por IP

### 5.3 Validación de Datos

- El campo `config` debe ser un JSON válido
- Los colores deben ser hex válidos (`#RRGGBB`)
- Los rangos numéricos deben estar dentro de límites razonables
- El `id` del tema debe ser alfanumérico (sin espacios ni caracteres especiales)

## 6. Monitoreo y Logs

- Registrar todas las operaciones de superadmin (crear, editar, eliminar)
- Registrar cada copia de tema (qué tema, qué sitio, qué usuario)
- Alertar si hay errores de conexión a D1
- Métricas: temas más copiados, tasa de éxito de copia, tiempo de respuesta
