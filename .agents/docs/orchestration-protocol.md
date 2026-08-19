# 🔄 Protocolo de Orquestación Multi-Agente

> **Versión:** 1.0.0
> **Última actualización:** 2026-08-01
> **Propósito:** Definir el flujo estricto de delegación, comunicación y consolidación entre el Agente Orquestador y los Skills especializados.

---

## 📐 Arquitectura de Delegación

```
┌──────────────────────────────────────────────────────────────────┐
│                     AGENTE ORQUESTADOR                           │
│                                                                  │
│  Responsabilidades:                                              │
│  1. Recibir la tarea del usuario                                 │
│  2. Analizar qué sectores están involucrados                      │
│  3. Planificar la secuencia de delegación                        │
│  4. Delegar en skills especializados (uno a la vez)               │
│  5. Consolidar resultados y pasar contexto entre skills           │
│  6. Validar con QA Gate                                          │
│  7. Documentar y cerrar                                          │
│                                                                  │
│  NO hace:                                                        │
│  ❌ Escribir código de producción directamente                    │
│  ❌ Modificar archivos sin delegar al skill correspondiente       │
│  ❌ Saltarse el QA Gate                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Flujo de Delegación (Máquina de Estados)

```
                     ┌──────────┐
                     │  INICIO  │
                     └────┬─────┘
                          │
                    ┌─────▼──────┐
                    │  ANÁLISIS  │ ◄── Leer .agents/README.md + AGENTS.md + TASK_LIST.md
                    └─────┬──────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ ¿Admin?  │ │ ¿Public? │ │  ¿QA?    │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │             │
             ▼             ▼             ▼
   ┌─────────────────────────────────────────┐
   │        PLANIFICAR SECUENCIA             │
   │                                         │
   │  Regla: Build → Validate                 │
   │  1. sector-admin o sector-public         │
   │  2. qa-auditor                          │
   └─────────────────┬───────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │        DELEGAR (un skill a la vez)       │
   │                                         │
   │  1. Activar skill con use_skill          │
   │  2. Pasar contexto (archivos, types)     │
   │  3. Esperar resultado                    │
   │  4. Pasar al siguiente skill             │
   └─────────────────┬───────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │        QA GATE                          │
   │                                         │
   │  npm run qa && npm run build             │
   │                                         │
   │  ¿Verde? ──► CIERRE                     │
   │  ¿Rojo?  ──► Activar qa-auditor         │
   └─────────────────┬───────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │    CIERRE    │
              │  - Actualizar TASK_LIST.md    │
              │  - Documentar cambios         │
              │  - Sugerir commit             │
              └──────────────┘
```

---

## 📦 Formato de Contexto entre Skills

Cuando el orquestador delega de un skill a otro, debe pasar un **contexto estructurado**:

### Contexto de Entrada (del Orquestador al Skill)

```markdown
## Contexto del Orquestador

### Tarea Original
[Descripción de lo que pidió el usuario]

### Archivos Modificados por Skills Anteriores
| Archivo | Skill | Cambio |
|---------|-------|--------|
| src/components/admin/X.ts | sector-admin | Añadida función Y |
| src/lib/i18n/modules/admin.ts | sector-admin | Nuevas keys Z |

### Interfaces/Types Afectados
```typescript
// Nuevos types introducidos
interface NuevaInterfaz { ... }
```

### Restricciones
- No modificar archivos fuera del sector
- Mantener compatibilidad con X, Y, Z
- Seguir Golden Rules de AGENTS.md
```

### Contexto de Salida (del Skill al Orquestador)

```markdown
## Resultado del Skill: [nombre]

### Archivos Creados/Modificados
| Archivo | Operación | Descripción |
|---------|-----------|-------------|
| tests/nuevo.test.ts | CREATE | 8 tests para feature X |
| src/lib/x.ts | MODIFY | Añadida validación Y |

### Tests Ejecutados
- 8/8 PASS en tests/nuevo.test.ts
- 0 regresiones detectadas

