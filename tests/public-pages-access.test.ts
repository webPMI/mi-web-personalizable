// ============================================
// tests/public-pages-access.test.ts — Pruebas de Visibilidad y Acceso Público de Páginas
// ============================================
// Verifica las reglas de acceso público a páginas personalizadas:
// 1. Las páginas publicadas (published: true) deben ser accesibles.
// 2. Las páginas borrador (published: false) deben bloquearse y mostrar 404.
// 3. Las páginas eliminadas se limpian de navLinks y devuelven 404.
// ============================================

import { describe, it, expect, beforeEach } from "vitest";

interface CustomPage {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  status: "published" | "draft";
  showInNav?: boolean;
}

/**
 * Emulación de la lógica de evaluación de acceso público ([...slug].astro)
 */
function evaluatePublicAccess(page: CustomPage | null): { canAccess: boolean; show404: boolean } {
  if (!page) {
    return { canAccess: false, show404: true };
  }

  // Si la página está explícitamente en borrador o no publicada
  if (page.published === false || page.status === "draft") {
    return { canAccess: false, show404: true };
  }

  return { canAccess: true, show404: false };
}

/**
 * Emulación del filtrado de enlaces de navegación (navLinks)
 */
function updateNavLinksForPage(
  currentNavLinks: Array<{ label: string; href: string }>,
  page: CustomPage,
  action: "save" | "delete"
): Array<{ label: string; href: string }> {
  const pageHref = `/${page.slug}`;
  let updated = [...currentNavLinks];

  if (action === "delete") {
    return updated.filter((link) => link.href !== pageHref);
  }

  const existingIndex = updated.findIndex((l) => l.href === pageHref);

  if (page.showInNav && page.published && page.status === "published") {
    if (existingIndex >= 0) {
      updated[existingIndex] = { label: page.title, href: pageHref };
    } else {
      updated.push({ label: page.title, href: pageHref });
    }
  } else if (existingIndex >= 0) {
    // Si ya no es visible o no debe mostrarse en nav, quitar del menú
    updated.splice(existingIndex, 1);
  }

  return updated;
}

describe("Public Pages Access & Visibility Rules", () => {
  const publishedPage: CustomPage = {
    id: "p1",
    slug: "acerca-de",
    title: "Acerca de Nosotros",
    published: true,
    status: "published",
    showInNav: true,
  };

  const draftPage: CustomPage = {
    id: "p2",
    slug: "borrador-secreto",
    title: "Proyecto Secreto",
    published: false,
    status: "draft",
    showInNav: false,
  };

  describe("Evaluación de Acceso Público", () => {
    it("debe permitir acceso a páginas publicadas", () => {
      const result = evaluatePublicAccess(publishedPage);
      expect(result.canAccess).toBe(true);
      expect(result.show404).toBe(false);
    });

    it("debe bloquear acceso (mostrar 404) a páginas en borrador", () => {
      const result = evaluatePublicAccess(draftPage);
      expect(result.canAccess).toBe(false);
      expect(result.show404).toBe(true);
    });

    it("debe bloquear acceso (mostrar 404) cuando la página no existe (null)", () => {
      const result = evaluatePublicAccess(null);
      expect(result.canAccess).toBe(false);
      expect(result.show404).toBe(true);
    });
  });

  describe("Sincronización con el Menú de Navegación (navLinks)", () => {
    const initialNav = [{ label: "Inicio", href: "/" }];

    it("debe añadir página al menú si está publicada y showInNav = true", () => {
      const updatedNav = updateNavLinksForPage(initialNav, publishedPage, "save");
      expect(updatedNav.length).toBe(2);
      expect(updatedNav[1]).toEqual({ label: "Acerca de Nosotros", href: "/acerca-de" });
    });

    it("NO debe añadir página al menú si es borrador (published = false)", () => {
      const updatedNav = updateNavLinksForPage(initialNav, draftPage, "save");
      expect(updatedNav.length).toBe(1);
      expect(updatedNav.some((l) => l.href === "/borrador-secreto")).toBe(false);
    });

    it("debe remover enlace del menú al eliminar la página", () => {
      const navWithPage = [...initialNav, { label: "Acerca de Nosotros", href: "/acerca-de" }];
      const updatedNav = updateNavLinksForPage(navWithPage, publishedPage, "delete");
      expect(updatedNav.length).toBe(1);
      expect(updatedNav.some((l) => l.href === "/acerca-de")).toBe(false);
    });

    it("debe remover enlace del menú si una página publicada cambia a borrador", () => {
      const navWithPage = [...initialNav, { label: "Proyecto Secreto", href: "/borrador-secreto" }];
      const updatedNav = updateNavLinksForPage(navWithPage, draftPage, "save");
      expect(updatedNav.length).toBe(1);
      expect(updatedNav.some((l) => l.href === "/borrador-secreto")).toBe(false);
    });
  });
});
