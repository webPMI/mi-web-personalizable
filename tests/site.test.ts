// ============================================
// tests/site.test.ts — Site data & page subcollection logic
// ============================================
// Tests the business logic in src/lib/site.ts:
// - getSiteData, getPageBySlug, listSitePages
// - savePageSubcollection, deletePageSubcollection
// - Cache invalidation on write operations
// ============================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryCache } from "../src/lib/cache";

// ============================================
// Mock Firestore
// ============================================
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockGetDocs = vi.fn();
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
    doc: (...args: any[]) => mockDoc(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    collection: (...args: any[]) => mockCollection(...args),
    query: (...args: any[]) => mockQuery(...args),
    where: (...args: any[]) => mockWhere(...args),
    limit: (...args: any[]) => mockLimit(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
    Timestamp: {
        now: () => ({ seconds: 1234567890, nanoseconds: 0 }),
    },
}));

vi.mock("../src/lib/firebase", () => ({
    db: {} as any,
    auth: { currentUser: null } as any,
}));

// Mock para setDocument usado por createSite
const mockSetDocument = vi.fn();
vi.mock("../src/lib/firebase/firestore", () => ({
    setDocument: (...args: any[]) => mockSetDocument(...args),
    sanitizeData: (data: any) => data,
    getDocument: (...args: any[]) => mockGetDocument(...args),
}));
const mockGetDocument = vi.fn();

// ============================================
// Helpers to create mock Firestore snapshots
// ============================================
function makeDocSnap(exists: boolean, data?: Record<string, any>, id = "test-id") {
    return {
        exists: () => exists,
        id,
        data: () => data || {},
    };
}

function makeQuerySnapshot(docs: any[]) {
    return {
        docs,
        empty: docs.length === 0,
    };
}