### Notas para el Siguiente Skill
- El type Z ahora tiene propiedad W
- La función Y espera parámetro validado
```

---

## 🎯 Matriz de Decisión: ¿Qué Skill para qué Tarea?

| Tipo de Tarea | Skill | Ejemplos |
|--------------|-------|----------|
| Páginas/componentes del admin | `sector-admin` | `/admin/profile`, `UserManager.ts`, `SiteConfig.ts` |
| Páginas/componentes públicos | `sector-public` | `index.astro`, `PublicLayout.astro`, `Navbar.astro` |
| API endpoints del admin | `sector-admin` | `/api/admin/themes/*` |
| API endpoints públicos | `sector-public` | `/api/public/*` |
| Testing unitario | `qa-auditor` | Nuevos archivos en `tests/` |
| Sanitización/seguridad | `qa-auditor` | `sanitizer.ts`, XSS prevention |
| i18n (nuevas keys) | **Orquestador** decide según sector | Admin keys → admin, Public keys → public |
| Firebase/Firestore | **Orquestador** coordina | Afecta a ambos sectores |
| Documentación | **Orquestador** | `docs/`, `AGENTS.md`, `TASK_LIST.md` |
| Configuración (build, deps) | **Orquestador** | `package.json`, `astro.config.mjs` |

---

## 🚦 Reglas de Tránsito entre Skills

### Regla R1: Secuencia obligatoria
```
Skill de Construcción → QA Auditor → Cierre
```
Nunca ejecutar QA antes de que el skill de construcción termine.

### Regla R2: Un skill activo a la vez
- Activar un skill, completar su trabajo, desactivarlo, luego activar el siguiente.
- No mantener dos skills activos simultáneamente.

### Regla R3: Contexto inmutable por skill
- Un skill no debe modificar archivos que otro skill está usando sin coordinación del orquestador.
- Si dos skills necesitan tocar el mismo archivo, el orquestador debe secuenciarlos.

### Regla R4: Rollback en caso de fallo
- Si un skill falla, el orquestador debe:
  1. Analizar el error
  2. Decidir si reintentar, reparar, o hacer rollback
  3. No proceder al siguiente skill hasta resolver

### Regla R5: QA Gate vinculante
- Si `npm run qa` falla después de cualquier cambio, activar `qa-auditor` inmediatamente.
- No se puede cerrar la tarea hasta que QA Gate esté verde.

---

## 📊 Ejemplo de Orquestación Completa

### Tarea: "Añadir página de perfil de usuario en el admin"

```
1. ORQUESTADOR: Análisis
   - ¿Qué sectores? → Admin (construir) + QA (testear)
   - ¿Archivos afectados? → src/pages/admin/profile.astro, src/components/admin/UserProfile.ts, i18n admin
   - Secuencia: sector-admin → qa-auditor → QA Gate → Cierre

2. ORQUESTADOR → sector-admin: Delegar
   Contexto: "Crear página /admin/profile con..."
   Resultado: 3 archivos creados, 2 modificados

3. ORQUESTADOR → qa-auditor: Delegar
   Contexto: "Se crearon UserProfile.ts y profile.astro, necesita tests para..."
   Resultado: 6 tests nuevos, 0 regresiones

4. ORQUESTADOR: QA Gate
   npm run qa → VERDE ✓
   npm run build → VERDE ✓

5. ORQUESTADOR: Cierre
   - TASK_LIST.md: Marcar "Perfil de Usuario" como completado
   - Commit sugerido: "feat(admin): añadir página de perfil de usuario"
```

---

## 🔒 Restricciones de Acceso por Skill

| Archivo/Directorio | sector-admin | sector-public | qa-auditor | orquestador |
|-------------------|-------------|---------------|------------|-------------|
| `src/pages/admin/**` | ✅ RW | ❌ | ❌ | 🔍 RO |
| `src/components/admin/**` | ✅ RW | ❌ | ❌ | 🔍 RO |
| `src/pages/index.astro` | ❌ | ✅ RW | ❌ | 🔍 RO |
| `src/components/public/**` | ❌ | ✅ RW | ❌ | 🔍 RO |
| `src/pages/api/admin/**` | ✅ RW | ❌ | ❌ | 🔍 RO |
| `src/lib/i18n/modules/admin.ts` | ✅ RW | ❌ | ❌ | 🔍 RO |
| `src/lib/i18n/modules/public.ts` | ❌ | ✅ RW | ❌ | 🔍 RO |
| `src/lib/i18n/modules/common.ts` | ❌ | ❌ | ❌ | ✅ RW |
| `src/lib/sanitizer.ts` | ❌ | ❌ | ✅ RW | 🔍 RO |
| `tests/**` | ❌ | ❌ | ✅ RW | 🔍 RO |
| `AGENTS.md` | ❌ | ❌ | ❌ | ✅ RW |
| `TASK_LIST.md` | ❌ | ❌ | ❌ | ✅ RW |
| `docs/**` | ❌ | ❌ | ❌ | ✅ RW |
| `package.json` | ❌ | ❌ | ❌ | ✅ RW |
| `firebase/firestore.rules` | ❌ | ❌ | ✅ RW | 🔍 RO |

> **Leyenda:** ✅ RW = Lectura/Escritura | 🔍 RO = Solo Lectura | ❌ = Sin acceso

---

## 📐 Diagrama de Comunicación

```
Usuario
  │
  │ "Añadir feature X"
  ▼
Orquestador ──analiza──► .agents/README.md, AGENTS.md, TASK_LIST.md
  │
  │ decide secuencia
  │
  ├──► sector-admin ──construye──► archivos admin
  │       │
  │       └──resultado──► Orquestador
  │
  ├──► sector-public ──construye──► archivos public
  │       │
  │       └──resultado──► Orquestador
  │
  └──► qa-auditor ──testea──► tests/
          │
          └──resultado──► Orquestador
                            │
                            │ QA Gate
                            ▼
                         npm run qa
                         npm run build
                            │
                            ▼
                         CIERRE ✅
```

---

> **Principio:** La orquestación es un proceso secuencial y determinista. Cada paso tiene entradas claras, salidas verificables, y un único responsable.