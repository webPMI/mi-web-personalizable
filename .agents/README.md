# 🧠 Agente Orquestador — Punto de Entrada

> **Versión:** 1.0.0
> **Última actualización:** 2026-08-01
> **Rol:** Guía central para cualquier agente IA que trabaje en `mi-web-personalizable`.

---

## 🎯 Propósito

Este documento es la **ruta de entrada obligatoria** para cualquier agente IA (Cline, Copilot, etc.) que reciba una tarea en este proyecto. Define:

1. **Cómo analizar** el proyecto antes de actuar
2. **Cómo delegar** trabajo en skills especializados (multi-agente)
3. **Cómo orquestar** decisiones entre sectores (Admin, Public, QA)
4. **Cómo mantener** la documentación actualizada

---

## 🗺️ Mapa del Proyecto (30 segundos)

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| **Frontend público** | Astro + HTML/CSS/JS vanilla | `src/pages/`, `src/components/public/` |
| **Panel admin** | Astro + JS vanilla | `src/pages/admin/`, `src/components/admin/` |
| **API endpoints** | Astro API routes | `src/pages/api/` |
| **Backend** | Firebase (Auth, Firestore, Storage) | `src/lib/firebase/` |
| **Base de datos** | Cloudflare D1 (SQLite) + Firestore | `src/lib/d1/`, `firebase/` |
| **Testing** | Vitest + jsdom | `tests/`, `vitest.config.ts` |
| **Estilos** | CSS vanilla con variables | `src/styles/` |
| **i18n** | Motor propio con namespaces | `src/lib/i18n/` |
| **Hosting** | Cloudflare Pages + Workers | `wrangler.toml`, `astro.config.mjs` |

---

## 🤖 Sistema de Skills Multi-Agente

El proyecto se divide en **3 skills especializados** + **1 orquestador**:

```
                     ┌─────────────────────┐
                     │   AGENTE PRINCIPAL   │
                     │   (Orquestador)      │
                     │   Eres tú            │
                     └──────┬──────────────┘
                            │ analiza, decide, delega
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Sector Admin │ │ Sector Public│ │  QA Auditor  │
   │   SKILL.md   │ │   SKILL.md   │ │   SKILL.md   │
   └──────────────┘ └──────────────┘ └──────────────┘
   Admin panel,     Páginas públicas,  Testing, sanitización,
   usuarios, RBAC,  layout dinámico,   seguridad, i18n
   configuración    blog, SEO          auditoría sintética
```

### Cómo activar un skill

Usa el comando `use_skill` con el nombre exacto del skill:
- `qa-auditor` — Agente de QA y Testing
- `sector-admin` — Agente de Panel Admin
- `sector-public` — Agente de Sección Pública

---

## 🛤️ Ruta de Trabajo del Orquestador (6 Pasos)

### Paso 1: Análisis Inicial (SIN tocar código)

```
1. Leer .agents/README.md (este archivo)
2. Leer AGENTS.md (Golden Rules)
3. Leer TASK_LIST.md (estado del proyecto)
4. Identificar qué sector(es) están involucrados en la tarea
```

**Checklist de análisis:**
- [ ] ¿La tarea toca el panel admin? → Activar `sector-admin`
- [ ] ¿La tarea toca páginas públicas? → Activar `sector-public`
- [ ] ¿La tarea requiere tests o validación? → Activar `qa-auditor`
- [ ] ¿La tarea toca i18n? → Revisar Golden Rules de i18n en `AGENTS.md`
- [ ] ¿La tarea toca Firebase/Firestore? → Revisar Golden Rules de rendimiento en `AGENTS.md`

### Paso 2: Planificación (Propuesta sin ejecutar)

1. Explicar **QUÉ** archivos se van a modificar/crear
2. Explicar **POR QUÉ** son necesarios los cambios
3. Explicar **CÓMO** impactan en otros sectores
4. **Esperar autorización** explícita del usuario

### Paso 3: Delegación (Orquestación multi-agente)

Si la tarea involucra múltiples sectores:

