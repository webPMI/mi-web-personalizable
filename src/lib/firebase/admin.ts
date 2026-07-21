// ============================================================
// Firebase Admin SDK - Operaciones del lado servidor (SSR)
// ============================================================
// Uso: import { adminAuth, adminDb, adminStorage } from "./admin";
// Solo funciona en entornos de servidor (Astro SSR)
//
// Las credenciales se obtienen de las variables de entorno:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY
// ============================================================

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const projectId = import.meta.env.FIREBASE_PROJECT_ID;
  const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltan variables de entorno para Firebase Admin SDK.\n" +
      "Asegúrate de tener definidas:\n" +
      "  FIREBASE_PROJECT_ID\n" +
      "  FIREBASE_CLIENT_EMAIL\n" +
      "  FIREBASE_PRIVATE_KEY"
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Reemplazar \\n por saltos de línea reales
      // (por si la variable viene con \n escapados desde .env)
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp).bucket();

export default adminApp;
