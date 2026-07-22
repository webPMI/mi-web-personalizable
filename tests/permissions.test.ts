import { describe, it, expect } from "vitest";
import {
  getUserRole,
  canCreatePage,
  canEditPage,
  canPublishPage,
  canDeletePage,
} from "../src/lib/permissions";

describe("RBAC Permissions Module (permissions.ts)", () => {
  const siteOwnerId = "owner-uid-123";
  const siteRoles: Record<string, string> = {
    "editor-uid-456": "editor",
    "viewer-uid-789": "viewer",
    "admin-uid-aaa": "admin",
  };

  // ============================================
  // getUserRole — Resolución de roles
  // ============================================
  describe("getUserRole()", () => {
    it("should assign 'admin' role to site owner", () => {
      expect(getUserRole({ userId: siteOwnerId, siteOwnerId, siteRoles })).toBe("admin");
    });

    it("should assign 'admin' role to user with 'admin' in roles map", () => {
      expect(getUserRole({ userId: "admin-uid-aaa", siteOwnerId, siteRoles })).toBe("admin");
    });

    it("should assign 'editor' role to assigned editor user", () => {
      expect(getUserRole({ userId: "editor-uid-456", siteOwnerId, siteRoles })).toBe("editor");
    });

    it("should assign 'viewer' role to assigned viewer user", () => {
      expect(getUserRole({ userId: "viewer-uid-789", siteOwnerId, siteRoles })).toBe("viewer");
    });

    it("should return null for unauthenticated (null/undefined userId)", () => {
      expect(getUserRole({ userId: null, siteOwnerId, siteRoles })).toBeNull();
      expect(getUserRole({ userId: undefined, siteOwnerId, siteRoles })).toBeNull();
    });

    it("should return null for user not in roles and not owner", () => {
      expect(getUserRole({ userId: "stranger-uid-999", siteOwnerId, siteRoles })).toBeNull();
    });

    it("should return null when siteRoles is undefined", () => {
      expect(getUserRole({ userId: "editor-uid-456", siteOwnerId, siteRoles: undefined })).toBeNull();
    });

    it("should return null when siteRoles has invalid role string", () => {
      const badRoles = { "user-x": "superuser" }; // Not a valid UserRole
      expect(getUserRole({ userId: "user-x", siteOwnerId, siteRoles: badRoles })).toBeNull();
    });

    it("should prioritize ownerId over roles map", () => {
      // Owner is in roles as 'editor', but ownerId check should return 'admin'
      const rolesWithOwnerAsEditor = { [siteOwnerId]: "editor" };
      expect(getUserRole({ userId: siteOwnerId, siteOwnerId, siteRoles: rolesWithOwnerAsEditor })).toBe("admin");
    });

    it("should handle empty string userId", () => {
      expect(getUserRole({ userId: "", siteOwnerId, siteRoles })).toBeNull();
    });
  });

  // ============================================
  // Matriz de permisos por acción
  // ============================================
  describe("Permission actions matrix", () => {
    const adminCtx = { userId: siteOwnerId, siteOwnerId, siteRoles };
    const roleAdminCtx = { userId: "admin-uid-aaa", siteOwnerId, siteRoles };
    const editorCtx = { userId: "editor-uid-456", siteOwnerId, siteRoles };
    const viewerCtx = { userId: "viewer-uid-789", siteOwnerId, siteRoles };
    const strangerCtx = { userId: "stranger-uid-999", siteOwnerId, siteRoles };
    const nullCtx = { userId: null, siteOwnerId, siteRoles };

    it("canCreatePage: allowed for admin and editor, denied for viewer/stranger/null", () => {
      expect(canCreatePage(adminCtx)).toBe(true);
      expect(canCreatePage(roleAdminCtx)).toBe(true);
      expect(canCreatePage(editorCtx)).toBe(true);
      expect(canCreatePage(viewerCtx)).toBe(false);
      expect(canCreatePage(strangerCtx)).toBe(false);
      expect(canCreatePage(nullCtx)).toBe(false);
    });

    it("canEditPage: allowed for admin and editor, denied for viewer/stranger/null", () => {
      expect(canEditPage(adminCtx)).toBe(true);
      expect(canEditPage(roleAdminCtx)).toBe(true);
      expect(canEditPage(editorCtx)).toBe(true);
      expect(canEditPage(viewerCtx)).toBe(false);
      expect(canEditPage(strangerCtx)).toBe(false);
      expect(canEditPage(nullCtx)).toBe(false);
    });

    it("canPublishPage: allowed for admin and editor, denied for viewer/stranger/null", () => {
      expect(canPublishPage(adminCtx)).toBe(true);
      expect(canPublishPage(roleAdminCtx)).toBe(true);
      expect(canPublishPage(editorCtx)).toBe(true);
      expect(canPublishPage(viewerCtx)).toBe(false);
      expect(canPublishPage(strangerCtx)).toBe(false);
      expect(canPublishPage(nullCtx)).toBe(false);
    });

    it("canDeletePage: exclusively admin (owner or role admin), denied for everyone else", () => {
      expect(canDeletePage(adminCtx)).toBe(true);
      expect(canDeletePage(roleAdminCtx)).toBe(true);
      expect(canDeletePage(editorCtx)).toBe(false);
      expect(canDeletePage(viewerCtx)).toBe(false);
      expect(canDeletePage(strangerCtx)).toBe(false);
      expect(canDeletePage(nullCtx)).toBe(false);
    });
  });

  // ============================================
  // Edge cases de contextos vacíos
  // ============================================
  describe("Edge cases with empty/missing context", () => {
    it("should handle completely empty context", () => {
      expect(getUserRole({})).toBeNull();
      expect(canCreatePage({})).toBe(false);
      expect(canDeletePage({})).toBe(false);
    });

    it("should handle context with only userId (no site info)", () => {
      expect(getUserRole({ userId: "some-uid" })).toBeNull();
      expect(canEditPage({ userId: "some-uid" })).toBe(false);
    });

    it("should handle empty roles object", () => {
      expect(getUserRole({ userId: "some-uid", siteOwnerId: "other", siteRoles: {} })).toBeNull();
    });
  });
});

