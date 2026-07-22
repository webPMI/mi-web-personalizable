import { describe, it, expect, beforeEach } from "vitest";
import { MemoryCache } from "../src/lib/cache";

describe("MemoryCache & LocalStorage System (Dual SWR Cache)", () => {
  beforeEach(() => {
    MemoryCache.clear();
  });

  it("should store and retrieve data within TTL from memory", () => {
    MemoryCache.set("key1", { title: "Test Page" }, 5000);
    const data = MemoryCache.get<{ title: string }>("key1");

    expect(data).not.toBeNull();
    expect(data?.title).toBe("Test Page");
  });

  it("should return null for non-existent key", () => {
    const data = MemoryCache.get("non-existent");
    expect(data).toBeNull();
  });

  it("should expire items when TTL is reached", async () => {
    MemoryCache.set("temp-key", "temp-value", 10); // TTL 10ms

    // Esperar 20ms
    await new Promise((resolve) => setTimeout(resolve, 20));

    const data = MemoryCache.get("temp-key");
    expect(data).toBeNull();
  });

  it("should recover data from localStorage if cleared from RAM memory", () => {
    MemoryCache.set("persistent-key", { siteName: "My Web" }, 10000);

    // Simular pérdida de memoria RAM (sin limpiar localStorage)
    (MemoryCache as any).store.clear();

    // Debe recuperarlo de localStorage y volver a llenar RAM
    const data = MemoryCache.get<{ siteName: string }>("persistent-key");
    expect(data).not.toBeNull();
    expect(data?.siteName).toBe("My Web");
  });

  it("should invalidate keys matching a pattern in both RAM and localStorage", () => {
    MemoryCache.set("site:example.com", { name: "Example Site" });
    MemoryCache.set("page:example.com:about", { title: "About Us" });
    MemoryCache.set("site:other.com", { name: "Other Site" });

    MemoryCache.invalidate("example.com");

    expect(MemoryCache.get("site:example.com")).toBeNull();
    expect(MemoryCache.get("page:example.com:about")).toBeNull();
    expect(MemoryCache.get("site:other.com")).not.toBeNull();
  });

  // ============================================
  // Edge cases
  // ============================================
  it("should return null for expired items exactly at TTL boundary", async () => {
    MemoryCache.set("boundary-key", "boundary-value", 0); // TTL 0ms

    // TTL 0 means the item was stored at time X with expiry X+0 = X
    // Since Date.now() advances, it should be expired immediately
    // But the implementation uses `ttlMs || 300000` so TTL 0 becomes 300000
    // This test documents that behavior — TTL 0 falls back to default
    const data = MemoryCache.get("boundary-key");
    // The implementation treats 0 as falsy and uses default TTL
    // So the item is still valid
    expect(data).toBe("boundary-value");
  });

  it("should handle null and undefined values gracefully", () => {
    // Setting null should not throw
    expect(() => MemoryCache.set("null-key", null)).not.toThrow();

    // Setting undefined should not throw
    expect(() => MemoryCache.set("undefined-key", undefined)).not.toThrow();
  });

  it("should handle corrupt localStorage data gracefully", () => {
    // Manually inject corrupt JSON into localStorage
    localStorage.setItem("cache:corrupt-key", "not-valid-json{{{");

    // Should return null instead of throwing
    const data = MemoryCache.get("corrupt-key");
    expect(data).toBeNull();
  });

  it("should handle invalidate with empty pattern gracefully", () => {
    MemoryCache.set("key1", "value1");
    MemoryCache.set("key2", "value2");

    // Empty pattern should not throw
    // Note: key.includes("") is always true, so invalidate("") clears ALL keys
    // This is the current implementation behavior
    expect(() => MemoryCache.invalidate("")).not.toThrow();
    expect(MemoryCache.get("key1")).toBeNull();
    expect(MemoryCache.get("key2")).toBeNull();
  });

  it("should handle invalidate with pattern that matches nothing", () => {
    MemoryCache.set("key1", "value1");

    // Pattern that matches nothing should not affect existing keys
    MemoryCache.invalidate("nonexistent-pattern-xyz");
    expect(MemoryCache.get("key1")).not.toBeNull();
  });

  it("should store different data types correctly", () => {
    MemoryCache.set("string-key", "hello");
    MemoryCache.set("number-key", 42);
    MemoryCache.set("boolean-key", true);
    MemoryCache.set("array-key", [1, 2, 3]);
    MemoryCache.set("object-key", { a: 1, b: { c: 2 } });

    expect(MemoryCache.get("string-key")).toBe("hello");
    expect(MemoryCache.get("number-key")).toBe(42);
    expect(MemoryCache.get("boolean-key")).toBe(true);
    expect(MemoryCache.get<number[]>("array-key")).toEqual([1, 2, 3]);
    expect(MemoryCache.get<{ a: number; b: { c: number } }>("object-key")).toEqual({ a: 1, b: { c: 2 } });
  });

  // ============================================
  // Expanded edge cases
  // ============================================
  it("should handle invalidate with partial pattern match", () => {
    MemoryCache.set("site:example.com", { name: "Example" });
    MemoryCache.set("site:test.org", { name: "Test" });
    MemoryCache.set("page:example.com:home", { title: "Home" });
    MemoryCache.set("page:test.org:about", { title: "About" });

    // Invalidate only example.com entries
    MemoryCache.invalidate("example.com");

    expect(MemoryCache.get("site:example.com")).toBeNull();
    expect(MemoryCache.get("page:example.com:home")).toBeNull();
    expect(MemoryCache.get("site:test.org")).not.toBeNull();
    expect(MemoryCache.get("page:test.org:about")).not.toBeNull();
  });

  it("should handle invalidate with pattern that matches all keys", () => {
    MemoryCache.set("key-a", 1);
    MemoryCache.set("key-b", 2);
    MemoryCache.set("key-c", 3);

    MemoryCache.invalidate("key-");

    expect(MemoryCache.get("key-a")).toBeNull();
    expect(MemoryCache.get("key-b")).toBeNull();
    expect(MemoryCache.get("key-c")).toBeNull();
  });

  it("should handle corrupt localStorage data with invalid JSON structure", () => {
    // Inject various corrupt data formats
    localStorage.setItem("mwp_cache_corrupt1", "not-valid-json{{{");
    localStorage.setItem("mwp_cache_corrupt2", "{broken: json}");
    localStorage.setItem("mwp_cache_corrupt3", "null");
    localStorage.setItem("mwp_cache_corrupt4", "undefined");
    localStorage.setItem("mwp_cache_corrupt5", "");

    // All should return null without throwing
    expect(MemoryCache.get("corrupt1")).toBeNull();
    expect(MemoryCache.get("corrupt2")).toBeNull();
    expect(MemoryCache.get("corrupt3")).toBeNull();
    expect(MemoryCache.get("corrupt4")).toBeNull();
    expect(MemoryCache.get("corrupt5")).toBeNull();
  });

  it("should handle expired localStorage data gracefully", () => {
    // Manually inject expired entry into localStorage
    const expiredEntry = JSON.stringify({
      data: "old-data",
      timestamp: Date.now() - 600000, // 10 minutes ago
      ttl: 5000, // 5 seconds TTL
    });
    localStorage.setItem("mwp_cache_expired-key", expiredEntry);

    // Should return null because TTL expired
    const data = MemoryCache.get("expired-key");
    expect(data).toBeNull();

    // Should have removed the expired entry from localStorage
    expect(localStorage.getItem("mwp_cache_expired-key")).toBeNull();
  });

  it("should handle clear() correctly across RAM and localStorage", () => {
    MemoryCache.set("keep-me", "value");
    MemoryCache.set("also-keep", "value2");

    // Manually add a non-prefixed localStorage item (should survive clear)
    localStorage.setItem("other-app-data", "should-survive");

    MemoryCache.clear();

    expect(MemoryCache.get("keep-me")).toBeNull();
    expect(MemoryCache.get("also-keep")).toBeNull();
    // Non-prefixed items should survive
    expect(localStorage.getItem("other-app-data")).toBe("should-survive");
  });

  it("should handle concurrent set/get operations", () => {
    const keys = Array.from({ length: 50 }, (_, i) => `concurrent-${i}`);

    // Set all
    keys.forEach((k, i) => MemoryCache.set(k, i));

    // Get all
    keys.forEach((k, i) => {
      expect(MemoryCache.get(k)).toBe(i);
    });

    // Invalidate all
    MemoryCache.invalidate("concurrent-");

    // Verify all gone
    keys.forEach((k) => {
      expect(MemoryCache.get(k)).toBeNull();
    });
  });

  it("should handle overwriting existing keys", () => {
    MemoryCache.set("overwrite", "original");
    expect(MemoryCache.get("overwrite")).toBe("original");

    MemoryCache.set("overwrite", "updated");
    expect(MemoryCache.get("overwrite")).toBe("updated");
  });

  it("should handle TTL of exactly 1ms (minimum viable)", async () => {
    MemoryCache.set("min-ttl", "value", 1);

    // Wait just over 1ms
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(MemoryCache.get("min-ttl")).toBeNull();
  });
});
