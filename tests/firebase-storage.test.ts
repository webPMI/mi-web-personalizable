// ============================================
// tests/firebase-storage.test.ts — Pruebas de Firebase Storage helpers
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Mocks de Firebase Storage
// ============================================

interface StorageRef {
    fullPath: string;
    name: string;
}

interface UploadResultMock {
    ref: StorageRef;
    metadata: {
        size: number;
        contentType?: string;
    };
}

interface ListResultMock {
    items: StorageRef[];
    prefixes: StorageRef[];
}

const mockStorageRef = vi.fn();
const mockUploadBytes = vi.fn();
const mockGetDownloadURL = vi.fn();
const mockDeleteObject = vi.fn();
const mockListAll = vi.fn();
const mockUploadBytesResumable = vi.fn();

vi.mock("firebase/storage", () => ({
    ref: (...args: any[]) => mockStorageRef(...args),
    uploadBytes: (...args: any[]) => mockUploadBytes(...args),
    getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
    deleteObject: (...args: any[]) => mockDeleteObject(...args),
    listAll: (...args: any[]) => mockListAll(...args),
    uploadBytesResumable: (...args: any[]) => mockUploadBytesResumable(...args),
}));

// ============================================
// Implementación inline de las funciones (replicando storage.ts)
// ============================================

interface UploadResult {
    url: string;
    path: string;
    name: string;
    size: number;
    type: string;
}

async function uploadFile(
    path: string,
    file: File | Blob | Uint8Array
): Promise<{ success: true; data: UploadResult } | { success: false; error: string }> {
    try {
        const storageRef = mockStorageRef(path);
        const snapshot: UploadResultMock = await mockUploadBytes(storageRef, file);
        const url = await mockGetDownloadURL(snapshot.ref);

        return {
            success: true,
            data: {
                url,
                path: snapshot.ref.fullPath,
                name: snapshot.ref.name,
                size: snapshot.metadata.size,
                type: snapshot.metadata.contentType || "unknown",
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al subir el archivo." };
    }
}

function uploadFileWithProgress(
    path: string,
    file: File
): {
    task: any;
    promise: Promise<UploadResult>;
} {
    const storageRef = mockStorageRef(path);
    const task = mockUploadBytesResumable(storageRef, file);

    const promise = new Promise<UploadResult>((resolve, reject) => {
        task.on(
            "state_changed",
            null,
            (error: any) => reject(error),
            async () => {
                const url = await mockGetDownloadURL(task.snapshot.ref);
                resolve({
                    url,
                    path: task.snapshot.ref.fullPath,
                    name: task.snapshot.ref.name,
                    size: task.snapshot.metadata.size,
                    type: task.snapshot.metadata.contentType || "unknown",
                });
            }
        );
    });

    return { task, promise };
}

async function deleteFile(
    path: string
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        const storageRef = mockStorageRef(path);
        await mockDeleteObject(storageRef);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al eliminar el archivo." };
    }
}

async function listFiles(path: string) {
    const storageRef = mockStorageRef(path);
    const result: ListResultMock = await mockListAll(storageRef);

    const items = await Promise.all(
        result.items.map(async (itemRef) => {
            const url = await mockGetDownloadURL(itemRef);
            return {
                name: itemRef.name,
                path: itemRef.fullPath,
                url,
            };
        })
    );

    return {
        files: items,
        prefixes: result.prefixes.map((prefix) => prefix.fullPath),
    };
}

async function getFileUrl(path: string): Promise<string> {
    const storageRef = mockStorageRef(path);
    return mockGetDownloadURL(storageRef);
}

// ============================================
// Tests
// ============================================

describe("Firebase Storage — uploadFile()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe subir un archivo y retornar URL y metadata", async () => {
        const mockFile = new Blob(["test content"], { type: "text/plain" });
        const mockSnapshot: UploadResultMock = {
            ref: { fullPath: "uploads/test.txt", name: "test.txt" },
            metadata: { size: 12, contentType: "text/plain" },
        };

        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockUploadBytes.mockResolvedValue(mockSnapshot);
        mockGetDownloadURL.mockResolvedValue("https://example.com/test.txt");

        const result = await uploadFile("uploads/test.txt", mockFile);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.url).toBe("https://example.com/test.txt");
            expect(result.data.path).toBe("uploads/test.txt");
            expect(result.data.name).toBe("test.txt");
            expect(result.data.size).toBe(12);
            expect(result.data.type).toBe("text/plain");
        }
    });

    it("debe usar 'unknown' como type si no hay contentType", async () => {
        const mockFile = new Blob(["test"]);
        const mockSnapshot: UploadResultMock = {
            ref: { fullPath: "uploads/file.bin", name: "file.bin" },
            metadata: { size: 4 },
        };

        mockStorageRef.mockReturnValue({ fullPath: "uploads/file.bin", name: "file.bin" });
        mockUploadBytes.mockResolvedValue(mockSnapshot);
        mockGetDownloadURL.mockResolvedValue("https://example.com/file.bin");

        const result = await uploadFile("uploads/file.bin", mockFile);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.type).toBe("unknown");
        }
    });

    it("debe manejar errores de subida", async () => {
        mockUploadBytes.mockRejectedValue(new Error("Network error"));

        const result = await uploadFile("uploads/test.txt", new Blob(["test"]));

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("Network error");
        }
    });

    it("debe manejar errores sin mensaje", async () => {
        mockUploadBytes.mockRejectedValue(new Error());

        const result = await uploadFile("uploads/test.txt", new Blob(["test"]));

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Error al subir el archivo.");
        }
    });

    it("debe aceptar Uint8Array como tipo de archivo", async () => {
        const data = new Uint8Array([1, 2, 3]);
        const mockSnapshot: UploadResultMock = {
            ref: { fullPath: "uploads/data.bin", name: "data.bin" },
            metadata: { size: 3, contentType: "application/octet-stream" },
        };

        mockStorageRef.mockReturnValue({ fullPath: "uploads/data.bin", name: "data.bin" });
        mockUploadBytes.mockResolvedValue(mockSnapshot);
        mockGetDownloadURL.mockResolvedValue("https://example.com/data.bin");

        const result = await uploadFile("uploads/data.bin", data);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.size).toBe(3);
        }
    });
});

