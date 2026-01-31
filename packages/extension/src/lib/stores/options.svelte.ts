/**
 * Options Store for ZeroOmega
 *
 * Svelte 5 reactive store using runes pattern for managing extension options.
 */

import type { Profile, OmegaOptions } from '@anthropic-demo/onemega-pac';
import { Profiles } from '@anthropic-demo/onemega-pac';

// Store state
let options = $state<OmegaOptions | null>(null);
let currentProfileName = $state<string>('system');
let isLoading = $state(true);
let isDirty = $state(false);
let error = $state<string | null>(null);

/**
 * Get profiles array from options
 */
function getProfiles(): Profile[] {
  if (!options) return [];
  const result: Profile[] = [];
  Profiles.each(options as unknown as Record<string, Profile>, (_key, profile) => {
    result.push(profile);
  });
  return result;
}

/**
 * Initialize the store by loading options from background
 */
async function init(): Promise<void> {
  isLoading = true;
  error = null;

  try {
    // In extension context, get from background
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const response = await chrome.runtime.sendMessage({ action: 'getOptions' });
      if (response?.options) {
        options = response.options;
        currentProfileName = response.currentProfileName || 'system';
      }
    } else {
      // Development mode - use defaults
      options = getDefaultOptions();
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load options';
    options = getDefaultOptions();
  } finally {
    isLoading = false;
    isDirty = false;
  }
}

/**
 * Get default options for development/testing
 */
function getDefaultOptions(): OmegaOptions {
  return {
    '-schemaVersion': 2,
    '-startupProfileName': '',
    '-quickSwitchProfiles': [],
    '-refreshOnProfileChange': false,
    '-enableQuickSwitch': false,
    '-revertProxyChanges': false,
    '-showInspectMenu': true,
    '-downloadInterval': 1440,
    '+proxy': Profiles.create('proxy', 'FixedProfile'),
    '+auto switch': Profiles.create('auto switch', 'SwitchProfile'),
  } as OmegaOptions;
}

/**
 * Get a specific option value
 */
function get<K extends keyof OmegaOptions>(key: K): OmegaOptions[K] | undefined {
  return options?.[key];
}

/**
 * Set option values
 */
function set(changes: Partial<OmegaOptions>): void {
  if (!options) return;

  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) {
      delete (options as Record<string, unknown>)[key];
    } else {
      (options as Record<string, unknown>)[key] = value;
    }
  }
  isDirty = true;
}

/**
 * Get a profile by name
 */
function getProfile(name: string): Profile | undefined {
  if (!options) return undefined;
  return Profiles.byName(name, options as unknown as Record<string, Profile>);
}

/**
 * Add or update a profile
 */
function setProfile(profile: Profile): void {
  if (!options) return;

  const key = Profiles.nameAsKey(profile.name);
  Profiles.updateRevision(profile);
  (options as Record<string, unknown>)[key] = profile;
  isDirty = true;
}

/**
 * Delete a profile
 */
function deleteProfile(name: string): void {
  if (!options) return;

  const key = Profiles.nameAsKey(name);
  delete (options as Record<string, unknown>)[key];
  isDirty = true;
}

/**
 * Apply changes to background
 */
async function applyChanges(): Promise<boolean> {
  if (!isDirty || !options) return true;

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({
        action: 'setOptions',
        options,
      });
    }
    isDirty = false;
    return true;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to save options';
    return false;
  }
}

/**
 * Revert changes by reloading from background
 */
async function revertChanges(): Promise<void> {
  await init();
}

/**
 * Apply a profile (make it current)
 */
async function applyProfile(name: string): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({
        action: 'applyProfile',
        profileName: name,
      });
    }
    currentProfileName = name;
    return true;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to apply profile';
    return false;
  }
}

// Export the store
export const optionsStore = {
  // Reactive getters
  get options() {
    return options;
  },
  get profiles() {
    return getProfiles();
  },
  get sortedProfiles() {
    return getProfiles().sort((a, b) => a.name.localeCompare(b.name));
  },
  get currentProfileName() {
    return currentProfileName;
  },
  get currentProfile() {
    if (!options) return null;
    return Profiles.byName(currentProfileName, options as unknown as Record<string, Profile>) || null;
  },
  get isLoading() {
    return isLoading;
  },
  get isDirty() {
    return isDirty;
  },
  get error() {
    return error;
  },

  // Methods
  init,
  get,
  set,
  getProfile,
  setProfile,
  deleteProfile,
  applyChanges,
  revertChanges,
  applyProfile,
};

export default optionsStore;
