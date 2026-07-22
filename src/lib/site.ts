// ============================================
// site - Datos del sitio público y subcolecciones
// ============================================

import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "./firebase";
import { normalizeDomain } from "./domain-check";
import { MemoryCache } from "./cache";
import { getDocument, setDocument } from "./firebase/firestore";
import type { SiteThemeConfig } from "./theme";

export type BlockType =
  | "heading"
  | "paragraph"
  | "hero"
  | "image"
  | "gallery"
  | "cards"
  | "cta"
  | "columns"
  | "html"
  | "spacer";

export interface BlockStyle {
  textColor?: string;
  backgroundColor?: string;
  paddingY?: number;
  paddingX?: number;
  marginTop?: number;
  marginBottom?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  fullWidth?: boolean;
  borderRadius?: number;
  customClass?: string;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  style?: BlockStyle;
}

export interface PageSEO {
  metaTitle?: string;
  metaDescription?: string;
  focusKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  showInNav: boolean;
  status?: "published" | "draft" | "scheduled" | "private";
  excerpt?: string;
  featuredImage?: string;
  order?: number;
  blocks?: PageBlock[];
  seo?: PageSEO;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteData {
  id: string;
  domain: string;
  siteName: string;
  siteDescription?: string;
  ownerId?: string;
  locale?: string;
  status?: "pending" | "approved" | "rejected" | "active";
  registeredAt?: string;

  // Configuración visual y navegación
  navLinks?: Array<{ label: string; href: string }>;
  pages?: CustomPage[];

  // Hero Section
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroCtaText?: string;
  heroCtaLink?: string;

  // Redes Sociales
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
  };

  // Secciones Dinámicas
  sections?: Array<{
    id: string;
    type: "features" | "about" | "contact" | "gallery" | "custom" | "text" | "image-text" | "cards";
    title?: string;
    content?: string;
    image?: string;
    enabled: boolean;
    order: number;
  }>;

  // Configuración del Tema
  theme?: SiteThemeConfig;

  // Roles de usuario
  roles?: Record<string, string>;

  // SEO Global
  seo?: {
    defaultTitle?: string;
    defaultDescription?: string;
    defaultImage?: string;
  };
}

/**
 * Obtiene los datos completos de un sitio por su dominio.
 * Consulta primero la caché SWR antes de realizar la llamada a Firestore.
 */
export async function getSiteData(domain: string): Promise<SiteData | null> {
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) return null;

    const cacheKey = `site:${cleanDomain}`;
    const cached = MemoryCache.get<SiteData>(cacheKey);
    if (cached) return cached;

    const docRef = doc(db, "sites", cleanDomain);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    const siteData: SiteData = {
      id: docSnap.id,
      domain: data.domain || domain,
      siteName: data.siteName || "",
      siteDescription: data.siteDescription || "",
      ownerId: data.ownerId,
      locale: data.locale,
      status: data.status || "pending",
      registeredAt: data.registeredAt,
      navLinks: data.navLinks,
      pages: data.pages || [],
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      heroImage: data.heroImage,
      heroCtaText: data.heroCtaText,
      heroCtaLink: data.heroCtaLink,
      socialLinks: data.socialLinks,
      sections: data.sections,
      theme: data.theme,
      seo: data.seo,
    };

    MemoryCache.set(cacheKey, siteData);
    return siteData;
  } catch (error) {
    console.error("Error getting site data:", error);
    return null;
  }
}

/**
 * Busca un sitio por el ownerId (UID del usuario).
 */
