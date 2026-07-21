#!/usr/bin/env node

// ============================================
// i18n:check - Valida consistencia de traducciones
// ============================================
//
// Uso: node scripts/i18n-check.mjs
//
// Detecta:
// - Keys que existen en es pero no en en (y viceversa)
// - Posibles duplicados de valores entre namespaces
// - Muestra estadísticas del sistema
// ============================================

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, "..", "src", "lib", "i18n", "modules");

// --- Colores para consola ---
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function logError(msg) {
    console.error(`${RED}❌ ${msg}${RESET}`);
}

function logWarn(msg) {
    console.warn(`${YELLOW}⚠️  ${msg}${RESET}`);
}

function logInfo(msg) {
    console.log(`${CYAN}ℹ️  ${msg}${RESET}`);
}

function logSuccess(msg) {
    console.log(`${GREEN}✅ ${msg}${RESET}`);
}

// --- Cargar módulos ---
function loadModules() {
    const files = readdirSync(MODULES_DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    const modules = {};

    for (const file of files) {
        const content = readFileSync(join(MODULES_DIR, file), "utf-8");
        const namespace = file.replace(/\.(ts|js)$/, "");

        // Extraer el bloque entre "es": { ... } y "en": { ... }
        // Usamos un enfoque más robusto: buscar entre llaves anidadas
        const esBlock = extractLocaleBlock(content, "es");
        const enBlock = extractLocaleBlock(content, "en");

        if (!esBlock || !enBlock) {
            logWarn(`No se pudieron extraer traducciones de ${file}. ¿Formato inesperado?`);
            continue;
        }

        const esKeys = extractKeys(esBlock);
        const enKeys = extractKeys(enBlock);

        modules[namespace] = { es: esKeys, en: enKeys };
    }

    return modules;
}

/**
 * Extrae el bloque de traducciones para un locale específico.
 * Busca el patrón: "es": { ... } o "en": { ... }
 * Maneja llaves anidadas correctamente.
 */
function extractLocaleBlock(content, locale) {
    // Busca tanto "es": { como es: { (con o sin comillas)
    const regex = new RegExp(`["']?${locale}["']?\\s*:\\s*\\{`);
    const match = regex.exec(content);
    if (!match) return null;

    const start = match.index + match[0].length - 1; // posición de la llave de apertura
    let depth = 1;
    let i = start + 1;

    while (depth > 0 && i < content.length) {
        if (content[i] === "{") depth++;
        else if (content[i] === "}") depth--;
        i++;
    }

    if (depth !== 0) return null;
    return content.substring(start + 1, i - 1);
}

function extractKeys(block) {
    const keys = {};
    // Busca patrones: "key": "value" o 'key': 'value'
    // Soporta valores con comillas escapadas y saltos de línea
    const regex = /["']([^"']+)["']:\s*["']((?:[^"'\\]|\\.)*)["']/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        keys[match[1]] = match[2];
    }
    return keys;
}

// --- Validaciones ---
function checkParity(modules) {
    let hasErrors = false;

    for (const [namespace, translations] of Object.entries(modules)) {
        const esKeys = new Set(Object.keys(translations.es));
        const enKeys = new Set(Object.keys(translations.en));

        // Keys en es que no están en en
        for (const key of esKeys) {
            if (!enKeys.has(key)) {
                logError(`${namespace}: "${key}" existe en es pero no en en`);
                hasErrors = true;
            }
        }

        // Keys en en que no están en es
        for (const key of enKeys) {
            if (!esKeys.has(key)) {
                logError(`${namespace}: "${key}" existe en en pero no en es`);
                hasErrors = true;
            }
        }
    }

    return !hasErrors;
}

function checkDuplicates(modules) {
    // Mapa de valor → lista de {namespace, key}
    const valueMap = new Map();

    for (const [namespace, translations] of Object.entries(modules)) {
        for (const [key, value] of Object.entries(translations.es)) {
            const normalizedValue = value.toLowerCase().trim();
            if (!valueMap.has(normalizedValue)) {
                valueMap.set(normalizedValue, []);
            }
            valueMap.get(normalizedValue).push({ namespace, key, value, locale: "es" });
        }
        for (const [key, value] of Object.entries(translations.en)) {
            const normalizedValue = value.toLowerCase().trim();
            if (!valueMap.has(normalizedValue)) {
                valueMap.set(normalizedValue, []);
            }
            valueMap.get(normalizedValue).push({ namespace, key, value, locale: "en" });
        }
    }

    let hasDuplicates = false;
    for (const [normalizedValue, entries] of valueMap.entries()) {
        if (entries.length > 1) {
            // Filtrar para mostrar solo duplicados entre diferentes namespaces
            const namespaces = [...new Set(entries.map((e) => e.namespace))];
            if (namespaces.length > 1) {
                logWarn(`Valor duplicado: "${entries[0].value}"`);
                for (const entry of entries) {
                    console.warn(`   → ${entry.namespace}:${entry.key} (${entry.locale})`);
                }
                hasDuplicates = true;
            }
        }
    }

    return !hasDuplicates;
}

function showStats(modules) {
    console.log(`\n${BOLD}📊 Estadísticas del sistema i18n${RESET}`);
    console.log("─".repeat(50));

    let totalEs = 0;
    let totalEn = 0;

    for (const [namespace, translations] of Object.entries(modules)) {
        const esCount = Object.keys(translations.es).length;
        const enCount = Object.keys(translations.en).length;
        totalEs += esCount;
        totalEn += enCount;

        console.log(`  ${namespace}: ${esCount} es / ${enCount} en`);
    }

    console.log("─".repeat(50));
    console.log(`  ${BOLD}Total:${RESET} ${totalEs} es / ${totalEn} en`);
    console.log(`  ${BOLD}Namespaces:${RESET} ${Object.keys(modules).length}`);
    console.log(`  ${BOLD}Cobertura en:${RESET} ${totalEn === totalEs ? "100%" : `${Math.round((totalEn / totalEs) * 100)}%`}`);
    console.log("");
}

// --- Main ---
function main() {
    console.log(`${BOLD}🔍 i18n:check - Validación de traducciones${RESET}\n`);

    const modules = loadModules();

    if (Object.keys(modules).length === 0) {
        logError("No se encontraron módulos de traducción.");
        process.exit(1);
    }

    logInfo(`Módulos encontrados: ${Object.keys(modules).join(", ")}`);

    showStats(modules);

    let allPass = true;

    console.log(`${BOLD}📋 Verificando paridad es/en...${RESET}`);
    allPass = checkParity(modules) && allPass;

    console.log(`\n${BOLD}🔎 Buscando duplicados entre namespaces...${RESET}`);
    allPass = checkDuplicates(modules) && allPass;

    console.log("");
    if (allPass) {
        logSuccess("Todas las validaciones pasaron correctamente.");
    } else {
        logError("Se encontraron problemas. Revisa los mensajes anteriores.");
        process.exit(1);
    }
}

main();
