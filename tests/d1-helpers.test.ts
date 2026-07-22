// ============================================
// tests/d1-helpers.test.ts — Pruebas de helpers D1
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock del binding de D1
const mockD1Db = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    all: vi.fn(),
    first: vi.fn(),
    run: vi.fn(),
};

// Funciones helper inline para testear la lógica de D1
async function queryAll(db: typeof mockD1Db, sql: string, ...params: any[]) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(...params);
    return stmt.all();
}

async function queryFirst(db: typeof mockD1Db, sql: string, ...params: any[]) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(...params);
    return stmt.first();
}

async function execute(db: typeof mockD1Db, sql: string, ...params: any[]) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(...params);
    return stmt.run();
}

describe("D1 Database Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe ejecutar query SELECT con all()", async () => {
        mockD1Db.all.mockResolvedValue({
            results: [
                { id: 1, name: "Test", email: "test@example.com" },
                { id: 2, name: "Otro", email: "otro@example.com" },
            ],
            success: true,
        });

        const result = await queryAll(mockD1Db, "SELECT * FROM users WHERE active = ?", true);
        expect(result.results.length).toBe(2);
        expect(result.results[0].name).toBe("Test");
        expect(mockD1Db.prepare).toHaveBeenCalledWith("SELECT * FROM users WHERE active = ?");
        expect(mockD1Db.bind).toHaveBeenCalledWith(true);
    });

    it("debe ejecutar query SELECT con first()", async () => {
        mockD1Db.first.mockResolvedValue({
            id: 1,
            name: "Test User",
            email: "test@example.com",
        });

        const result = await queryFirst(mockD1Db, "SELECT * FROM users WHERE id = ?", 1);
        expect(result.name).toBe("Test User");
        expect(result.email).toBe("test@example.com");
    });

    it("debe ejecutar INSERT con run()", async () => {
        mockD1Db.run.mockResolvedValue({
            success: true,
            meta: { changes: 1, last_row_id: 3 },
        });

        const result = await execute(
            mockD1Db,
            "INSERT INTO users (name, email) VALUES (?, ?)",
            "Nuevo Usuario",
            "nuevo@example.com"
        );
        expect(result.success).toBe(true);
        expect(result.meta.changes).toBe(1);
    });

    it("debe ejecutar UPDATE con run()", async () => {
        mockD1Db.run.mockResolvedValue({
            success: true,
            meta: { changes: 1 },
        });

        const result = await execute(
            mockD1Db,
            "UPDATE users SET name = ? WHERE id = ?",
            "Actualizado",
            1
        );
        expect(result.success).toBe(true);
        expect(result.meta.changes).toBe(1);
    });

    it("debe ejecutar DELETE con run()", async () => {
        mockD1Db.run.mockResolvedValue({
            success: true,
            meta: { changes: 1 },
        });

        const result = await execute(mockD1Db, "DELETE FROM users WHERE id = ?", 1);
        expect(result.success).toBe(true);
    });

    it("debe retornar resultados vacíos cuando no hay datos", async () => {
        mockD1Db.all.mockResolvedValue({
            results: [],
            success: true,
        });

        const result = await queryAll(mockD1Db, "SELECT * FROM users WHERE active = ?", false);
        expect(result.results.length).toBe(0);
    });

    it("debe retornar null con first() cuando no hay resultados", async () => {
        mockD1Db.first.mockResolvedValue(null);

        const result = await queryFirst(mockD1Db, "SELECT * FROM users WHERE id = ?", 999);
        expect(result).toBeNull();
    });

    it("debe manejar errores de base de datos", async () => {
        mockD1Db.all.mockRejectedValue(new Error("Database error: table not found"));

        await expect(queryAll(mockD1Db, "SELECT * FROM nonexistent")).rejects.toThrow("Database error");
    });

    it("debe ejecutar query sin parámetros", async () => {
        mockD1Db.all.mockResolvedValue({
            results: [{ count: 5 }],
            success: true,
        });

        const result = await queryAll(mockD1Db, "SELECT COUNT(*) as count FROM users");
        expect(result.results[0].count).toBe(5);
        expect(mockD1Db.bind).not.toHaveBeenCalled();
    });

    it("debe manejar múltiples parámetros", async () => {
        mockD1Db.all.mockResolvedValue({
            results: [{ id: 1 }],
            success: true,
        });

        await queryAll(
            mockD1Db,
            "SELECT * FROM users WHERE name = ? AND email = ? AND active = ?",
            "Test",
            "test@example.com",
            true
        );
        expect(mockD1Db.bind).toHaveBeenCalledWith("Test", "test@example.com", true);
    });
});
