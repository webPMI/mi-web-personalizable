// ============================================
// tests/r2-client.test.ts — Pruebas del cliente R2 (Cloudflare)
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Interfaces (replicando r2/client.ts)
// ============================================

interface R2Object {
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
    httpEtag: string;
}

interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
    delimitedPrefixes: string[];
}

interface R2Bucket {
    name: string;
}

interface R2PutOptions {
    onlyIf?: {
        etagMatches?: string;
        etagDoesNotMatch?: string;
        uploadedBefore?: Date;
        uploadedAfter?: Date;
    };
    httpMetadata?: Record<string, string>;
    customMetadata?: Record<string, string>;
}

interface R2Binding {
    list: (options?: { limit?: number; prefix?: string; cursor?: string; delimiter?: string }) => Promise<R2Objects>;
    get: (key: string) => Promise<R2Object | null>;
    put: (key: string, value: any, options?: R2PutOptions) => Promise<R2Object>;
    delete: (key: string) => Promise<void>;
    head: (key: string) => Promise<R2Object | null>;
}

// ============================================
// Mock R2 Binding
// ============================================

class MockR2Bucket implements R2Binding {
    private objects: Map<string, { data: any; metadata: Record<string, any> }> = new Map();

    reset(): void {
        this.objects.clear();
    }

    async list(options?: { limit?: number; prefix?: string; cursor?: string; delimiter?: string }): Promise<R2Objects> {
        let entries = Array.from(this.objects.entries());

        // Filtrar por prefijo
        if (options?.prefix) {
            entries = entries.filter(([key]) => key.startsWith(options.prefix!));
        }

        const objects: R2Object[] = entries.map(([key, val]) => ({
            key,
            size: typeof val.data === "string" ? val.data.length : JSON.stringify(val.data).length,
            etag: `"${key}-etag"`,
            uploaded: new Date(),
            httpEtag: `"${key}-etag"`,
        }));

        // Paginación
        let truncated = false;
        let cursor: string | undefined;
        if (options?.limit && objects.length > options.limit) {
            truncated = true;
            cursor = objects[options.limit - 1].key;
            objects.splice(options.limit);
        }

        return {
            objects,
            truncated,
            cursor,
            delimitedPrefixes: [],
        };
    }

    async get(key: string): Promise<R2Object | null> {
        const entry = this.objects.get(key);
        if (!entry) return null;

        return {
            key,
            size: typeof entry.data === "string" ? entry.data.length : JSON.stringify(entry.data).length,
            etag: `"${key}-etag"`,
            uploaded: new Date(),
            httpEtag: `"${key}-etag"`,
        };
    }

    async put(key: string, value: any, options?: R2PutOptions): Promise<R2Object> {
        // Verificar condiciones onlyIf
        if (options?.onlyIf) {
            const existing = this.objects.get(key);
            if (options.onlyIf.etagMatches && existing) {
                const currentEtag = `"${key}-etag"`;
                if (currentEtag !== options.onlyIf.etagMatches) {
                    throw new Error("etag does not match");
                }
            }
            if (options.onlyIf.etagDoesNotMatch && existing) {
                const currentEtag = `"${key}-etag"`;
                if (currentEtag === options.onlyIf.etagDoesNotMatch) {
                    throw new Error("etag matches precondition failure");
                }
            }
        }

        this.objects.set(key, {
            data: value,
            metadata: options?.customMetadata || {},
        });

        return {
            key,
            size: typeof value === "string" ? value.length : JSON.stringify(value).length,
            etag: `"${key}-etag"`,
            uploaded: new Date(),
            httpEtag: `"${key}-etag"`,
        };
    }

    async delete(key: string): Promise<void> {
        this.objects.delete(key);
    }

    async head(key: string): Promise<R2Object | null> {
        return this.get(key);
    }
}

// ============================================
// Factory (replicando r2/client.ts)
// ============================================

let r2Instance: R2Binding | null = null;

function getR2Client(): R2Binding {
    if (r2Instance) return r2Instance;
    r2Instance = new MockR2Bucket();
    return r2Instance;
}

function resetR2Client(): void {
    if (r2Instance instanceof MockR2Bucket) {
        r2Instance.reset();
    }
    r2Instance = null;
}

// ============================================
// Funciones helper (replicando r2/client.ts)
// ============================================

async function putObject(key: string, data: any, options?: R2PutOptions): Promise<R2Object> {
    const client = getR2Client();
    return client.put(key, data, options);
}

async function getObject(key: string): Promise<R2Object | null> {
    const client = getR2Client();
    return client.get(key);
}

async function deleteObject(key: string): Promise<void> {
    const client = getR2Client();
    await client.delete(key);
}

async function listObjects(prefix?: string, limit?: number): Promise<R2Objects> {
    const client = getR2Client();
    return client.list({ prefix, limit });
}

async function objectExists(key: string): Promise<boolean> {
    const client = getR2Client();
    const obj = await client.head(key);
    return obj !== null;
}

// ============================================
// Tests
// ============================================

