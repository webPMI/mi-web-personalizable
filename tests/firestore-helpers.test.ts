import { describe, it, expect } from "vitest";
import { sanitizeData, getFirestoreErrorMessage } from "../src/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";

describe("Firestore Helpers & Sanitization", () => {
  describe("sanitizeData()", () => {
    it("should strip top-level undefined properties while keeping null, false, 0, and empty strings", () => {
      const input = {
        siteName: "Mi Sitio",
        description: undefined,
        logoUrl: undefined,
        isActive: false,
        viewCount: 0,
        customCss: "",
        owner: null,
      };

      const result = sanitizeData(input);

      expect(result).toEqual({
        siteName: "Mi Sitio",
        isActive: false,
        viewCount: 0,
        customCss: "",
        owner: null,
      });

      expect("description" in result).toBe(false);
      expect("logoUrl" in result).toBe(false);
    });

    it("should recursively strip undefined properties from nested objects", () => {
      const input = {
        theme: {
          primaryColor: "#ff0000",
          fontFamily: undefined,
          meta: {
            author: "Enzo",
            version: undefined,
          },
        },
      };

      const result = sanitizeData(input);

      expect(result).toEqual({
        theme: {
          primaryColor: "#ff0000",
          meta: {
            author: "Enzo",
          },
        },
      });
    });

    it("should strip undefined items in arrays and objects inside arrays", () => {
      const input = {
        navLinks: [
          { label: "Home", href: "/" },
          { label: "About", href: undefined },
        ],
      };

      const result = sanitizeData(input);

      expect(result).toEqual({
        navLinks: [
          { label: "Home", href: "/" },
          { label: "About" },
        ],
      });
    });

    it("should preserve Timestamp objects without altering them", () => {
      const now = Timestamp.now();
      const input = {
        createdAt: now,
        updatedAt: undefined,
      };

      const result = sanitizeData(input);

      expect(result.createdAt).toBe(now);
      expect("updatedAt" in result).toBe(false);
    });
  });

  describe("getFirestoreErrorMessage()", () => {
    it("should translate known Firestore error codes", () => {
      expect(getFirestoreErrorMessage({ code: "permission-denied" })).toBe(
        "No tienes permisos para realizar esta operación."
      );
      expect(getFirestoreErrorMessage({ code: "not-found" })).toBe(
        "El documento solicitado no existe."
      );
    });

    it("should handle generic Error objects cleanly without returning undefined", () => {
      const genericErr = new Error("Connection failed");
      expect(getFirestoreErrorMessage(genericErr)).toBe("Error de Firestore: Connection failed");
    });

    it("should handle null or undefined error inputs gracefully", () => {
      expect(getFirestoreErrorMessage(null)).toBe("Ha ocurrido un error inesperado en Firestore.");
      expect(getFirestoreErrorMessage(undefined)).toBe("Ha ocurrido un error inesperado en Firestore.");
    });
  });
});
