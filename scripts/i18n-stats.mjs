#!/usr/bin/env node

// ============================================
// i18n:stats - Estadísticas del sistema i18n
// ============================================
//
// Uso: node scripts/i18n-stats.mjs
//
// Muestra:
// - Total de keys por namespace
// - Total de keys por idioma
// - Porcentaje de cobertura
// ============================================

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, "..", "src", "lib", "i18n", "modules");

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
    const modules = loadModules();

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

main();
