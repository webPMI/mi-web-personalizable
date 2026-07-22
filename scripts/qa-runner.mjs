#!/usr/bin/env node

// ============================================
// QA Runner - Ejecutor Sintético Token-Efficient
// ============================================
//
// Este script ejecuta la suite de comprobaciones (i18n check, Vitest)
// y produce un resumen sintético limpio para evitar consumir
// tokens excesivos en respuestas de consola ruidosas.
//
// Uso: npm run qa
// ============================================

import { execSync } from "child_process";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

console.log(`${BOLD}🚀 [QA Runner] Iniciando auditoría sintética...${RESET}\n`);

const results = [];
let overallPass = true;

// --- 1. Verificación de i18n ---
try {
  const output = execSync("node scripts/i18n-check.mjs", { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  const totalMatch = output.match(/Total:\s+(\d+)\s+es\s+\/\s+(\d+)\s+en/);
  const statsStr = totalMatch ? `(${totalMatch[1]} keys es/en)` : "";
  results.push({ name: "i18n Parity & Rules", status: "PASS", detail: `100% Cobertura ${statsStr}` });
} catch (error) {
  overallPass = false;
  const stdout = error.stdout || "";
  const stderr = error.stderr || error.message || "";
  const cleanErr = (stdout + "\n" + stderr).split("\n").filter(l => l.includes("❌") || l.includes("⚠️")).join("\n");
  results.push({ name: "i18n Parity & Rules", status: "FAIL", detail: cleanErr || "Falló la validación de i18n" });
}

// --- 2. Pruebas Unitarias Vitest ---
try {
  const output = execSync("npx vitest run", { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  const testMatch = output.match(/Test Files\s+(.+)\n\s+Tests\s+(.+)/);
  const testSummary = testMatch ? `${testMatch[1].trim()} | ${testMatch[2].trim()}` : "Pruebas pasadas";
  results.push({ name: "Vitest Unit & Edge Cases", status: "PASS", detail: testSummary });
} catch (error) {
  overallPass = false;
  const stdout = error.stdout || "";
  const stderr = error.stderr || error.message || "";
  const cleanErr = (stdout + "\n" + stderr).split("\n").filter(l => l.includes("FAIL") || l.includes("AssertionError") || l.includes("Error")).slice(0, 10).join("\n");
  results.push({ name: "Vitest Unit & Edge Cases", status: "FAIL", detail: cleanErr || "Fallaron pruebas unitarias" });
}

// --- Reporte Resumido Sintético ---
console.log(`${BOLD}📊 Resumen Sintético de Calidad (QA Summary)${RESET}`);
console.log("─".repeat(55));

for (const res of results) {
  const symbol = res.status === "PASS" ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
  console.log(`${symbol} ${BOLD}${res.name}${RESET}: ${res.detail}`);
}

console.log("─".repeat(55));

if (overallPass) {
  console.log(`${GREEN}${BOLD}✨ Todo el sistema superó la auditoría QA sin errores.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}🚨 Se encontraron fallos en la auditoría. Revisa el detalle arriba.${RESET}\n`);
  process.exit(1);
}