describe("R2 Client — Mock Bucket", () => {
    beforeEach(() => {
        resetR2Client();
    });

    describe("getR2Client()", () => {
        it("debe crear una instancia del cliente R2", () => {
            const client = getR2Client();
            expect(client).toBeDefined();
            expect(typeof client.put).toBe("function");
            expect(typeof client.get).toBe("function");
            expect(typeof client.delete).toBe("function");
            expect(typeof client.list).toBe("function");
            expect(typeof client.head).toBe("function");
        });

        it("debe retornar la misma instancia en llamadas sucesivas (singleton)", () => {
            const client1 = getR2Client();
            const client2 = getR2Client();
            expect(client1).toBe(client2);
        });

        it("debe crear una nueva instancia después de reset", () => {
            const client1 = getR2Client();
            resetR2Client();
            const client2 = getR2Client();
            expect(client1).not.toBe(client2);
        });
    });

    describe("putObject()", () => {
        it("debe almacenar un objeto de texto", async () => {
            const result = await putObject("test.txt", "Hello World");
            expect(result.key).toBe("test.txt");
            expect(result.size).toBe(11); // "Hello World" length
        });

        it("debe almacenar un objeto JSON", async () => {
            const data = { name: "Test", value: 42 };
            const result = await putObject("data.json", JSON.stringify(data));
            expect(result.key).toBe("data.json");
            expect(result.size).toBeGreaterThan(0);
        });

        it("debe sobrescribir un objeto existente", async () => {
            await putObject("test.txt", "Original");
            await putObject("test.txt", "Updated");
            const obj = await getObject("test.txt");
            expect(obj).not.toBeNull();
        });

        it("debe aceptar metadatos personalizados", async () => {
            const client = getR2Client();
            const result = await client.put("meta.txt", "data", {
                customMetadata: { author: "test", version: "1.0" },
            });
            expect(result.key).toBe("meta.txt");
        });

        it("debe rechazar put si etagDoesNotMatch falla", async () => {
            const client = getR2Client();
            await client.put("conflict.txt", "original");

            await expect(
                client.put("conflict.txt", "new", {
                    onlyIf: { etagDoesNotMatch: `"conflict.txt-etag"` },
                })
            ).rejects.toThrow("etag matches precondition failure");
        });
    });

    describe("getObject()", () => {
        it("debe recuperar un objeto almacenado", async () => {
            await putObject("test.txt", "Hello World");
            const obj = await getObject("test.txt");
            expect(obj).not.toBeNull();
            expect(obj?.key).toBe("test.txt");
        });

        it("debe retornar null para objetos inexistentes", async () => {
            const obj = await getObject("nonexistent.txt");
            expect(obj).toBeNull();
        });

        it("debe retornar null después de eliminar", async () => {
            await putObject("temp.txt", "temporal");
            await deleteObject("temp.txt");
            const obj = await getObject("temp.txt");
            expect(obj).toBeNull();
        });
    });

    describe("deleteObject()", () => {
        it("debe eliminar un objeto existente", async () => {
            await putObject("delete-me.txt", "to be deleted");
            await deleteObject("delete-me.txt");
            const obj = await getObject("delete-me.txt");
            expect(obj).toBeNull();
        });

        it("debe no lanzar error al eliminar objeto inexistente", async () => {
            await expect(deleteObject("already-gone.txt")).resolves.toBeUndefined();
        });
    });

    describe("listObjects()", () => {
        it("debe listar todos los objetos", async () => {
            await putObject("a.txt", "A");
            await putObject("b.txt", "B");
            await putObject("c.txt", "C");

            const result = await listObjects();
            expect(result.objects.length).toBe(3);
            expect(result.truncated).toBe(false);
        });

        it("debe filtrar por prefijo", async () => {
            await putObject("images/logo.png", "logo");
            await putObject("images/banner.png", "banner");
            await putObject("docs/readme.txt", "readme");

            const images = await listObjects("images/");
            expect(images.objects.length).toBe(2);

            const docs = await listObjects("docs/");
            expect(docs.objects.length).toBe(1);
        });

        it("debe paginar resultados con limit", async () => {
            for (let i = 1; i <= 5; i++) {
                await putObject(`file-${i}.txt`, `File ${i}`);
            }

            const page1 = await listObjects(undefined, 2);
            expect(page1.objects.length).toBe(2);
            expect(page1.truncated).toBe(true);
            expect(page1.cursor).toBeDefined();
        });

        it("debe retornar lista vacía si no hay objetos", async () => {
            const result = await listObjects();
            expect(result.objects).toEqual([]);
            expect(result.truncated).toBe(false);
        });

        it("debe retornar lista vacía para prefijo sin coincidencias", async () => {
            await putObject("a.txt", "A");
            const result = await listObjects("nonexistent/");
            expect(result.objects).toEqual([]);
        });
    });

    describe("objectExists()", () => {
        it("debe retornar true para objetos existentes", async () => {
            await putObject("exists.txt", "I exist");
            expect(await objectExists("exists.txt")).toBe(true);
        });

        it("debe retornar false para objetos inexistentes", async () => {
            expect(await objectExists("ghost.txt")).toBe(false);
        });

        it("debe retornar false después de eliminar", async () => {
            await putObject("temp.txt", "temporal");
            await deleteObject("temp.txt");
            expect(await objectExists("temp.txt")).toBe(false);
        });
    });

    describe("Operaciones con rutas (path-like keys)", () => {
        it("debe manejar rutas anidadas como keys", async () => {
            await putObject("uploads/2024/01/image.jpg", "binary-data");
            const obj = await getObject("uploads/2024/01/image.jpg");
            expect(obj).not.toBeNull();
            expect(obj?.key).toBe("uploads/2024/01/image.jpg");
        });

        it("debe listar objetos en subdirectorios", async () => {
            await putObject("assets/css/main.css", "body {}");
            await putObject("assets/css/theme.css", ":root {}");
            await putObject("assets/js/app.js", "console.log('hi')");

            const cssFiles = await listObjects("assets/css/");
            expect(cssFiles.objects.length).toBe(2);

            const jsFiles = await listObjects("assets/js/");
            expect(jsFiles.objects.length).toBe(1);
        });

        it("debe eliminar objetos en rutas anidadas", async () => {
            await putObject("deeply/nested/path/file.txt", "deep");
            await deleteObject("deeply/nested/path/file.txt");
            expect(await objectExists("deeply/nested/path/file.txt")).toBe(false);
        });
    });
});
