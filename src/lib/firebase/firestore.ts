// ============================================================
// Helpers CRUD para Firestore
// ============================================================

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "../firebase";
import type { FirestoreResponse } from "../../types/firebase";

// --- Crear documento con ID autogenerado ---
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<FirestoreResponse<{ id: string }>> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error as FirestoreError) };
  }
}

// --- Crear documento con ID personalizado (ej: dominio como ID) ---
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<FirestoreResponse<{ id: string }>> {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, data: { id: docId } };
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error as FirestoreError) };
  }
}

// --- Obtener documento por ID ---
export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<FirestoreResponse<T & { id: string }>> {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (!docSnap.exists()) {
      return { success: false, error: "Documento no encontrado." };
    }
    return {
      success: true,
      data: { id: docSnap.id, ...docSnap.data() } as T & { id: string },
    };
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error as FirestoreError) };
  }
}

// --- Actualizar documento ---
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<FirestoreResponse<void>> {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error as FirestoreError) };
  }
}

// --- Eliminar documento ---
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<FirestoreResponse<void>> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error as FirestoreError) };
  }
}

// --- Listar documentos con filtros ---
export async function listDocuments<T>(
  collectionName: string,
  options?: {
    field?: string;
    operator?: "==" | "!=" | ">" | ">=" | "<" | "<=" | "array-contains" | "in";
    value?: any;
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    limitCount?: number;
  }
): Promise<FirestoreResponse<(T & { id: string })[]>> {
  try {
    const constraints: QueryConstraint[] = [];

    if (options?.field && options?.operator && options?.value !== undefined) {
      constraints.push(where(options.field, options.operator, options.value));
    }

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || "asc"));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q =
      constraints.length > 0
        ? query(collection(db, collectionName), ...constraints)
        : collection(db, collectionName);

    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[];

    return { success: true, data: documents };
  } catch (error) {
    return { success: false, error: getFirestoreErrorMessage(error as FirestoreError) };
  }
}

// --- Mapeo de errores de Firestore ---
function getFirestoreErrorMessage(error: FirestoreError): string {
  const errorMap: Record<string, string> = {
    "permission-denied": "No tienes permisos para realizar esta operación.",
    "not-found": "El documento solicitado no existe.",
    "already-exists": "El documento ya existe.",
    "invalid-argument": "Los datos proporcionados no son válidos.",
    "unavailable": "El servicio no está disponible. Intenta de nuevo.",
    "deadline-exceeded": "La operación tardó demasiado. Intenta de nuevo.",
  };
  return errorMap[error.code] || `Error de Firestore: ${error.message}`;
}
