import AsyncStorage from '@react-native-async-storage/async-storage';

let mmkvStorage: { getNumber: (k: string) => number | undefined; set: (k: string, v: number | string | boolean) => void; getString: (k: string) => string | undefined; getBoolean: (k: string) => boolean | undefined; delete: (k: string) => void } | null = null;

try {
  const { MMKV } = require('react-native-mmkv');
  mmkvStorage = new MMKV();
} catch {
  // MMKV native module not available (Expo Go), use AsyncStorage fallback
}

function isMMKV(): boolean {
  return mmkvStorage !== null;
}

export const storage = {
  getNumber(key: string): number | undefined {
    if (isMMKV()) return mmkvStorage!.getNumber(key);
    const raw = storage._cache[key];
    return raw !== undefined ? Number(raw) : undefined;
  },

  getString(key: string): string | undefined {
    if (isMMKV()) return mmkvStorage!.getString(key);
    return storage._cache[key] ?? undefined;
  },

  getBoolean(key: string): boolean | undefined {
    if (isMMKV()) return mmkvStorage!.getBoolean(key);
    const raw = storage._cache[key];
    return raw !== undefined ? raw === 'true' : undefined;
  },

  set(key: string, value: number | string | boolean): void {
    if (isMMKV()) {
      mmkvStorage!.set(key, value);
      return;
    }
    storage._cache[key] = String(value);
    AsyncStorage.setItem(key, String(value)).catch(() => {});
  },

  delete(key: string): void {
    if (isMMKV()) {
      mmkvStorage!.delete(key);
      return;
    }
    delete storage._cache[key];
    AsyncStorage.removeItem(key).catch(() => {});
  },

  async hydrate(): Promise<void> {
    if (isMMKV()) return;
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    for (const [k, v] of entries) {
      if (v !== null) storage._cache[k] = v;
    }
  },

  _cache: {} as Record<string, string>,
};
