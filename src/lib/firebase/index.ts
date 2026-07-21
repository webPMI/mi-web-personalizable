// ============================================================
// Barrel export - Firebase
// ============================================================

// Cliente Firebase (cliente)
export { db, auth, storage } from "../firebase";

// ──────────────────────────────────────────────
// Admin SDK (servidor) - Deshabilitado por ahora
// Si en el futuro activas SSR, descomenta:
// export { adminAuth, adminDb, adminStorage } from "./admin";
// Y añade FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL
// y FIREBASE_PRIVATE_KEY en tu .env
// ──────────────────────────────────────────────

// Auth helpers
export {
  registerUser,
  loginUser,
  logoutUser,
  onAuthChange,
  resetPassword,
  getIdToken,
} from "./auth";

// Firestore helpers
export {
  createDocument,
  setDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
} from "./firestore";

// Storage helpers
export {
  uploadFile,
  uploadFileWithProgress,
  deleteFile,
  listFiles,
  getFileUrl,
} from "./storage";
