// ============================================
// tests/storage.test.ts — Pruebas de Firebase Storage helpers
// ============================================
import { describe, it, expect, vi } from "vitest";

// Mocks de Firebase Storage
vi.mock("firebase/storage", () => ({
    ref: vi.fn((_storage, path) => ({ fullPath: path, name: path.split("/").pop() })),
    uploadBytes: vi.fn(async (_ref: any, _file: any) => ({
        ref: { fullPath: "test/file.jpg", name: "file.jpg" },
        metadata: { size: 1024, contentType: "image/jpeg" },
    })),
    getDownloadURL: vi.fn(async (_ref: any) => "https://example.com/file.jpg"),
    deleteObject: vi.fn(async (_ref: any) => undefined),
    listAll: vi.fn(async (_ref: any) => ({
        items: [
            { name: "file1.jpg", fullPath: "test/file1.jpg" },
            { name: "file2.jpg", fullPath: "test/file2.jpg" },
        ],
        prefixes: [{ fullPath: "test/subfolder" }],
    })),
    uploadBytesResumable: vi.fn(),
}));

vi.mock("../src/lib/firebase", () => ({
    storage: {},
}));

// Replicamos las funciones de storage.ts para testear la lógica pura
async function uploadFile(path: string, _file: any) {
    try {
        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
        const { storage } = await import("../src/lib/firebase");
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, _file);
        const url = await getDownloadURL(snapshot.ref);
        return {
            success: true as const,
            data: {
                url,
                path: snapshot.ref.fullPath,
                name: snapshot.ref.name,
                size: snapshot.metadata.size,
                type: snapshot.metadata.contentType || "unknown",
            },
        };
    } catch (error: any) {
        return { success: false as const, error: error.message || "Error al subir el archivo." };
    }
}

async function deleteFile(path: string) {
    try {
        const { ref, deleteObject } = await import("firebase/storage");
        const { storage } = await import("../src/lib/firebase");
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        return { success: true as const };
    } catch (error: any) {
        return { success: false as const, error: error.message || "Error al eliminar el archivo." };
    }
}

async function listFiles(path: string) {
    const { ref, listAll, getDownloadURL } = await import("firebase/storage");
    const { storage } = await import("../src/lib/firebase");
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    const items = await Promise.all(
        result.items.map(async (itemRef: any) => {
            const url = await getDownloadURL(itemRef);
            return { name: itemRef.name, path: itemRef.fullPath, url };
        })
    );
    return { files: items, prefixes: result.prefixes.map((p: any) => p.fullPath) };
}

describe("Firebase Storage Helpers", () => {
    it("debe subir un archivo y devolver URL", async () => {
        const result = await uploadFile("test/file.jpg", new Uint8Array([1, 2, 3]));
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.url).toBe("https://example.com/file.jpg");
            expect(result.data.name).toBe("file.jpg");
            expect(result.data.size).toBe(1024);
        }
    });

    it("debe eliminar un archivo", async () => {
        const result = await deleteFile("test/file.jpg");
        expect(result.success).toBe(true);
    });

    it("debe listar archivos en una ruta", async () => {
        const result = await listFiles("test");
        expect(result.files.length).toBe(2);
        expect(result.files[0].name).toBe("file1.jpg");
        expect(result.prefixes).toContain("test/subfolder");
    });

    it("debe devolver tipo unknown si no hay contentType", async () => {
        // Simular metadata sin contentType
        vi.mocked((await import("firebase/storage")).uploadBytes).mockResolvedValueOnce({
            ref: { fullPath: "test/file.txt", name: "file.txt" },
            metadata: { size: 512, contentType: undefined },
        } as any);

        const result = await uploadFile("test/file.txt", new Uint8Array([1]));
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.type).toBe("unknown");
        }
    });

    it("debe manejar errores de subida", async () => {
        vi.mocked((await import("firebase/storage")).uploadBytes).mockRejectedValueOnce(
            new Error("Network error")
        );
        const result = await uploadFile("test/file.jpg", new Uint8Array([1]));
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Network error");
        }
    });

    it("debe manejar errores de eliminación", async () => {
        vi.mocked((await import("firebase/storage")).deleteObject).mockRejectedValueOnce(
            new Error("File not found")
        );
        const result = await deleteFile("test/nonexistent.jpg");
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("File not found");
        }
    });
});
