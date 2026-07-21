#!/usr/bin/env node

// ============================================
// i18n:find - Busca texto en las traducciones
// ============================================
//
// Uso: node scripts/i18n-find.mjs <texto>
// Ej:  node scripts/i18n-find.mjs "Continuar"
//      node scripts/i18n-find.mjs "Welcome"
// ============================================

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, "..", "src", "lib", "i18n", "modules");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function loadModules() {
    const files = readdirSync(MODULES_DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    const modules = {};

    for (const file of files) {
        const content = readFileSync(join(MODULES_DIR, file), "utf-8");
        const namespace = file.replace(/\.(ts|js)$/, "");

        const esBlock = extractLocaleBlock(content, "es");
        const enBlock = extractLocaleBlock(content, "en");

        if (!esBlock || !enBlock) continue;

        modules[namespace] = {
            es: extractKeys(esBlock),
            en: extractKeys(enBlock),
        };
    }

    return modules;
}

function extractLocaleBlock(content, locale) {
    // Busca tanto "es": { como es: { (con o sin comillas)
    const regex = new RegExp(`["']?${locale}["']?\\s*:\\s*\\{`);
    const match = regex.exec(content);
    if (!match) return null;

    const start = match.index + match[0].length - 1;
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
    const regex = /["']([^"']+)["']:\s*["']((?:[^"'\\]|\\.)*)["']/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        keys[match[1]] = match[2];
    }
    return keys;
}

function main() {
    const searchTerm = process.argv[2];
    if (!searchTerm) {
        console.error("Uso: node scripts/i18n-find.mjs <texto>");
        console.error("Ej:  node scripts/i18n-find.mjs \"Continuar\"");
        process.exit(1);
    }

    const term = searchTerm.toLowerCase();
    const modules = loadModules();
    let found = false;

    console.log(`${BOLD}🔎 Buscando "${searchTerm}" en traducciones...${RESET}\n`);

    for (const [namespace, translations] of Object.entries(modules)) {
        for (const [locale, keys] of Object.entries(translations)) {
            for (const [key, value] of Object.entries(keys)) {
                if (value.toLowerCase().includes(term)) {
                    const color = locale === "es" ? GREEN : CYAN;
                    console.log(`  ${color}${namespace}:${key}${RESET}`);
                    console.log(`    ${locale === "es" ? "🇪🇸" : "🇬🇧"} ${value}`);
                    found = true;
                }
            }
        }
    }

    if (!found) {
        console.log(`  ${YELLOW}No se encontraron resultados para "${searchTerm}"${RESET}`);
    }
}

main();
