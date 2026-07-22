# Reglas para Agentes de IA

> ⚠️ **Nota:** Este proyecto **no utiliza Claude**. Estas reglas aplican para cualquier otro agente de IA (Cline, Copilot, etc.)

## 🥇 Golden Rules

### 1. Rol de Asesor, No de Ejecutor Automático
- El agente **siempre** actuará como asesor primero.
- No modificará ningún archivo sin autorización explícita del usuario.
- Antes de cualquier cambio, presentará un análisis detallado.

### 2. Proceso Obligatorio Antes de Modificar
Antes de tocar cualquier archivo, el agente deberá:
1. **Explicar QUÉ** cambios propone (archivos, líneas, contenido).
2. **Explicar POR QUÉ** son necesarios (problema que resuelven, mejora que aportan).
3. **Explicar CÓMO** impactan en el proyecto (dependencias, efectos colaterales, riesgos).
4. **Esperar autorización** explícita del usuario para proceder.

### 3. Exploración Primero
- Antes de opinar o sugerir cambios, el agente debe explorar el contexto relevante:
  - Leer los archivos involucrados.
  - Entender la arquitectura existente.
  - Revisar documentación relacionada.
- No asumir nada sin verificar.

### 4. Transparencia Total
- Mostrar el código propuesto (diffs, bloques SEARCH/REPLACE) antes de aplicarlo.
- Explicar alternativas si las hay, y por qué se recomienda una sobre otra.
- Advertir sobre cualquier riesgo o breaking change.

### 5. Respeto a la Estructura del Proyecto
- Seguir las convenciones existentes (nombres, estilos, patrones).
- No reorganizar archivos sin consultar.
- Mantener consistencia con el código ya escrito.

### 6. Documentación y Commits
- Si se hacen cambios, el agente debe:
  - Actualizar la documentación relevante si aplica.
  - Sugerir mensajes de commit descriptivos.

### 7. Derecho a Rechazo del Usuario
- El usuario puede rechazar total o parcialmente cualquier sugerencia.
- El agente aceptará la decisión sin insistir, y ofrecerá alternativas si corresponde.

---

## 🌐 Golden Rules de i18n

> El objetivo es mantener un sistema de traducciones limpio, reutilizable y escalable.
> **Regla de oro:** Antes de crear una key nueva, busca si ya existe. Preferir reutilización sobre duplicación.

### 1. Tesauro Central (`common`)
- `common` es el módulo de traducciones compartidas. Todo texto reusable va aquí.
- Categorías que **siempre** van en `common`:
  - Botones (`btn-*`)
  - Errores genéricos (`err-*`)
  - Estados (`loading-*`, `success-*`, `empty-*`)
  - Etiquetas genéricas (`label-*`)
  - Palabras sueltas (`yes`, `no`, `or`, `and`, `save`, `cancel`)
- **Antes de crear una key en otro namespace, verifica si ya existe en `common`.**

### 2. Regla de "Antes de Crear, Buscar"
Antes de añadir cualquier key nueva:
1. Buscar en `common` si ya existe un valor equivalente.
2. Buscar en otros namespaces si ya existe.
3. Si existe → **reutilizar la key existente** (no crear una duplicada).
4. Si no existe → crear la key, pero primero preguntar: ¿debería ir en `common`?

### 3. Namespaces por Feature, No por Página
- Un namespace por **dominio funcional grande** (ej: `onboarding`, `admin`, `public`).
- **NO** crear un namespace por cada página o componente diminuto.
- Si un namespace crece demasiado (>100 keys), considerar dividirlo en submódulos.

### 4. Prefijos Semánticos Obligatorios
Toda key debe usar un prefijo que indique su tipo:

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `btn-` | Botones y acciones | `btn-continue`, `btn-save` |
| `err-` | Errores y validaciones | `err-email-invalid` |
| `success-` | Éxitos | `success-welcome` |
| `loading-` | Estados de carga | `loading-text` |
| `label-` | Etiquetas de formularios | `label-username` |
| `placeholder-` | Placeholders | `placeholder-email` |
| `hint-` | Ayudas y sugerencias | `hint-password-min` |
| `title-` | Títulos | `title-welcome` |
| `desc-` | Descripciones | `desc-feature` |
| `step-` | Pasos de un flujo | `step-1-title` |
| `lang-` | Nombres de idiomas | `lang-es` |
| `config-` | Configuración | `config-domain-info` |
| `empty-` | Estados vacíos | `empty-no-results` |
| `toggle-` | Toggles | `toggle-show`, `toggle-hide` |

### 5. Paridad Estricta es/en
- **Toda key en español debe tener su equivalente en inglés.**
- Si una key existe en `es` pero no en `en` (o viceversa), es un error.
- Usar el script `npm run i18n:check` para verificar paridad.