1. **Activar skills en orden**:
   - Primero: `sector-admin` o `sector-public` (el que construye)
   - Después: `qa-auditor` (el que valida)
2. **Pasar contexto entre skills**:
   - Compartir qué archivos se crearon/modificaron
   - Compartir interfaces/types afectados
3. **Consolidar resultados**:
   - Verificar que los cambios de un skill no rompan el trabajo de otro

### Paso 4: Ejecución Controlada

- Un cambio a la vez
- Un archivo a la vez (salvo que sean atómicos)
- Esperar confirmación entre pasos críticos
- Si un paso falla, detenerse y analizar antes de continuar

### Paso 5: Validación (QA Gate obligatorio)

Antes de declarar "terminado":
```bash
npm run qa        # Auditoría sintética (i18n + tests)
npm run build     # Build de producción
```

- Si `npm run qa` falla → Activar `qa-auditor` para reparar
- Si `npm run build` falla → Revisar errores y corregir
- **Nunca cerrar una tarea con tests en rojo o build roto**

### Paso 6: Documentación y Cierre

1. Actualizar `TASK_LIST.md` marcando ítems completados
2. Si se crearon nuevos patrones/convenciones → Actualizar `AGENTS.md`
3. Si se crearon nuevas features → Añadir entrada en documentación relevante
4. Sugerir mensaje de commit descriptivo

---

## 📋 Reglas de Oro del Orquestador

### Regla #1: Nunca asumir, siempre verificar
Antes de opinar sobre un archivo, leerlo. Antes de modificar, entenderlo.

### Regla #2: Un skill a la vez
No activar dos skills simultáneamente. Terminar el trabajo de uno antes de pasar al siguiente.

### Regla #3: El QA Gate es innegociable
Ninguna tarea se considera completada sin pasar `npm run qa` en verde.

### Regla #4: Documentación viva
Si un cambio introduce un nuevo patrón, componente o convención, debe documentarse inmediatamente.

### Regla #5: Build verde siempre
El build de producción (`npm run build`) debe permanecer verde en todo momento. Si se rompe, reparar antes de continuar.

### Regla #6: Separación de responsabilidades estricta
- **Admin** no toca componentes públicos
- **Public** no toca componentes admin
- **QA** no modifica lógica de negocio, solo tests y sanitización
- Si un cambio cruza sectores, el **orquestador** coordina

---

## 🔗 Referencias Rápidas

| Recurso | Ruta | Propósito |
|---------|------|-----------|
| Golden Rules | `AGENTS.md` | Reglas generales, i18n, rendimiento |
| Estado del proyecto | `TASK_LIST.md` | Checklist de features y progreso |
| Protocolo de orquestación | `.agents/docs/orchestration-protocol.md` | Flujo detallado de delegación |
| Skill QA | `.agents/skills/qa-auditor/SKILL.md` | Ruta de trabajo del agente QA |
| Skill Admin | `.agents/skills/sector-admin/SKILL.md` | Ruta de trabajo del agente Admin |
| Skill Public | `.agents/skills/sector-public/SKILL.md` | Ruta de trabajo del agente Public |
| Documentación de temas | `docs/theme/README.md` | Sistema de temas completo |
| Estrategia Admin | `docs/admin-profile-users-strategy.md` | Perfil y usuarios |

---

## 🚨 Anti-Patrones (Lo que NUNCA hacer)

- ❌ Modificar archivos sin leer `AGENTS.md` primero
- ❌ Saltarse el paso de propuesta y autorización
- ❌ Dar una tarea por terminada sin pasar `npm run qa`
- ❌ Mezclar responsabilidades de sectores sin coordinar
- ❌ Dejar documentación desactualizada tras cambios
- ❌ Hacer múltiples cambios no relacionados en un solo commit
- ❌ Ignorar fallos de build o tests

---

> **Principio fundamental:** El orquestador no hace el trabajo de los skills. El orquestador analiza, decide, delega, consolida y valida. Cada skill es responsable de su sector.