export async function getSiteByOwnerId(ownerId: string): Promise<SiteData | null> {
  try {
    const q = query(collection(db, "sites"), where("ownerId", "==", ownerId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();

    return {
      id: docSnap.id,
      domain: data.domain || docSnap.id,
      siteName: data.siteName || "",
      siteDescription: data.siteDescription || "",
      ownerId: data.ownerId,
      locale: data.locale,
      status: data.status || "pending",
      registeredAt: data.registeredAt,
      navLinks: data.navLinks,
      pages: data.pages || [],
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      heroImage: data.heroImage,
      heroCtaText: data.heroCtaText,
      heroCtaLink: data.heroCtaLink,
      socialLinks: data.socialLinks,
      sections: data.sections,
      theme: data.theme,
      seo: data.seo,
    };
  } catch (error) {
    console.error("Error getting site by owner ID:", error);
    return null;
  }
}

// ============================================
// Funciones para la Subcolección de Páginas (sites/{domain}/pages)
// ============================================

/**
 * Obtiene una página específica por su slug desde la subcolección sites/{domain}/pages.
 */
export async function getPageBySlug(domain: string, slug: string): Promise<CustomPage | null> {
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain || !slug) return null;

    const cleanSlug = slug.toLowerCase().trim();
    const cacheKey = `page:${cleanDomain}:${cleanSlug}`;
    const cached = MemoryCache.get<CustomPage>(cacheKey);
    if (cached) return cached;

    // 1. Buscar en la subcolección sites/{domain}/pages
    const pagesRef = collection(db, "sites", cleanDomain, "pages");
    const q = query(pagesRef, where("slug", "==", cleanSlug), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const pageDoc = snapshot.docs[0];
      const pageData = { id: pageDoc.id, ...pageDoc.data() } as CustomPage;
      MemoryCache.set(cacheKey, pageData);
      return pageData;
    }

    // 2. Fallback a array legacy pages en el documento del sitio
    const site = await getSiteData(cleanDomain);
    if (site && site.pages) {
      const legacyPage = site.pages.find((p) => p.slug.toLowerCase() === cleanSlug);
      if (legacyPage) {
        MemoryCache.set(cacheKey, legacyPage);
        return legacyPage;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting page by slug:", error);
    return null;
  }
}

export interface ListPagesOptions {
  limitCount?: number;
}

/**
 * Obtiene las páginas de la subcolección sites/{domain}/pages (con soporte para paginación y caché SWR).
 */
export async function listSitePages(domain: string, options?: ListPagesOptions): Promise<CustomPage[]> {
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) return [];

    const limitVal = options?.limitCount || 0;
    const cacheKey = `pages-list:${cleanDomain}:${limitVal}`;
    const cached = MemoryCache.get<CustomPage[]>(cacheKey);
    if (cached) return cached;

    const pagesMap = new Map<string, CustomPage>();

    // 1. Obtener páginas legacy del documento principal
    const site = await getSiteData(cleanDomain);
    if (site && site.pages) {
      site.pages.forEach((p) => pagesMap.set(p.id, p));
    }

    // 2. Obtener páginas de la subcolección
    const pagesRef = collection(db, "sites", cleanDomain, "pages");
    const q = limitVal > 0 ? query(pagesRef, limit(limitVal)) : query(pagesRef);
    const snapshot = await getDocs(q);

    snapshot.docs.forEach((docSnap) => {
      const pageData = { id: docSnap.id, ...docSnap.data() } as CustomPage;
      pagesMap.set(pageData.id, pageData);
    });

    const result = Array.from(pagesMap.values());
    MemoryCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error listing site pages:", error);
    return [];
  }
}

/**
 * Guarda o actualiza una página en la subcolección e invalida la caché del sitio.
 */