describe("Site Data & Page Subcollection Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        MemoryCache.clear();
    });

    // ============================================
    // getSiteData()
    // ============================================
    describe("getSiteData()", () => {
        it("should return null when domain is empty", async () => {
            const { getSiteData } = await import("../src/lib/site");
            const result = await getSiteData("");
            expect(result).toBeNull();
        });

        it("should return null when Firestore document does not exist", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(makeDocSnap(false));

            const { getSiteData } = await import("../src/lib/site");
            const result = await getSiteData("nonexistent.com");
            expect(result).toBeNull();
        });

        it("should return site data when Firestore document exists", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, {
                    domain: "example.com",
                    siteName: "Example Site",
                    siteDescription: "A test site",
                    ownerId: "user-123",
                    status: "active",
                    locale: "es",
                })
            );

            const { getSiteData } = await import("../src/lib/site");
            const result = await getSiteData("example.com");

            expect(result).not.toBeNull();
            expect(result?.id).toBe("test-id");
            expect(result?.siteName).toBe("Example Site");
            expect(result?.domain).toBe("example.com");
            expect(result?.ownerId).toBe("user-123");
            expect(result?.status).toBe("active");
        });

        it("should return cached data on second call without Firestore read", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, { domain: "cached.com", siteName: "Cached Site" })
            );

            const { getSiteData } = await import("../src/lib/site");

            // First call — reads from Firestore
            const first = await getSiteData("cached.com");
            expect(first?.siteName).toBe("Cached Site");
            expect(mockGetDoc).toHaveBeenCalledTimes(1);

            // Second call — should read from cache
            const second = await getSiteData("cached.com");
            expect(second?.siteName).toBe("Cached Site");
            // getDoc should NOT have been called again
            expect(mockGetDoc).toHaveBeenCalledTimes(1);
        });

        it("should handle Firestore errors gracefully and return null", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockRejectedValue(new Error("Network error"));

            const { getSiteData } = await import("../src/lib/site");
            const result = await getSiteData("error.com");
            expect(result).toBeNull();
        });
    });

    // ============================================
    // getPageBySlug()
    // ============================================
    describe("getPageBySlug()", () => {
        it("should return null when domain or slug is empty", async () => {
            const { getPageBySlug } = await import("../src/lib/site");
            expect(await getPageBySlug("", "slug")).toBeNull();
            expect(await getPageBySlug("domain.com", "")).toBeNull();
        });

        it("should return page from subcollection when found", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, { domain: "test.com", siteName: "Test" })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(
                makeQuerySnapshot([
                    makeDocSnap(true, {
                        slug: "about",
                        title: "About Us",
                        content: "<p>About content</p>",
                        published: true,
                    }, "page-1"),
                ])
            );

            const { getPageBySlug } = await import("../src/lib/site");
            const result = await getPageBySlug("test.com", "about");

            expect(result).not.toBeNull();
            expect(result?.id).toBe("page-1");
            expect(result?.slug).toBe("about");
            expect(result?.title).toBe("About Us");
        });

        it("should fallback to legacy pages array when subcollection is empty", async () => {
            // First call: getSiteData (for fallback)
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, {
                    domain: "legacy.com",
                    siteName: "Legacy",
                    pages: [
                        { id: "legacy-1", slug: "contact", title: "Contact", content: "", published: true },
                    ],
                })
            );

            // Subcollection query returns empty
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(makeQuerySnapshot([]));

            const { getPageBySlug } = await import("../src/lib/site");
            const result = await getPageBySlug("legacy.com", "contact");

            expect(result).not.toBeNull();
            expect(result?.id).toBe("legacy-1");
            expect(result?.slug).toBe("contact");
            expect(result?.title).toBe("Contact");
        });

        it("should return null when page is not found anywhere", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, { domain: "empty.com", siteName: "Empty", pages: [] })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(makeQuerySnapshot([]));

            const { getPageBySlug } = await import("../src/lib/site");
            const result = await getPageBySlug("empty.com", "nonexistent");
            expect(result).toBeNull();
        });

        it("should be case-insensitive when matching slugs", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, { domain: "case.com", siteName: "Case Test" })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(
                makeQuerySnapshot([
                    makeDocSnap(true, {
                        slug: "About-Us",
                        title: "About Us",
                        content: "",
                        published: true,
                    }, "page-1"),
                ])
            );

            const { getPageBySlug } = await import("../src/lib/site");
            const result = await getPageBySlug("case.com", "about-us");
            expect(result).not.toBeNull();
            expect(result?.slug).toBe("About-Us");
        });

        it("should return cached page on second call without Firestore read", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, { domain: "cached-page.com", siteName: "Cached" })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(
                makeQuerySnapshot([
                    makeDocSnap(true, {
                        slug: "cached",
                        title: "Cached Page",
                        content: "",
                        published: true,
                    }, "page-cached"),
                ])
            );

            const { getPageBySlug } = await import("../src/lib/site");

            // First call
            const first = await getPageBySlug("cached-page.com", "cached");
            expect(first).not.toBeNull();
            expect(mockGetDocs).toHaveBeenCalledTimes(1);

            // Second call — should use cache
            const second = await getPageBySlug("cached-page.com", "cached");
            expect(second).not.toBeNull();
            expect(mockGetDocs).toHaveBeenCalledTimes(1);
        });

        it("should handle Firestore errors gracefully and return null", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, { domain: "error.com", siteName: "Error" })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockRejectedValue(new Error("Firestore error"));

            const { getPageBySlug } = await import("../src/lib/site");
            const result = await getPageBySlug("error.com", "any");
            expect(result).toBeNull();
        });

        it("should match legacy page with case-insensitive slug", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, {
                    domain: "legacy-case.com",
                    siteName: "Legacy Case",
                    pages: [
                        { id: "legacy-1", slug: "CONTACT", title: "Contact", content: "", published: true },
                    ],
                })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(makeQuerySnapshot([]));

            const { getPageBySlug } = await import("../src/lib/site");
            const result = await getPageBySlug("legacy-case.com", "contact");
            expect(result).not.toBeNull();
            expect(result?.id).toBe("legacy-1");
        });
    });

    // ============================================
    // getSiteByOwnerId()
    // ============================================
    describe("getSiteByOwnerId()", () => {
        it("should return null when no site found for owner", async () => {
            mockCollection.mockReturnValue("sites-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(makeQuerySnapshot([]));

            const { getSiteByOwnerId } = await import("../src/lib/site");
            const result = await getSiteByOwnerId("nonexistent-user");
            expect(result).toBeNull();
        });

        it("should return site data when found by ownerId", async () => {
            mockCollection.mockReturnValue("sites-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(
                makeQuerySnapshot([
                    makeDocSnap(true, {
                        domain: "owner-site.com",
                        siteName: "Owner Site",
                        ownerId: "user-456",
                        status: "active",
                    }, "owner-site.com"),
                ])
            );

            const { getSiteByOwnerId } = await import("../src/lib/site");
            const result = await getSiteByOwnerId("user-456");
            expect(result).not.toBeNull();
            expect(result?.domain).toBe("owner-site.com");
            expect(result?.ownerId).toBe("user-456");
        });

        it("should handle Firestore errors gracefully", async () => {
            mockCollection.mockReturnValue("sites-collection");
            mockWhere.mockReturnValue("where-clause");
            mockLimit.mockReturnValue("limit-clause");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockRejectedValue(new Error("Network error"));

            const { getSiteByOwnerId } = await import("../src/lib/site");
            const result = await getSiteByOwnerId("user-error");
            expect(result).toBeNull();
        });
    });

    // ============================================
    // checkUserSite()
    // ============================================
    describe("checkUserSite()", () => {
        it("should return domain when user is owner", async () => {
            mockGetDocument.mockResolvedValue({
                success: true,
                data: {
                    id: "my-site.com",
                    domain: "my-site.com",
                    ownerId: "user-789",
                    roles: {},
                },
            });

            const { checkUserSite } = await import("../src/lib/site");
            const result = await checkUserSite("user-789", "my-site.com");
            expect(result).toBe("my-site.com");
        });

        it("should return domain when user has a role", async () => {
            mockGetDocument.mockResolvedValue({
                success: true,
                data: {
                    id: "team-site.com",
                    domain: "team-site.com",
                    ownerId: "owner-1",
                    roles: { "user-999": "editor" },
                },
            });

            const { checkUserSite } = await import("../src/lib/site");
            const result = await checkUserSite("user-999", "team-site.com");
            expect(result).toBe("team-site.com");
        });

        it("should return null when user has no access", async () => {
            // Paso 1: getDocument("sites", "restricted.com") devuelve datos pero el usuario no es owner ni tiene rol
            mockGetDocument.mockImplementation((path: string, id: string) => {
                if (path === "sites" && id === "restricted.com") {
                    return Promise.resolve({
                        success: true,
                        data: {
                            id: "restricted.com",
                            domain: "restricted.com",
                            ownerId: "owner-1",
                            roles: {},
                        },
                    });
                }
                return Promise.resolve({ success: false, error: "Not found" });
            });
            // Paso 3: getSiteByOwnerId no encuentra ningún sitio para este usuario
            // Usamos mockImplementation para asegurar que getDocs siempre devuelva vacío
            // independientemente de contaminación de mocks entre archivos
            mockGetDocs.mockImplementation(() => Promise.resolve(makeQuerySnapshot([])));

            const { checkUserSite } = await import("../src/lib/site");
            const result = await checkUserSite("unauthorized-user", "restricted.com");
            expect(result).toBeNull();
        });
    });

    // ============================================
    // createSite()
    // ============================================
    describe("createSite()", () => {
        it("should create a site successfully", async () => {
            mockSetDocument.mockResolvedValue({ success: true, data: { id: "new-site.com" } });

            const { createSite } = await import("../src/lib/site");
            const result = await createSite("new-site.com", {
                ownerId: "user-new",
                siteName: "New Site",
            });

            expect(result).toBe(true);
            expect(mockSetDocument).toHaveBeenCalled();
        });

        it("should handle errors gracefully", async () => {
            mockSetDocument.mockResolvedValue({ success: false, error: "Permission denied" });

            const { createSite } = await import("../src/lib/site");
            const result = await createSite("fail.com", {
                ownerId: "user-fail",
            });

            expect(result).toBe(false);
        });
    });

    // ============================================
    // listSitePages()
    // ============================================
    describe("listSitePages()", () => {
        it("should return empty array for empty domain", async () => {
            const { listSitePages } = await import("../src/lib/site");
            const result = await listSitePages("");
            expect(result).toEqual([]);
        });

        it("should merge legacy pages and subcollection pages", async () => {
            mockDoc.mockReturnValue("doc-ref");
            mockGetDoc.mockResolvedValue(
                makeDocSnap(true, {
                    domain: "merge.com",
                    siteName: "Merge",
                    pages: [
                        { id: "legacy-1", slug: "old-page", title: "Old Page", content: "", published: true },
                    ],
                })
            );
            mockCollection.mockReturnValue("pages-collection");
            mockQuery.mockReturnValue("query-ref");
            mockGetDocs.mockResolvedValue(
                makeQuerySnapshot([
                    makeDocSnap(true, {
                        slug: "new-page",
                        title: "New Page",
                        content: "",
                        published: true,
                    }, "sub-1"),
                ])
            );

            const { listSitePages } = await import("../src/lib/site");
            const result = await listSitePages("merge.com");

            expect(result.length).toBe(2);
            const slugs = result.map((p) => p.slug);
            expect(slugs).toContain("old-page");
            expect(slugs).toContain("new-page");
        });
    });

    // ============================================
    // savePageSubcollection()
    // ============================================
    describe("savePageSubcollection()", () => {
        it("should return error when domain or page id is missing", async () => {
            const { savePageSubcollection } = await import("../src/lib/site");
            const result1 = await savePageSubcollection("", { id: "p1" } as any);
            expect(result1.success).toBe(false);

            const result2 = await savePageSubcollection("domain.com", { id: "" } as any);
            expect(result2.success).toBe(false);
        });

        it("should save page and invalidate cache", async () => {
            mockDoc.mockReturnValue("page-ref");
            mockSetDoc.mockResolvedValue(undefined);

            // Pre-populate cache to verify invalidation
            MemoryCache.set("site:domain.com", { id: "domain.com" } as any);
            MemoryCache.set("page:domain.com:test", { id: "test" } as any);
            MemoryCache.set("pages-list:domain.com:0", [] as any);

            const { savePageSubcollection } = await import("../src/lib/site");
            const result = await savePageSubcollection("domain.com", {
                id: "page-1",
                slug: "test-page",
                title: "Test",
                content: "",
                published: true,
                showInNav: false,
            });

            expect(result.success).toBe(true);
            expect(mockSetDoc).toHaveBeenCalled();

            // Verify cache was invalidated
            expect(MemoryCache.get("site:domain.com")).toBeNull();
            expect(MemoryCache.get("page:domain.com:test")).toBeNull();
            expect(MemoryCache.get("pages-list:domain.com:0")).toBeNull();
        });

        it("should handle Firestore errors gracefully", async () => {
            mockDoc.mockReturnValue("page-ref");
            mockSetDoc.mockRejectedValue(new Error("Permission denied"));

            const { savePageSubcollection } = await import("../src/lib/site");
            const result = await savePageSubcollection("domain.com", {
                id: "page-1",
                slug: "test",
                title: "Test",
                content: "",
                published: true,
                showInNav: false,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    // ============================================
    // deletePageSubcollection()
    // ============================================
    describe("deletePageSubcollection()", () => {
        it("should return error when domain or page id is missing", async () => {
            const { deletePageSubcollection } = await import("../src/lib/site");
            const result1 = await deletePageSubcollection("", "p1");
            expect(result1.success).toBe(false);

            const result2 = await deletePageSubcollection("domain.com", "");
            expect(result2.success).toBe(false);
        });

        it("should delete page and invalidate cache", async () => {
            mockDoc.mockReturnValue("page-ref");
            mockDeleteDoc.mockResolvedValue(undefined);

            // Pre-populate cache to verify invalidation
            MemoryCache.set("site:domain.com", { id: "domain.com" } as any);
            MemoryCache.set("pages-list:domain.com:0", [] as any);

            const { deletePageSubcollection } = await import("../src/lib/site");
            const result = await deletePageSubcollection("domain.com", "page-1");

            expect(result.success).toBe(true);
            expect(mockDeleteDoc).toHaveBeenCalled();

            // Verify cache was invalidated
            expect(MemoryCache.get("site:domain.com")).toBeNull();
            expect(MemoryCache.get("pages-list:domain.com:0")).toBeNull();
        });

        it("should handle Firestore errors gracefully", async () => {
            mockDoc.mockReturnValue("page-ref");
            mockDeleteDoc.mockRejectedValue(new Error("Not found"));

            const { deletePageSubcollection } = await import("../src/lib/site");
            const result = await deletePageSubcollection("domain.com", "page-1");

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});
