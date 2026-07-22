import { vi } from "vitest";

// Mock env variables for Firebase if missing during tests
// import.meta.env may not be available in all test environments
try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
        if (!import.meta.env.PUBLIC_FIREBASE_API_KEY) {
            (import.meta.env as any).PUBLIC_FIREBASE_API_KEY = "AIzaSyCrnKnOusmmrlLJ3VSX-Lriz7qduM7JZZE";
            (import.meta.env as any).PUBLIC_FIREBASE_AUTH_DOMAIN = "miwebpersonalizada.firebaseapp.com";
            (import.meta.env as any).PUBLIC_FIREBASE_PROJECT_ID = "miwebpersonalizada";
            (import.meta.env as any).PUBLIC_FIREBASE_STORAGE_BUCKET = "miwebpersonalizada.firebasestorage.app";
            (import.meta.env as any).PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "612426872270";
            (import.meta.env as any).PUBLIC_FIREBASE_APP_ID = "1:612426872270:web:b80e9a3dec9880d6a5279f";
        }
    }
} catch {
    // import.meta.env not available, skip env mocking
}

// In Node 22+, native localStorage getter returns undefined without --localstorage-file.
// We override globalThis.localStorage and window.localStorage with a robust in-memory Storage mock.
class MockStorage implements Storage {
    private store = new Map<string, string>();

    get length(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }

    getItem(key: string): string | null {
        return this.store.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.store.delete(key);
    }

    setItem(key: string, value: string): void {
        this.store.set(key, String(value));
    }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

Object.defineProperty(globalThis, "localStorage", {
    get() {
        return mockLocalStorage;
    },
    configurable: true,
});

Object.defineProperty(globalThis, "sessionStorage", {
    get() {
        return mockSessionStorage;
    },
    configurable: true,
});

if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
        get() {
            return mockLocalStorage;
        },
        configurable: true,
    });

    Object.defineProperty(window, "sessionStorage", {
        get() {
            return mockSessionStorage;
        },
        configurable: true,
    });
}
