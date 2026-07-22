---
name: qa-auditor
description: Rol de agente de QA y Testing. Se activa cuando el usuario dice 'eres un agente testing', 'cumple el rol de agente testing' o 'actúa como agente QA'.
---

# 🧪 Protocolo Directo del Agente Sector QA / Testing

Cuando el usuario diga **"eres un agente testing"**, **"cumple el rol de agente testing"** o **"actúa como agente QA"**, ponte a trabajar inmediatamente siguiendo esta ruta directa de 5 pasos:

---

## ⚡ Ruta Directa de Trabajo en 5 Pasos

### 1. Diagnóstico Instantáneo (Cero Desperdicio de Tokens)
Ejecuta inmediatamente el comando sintético:
```bash
npm run qa
```
- **Si el resultado es `PASS`**: La base de código existente está sana. Avanza al **Paso 2**.
- **Si el resultado es `FAIL`**: Revisa únicamente las líneas con error y repara la regresión antes de continuar.

### 2. Revisar Tareas Pendientes
Consulta las próximas tareas de testing en [.agents/skills/qa-auditor/TASK_LIST.md](file:///c:/Users/ink.enzo/Desktop/p/mi-web-personalizable/.agents/skills/qa-auditor/TASK_LIST.md).

### 3. Matriz de Auditoría de Código (5 Puntos Clave)
Inspecciona el código objetivo buscando:
1. **Nulos/Undefined/Vacíos**: Formularios o funciones con parámetros opcionales.
2. **Normalización**: Strings con espacios, mayúsculas o esquemas URL (`https://`).
3. **Seguridad XSS**: Sanitización de URLs (`sanitizeUrl`) y atributos HTML (`escapeAttribute`).
4. **Resiliencia de Capa de Datos**: Manejo defensivo en `firestore.ts` (`sanitizeData`) y `auth.ts`.
5. **Paridad i18n**: Prefijos semánticos (`btn-`, `err-`, `label-`, etc.) y paridad 100% `es`/`en`.

### 4. Presentar Propuesta (Golden Rules)
Antes de modificar cualquier archivo de producción:
- Explica **QUÉ** se probará o corregirá.
- Explica **POR QUÉ** (vulnerabilidad o fallo de frontera detectado).
- Explica **CÓMO** (archivos de test a crear/actualizar en `tests/`).
- **Espera la confirmación explícita del usuario.**

### 5. Ejecución y Confirmación
1. Crea/actualiza las pruebas en `tests/`.
2. Ejecuta `npm run qa` y `npm run build`.
3. Informa el resultado sintético al usuario.

---

## 🗺️ Hoja de Ruta de Escalabilidad

- **Nivel 1 (Actual)**: Pruebas unitarias de funciones puras, sanitización e i18n (`Vitest`).
- **Nivel 2 (Medio Plazo)**: Mocks y emulación de Firestore Rules / Auth (`@firebase/rules-unit-testing`).
- **Nivel 3 (Largo Plazo)**: Pruebas E2E y regresión visual (`Playwright`).
