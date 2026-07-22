// ============================================
// tests/d1-themes.test.ts — Pruebas de CRUD de temas D1
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Interfaces y tipos (replicando d1/themes.ts)
// ============================================

interface DefaultTheme {
    id: string;
    name: string;
    description: string;
    preview_image: string;
    category: string;
    is_active: number;
    sort_order: number;
    version: number;
    created_at: string;
    updated_at: string;
    config: Record<string, any>;
}

interface DefaultThemeInput {
    id: string;
    name: string;
    description?: string;
    preview_image?: string;
    category?: string;
    sort_order?: number;
    config: Record<string, any>;
}

// ============================================
// Mock D1 Database
// ============================================

type ThemeRow = Record<string, any>;

class MockD1Db {
    private tables: Map<string, ThemeRow[]> = new Map();

    constructor() {
        this.tables.set("default_themes", []);
    }

    reset() {
        this.tables.set("default_themes", []);
    }

    getTable(name: string): ThemeRow[] {
        return this.tables.get(name) || [];
    }

    prepare(sql: string) {
        return new MockD1Statement(this, sql);
    }
}

class MockD1Statement {
    private params: any[] = [];

    constructor(private db: MockD1Db, private sql: string) { }

    bind(...args: any[]): this {
        this.params = args;
        return this;
    }

    async first(): Promise<ThemeRow | null> {
        const results = this.executeSelect();
        return results[0] || null;
    }

    async all(): Promise<{ success: boolean; results: ThemeRow[] }> {
        return { success: true, results: this.executeSelect() };
    }

    async run(): Promise<{ success: boolean }> {
        this.executeMutation();
        return { success: true };
    }

    private isActive(row: ThemeRow): boolean {
        return row.is_active === 1 || row.is_active === "1";
    }

    private executeSelect(): ThemeRow[] {
        const table = this.db.getTable("default_themes");
        const sql = this.sql.toLowerCase().trim();

        // IMPORTANTE: Evaluar primero los casos más específicos
        // antes que los genéricos

        if (sql.includes("where id = ?") && this.params.length > 0) {
            const id = this.params[0];
            const row = table.find((r) => r.id === id);
            if (sql.includes("is_active = 1")) {
                return row && this.isActive(row) ? [row] : [];
            }
            return row ? [row] : [];
        }

        // SELECT COUNT(*) ... WHERE is_active = 1
        if (sql.includes("select count") && sql.includes("where is_active = 1")) {
            let results = table.filter((r) => this.isActive(r));
            const catIdx = sql.indexOf("category = ?");
            if (catIdx !== -1) {
                const catParamIdx = sql.substring(0, catIdx).split("?").length - 1;
                const category = this.params[catParamIdx];
                if (category) {
                    results = results.filter((r) => r.category === category);
                }
            }
            return [{ total: results.length }] as any;
        }

        // SELECT ... LIMIT ? OFFSET ? (debe ir antes del WHERE is_active = 1 genérico)
        if (sql.includes("limit ? offset ?")) {
            const limitIdx = sql.indexOf("limit ?");
            const paramsBeforeLimit = sql.substring(0, limitIdx).split("?").length - 1;
            const limit = this.params[paramsBeforeLimit];
            const offset = this.params[paramsBeforeLimit + 1];

            let results = table.filter((r) => this.isActive(r));
            const catIdx = sql.indexOf("category = ?");
            if (catIdx !== -1) {
                const catParamIdx = sql.substring(0, catIdx).split("?").length - 1;
                const category = this.params[catParamIdx];
                if (category) {
                    results = results.filter((r) => r.category === category);
                }
            }
            results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            return results.slice(offset, offset + limit);
        }

        // WHERE is_active = 1 (genérico, sin LIMIT ni COUNT)
        if (sql.includes("where is_active = 1") && !sql.includes("select count") && !sql.includes("limit ?")) {
            let results = table.filter((r) => this.isActive(r));
            // category filter
            const catIdx = sql.indexOf("category = ?");
            if (catIdx !== -1) {
                const catParamIdx = sql.substring(0, catIdx).split("?").length - 1;
                const category = this.params[catParamIdx];
                if (category) {
                    results = results.filter((r) => r.category === category);
                }
            }
            // sort
            results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
            return results;
        }

        // Todas las filas (listAll) - sin WHERE
        return [...table].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
    }