export async function savePageSubcollection(
  domain: string,
  page: CustomPage
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain || !page.id) return { success: false, error: "Dominio o ID de página no válido." };

    const { doc, setDoc, getDoc } = await import("firebase/firestore");
    const { getCurrentUser } = await import("./firebase/auth");
    const currentUser = getCurrentUser();

    // Auto-asegurar existencia de la raíz del sitio con permisos para el usuario actual si no estuviera configurado
    if (currentUser) {
      try {
        const siteDocRef = doc(db, "sites", cleanDomain);
        const siteDocSnap = await getDoc(siteDocRef);

        if (!siteDocSnap.exists()) {
          await setDoc(siteDocRef, {
            domain: cleanDomain,
            siteName: "Mi Sitio Web",
            ownerId: currentUser.uid,
            status: "active",
            roles: {
              [currentUser.uid]: "admin",
            },
            registeredAt: new Date().toISOString(),
          }, { merge: true });
        } else {
          const siteData = siteDocSnap.data();
          if (!siteData.ownerId) {
            await setDoc(siteDocRef, {
              ownerId: currentUser.uid,
              roles: {
                ...(siteData.roles || {}),
                [currentUser.uid]: "admin",
              },
            }, { merge: true });
          }
        }
      } catch {
        // Ignorar si el usuario ya tiene permisos directos
      }
    }

    const pageRef = doc(db, "sites", cleanDomain, "pages", page.id);

    await setDoc(
      pageRef,
      {
        ...page,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Invalidar caché del dominio
    MemoryCache.invalidate(`site:${cleanDomain}`);
    MemoryCache.invalidate(`page:${cleanDomain}`);
    MemoryCache.invalidate(`pages-list:${cleanDomain}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error saving page subcollection:", error);
    return { success: false, error: error?.message || "Error al guardar página en subcolección." };
  }
}

/**
 * Elimina una página de la subcolección e invalida la caché del sitio.
 */
export async function deletePageSubcollection(
  domain: string,
  pageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain || !pageId) return { success: false, error: "Dominio o ID de página no válido." };

    const { doc, deleteDoc } = await import("firebase/firestore");
    const pageRef = doc(db, "sites", cleanDomain, "pages", pageId);
    await deleteDoc(pageRef);

    // Invalidar caché del dominio
    MemoryCache.invalidate(`site:${cleanDomain}`);
    MemoryCache.invalidate(`page:${cleanDomain}`);
    MemoryCache.invalidate(`pages-list:${cleanDomain}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting page subcollection:", error);
    return { success: false, error: error?.message || "Error al eliminar página de subcolección." };
  }
}

// ============================================
// Funciones compartidas de verificación y creación de sitios
// ============================================

/**
 * Verifica si un usuario tiene acceso a un sitio.
 * Busca en este orden:
 *   1. Por ownerId en el documento del sitio (dominio actual)
 *   2. Por membresía en sites/{domain}/members/{uid}
 *   3. Por ownerId global (cualquier sitio donde sea owner)
 *
 * @param uid - UID del usuario
 * @param domain - Dominio del sitio a verificar
 * @returns El dominio del sitio si el usuario tiene acceso, o null
 */
export async function checkUserSite(uid: string, domain: string): Promise<string | null> {
  // 1. Intentar por dominio actual (ownerId o roles legacy)
  try {
    const result = await getDocument("sites", domain);
    if (result.success && result.data) {
      const site = result.data as any;
      if (site.ownerId === uid || (site.roles && site.roles[uid])) {
        return domain;
      }
    }
  } catch (err) {
    console.error(`[checkUserSite] Error en getDocument("sites", "${domain}"):`, err);
  }

  // 2. Buscar en la subcolección members/{uid} del dominio actual
  try {
    const memberResult = await getDocument(`sites/${domain}/members`, uid);
    if (memberResult.success && memberResult.data) {
      const member = memberResult.data as any;
      // Miembros inactivos no tienen acceso al admin
      if (member.isActive !== false) {
        return domain;
      }
    }
  } catch (err) {
    console.error(`[checkUserSite] Error en members/${uid}:`, err);
  }

  // 3. Buscar por ownerId global (cualquier sitio donde sea owner)
  try {
    const site = await getSiteByOwnerId(uid);
    if (site) {
      return site.domain;
    }
  } catch (err) {
    console.error(`[checkUserSite] Error en getSiteByOwnerId:`, err);
  }

  return null;
}

/**
 * Crea un sitio nuevo en Firestore con el usuario como admin.
 * También crea el documento del owner en la subcolección members/{uid}.
 *
 * @param domain - Dominio del sitio
 * @param data - Datos del sitio (ownerId, siteName, etc.)
 * @returns true si se creó correctamente, false si falló
 */
export async function createSite(
  domain: string,
  data: {
    ownerId: string;
    siteName?: string;
    siteDescription?: string;
    ownerUsername?: string;
    locale?: string;
    status?: string;
  }
): Promise<boolean> {
  try {
    // 1. Crear el documento del sitio
    const result = await setDocument("sites", domain, {
      domain,
      siteName: data.siteName || "Mi Sitio",
      siteDescription: data.siteDescription || "",
      ownerId: data.ownerId,
      ownerUsername: data.ownerUsername || "",
      status: data.status || "active",
      locale: data.locale || "es",
      registeredAt: new Date().toISOString(),
      roles: {
        [data.ownerId]: "admin",
      },
    });

    if (!result.success) return false;

    // 2. Crear el documento del owner en members/{uid}
    const { Timestamp } = await import("firebase/firestore");
    const memberResult = await setDocument(`sites/${domain}/members`, data.ownerId, {
      uid: data.ownerId,
      email: "", // se actualizará cuando el usuario acceda al perfil
      displayName: data.ownerUsername || data.siteName || "Propietario",
      photoURL: "",
      role: "admin",
      invitedBy: data.ownerId,
      invitedAt: Timestamp.now(),
      isActive: true,
    });

    if (!memberResult.success) {
      console.warn(`[createSite] Sitio creado pero falló al crear member doc para ${data.ownerId}`);
    }

    return true;
  } catch (err) {
    console.error("[createSite] Error al crear sitio:", err);
    return false;
  }
}