describe("Firebase Storage — uploadFileWithProgress()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe retornar task y promise", () => {
        const mockTask = {
            on: vi.fn(),
            snapshot: {
                ref: { fullPath: "uploads/test.txt", name: "test.txt" },
                metadata: { size: 12, contentType: "text/plain" },
            },
        };

        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockUploadBytesResumable.mockReturnValue(mockTask);
        mockGetDownloadURL.mockResolvedValue("https://example.com/test.txt");

        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const result = uploadFileWithProgress("uploads/test.txt", file);

        expect(result.task).toBe(mockTask);
        expect(result.promise).toBeInstanceOf(Promise);
    });

    it("debe resolver la promise cuando la subida se completa", async () => {
        let onComplete: () => void = () => { };
        const mockTask = {
            on: vi.fn((_event: string, _next: null, _error: any, complete: () => void) => {
                onComplete = complete;
            }),
            snapshot: {
                ref: { fullPath: "uploads/test.txt", name: "test.txt" },
                metadata: { size: 12, contentType: "text/plain" },
            },
        };

        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockUploadBytesResumable.mockReturnValue(mockTask);
        mockGetDownloadURL.mockResolvedValue("https://example.com/test.txt");

        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const { promise } = uploadFileWithProgress("uploads/test.txt", file);

        // Simular que la subida se completa
        onComplete();

        const result = await promise;
        expect(result.url).toBe("https://example.com/test.txt");
        expect(result.path).toBe("uploads/test.txt");
    });

    it("debe rechazar la promise si hay error", async () => {
        let onError: (error: any) => void = () => { };
        const mockTask = {
            on: vi.fn((_event: string, _next: null, error: (e: any) => void, _complete: () => void) => {
                onError = error;
            }),
            snapshot: {
                ref: { fullPath: "uploads/test.txt", name: "test.txt" },
                metadata: { size: 12, contentType: "text/plain" },
            },
        };

        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockUploadBytesResumable.mockReturnValue(mockTask);

        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const { promise } = uploadFileWithProgress("uploads/test.txt", file);

        // Simular error
        onError(new Error("Upload failed"));

        await expect(promise).rejects.toThrow("Upload failed");
    });
});

describe("Firebase Storage — deleteFile()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe eliminar un archivo correctamente", async () => {
        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockDeleteObject.mockResolvedValue(undefined);

        const result = await deleteFile("uploads/test.txt");

        expect(result.success).toBe(true);
        expect(mockDeleteObject).toHaveBeenCalledTimes(1);
    });

    it("debe manejar errores al eliminar", async () => {
        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockDeleteObject.mockRejectedValue(new Error("File not found"));

        const result = await deleteFile("uploads/test.txt");

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("File not found");
        }
    });
});

describe("Firebase Storage — listFiles()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe listar archivos y prefijos", async () => {
        const mockItems = [
            { name: "file1.txt", fullPath: "uploads/file1.txt" },
            { name: "file2.txt", fullPath: "uploads/file2.txt" },
        ];
        const mockPrefixes = [
            { fullPath: "uploads/images" },
            { fullPath: "uploads/docs" },
        ];

        mockStorageRef.mockReturnValue({ fullPath: "uploads" });
        mockListAll.mockResolvedValue({ items: mockItems, prefixes: mockPrefixes });
        mockGetDownloadURL
            .mockResolvedValueOnce("https://example.com/file1.txt")
            .mockResolvedValueOnce("https://example.com/file2.txt");

        const result = await listFiles("uploads");

        expect(result.files.length).toBe(2);
        expect(result.files[0].name).toBe("file1.txt");
        expect(result.files[0].url).toBe("https://example.com/file1.txt");
        expect(result.prefixes).toEqual(["uploads/images", "uploads/docs"]);
    });

    it("debe retornar arrays vacíos si no hay archivos", async () => {
        mockStorageRef.mockReturnValue({ fullPath: "empty" });
        mockListAll.mockResolvedValue({ items: [], prefixes: [] });

        const result = await listFiles("empty");

        expect(result.files).toEqual([]);
        expect(result.prefixes).toEqual([]);
    });
});

describe("Firebase Storage — getFileUrl()", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("debe retornar la URL de descarga", async () => {
        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockGetDownloadURL.mockResolvedValue("https://example.com/test.txt");

        const url = await getFileUrl("uploads/test.txt");

        expect(url).toBe("https://example.com/test.txt");
    });

    it("debe propagar errores", async () => {
        mockStorageRef.mockReturnValue({ fullPath: "uploads/test.txt", name: "test.txt" });
        mockGetDownloadURL.mockRejectedValue(new Error("Permission denied"));

        await expect(getFileUrl("uploads/test.txt")).rejects.toThrow("Permission denied");
    });
});
