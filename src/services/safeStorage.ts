// SafeStorage utility to avoid SSR localStorage reference errors
// Provides in-memory fallback when window/localStorage not available (SSR/build)
// Simple namespaced API: safeStorage.get(key), set(key, value), remove(key)

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements StorageLike {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
}

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const backend: StorageLike = isBrowser() ? window.localStorage : new MemoryStorage();

export const safeStorage = {
  get(key: string) {
    try { return backend.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { backend.setItem(key, value); } catch {/* ignore */}
  },
  remove(key: string) {
    try { backend.removeItem(key); } catch {/* ignore */}
  },
  // Helpers for JSON
  getJSON<T>(key: string, fallback: T): T {
    const raw = this.get(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  },
  setJSON(key: string, value: unknown) {
    try { this.set(key, JSON.stringify(value)); } catch {/* ignore */}
  }
};
