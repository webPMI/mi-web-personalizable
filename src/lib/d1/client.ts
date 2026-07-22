// ============================================
// d1/client.ts — Cliente D1 (Cloudflare)
// ============================================
// Proporciona una interfaz unificada para acceder a la base de datos D1.
// En desarrollo, usa un mock. En producción, usa el binding de Cloudflare.
// ============================================

export interface D1Result<T = any> {
  success: boolean;
  results?: T[];
  error?: string;
}

export interface D1PreparedStatement {
  bind(...args: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean }>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

// ============================================
// Mock para desarrollo local
// ============================================
class MockD1PreparedStatement implements D1PreparedStatement {
  private params: any[] = [];

  constructor(private sql: string) {}

  bind(...args: any[]): D1PreparedStatement {
    this.params = args;
    return this;
  }

  async first<T = any>(): Promise<T | null> {
    console.warn(`[D1 Mock] first() called: ${this.sql}`, this.params);
    return null;
  }

  async all<T = any>(): Promise<D1Result<T>> {
    console.warn(`[D1 Mock] all() called: ${this.sql}`, this.params);
    return { success: true, results: [] };
  }

  async run(): Promise<{ success: boolean }> {
    console.warn(`[D1 Mock] run() called: ${this.sql}`, this.params);
    return { success: true };
  }
}

class MockD1Database implements D1Database {
  prepare(sql: string): D1PreparedStatement {
    return new MockD1PreparedStatement(sql);
  }
}

// ============================================
// Factory
// ============================================

let d1Instance: D1Database | null = null;

/**
 * Obtiene la instancia del cliente D1.
 * En Cloudflare Pages, usa el binding de entorno.
 * En desarrollo local, usa un mock.
 */
export function getD1Client(): D1Database {
  if (d1Instance) return d1Instance;

  // Intentar obtener el binding de Cloudflare (disponible en runtime)
  // @ts-ignore - process.env puede no tener type definitions para CF bindings
  if (typeof process !== "undefined" && (process as any).env?.MI_WEB_DB) {
    // @ts-ignore
    d1Instance = (process as any).env.MI_WEB_DB as D1Database;
    return d1Instance!;
  }

  // Fallback a globalThis (para Cloudflare Workers)
  if (typeof (globalThis as any).MI_WEB_DB !== "undefined") {
    d1Instance = (globalThis as any).MI_WEB_DB as D1Database;
    return d1Instance!;
  }

  // Mock para desarrollo local
  console.warn("[D1] No se encontró binding D1. Usando mock en memoria.");
  d1Instance = new MockD1Database();
  return d1Instance;
}

/**
 * Resetea la instancia del cliente (útil para tests).
 */
export function resetD1Client(): void {
  d1Instance = null;
}