### 6. Interpolación Consistente
- Usar formato `{variable}` con el mismo nombre en ambos idiomas.
- Documentar los parámetros en un comentario junto a la key.
- Ejemplo correcto:
  ```ts
  // Parámetros: {name}
  "success-welcome": "Bienvenido, {name}",
  "success-welcome": "Welcome, {name}",
  ```

### 7. Proceso de Creación de Nuevas Keys
Al añadir traducciones nuevas, seguir estos pasos obligatorios:

```
1. Buscar en common si ya existe → si existe, reutilizar
2. Buscar en otros namespaces → si existe, reutilizar
3. Elegir el namespace correcto (¿es genérico? → common. ¿Es específico? → namespace del feature)
4. Usar prefijo semántico adecuado
5. Añadir la key en ambos idiomas (es y en)
6. Documentar parámetros de interpolación si aplica
7. Ejecutar npm run i18n:check para validar
```

### 8. Lo que NO está permitido
- ❌ Keys duplicadas con el mismo valor en distintos namespaces.
- ❌ Nombres de key sin prefijo semántico.
- ❌ Traducción faltante en uno de los idiomas.
- ❌ Parámetros de interpolación con nombres diferentes en cada idioma.
- ❌ Namespaces demasiado pequeños (uno por página/componente).

---

## 🛠️ Scripts de Utilidad

El proyecto incluye scripts para mantener la calidad del sistema i18n:

### `npm run i18n:check`
Valida la consistencia de las traducciones:
- Detecta keys que existen en `es` pero no en `en` (y viceversa).
- Detecta posibles duplicados de valores entre namespaces.
- Muestra estadísticas del sistema (total keys, por namespace, etc.).

### `npm run i18n:find <texto>`
Busca un texto en todos los valores de traducción:
```
npm run i18n:find "Continuar"
```
Útil para ver si un valor ya existe antes de crear una key nueva.

### `npm run i18n:stats`
Muestra estadísticas detalladas del sistema i18n:
- Total de keys por namespace.
- Total de keys por idioma.
- Porcentaje de cobertura.
- Namespaces registrados.

### `npm run qa`
Ejecuta la auditoría QA sintética optimizada para ahorro de tokens:
- Valida i18n (`npm run i18n:check`).
- Ejecuta pruebas unitarias y de casos de borde (`vitest run`).
- Devuelve un resumen sintético en formato limpio.

---

## 🧪 Reglas y Protocolo para el Agent Sector QA / Testing

Cualquier agente al que se le asigne la tarea de testing o al recibir la instrucción *"cumple el rol de agente de testing"*, debe actuar bajo los siguientes principios:

### 1. Filosofía de "Búsqueda de Fallos Reales"
- El agente QA **nunca** crea pruebas superficiales solo para marcar verde un test.
- Su meta es descubrir **fallos de frontera, desbordamientos, valores nulos/indefinidos, fallos de casing/espacios y vulnerabilidades de inyección**.

### 2. Eficiencia de Tokens (*Token Efficiency*)
- Utilizar `npm run qa` en lugar de lanzar múltiples comandos verbosos que saturen el contexto de la conversación.
- Inspeccionar solo las líneas con fallos reportadas sintéticamente.

### 3. Matriz de Escalabilidad de Testing
A medida que el proyecto crezca, la suite seguirá la siguiente ruta optimizada:
- **Nivel 1 (Actual)**: Pruebas unitarias de funciones puras, dominios e i18n (`Vitest`).
- **Nivel 2**: Mocks y emulación de Firestore Rules / Firebase Auth.
- **Nivel 3**: Pruebas E2E y de regresión visual (`Playwright`).

---

## ⚡ Golden Rules de Rendimiento, Caché y Paginación

> **Regla de oro:** Minimizar las lecturas directas a la base de datos de Firestore. Todo acceso recurrente debe ser respaldado por la capa de caché y las listas largas deben usar paginación progresiva.

### 1. Caché Obligatoria en Memoria / SWR (Stale-While-Revalidate)
- Las lecturas de sitio (`getSiteData`) y páginas (`getPageBySlug`, `listSitePages`) **deben** consultar primero la caché local antes de realizar una petición remota a Firestore.
- Definir un TTL (Time-To-Live) apropiado para las respuestas en memoria (por defecto 5 minutos).

### 2. Invalidación Inmediata en Escritura
- Cualquier operación que cree, modifique o elimine datos (`savePageSubcollection`, `deletePageSubcollection`, `updateDocument`) **debe invalidar inmediatamente** las claves de la caché asociadas a ese dominio o recurso.
- Nunca mantener datos desactualizados en caché tras una edición confirmada.

### 3. Paginación y Cargas Progresivas
- Al consultar listas de subcolecciones o documentos, utilizar siempre parámetros de paginación (`limitCount`, `startAfterDoc`).
- Evitar descargar colecciones enteras sin límite cuando el cliente solo requiere una vista parcial.

---

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
