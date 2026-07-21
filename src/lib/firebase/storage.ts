// ============================================================
// Helpers para Firebase Storage
// ============================================================

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  uploadBytesResumable,
  type UploadTask,
} from "firebase/storage";
import { storage } from "../firebase";
import type { UploadResult } from "../../types/firebase";

// --- Subir archivo ---
export async function uploadFile(
  path: string,
  file: File | Blob | Uint8Array
): Promise<{ success: true; data: UploadResult } | { success: false; error: string }> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      data: {
        url,
        path: snapshot.ref.fullPath,
        name: snapshot.ref.name,
        size: snapshot.metadata.size,
        type: snapshot.metadata.contentType || "unknown",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al subir el archivo." };
  }
}

// --- Subir archivo con progreso (para UI) ---
export function uploadFileWithProgress(
  path: string,
  file: File
): {
  task: UploadTask;
  promise: Promise<UploadResult>;
} {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  const promise = new Promise<UploadResult>((resolve, reject) => {
    task.on(
      "state_changed",
      null,
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          url,
          path: task.snapshot.ref.fullPath,
          name: task.snapshot.ref.name,
          size: task.snapshot.metadata.size,
          type: task.snapshot.metadata.contentType || "unknown",
        });
      }
    );
  });

  return { task, promise };
}

// --- Eliminar archivo ---
export async function deleteFile(
  path: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el archivo." };
  }
}

// --- Listar archivos en una ruta ---
export async function listFiles(path: string) {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);

  const items = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        url,
      };
    })
  );

  return {
    files: items,
    prefixes: result.prefixes.map((prefix) => prefix.fullPath),
  };
}

// --- Obtener URL de descarga ---
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}