    private executeMutation(): void {
        const table = this.db.getTable("default_themes");
        const sql = this.sql.toLowerCase().trim();

        if (sql.startsWith("insert into")) {
            const row: ThemeRow = {
                id: this.params[0],
                name: this.params[1],
                description: this.params[2] || "",
                preview_image: this.params[3] || "",
                category: this.params[4] || "general",
                sort_order: this.params[5] || 0,
                config: typeof this.params[6] === "string" ? JSON.parse(this.params[6]) : this.params[6],
                is_active: 1,
                version: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            table.push(row);
        }

        if (sql.startsWith("update")) {
            const id = this.params[this.params.length - 1];
            const row = table.find((r) => r.id === id);
            if (row) {
                // Mapear SET fields
                const setClause = this.sql.substring(
                    this.sql.toLowerCase().indexOf("set") + 3,
                    this.sql.toLowerCase().indexOf("where")
                );
                const setFields = setClause.split(",").map((f) => f.trim());
                let paramIdx = 0;
                for (const field of setFields) {
                    if (field.includes("version = version + 1")) {
                        row.version = (row.version || 1) + 1;
                        continue;
                    }
                    if (field.includes("updated_at")) {
                        row.updated_at = new Date().toISOString();
                        continue;
                    }
                    // Detectar si el valor es literal (sin ?) o parametrizado
                    const parts = field.split("=").map((s) => s.trim());
                    const fieldName = parts[0];
                    const rawValue = parts.slice(1).join("=").trim();

                    if (rawValue === "?") {
                        // Valor parametrizado
                        if (fieldName === "is_active") {
                            row.is_active = this.params[paramIdx];
                            paramIdx++;
                        } else if (fieldName === "name") {
                            row.name = this.params[paramIdx];
                            paramIdx++;
                        } else if (fieldName === "description") {
                            row.description = this.params[paramIdx];
                            paramIdx++;
                        } else if (fieldName === "preview_image") {
                            row.preview_image = this.params[paramIdx];
                            paramIdx++;
                        } else if (fieldName === "category") {
                            row.category = this.params[paramIdx];
                            paramIdx++;
                        } else if (fieldName === "sort_order") {
                            row.sort_order = this.params[paramIdx];
                            paramIdx++;
                        } else if (fieldName === "config") {
                            row.config = typeof this.params[paramIdx] === "string"
                                ? JSON.parse(this.params[paramIdx])
                                : this.params[paramIdx];
                            paramIdx++;
                        }
                    } else {
                        // Valor literal (ej: is_active = 0)
                        if (fieldName === "is_active") {
                            row.is_active = parseInt(rawValue, 10) || 0;
                        }
                    }
                }
            }
        }

        if (sql.startsWith("delete")) {
            const idIdx = sql.indexOf("id = ?");
            if (idIdx !== -1) {
                const id = this.params[0];
                const idx = table.findIndex((r) => r.id === id);
                if (idx !== -1) table.splice(idx, 1);
            }
        }
    }
}

// ============================================
// Funciones helper (replicando d1/themes.ts)
// ============================================

function parseThemeRow(row: any): DefaultTheme {
    return {
        ...row,
        config: typeof row.config === "string" ? JSON.parse(row.config) : row.config,
    };
}

async function listActiveThemes(db: MockD1Db): Promise<DefaultTheme[]> {
    const result = await db.prepare(
        "SELECT * FROM default_themes WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
    ).all();
    return (result.results || []).map(parseThemeRow);
}

async function listAllThemes(db: MockD1Db): Promise<DefaultTheme[]> {
    const result = await db.prepare(
        "SELECT * FROM default_themes ORDER BY sort_order ASC, name ASC"
    ).all();
    return (result.results || []).map(parseThemeRow);
}

async function getThemeById(db: MockD1Db, id: string): Promise<DefaultTheme | null> {
    const result = await db.prepare(
        "SELECT * FROM default_themes WHERE id = ? AND is_active = 1"
    ).bind(id).first();
    return result ? parseThemeRow(result) : null;
}

async function getThemeByIdAll(db: MockD1Db, id: string): Promise<DefaultTheme | null> {
    const result = await db.prepare(
        "SELECT * FROM default_themes WHERE id = ?"
    ).bind(id).first();
    return result ? parseThemeRow(result) : null;
}

async function createTheme(
    db: MockD1Db,
    theme: DefaultThemeInput
): Promise<{ success: boolean; error?: string }> {
    const existing = await db.prepare("SELECT id FROM default_themes WHERE id = ?").bind(theme.id).first();
    if (existing) {
        return { success: false, error: `Ya existe un tema con el ID '${theme.id}'` };
    }

    const result = await db.prepare(
        `INSERT INTO default_themes (id, name, description, preview_image, category, sort_order, config)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        theme.id,
        theme.name,
        theme.description || "",
        theme.preview_image || "",
        theme.category || "general",
        theme.sort_order || 0,
        JSON.stringify(theme.config)
    ).run();

    return { success: result.success };
}

async function updateTheme(
    db: MockD1Db,
    id: string,
    updates: Partial<DefaultThemeInput>
): Promise<{ success: boolean; error?: string }> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
    if (updates.preview_image !== undefined) { fields.push("preview_image = ?"); values.push(updates.preview_image); }
    if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
    if (updates.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(updates.sort_order); }
    if (updates.config !== undefined) { fields.push("config = ?"); values.push(JSON.stringify(updates.config)); }

    if (fields.length === 0) {
        return { success: false, error: "No hay campos para actualizar" };
    }

    fields.push("version = version + 1");
    fields.push("updated_at = datetime('now')");
    values.push(id);

    const result = await db.prepare(
        `UPDATE default_themes SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();

    return { success: result.success };
}

async function deleteTheme(
    db: MockD1Db,
    id: string,
    permanent: boolean = false
): Promise<{ success: boolean; error?: string }> {
    if (permanent) {
        const result = await db.prepare("DELETE FROM default_themes WHERE id = ?").bind(id).run();
        return { success: result.success };
    }

    const result = await db.prepare(
        "UPDATE default_themes SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return { success: result.success };
}

async function duplicateTheme(
    db: MockD1Db,
    sourceId: string,
    newId?: string
): Promise<{ success: boolean; error?: string; data?: DefaultTheme }> {
    const source = await getThemeByIdAll(db, sourceId);
    if (!source) {
        return { success: false, error: `Tema '${sourceId}' no encontrado` };
    }

    const duplicateId = newId || `${sourceId}-copy`;
    const result = await createTheme(db, {
        id: duplicateId,
        name: `${source.name} (copia)`,
        description: source.description,
        preview_image: source.preview_image,
        category: source.category,
        sort_order: source.sort_order + 1,
        config: source.config,
    });

    if (result.success) {
        const created = await getThemeByIdAll(db, duplicateId);
        return { success: true, data: created || undefined };
    }

    return result;
}

async function listActiveThemesPaginated(
    db: MockD1Db,
    page: number = 1,
    limit: number = 10,
    category?: string
): Promise<{ themes: DefaultTheme[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = 1";
    const params: any[] = [];

    if (category) {
        whereClause += " AND category = ?";
        params.push(category);
    }

    const countResult = await db.prepare(
        `SELECT COUNT(*) as total FROM default_themes ${whereClause}`
    ).bind(...params).first();

    const result = await db.prepare(
        `SELECT * FROM default_themes ${whereClause} ORDER BY sort_order ASC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    return {
        themes: (result.results || []).map(parseThemeRow),
        total: countResult?.total || 0,
    };
}

// ============================================
// Tests
// ============================================

describe("D1 Themes — CRUD de temas default", () => {
    let db: MockD1Db;

    const sampleTheme: DefaultThemeInput = {
        id: "theme-1",
        name: "Tema Oscuro",
        description: "Un tema oscuro y elegante",
        preview_image: "https://example.com/dark.png",
        category: "dark",
        sort_order: 1,
        config: {
            primaryColor: "#1a1a2e",
            fontFamily: "Inter",
        },
    };

    const sampleTheme2: DefaultThemeInput = {
        id: "theme-2",
        name: "Tema Claro",
        description: "Un tema claro y minimalista",
        preview_image: "https://example.com/light.png",
        category: "light",
        sort_order: 2,
        config: {
            primaryColor: "#ffffff",
            fontFamily: "Inter",
        },
    };

    beforeEach(() => {
        db = new MockD1Db();
    });

    describe("createTheme()", () => {
        it("debe crear un tema correctamente", async () => {
            const result = await createTheme(db, sampleTheme);
            expect(result.success).toBe(true);
        });

        it("debe rechazar duplicados por ID", async () => {
            await createTheme(db, sampleTheme);
            const result = await createTheme(db, sampleTheme);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Ya existe");
        });

        it("debe crear múltiples temas", async () => {
            await createTheme(db, sampleTheme);
            await createTheme(db, sampleTheme2);
            const themes = await listAllThemes(db);
            expect(themes.length).toBe(2);
        });

        it("debe usar valores por defecto para campos opcionales", async () => {
            const minimalTheme: DefaultThemeInput = {
                id: "minimal",
                name: "Minimal",
                config: {},
            };
            const result = await createTheme(db, minimalTheme);
            expect(result.success).toBe(true);

            const created = await getThemeByIdAll(db, "minimal");
            expect(created?.description).toBe("");
            expect(created?.preview_image).toBe("");
            expect(created?.category).toBe("general");
            expect(created?.sort_order).toBe(0);
        });
    });

    describe("listActiveThemes()", () => {
        it("debe listar solo temas activos", async () => {
            await createTheme(db, sampleTheme);
            await createTheme(db, sampleTheme2);
            await deleteTheme(db, "theme-1"); // soft delete

            const active = await listActiveThemes(db);
            expect(active.length).toBe(1);
            expect(active[0].id).toBe("theme-2");
        });

        it("debe retornar array vacío si no hay temas activos", async () => {
            const themes = await listActiveThemes(db);
            expect(themes).toEqual([]);
        });

        it("debe ordenar por sort_order y nombre", async () => {
            await createTheme(db, { id: "b", name: "Beta", sort_order: 2, config: {} });
            await createTheme(db, { id: "a", name: "Alpha", sort_order: 1, config: {} });
            await createTheme(db, { id: "c", name: "Gamma", sort_order: 1, config: {} });

            const themes = await listActiveThemes(db);
            expect(themes[0].id).toBe("a"); // sort_order 1, Alpha
            expect(themes[1].id).toBe("c"); // sort_order 1, Gamma
            expect(themes[2].id).toBe("b"); // sort_order 2
        });
    });

    describe("listAllThemes()", () => {
        it("debe listar todos los temas incluyendo inactivos", async () => {
            await createTheme(db, sampleTheme);
            await createTheme(db, sampleTheme2);
            await deleteTheme(db, "theme-1");

            const all = await listAllThemes(db);
            expect(all.length).toBe(2);
        });
    });

    describe("getThemeById()", () => {
        it("debe obtener un tema activo por ID", async () => {
            await createTheme(db, sampleTheme);
            const theme = await getThemeById(db, "theme-1");
            expect(theme).not.toBeNull();
            expect(theme?.name).toBe("Tema Oscuro");
        });

        it("debe retornar null si el tema no existe", async () => {
            const theme = await getThemeById(db, "non-existent");
            expect(theme).toBeNull();
        });

        it("debe retornar null si el tema está inactivo", async () => {
            await createTheme(db, sampleTheme);
            await deleteTheme(db, "theme-1");
            const theme = await getThemeById(db, "theme-1");
            expect(theme).toBeNull();
        });
    });

    describe("getThemeByIdAll()", () => {
        it("debe obtener un tema incluso si está inactivo", async () => {
            await createTheme(db, sampleTheme);
            await deleteTheme(db, "theme-1");
            const theme = await getThemeByIdAll(db, "theme-1");
            expect(theme).not.toBeNull();
            expect(theme?.is_active).toBe(0);
        });
    });

    describe("updateTheme()", () => {
        it("debe actualizar campos del tema", async () => {
            await createTheme(db, sampleTheme);
            const result = await updateTheme(db, "theme-1", { name: "Tema Oscuro V2", sort_order: 5 });
            expect(result.success).toBe(true);

            const updated = await getThemeByIdAll(db, "theme-1");
            expect(updated?.name).toBe("Tema Oscuro V2");
            expect(updated?.sort_order).toBe(5);
        });

        it("debe incrementar versión al actualizar", async () => {
            await createTheme(db, sampleTheme);
            await updateTheme(db, "theme-1", { name: "V2" });
            const updated = await getThemeByIdAll(db, "theme-1");
            expect(updated?.version).toBe(2);
        });

        it("debe fallar si no hay campos para actualizar", async () => {
            await createTheme(db, sampleTheme);
            const result = await updateTheme(db, "theme-1", {});
            expect(result.success).toBe(false);
            expect(result.error).toContain("No hay campos");
        });

        it("debe actualizar config como JSON", async () => {
            await createTheme(db, sampleTheme);
            const newConfig = { primaryColor: "#ff0000", fontFamily: "Roboto" };
            await updateTheme(db, "theme-1", { config: newConfig });

            const updated = await getThemeByIdAll(db, "theme-1");
            expect(updated?.config).toEqual(newConfig);
        });
    });

    describe("deleteTheme()", () => {
        it("debe hacer soft delete por defecto", async () => {
            await createTheme(db, sampleTheme);
            const result = await deleteTheme(db, "theme-1");
            expect(result.success).toBe(true);

            const theme = await getThemeByIdAll(db, "theme-1");
            expect(theme?.is_active).toBe(0);
        });

        it("debe hacer hard delete si permanent=true", async () => {
            await createTheme(db, sampleTheme);
            const result = await deleteTheme(db, "theme-1", true);
            expect(result.success).toBe(true);

            const theme = await getThemeByIdAll(db, "theme-1");
            expect(theme).toBeNull();
        });

        it("debe eliminar tema inexistente sin error", async () => {
            const result = await deleteTheme(db, "non-existent");
            expect(result.success).toBe(true);
        });
    });

    describe("duplicateTheme()", () => {
        it("debe duplicar un tema existente", async () => {
            await createTheme(db, sampleTheme);
            const result = await duplicateTheme(db, "theme-1");
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data?.name).toBe("Tema Oscuro (copia)");
            expect(result.data?.id).toBe("theme-1-copy");
        });

        it("debe usar ID personalizado para la copia", async () => {
            await createTheme(db, sampleTheme);
            const result = await duplicateTheme(db, "theme-1", "my-copy");
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe("my-copy");
        });

        it("debe fallar si el tema origen no existe", async () => {
            const result = await duplicateTheme(db, "non-existent");
            expect(result.success).toBe(false);
            expect(result.error).toContain("no encontrado");
        });

        it("debe incrementar sort_order en la copia", async () => {
            await createTheme(db, sampleTheme);
            const result = await duplicateTheme(db, "theme-1");
            expect(result.data?.sort_order).toBe(2);
        });
    });

    describe("listActiveThemesPaginated()", () => {
        it("debe paginar resultados", async () => {
            for (let i = 1; i <= 5; i++) {
                await createTheme(db, {
                    id: `theme-${i}`,
                    name: `Theme ${i}`,
                    sort_order: i,
                    config: {},
                });
            }

            const page1 = await listActiveThemesPaginated(db, 1, 2);
            expect(page1.themes.length).toBe(2);
            expect(page1.total).toBe(5);

            const page3 = await listActiveThemesPaginated(db, 3, 2);
            expect(page3.themes.length).toBe(1);
        });

        it("debe filtrar por categoría", async () => {
            await createTheme(db, { ...sampleTheme, category: "dark" });
            await createTheme(db, { ...sampleTheme2, category: "light" });
            await createTheme(db, { id: "theme-3", name: "Otro Oscuro", category: "dark", config: {} });

            const result = await listActiveThemesPaginated(db, 1, 10, "dark");
            expect(result.themes.length).toBe(2);
            expect(result.total).toBe(2);
        });

        it("debe retornar página vacía si no hay resultados", async () => {
            const result = await listActiveThemesPaginated(db, 1, 10);
            expect(result.themes).toEqual([]);
            expect(result.total).toBe(0);
        });
    });

    describe("parseThemeRow()", () => {
        it("debe parsear config de string a objeto", () => {
            const row = { id: "test", config: '{"key": "value"}' };
            const parsed = parseThemeRow(row);
            expect(parsed.config).toEqual({ key: "value" });
        });

        it("debe mantener config como objeto si ya está parseado", () => {
            const row = { id: "test", config: { key: "value" } };
            const parsed = parseThemeRow(row);
            expect(parsed.config).toEqual({ key: "value" });
        });

        it("debe propagar otros campos sin cambios", () => {
            const row = { id: "test", name: "Test", config: "{}" };
            const parsed = parseThemeRow(row);
            expect(parsed.id).toBe("test");
            expect(parsed.name).toBe("Test");
        });
    });
});
