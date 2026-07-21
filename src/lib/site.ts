// ============================================
// site - Datos del sitio público
// ============================================
//
// Funciones para obtener y gestionar los datos
// de un sitio desde Firestore.
//
// Uso:
//   import { getSiteData } from "../../lib/site";
//   const site = await getSiteData("midominio.com");
// ============================================

import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "./firebase";

export interface SiteData {
    id: string;
    domain: string;
    siteName: string;
    siteDescription: string;
    ownerId?: string;
    locale?: string;
    status: "pending" | "active";
    registeredAt?: string;

    // --- Navbar ---
    navLinks?: Array<{ label: string; href: string }>;

    // --- Hero ---
    heroTitle?: string;
    heroSubtitle?: string;
    heroImage?: string;
    heroCtaText?: string;
    heroCtaLink?: string;

    // --- Redes sociales ---
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
        instagram?: string;
    };

    // --- Secciones personalizadas ---
    sections?: Array<{
        id: string;
        type: "text" | "image-text" | "gallery" | "cards";
        title: string;
        content: string;
        image?: string;
        order: number;
    }>;

    // --- Tema ---
    theme?: {
        primaryColor?: string;
        fontFamily?: string;
        layout?: "centered" | "full-width";
    };

    // --- SEO ---
    seo?: {
        defaultTitle?: string;
        defaultDescription?: string;
        defaultImage?: string;
    };
}

/**
 * Obtiene los datos completos de un sitio por su dominio.
 * Usa getDoc directo porque el dominio es el ID del documento.
 * Esto es más rápido y no requiere índices compuestos.
 *
 * @param domain - El dominio a buscar (ej: "midominio.com")
 * @returns SiteData si existe, o null si no está registrado
 */
export async function getSiteData(domain: string): Promise<SiteData | null> {
    try {
        const docRef = doc(db, "sites", domain);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();

        return {
            id: docSnap.id,
            domain: data.domain || domain,
            siteName: data.siteName || "",
            siteDescription: data.siteDescription || "",
            ownerId: data.ownerId,
            locale: data.locale,
            status: data.status || "pending",
            registeredAt: data.registeredAt,
            navLinks: data.navLinks,
            heroTitle: data.heroTitle,
            heroSubtitle: data.heroSubtitle,
            heroImage: data.heroImage,
            heroCtaText: data.heroCtaText,
            heroCtaLink: data.heroCtaLink,
            socialLinks: data.socialLinks,
            sections: data.sections,
            theme: data.theme,
            seo: data.seo,
        } as SiteData;
    } catch (error) {
        console.error("Error getting site data:", error);
        return null;
    }
}

/**
 * Busca un sitio por el ownerId (UID del usuario).
 * Útil cuando no se conoce el dominio (ej: en localhost después del registro).
 *
 * @param ownerId - El UID del usuario propietario
 * @returns SiteData si existe, o null si no tiene sitio
 */
export async function getSiteByOwnerId(ownerId: string): Promise<SiteData | null> {
    try {
        const q = query(
            collection(db, "sites"),
            where("ownerId", "==", ownerId),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        return {
            id: doc.id,
            domain: data.domain || doc.id,
            siteName: data.siteName || "",
            siteDescription: data.siteDescription || "",
            ownerId: data.ownerId,
            locale: data.locale,
            status: data.status || "pending",
            registeredAt: data.registeredAt,
            navLinks: data.navLinks,
            heroTitle: data.heroTitle,
            heroSubtitle: data.heroSubtitle,
            heroImage: data.heroImage,
            heroCtaText: data.heroCtaText,
            heroCtaLink: data.heroCtaLink,
            socialLinks: data.socialLinks,
            sections: data.sections,
            theme: data.theme,
            seo: data.seo,
        } as SiteData;
    } catch (error) {
        console.error("Error getting site by ownerId:", error);
        return null;
    }
}
