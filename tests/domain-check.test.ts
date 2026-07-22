import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getEffectiveDomain,
  getRegisteredDomain,
  getDevToolsDomain,
  clearDevToolsDomain,
  getCurrentDomain,
  checkDomain,
} from "../src/lib/domain-check";

// ============================================
// Mock Firestore for checkDomain()
// ============================================
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
}));

vi.mock("../src/lib/firebase", () => ({
  db: {} as any,
}));

function makeDocSnap(exists: boolean, data?: Record<string, any>, id = "test-id") {
  return {
    exists: () => exists,
    id,
    data: () => data || {},
  };
}

describe("domain-check utility", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("should return registered-domain from sessionStorage as top priority", () => {
    sessionStorage.setItem("registered-domain", "mi-sitio-nuevo.com");
    sessionStorage.setItem("devtools-domain", "dev-sitio.com");

    expect(getEffectiveDomain()).toBe("mi-sitio-nuevo.com");
  });

  it("should consume registered-domain only once (one-time use)", () => {
    sessionStorage.setItem("registered-domain", "one-time.com");

    // First call retrieves domain and removes it
    expect(getRegisteredDomain()).toBe("one-time.com");

    // Second call should return null as it was removed
    expect(getRegisteredDomain()).toBeNull();
  });

  it("should return devtools-domain as second priority", () => {
    sessionStorage.setItem("devtools-domain", "dev-test.com");

    expect(getEffectiveDomain()).toBe("dev-test.com");
  });

  it("should clear devtools domain correctly", () => {
    sessionStorage.setItem("devtools-domain", "dev-test.com");
    expect(getDevToolsDomain()).toBe("dev-test.com");

    clearDevToolsDomain();
    expect(getDevToolsDomain()).toBeNull();
  });

  it("should fallback to window.location hostname or localhost if nothing set in sessionStorage", () => {
    // In jsdom environment, window.location.hostname defaults to 'localhost'
    expect(getCurrentDomain()).toBe("localhost");
    expect(getEffectiveDomain()).toBe("localhost");
  });

  // ============================================
  // checkDomain() tests
  // ============================================
  describe("checkDomain()", () => {
    it("should return null when domain is empty", async () => {
      const result = await checkDomain("");
      expect(result).toBeNull();
    });

    it("should return null when Firestore document does not exist", async () => {
      mockDoc.mockReturnValue("doc-ref");
      mockGetDoc.mockResolvedValue(makeDocSnap(false));

      const result = await checkDomain("nonexistent.com");
      expect(result).toBeNull();
    });

    it("should return site data when domain exists in Firestore", async () => {
      mockDoc.mockReturnValue("doc-ref");
      mockGetDoc.mockResolvedValue(
        makeDocSnap(true, {
          domain: "example.com",
          status: "active",
          ownerId: "user-123",
        })
      );

      const result = await checkDomain("example.com");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
      expect(result?.domain).toBe("example.com");
      expect(result?.status).toBe("active");
      expect(result?.ownerId).toBe("user-123");
    });

    it("should normalize domain before querying Firestore", async () => {
      mockDoc.mockReturnValue("doc-ref");
      mockGetDoc.mockResolvedValue(
        makeDocSnap(true, { domain: "example.com", status: "active" })
      );

      // Domain with protocol and uppercase
      const result = await checkDomain("  HTTPS://EXAMPLE.COM/  ");

      expect(result).not.toBeNull();
      expect(result?.domain).toBe("example.com");
    });

    it("should handle Firestore errors gracefully and return null", async () => {
      mockDoc.mockReturnValue("doc-ref");
      mockGetDoc.mockRejectedValue(new Error("Network error"));

      const result = await checkDomain("error.com");
      expect(result).toBeNull();
    });
  });
});
