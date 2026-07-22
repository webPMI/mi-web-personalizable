// ============================================
// tests/firestore-crud.test.ts — Pruebas de CRUD Auxiliar Firestore
// ============================================
// Evalúa las funciones helper de manipulación de documentos en src/lib/firebase/firestore.ts
// ============================================
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn(() => "mock-doc-ref");
const mockCollection = vi.fn(() => "mock-collection-ref");

vi.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => mockDoc(...args),
  collection: (...args: any[]) => mockCollection(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  Timestamp: { now: () => ({ seconds: 123, nanoseconds: 456 }) },
}));

vi.mock("../src/lib/firebase", () => ({
  db: "mock-db",
}));

import { getDocument, setDocument, updateDocument, deleteDocument, listDocuments } from "../src/lib/firebase/firestore";

describe("Firestore CRUD Helper Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDocument()", () => {
    it("debe obtener un documento exitosamente", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: "doc1",
        data: () => ({ name: "Test Doc" }),
      });

      const result = await getDocument("test-collection", "doc1");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: "doc1", name: "Test Doc" });
      }
    });

    it("debe retornar error si el documento no existe", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getDocument("test-collection", "nonexistent");
      expect(result.success).toBe(false);
    });
  });

  describe("setDocument()", () => {
    it("debe guardar un documento exitosamente", async () => {
      mockSetDoc.mockResolvedValue(undefined);

      const result = await setDocument("test-collection", "doc1", { title: "Nuevo" });
      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateDocument()", () => {
    it("debe actualizar campos de un documento", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await updateDocument("test-collection", "doc1", { title: "Actualizado" });
      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteDocument()", () => {
    it("debe eliminar un documento", async () => {
      mockDeleteDoc.mockResolvedValue(undefined);

      const result = await deleteDocument("test-collection", "doc1");
      expect(result.success).toBe(true);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("listDocuments()", () => {
    it("debe listar documentos de una colección", async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: "d1", data: () => ({ title: "Uno" }) },
          { id: "d2", data: () => ({ title: "Dos" }) },
        ],
      });

      const result = await listDocuments("test-collection");
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.length).toBe(2);
      }
    });
  });
});
