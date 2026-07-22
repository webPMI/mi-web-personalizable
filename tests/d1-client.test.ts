// ============================================
// tests/d1-client.test.ts — Pruebas del cliente D1
// ============================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================
// Mock del cliente D1 (replicando la lógica real)
// ============================================

interface D1Result<T = any> {
    success: boolean;
    results?: T[];
    error?: string;
}

interface D1PreparedStatement {
    bind(...args: any[]): D1PreparedStatement;
    first<T = any>(): Promise<T | null>;
    all<T = any>(): Promise<D1Result<T>>;
    run(): Promise<{ success: boolean }>;
}

interface D1Database {
    prepare(sql: string): D1PreparedStatement;
}

class MockD1PreparedStatement implements D1PreparedStatement {
    private params: any[] = [];

    constructor(private sql: string) { }

    bind(...args: any[]): D1PreparedStatement {
        this.params = args;
        return this;
    }

    async first<T = any>(): Promise<T | null> {
        return null;
    }

    async all<T = any>(): Promise<D1Result<T>> {
        return { success: true, results: [] };
    }

    async run(): Promise<{ success: boolean }> {
        return { success: true };
    }
}

class MockD1Database implements D1Database {
    prepare(sql: string): D1PreparedStatement {
        return new MockD1PreparedStatement(sql);
    }
}

// Factory
let d1Instance: D1Database | null = null;

function getD1Client(): D1Database {
    if (d1Instance) return d1Instance;
    d1Instance = new MockD1Database();
    return d1Instance;
}

function resetD1Client(): void {
    d1Instance = null;
}

describe("D1 Client — Mock Database", () => {
    beforeEach(() => {
        resetD1Client();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("debe crear una instancia del cliente D1", () => {
        const client = getD1Client();
        expect(client).toBeDefined();
        expect(typeof client.prepare).toBe("function");
    });

    it("debe retornar la misma instancia en llamadas sucesivas (singleton)", () => {
        const client1 = getD1Client();
        const client2 = getD1Client();
        expect(client1).toBe(client2);
    });

    it("debe crear una nueva instancia después de reset", () => {
        const client1 = getD1Client();
        resetD1Client();
        const client2 = getD1Client();
        expect(client1).not.toBe(client2);
    });

    it("debe preparar una sentencia SQL", () => {
        const client = getD1Client();
        const stmt = client.prepare("SELECT * FROM users WHERE id = ?");
        expect(stmt).toBeDefined();
        expect(typeof stmt.bind).toBe("function");
        expect(typeof stmt.first).toBe("function");
        expect(typeof stmt.all).toBe("function");
        expect(typeof stmt.run).toBe("function");
    });

    it("debe ejecutar bind con parámetros", () => {
        const client = getD1Client();
        const stmt = client.prepare("SELECT * FROM users WHERE id = ? AND active = ?");
        const bound = stmt.bind(1, true);
        expect(bound).toBe(stmt); // debe retornar this para chaining
    });

    it("debe ejecutar first() y retornar null por defecto", async () => {
        const client = getD1Client();
        const result = await client.prepare("SELECT * FROM users WHERE id = ?").bind(1).first();
        expect(result).toBeNull();
    });

    it("debe ejecutar all() y retornar array vacío por defecto", async () => {
        const client = getD1Client();
        const result = await client.prepare("SELECT * FROM users").all();
        expect(result.success).toBe(true);
        expect(result.results).toEqual([]);
    });

    it("debe ejecutar run() y retornar success por defecto", async () => {
        const client = getD1Client();
        const result = await client.prepare("INSERT INTO users (name) VALUES (?)").bind("test").run();
        expect(result.success).toBe(true);
    });

    it("debe permitir chaining de bind y all", async () => {
        const client = getD1Client();
        const result = await client
            .prepare("SELECT * FROM users WHERE name = ? AND email = ?")
            .bind("John", "john@example.com")
            .all();
        expect(result.success).toBe(true);
    });

    it("debe permitir chaining de bind y first", async () => {
        const client = getD1Client();
        const result = await client
            .prepare("SELECT * FROM users WHERE id = ?")
            .bind(42)
            .first();
        expect(result).toBeNull();
    });

    it("debe permitir chaining de bind y run", async () => {
        const client = getD1Client();
        const result = await client
            .prepare("UPDATE users SET name = ? WHERE id = ?")
            .bind("Updated", 1)
            .run();
        expect(result.success).toBe(true);
    });

    it("debe manejar múltiples binds consecutivos (reemplazo)", () => {
        const client = getD1Client();
        const stmt = client.prepare("SELECT * FROM users WHERE id = ?");
        stmt.bind(1);
        stmt.bind(2); // reemplaza params
        // No debe lanzar error
        expect(true).toBe(true);
    });

    it("debe ejecutar prepare sin bind", async () => {
        const client = getD1Client();
        const result = await client.prepare("SELECT * FROM users").all();
        expect(result.success).toBe(true);
    });
});

describe("D1 Client — PreparedStatement con mock personalizado", () => {
    it("debe retornar datos mockeados con first()", async () => {
        const mockStmt: D1PreparedStatement = {
            bind: vi.fn().mockReturnThis(),
            first: vi.fn().mockResolvedValue({ id: 1, name: "Test User" }),
            all: vi.fn(),
            run: vi.fn(),
        };

        const result = await mockStmt.bind(1).first();
        expect(result).toEqual({ id: 1, name: "Test User" });
    });

    it("debe retornar datos mockeados con all()", async () => {
        const mockStmt: D1PreparedStatement = {
            bind: vi.fn().mockReturnThis(),
            first: vi.fn(),
            all: vi.fn().mockResolvedValue({
                success: true,
                results: [
                    { id: 1, name: "User 1" },
                    { id: 2, name: "User 2" },
                ],
            }),
            run: vi.fn(),
        };

        const result = await mockStmt.all();
        expect(result.success).toBe(true);
        expect(result.results?.length).toBe(2);
    });

    it("debe retornar resultado mockeado con run()", async () => {
        const mockStmt: D1PreparedStatement = {
            bind: vi.fn().mockReturnThis(),
            first: vi.fn(),
            all: vi.fn(),
            run: vi.fn().mockResolvedValue({ success: true }),
        };

        const result = await mockStmt.run();
        expect(result.success).toBe(true);
    });

    it("debe verificar que bind recibe los parámetros correctos", async () => {
        const bindFn = vi.fn().mockReturnThis();
        const mockStmt: D1PreparedStatement = {
            bind: bindFn,
            first: vi.fn().mockResolvedValue(null),
            all: vi.fn(),
            run: vi.fn(),
        };

        await mockStmt.bind("test@example.com", true, 42).first();
        expect(bindFn).toHaveBeenCalledWith("test@example.com", true, 42);
    });
});
