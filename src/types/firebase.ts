// ============================================================
// Tipos para las colecciones de Firestore
// ============================================================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role: "user" | "admin" | "editor";
}

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  authorId: string;
  authorName: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFile {
  id?: string;
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

/**
 * @deprecated Usa `SiteData` de `src/lib/site.ts` en su lugar.
 * SiteSettings se mantiene por compatibilidad con código legacy.
 * Los campos socialLinks y seo ahora están directamente en SiteData.
 */
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultImage?: string;
  };
  updatedAt: Date;
}

// ============================================================
// Tipos para respuestas y errores
// ============================================================

export type FirestoreResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type AuthResponse =
  | { success: true; user: import("firebase/auth").User }
  | { success: false; error: string };

// ============================================================
// Tipos para Storage
// ============================================================

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}
