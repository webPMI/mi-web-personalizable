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
 * Normaliza un dominio quitando espacios en blanco, protocol esquemas (http/https)
 * y convirtiendo el string a minúsculas.
 *
 * @param domain - El dominio a normalizar (ej: "  https://MiDominio.Com/ " -> "midominio.com")
 */
export function normalizeDomain(domain: string): string {
  if (!domain) return "";
  let clean = domain.trim().toLowerCase();
  clean = clean.replace(/^(https?:\/\/)/, "");
  clean = clean.replace(/\/.*$/, "");
  return clean;
}

/**
 * Comprueba si un dominio está registrado en Firestore.
 * Usa getDoc directo normalizando el dominio recibido.
 * @param domain - El dominio a buscar (ej: "midominio.com")
 * @returns El sitio si existe, o null si no está registrado
 */
export async function checkDomain(domain: string): Promise<Site | null> {
  try {
    const cleanDomain = normalizeDomain(domain);
    if (!cleanDomain) return null;

    const docRef = doc(db, "sites", cleanDomain);
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
  return normalizeDomain(window.location.hostname);
}

/**
 * Obtiene el dominio efectivo, considerando:
 * 1. Dominio registrado recién creado (sessionStorage "registered-domain")
 * 2. Dominio simulado desde DevTools (sessionStorage "devtools-domain")
 * 3. Dominio real desde window.location
 * 4. Fallback a "localhost.com"
 *
 * Esta es la función centralizada que deben usar todos los componentes.
 */
export function getEffectiveDomain(): string {
  // 1. Prioridad máxima: dominio registrado en el onboarding (recién creado)
  const registeredDomain = getRegisteredDomain();
  if (registeredDomain) return normalizeDomain(registeredDomain);

  // 2. Prioridad: dominio simulado desde DevTools
  const devDomain = getDevToolsDomain();
  if (devDomain) return normalizeDomain(devDomain);

  // 3. Dominio real desde window.location
  const realDomain = getCurrentDomain();

  // 4. Si está vacío, retornar "localhost.com"
  if (!realDomain || realDomain === "") return "localhost.com";

  return normalizeDomain(realDomain);
}

/**
 * Obtiene el dominio registrado durante el onboarding (sessionStorage)
 * Por defecto se limpia automáticamente después de leerlo (one-time use).
 *
 * @param clearOnRead - Si es true, borra la clave tras la lectura (por defecto true).
 */
export function getRegisteredDomain(clearOnRead = true): string | null {
  try {
    const domain = sessionStorage.getItem("registered-domain");
    if (domain) {
      if (clearOnRead) {
        sessionStorage.removeItem("registered-domain");
      }
      return normalizeDomain(domain);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Limpia el dominio registrado de sessionStorage explícitamente
 */
export function clearRegisteredDomain(): void {
  try {
    sessionStorage.removeItem("registered-domain");
  } catch {
    // sessionStorage no disponible
  }
}

/**
 * Obtiene el dominio simulado desde DevTools (sessionStorage)
 */
export function getDevToolsDomain(): string | null {
  try {
    const devDomain = sessionStorage.getItem("devtools-domain");
    return devDomain ? normalizeDomain(devDomain) : null;
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
