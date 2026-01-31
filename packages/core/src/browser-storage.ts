/**
 * Browser storage implementation using localStorage with IndexedDB backup
 *
 * This implementation wraps browser's localStorage API and provides
 * async access with IndexedDB for persistence backup.
 */

import { Storage } from './storage';

/**
 * Simple IndexedDB key-value store wrapper
 */
const idbKeyval = {
  async get(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('omega-storage', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const getRequest = store.get(key);

        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  },

  async set(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('omega-storage', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        store.put(value, key);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  },
};

/** Global cache flag for localStorage initialization */
let globalLocalStorageCacheInitialized = false;

/**
 * Browser storage implementation
 *
 * Uses localStorage for fast access and IndexedDB for backup/sync.
 */
export class BrowserStorage extends Storage {
  private storage: globalThis.Storage;
  private prefix: string;

  constructor(storage: globalThis.Storage = localStorage, prefix = '') {
    super();
    this.storage = storage;
    this.prefix = prefix;
    this.debugStr = 'BrowserStorage';
  }

  async get(
    keys?: string | string[] | Record<string, unknown> | null
  ): Promise<Record<string, unknown>> {
    // Initialize from IndexedDB if needed
    if (!globalLocalStorageCacheInitialized) {
      try {
        await idbKeyval.get('localStorage');
        globalLocalStorageCacheInitialized = true;
      } catch {
        // IndexedDB not available, continue anyway
        globalLocalStorageCacheInitialized = true;
      }
    }

    const map: Record<string, unknown> = {};

    // Build keys map
    if (typeof keys === 'string') {
      map[keys] = undefined;
    } else if (Array.isArray(keys)) {
      for (const key of keys) {
        map[key] = undefined;
      }
    } else if (typeof keys === 'object' && keys !== null) {
      Object.assign(map, keys);
    }

    // Read from localStorage
    for (const key of Object.keys(map)) {
      try {
        const raw = this.storage.getItem(this.prefix + key);
        if (raw !== null) {
          map[key] = JSON.parse(raw);
        }
      } catch {
        // Ignore parse errors
      }

      if (map[key] === undefined) {
        delete map[key];
      }
    }

    return map;
  }

  async set(items: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Initialize from IndexedDB if needed
    if (!globalLocalStorageCacheInitialized) {
      try {
        await idbKeyval.get('localStorage');
        globalLocalStorageCacheInitialized = true;
      } catch {
        globalLocalStorageCacheInitialized = true;
      }
    }

    // Write to localStorage
    for (const [key, value] of Object.entries(items)) {
      const serialized = JSON.stringify(value);
      this.storage.setItem(this.prefix + key, serialized);
    }

    // Small delay for Firefox localStorage compatibility
    await new Promise((resolve) => setTimeout(resolve, 1));

    // Backup to IndexedDB
    try {
      const allData: Record<string, unknown> = {};
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.prefix)) {
          const raw = this.storage.getItem(key);
          if (raw) {
            try {
              allData[key] = JSON.parse(raw);
            } catch {
              // Skip unparseable items
            }
          }
        }
      }
      await idbKeyval.set('localStorage', allData);
    } catch {
      // IndexedDB backup failed, continue anyway
    }

    return items;
  }

  async remove(keys?: string | string[] | null): Promise<void> {
    // Initialize from IndexedDB if needed
    if (!globalLocalStorageCacheInitialized) {
      try {
        await idbKeyval.get('localStorage');
        globalLocalStorageCacheInitialized = true;
      } catch {
        globalLocalStorageCacheInitialized = true;
      }
    }

    if (keys === null || keys === undefined) {
      // Clear all with prefix
      if (!this.prefix) {
        this.storage.clear();
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i);
          if (key?.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        for (const key of keysToRemove) {
          this.storage.removeItem(key);
        }
      }
    } else if (typeof keys === 'string') {
      this.storage.removeItem(this.prefix + keys);
    } else {
      for (const key of keys) {
        this.storage.removeItem(this.prefix + key);
      }
    }

    // Small delay for Firefox compatibility
    await new Promise((resolve) => setTimeout(resolve, 1));

    // Update IndexedDB backup
    try {
      const allData: Record<string, unknown> = {};
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(this.prefix)) {
          const raw = this.storage.getItem(key);
          if (raw) {
            try {
              allData[key] = JSON.parse(raw);
            } catch {
              // Skip unparseable items
            }
          }
        }
      }
      await idbKeyval.set('localStorage', allData);
    } catch {
      // IndexedDB backup failed, continue anyway
    }
  }
}

export default BrowserStorage;
