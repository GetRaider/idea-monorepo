export const localStorageHelper = {
  readItem(key: string): unknown | null {
    if (!isClientStorageAvailable()) return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  },

  writeItem(key: string, value: unknown): void {
    if (!isClientStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be unavailable */
    }
  },

  removeItem(key: string): void {
    if (!isClientStorageAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage may be unavailable */
    }
  },

  readString(key: string): string | null {
    if (!isClientStorageAvailable()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  writeString(key: string, value: string): void {
    if (!isClientStorageAvailable()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage may be unavailable */
    }
  },
};

function isClientStorageAvailable(): boolean {
  return typeof window !== "undefined";
}
