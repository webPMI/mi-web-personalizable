import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface Site {
  id: string;
  domain: string;
  registeredAt: Date;
  status: "pending" | "active";
  ownerId?: string;
  ownerUsername?: string;
  roles?: Record<string, string>;
}

/**
 * Comprueba si un dominio está registrado en Firestore.
 * Ahora usa getDoc directo porque el dominio es el ID del documento.
 * @param domain - El dominio a buscar (ej: "midominio.com")
 * @returns El sitio si existe, o null si no está registrado
 */
export async function checkDomain(domain: string): Promise<Site | null> {
  try {
    const docRef = doc(db, "sites", domain);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Site;
  } catch (error) {
    console.error("Error checking domain:", error);
    return null;
  }
}

/**
 * Obtiene el dominio actual desde window.location
 */
export function getCurrentDomain(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname;
}

/**
 * Obtiene el dominio efectivo, considerando:
 * 1. Dominio registrado recién creado (sessionStorage "registered-domain")
 * 2. Dominio simulado desde DevTools (sessionStorage "devtools-domain")
 * 3. Dominio real desde window.location
 * 4. Fallback a "localhost"
 *
 * Esta es la función centralizada que deben usar todos los componentes.
 */
export function getEffectiveDomain(): string {
  // 1. Prioridad máxima: dominio registrado en el onboarding (recién creado)
  const registeredDomain = getRegisteredDomain();
  if (registeredDomain) return registeredDomain;

  // 2. Prioridad: dominio simulado desde DevTools
  const devDomain = getDevToolsDomain();
  if (devDomain) return devDomain;

  // 3. Dominio real desde window.location
  const realDomain = getCurrentDomain();

  // 4. Si está vacío, retornar "localhost"
  if (!realDomain || realDomain === "") return "localhost";

  return realDomain;
}

/**
 * Obtiene el dominio registrado durante el onboarding (sessionStorage)
 * Se limpia automáticamente después de leerlo (one-time use)
 */
export function getRegisteredDomain(): string | null {
  try {
    const domain = sessionStorage.getItem("registered-domain");
    if (domain) {
      // Limpiar para que solo funcione una vez (evitar bucles)
      sessionStorage.removeItem("registered-domain");
      return domain;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtiene el dominio simulado desde DevTools (sessionStorage)
 */
export function getDevToolsDomain(): string | null {
  try {
    return sessionStorage.getItem("devtools-domain");
  } catch {
    return null;
  }
}

/**
 * Limpia el dominio simulado de DevTools
 */
export function clearDevToolsDomain(): void {
  try {
    sessionStorage.removeItem("devtools-domain");
  } catch {
    // sessionStorage no disponible
  }
}
