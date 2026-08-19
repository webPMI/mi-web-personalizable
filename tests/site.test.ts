import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firebase Firestore module before importing site.ts
vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn(),
    getDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    Timestamp: {
      now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
    },
  };
});

// Mock the firebase config module
vi.mock("../src/lib/firebase", () => ({
  db: {},
}));

// Mock the firebase/firestore helpers
vi.mock("../src/lib/firebase/firestore", () => ({
  getDocument: vi.fn(),
  setDocument: vi.fn(),
}));

// Mock firebase/auth
vi.mock("../src/lib/firebase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { checkUserSite, createSite } from "../src/lib/site";
import { getDocument, setDocument } from "../src/lib/firebase/firestore";

describe("Site Module — checkUserSite()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return domain when user is owner by ownerId in site document", async () => {
    (getDocument as any).mockResolvedValueOnce({
      success: true,
      data: { id: "test.example.com", ownerId: "user-123", roles: {} },
    });

    const result = await checkUserSite("user-123", "test.example.com");
    expect(result).toBe("test.example.com");
    expect(getDocument).toHaveBeenCalledWith("sites", "test.example.com");
  });

  it("should return domain when user has roles entry in legacy roles object", async () => {
    (getDocument as any).mockResolvedValueOnce({
      success: true,
      data: { id: "test.example.com", ownerId: "other-user", roles: { "user-456": "admin" } },
    });

    const result = await checkUserSite("user-456", "test.example.com");
    expect(result).toBe("test.example.com");
  });

  it("should return domain when user is active member in members subcollection", async () => {
    (getDocument as any).mockResolvedValueOnce({
      success: true,
      data: { id: "test.example.com", ownerId: "other-user", roles: {} },
    });
    (getDocument as any).mockResolvedValueOnce({
      success: true,
      data: { id: "user-789", uid: "user-789", role: "editor", isActive: true },
    });

    const result = await checkUserSite("user-789", "test.example.com");
    expect(result).toBe("test.example.com");
  });

  it("should return null when member is inactive", async () => {
    (getDocument as any).mockResolvedValueOnce({
      success: true,
      data: { id: "test.example.com", ownerId: "other-user", roles: {} },
    });
    (getDocument as any).mockResolvedValueOnce({
      success: true,
      data: { id: "user-inactive", uid: "user-inactive", role: "editor", isActive: false },
    });
    const { getDocs } = await import("firebase/firestore");
    (getDocs as any).mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await checkUserSite("user-inactive", "test.example.com");
    expect(result).toBeNull();
  });

  it("should return null when site document does not exist and user has no sites", async () => {
    (getDocument as any).mockResolvedValueOnce({
      success: false,
      error: "not-found",
    });
    (getDocument as any).mockResolvedValueOnce({
      success: false,
      error: "not-found",
    });
    const { getDocs } = await import("firebase/firestore");
    (getDocs as any).mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await checkUserSite("unknown-user", "nonexistent.example.com");
    expect(result).toBeNull();
  });

  it("should handle Firestore errors gracefully and return null", async () => {
    (getDocument as any).mockRejectedValueOnce(new Error("Firestore connection failed"));

    const result = await checkUserSite("user-123", "test.example.com");
    expect(result).toBeNull();
  });
});

describe("Site Module — createSite()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create site document and return true on success", async () => {
    (setDocument as any).mockResolvedValueOnce({ success: true, data: { id: "new-site" } });
    (setDocument as any).mockResolvedValueOnce({ success: true, data: { id: "owner-123" } });

    const result = await createSite("new-site.example.com", {
      ownerId: "owner-123",
      siteName: "My New Site",
      siteDescription: "A test site",
      locale: "es",
    });

    expect(result).toBe(true);
    expect(setDocument).toHaveBeenCalledTimes(2);
    expect(setDocument).toHaveBeenNthCalledWith(1, "sites", "new-site.example.com", expect.objectContaining({
      domain: "new-site.example.com",
      siteName: "My New Site",
      ownerId: "owner-123",
    }));
    expect(setDocument).toHaveBeenNthCalledWith(2, "sites/new-site.example.com/members", "owner-123", expect.objectContaining({
      uid: "owner-123",
      role: "admin",
      isActive: true,
    }));
  });

  it("should return false when site document creation fails", async () => {
    (setDocument as any).mockResolvedValueOnce({ success: false, error: "permission-denied" });

    const result = await createSite("fail.example.com", {
      ownerId: "owner-456",
    });

    expect(result).toBe(false);
    expect(setDocument).toHaveBeenCalledTimes(1);
  });

  it("should still return true if site is created but member doc fails", async () => {
    (setDocument as any).mockResolvedValueOnce({ success: true, data: { id: "partial" } });
    (setDocument as any).mockResolvedValueOnce({ success: false, error: "permission-denied" });

    const result = await createSite("partial.example.com", {
      ownerId: "owner-789",
      siteName: "Partial Site",
    });

    expect(result).toBe(true);
    expect(setDocument).toHaveBeenCalledTimes(2);
  });

  it("should handle exceptions gracefully and return false", async () => {
    (setDocument as any).mockRejectedValueOnce(new Error("Database error"));

    const result = await createSite("crash.example.com", {
      ownerId: "owner-999",
    });

    expect(result).toBe(false);
  });

  it("should use default values when siteName and description are not provided", async () => {
    (setDocument as any).mockResolvedValueOnce({ success: true, data: { id: "defaults" } });
    (setDocument as any).mockResolvedValueOnce({ success: true, data: { id: "owner-000" } });

    await createSite("defaults.example.com", {
      ownerId: "owner-000",
    });

    expect(setDocument).toHaveBeenNthCalledWith(1, "sites", "defaults.example.com", expect.objectContaining({
      siteName: "Mi Sitio",
      siteDescription: "",
      locale: "es",
      status: "active",
    }));
  });
});