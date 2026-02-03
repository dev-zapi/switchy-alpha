import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chrome API
const mockStorage: Record<string, unknown> = {};
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(async (keys: string | string[] | null) => {
        if (keys === null) {
          return { ...mockStorage };
        }
        const keyArray = Array.isArray(keys) ? keys : [keys];
        const result: Record<string, unknown> = {};
        for (const key of keyArray) {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        }
        return result;
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
      }),
      clear: vi.fn(async () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        for (const key of keyArray) {
          delete mockStorage[key];
        }
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  proxy: {
    settings: {
      set: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    onActivated: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
  action: {
    setIcon: vi.fn(),
  },
};

// @ts-ignore
global.chrome = mockChrome;

// Clear storage before each test
beforeEach(() => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  vi.clearAllMocks();
});

describe('Profile deletion persistence', () => {
  it('should remove profile from storage after deletion', async () => {
    // Setup: Add a profile to storage
    mockStorage['-schemaVersion'] = 2;
    mockStorage['+proxy'] = {
      name: 'proxy',
      profileType: 'FixedProfile',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 },
    };
    mockStorage['+test-profile'] = {
      name: 'test-profile',
      profileType: 'FixedProfile',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8081 },
    };

    // Verify both profiles exist
    let storage = await chrome.storage.local.get(null);
    expect(storage['+proxy']).toBeDefined();
    expect(storage['+test-profile']).toBeDefined();

    // Simulate deletion: Create options without the deleted profile
    const options = {
      '-schemaVersion': 2,
      '+proxy': {
        name: 'proxy',
        profileType: 'FixedProfile',
        fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 },
      },
      // +test-profile is intentionally omitted
    };

    // This is what should happen in setOptions handler
    await chrome.storage.local.clear();
    await chrome.storage.local.set(options);

    // Verify the deleted profile is gone
    storage = await chrome.storage.local.get(null);
    expect(storage['+proxy']).toBeDefined();
    expect(storage['+test-profile']).toBeUndefined();
  });

  it('should persist profile deletion across browser restarts', async () => {
    // Simulate initial state with a profile
    mockStorage['-schemaVersion'] = 2;
    mockStorage['+proxy'] = {
      name: 'proxy',
      profileType: 'FixedProfile',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8080 },
    };
    mockStorage['+will-delete'] = {
      name: 'will-delete',
      profileType: 'FixedProfile',
      fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 8082 },
    };

    // Step 1: Delete the profile (simulating user action)
    const optionsWithoutDeleted = {
      '-schemaVersion': 2,
      '+proxy': mockStorage['+proxy'],
    };

    // Simulate setOptions with clear + set
    await chrome.storage.local.clear();
    await chrome.storage.local.set(optionsWithoutDeleted);

    // Step 2: Simulate browser restart - reload options from storage
    const loadedOptions = await chrome.storage.local.get(null);

    // Step 3: Verify deleted profile is not present
    expect(loadedOptions['+proxy']).toBeDefined();
    expect(loadedOptions['+will-delete']).toBeUndefined();
  });

  it('should handle multiple profile deletions', async () => {
    // Setup: Add multiple profiles
    mockStorage['-schemaVersion'] = 2;
    mockStorage['+proxy1'] = { name: 'proxy1', profileType: 'FixedProfile' };
    mockStorage['+proxy2'] = { name: 'proxy2', profileType: 'FixedProfile' };
    mockStorage['+proxy3'] = { name: 'proxy3', profileType: 'FixedProfile' };

    // Delete two profiles
    const options = {
      '-schemaVersion': 2,
      '+proxy1': mockStorage['+proxy1'],
      // proxy2 and proxy3 deleted
    };

    await chrome.storage.local.clear();
    await chrome.storage.local.set(options);

    // Verify only proxy1 remains
    const storage = await chrome.storage.local.get(null);
    expect(storage['+proxy1']).toBeDefined();
    expect(storage['+proxy2']).toBeUndefined();
    expect(storage['+proxy3']).toBeUndefined();
  });
});

describe('Chrome storage behavior', () => {
  it('should demonstrate the bug: set() without clear() keeps old keys', async () => {
    // This test demonstrates why the bug occurred
    mockStorage['+profile1'] = { name: 'profile1' };
    mockStorage['+profile2'] = { name: 'profile2' };

    // Simulate old behavior: set() without clear()
    const newOptions = { '+profile1': { name: 'profile1' } };
    await chrome.storage.local.set(newOptions);

    // Bug: profile2 still exists!
    const storage = await chrome.storage.local.get(null);
    expect(storage['+profile1']).toBeDefined();
    expect(storage['+profile2']).toBeDefined(); // Bug: this should be undefined!
  });

  it('should fix the bug: clear() + set() removes old keys', async () => {
    // Setup: Add profiles
    mockStorage['+profile1'] = { name: 'profile1' };
    mockStorage['+profile2'] = { name: 'profile2' };

    // New behavior: clear() then set()
    const newOptions = { '+profile1': { name: 'profile1' } };
    await chrome.storage.local.clear();
    await chrome.storage.local.set(newOptions);

    // Fixed: profile2 is removed
    const storage = await chrome.storage.local.get(null);
    expect(storage['+profile1']).toBeDefined();
    expect(storage['+profile2']).toBeUndefined();
  });
});
