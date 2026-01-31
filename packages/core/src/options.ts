/**
 * Options manager for ZeroOmega
 *
 * Handles loading, saving, and managing extension options and profiles.
 * This is a simplified TypeScript port of the original Options class.
 */

import { Profiles, type Profile, type OmegaOptions } from '@anthropic-demo/onemega-pac';
import { Storage } from './storage';
import { Log } from './log';
import { ProfileNotExistError, NoOptionsError } from './errors';

/**
 * Keys that should be excluded when syncing profiles
 */
const SYNC_EXCLUDED_KEYS = ['lastUpdate', 'ruleList', 'pacScript', 'sha256'];

/**
 * Generate SHA-256 hash of text
 */
async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Transform a value for syncing (strip downloadable content)
 */
export function transformValueForSync(value: unknown, key: string): unknown {
  if (key === '-customCss') {
    return undefined;
  }

  if (key.startsWith('+') && typeof value === 'object' && value !== null) {
    const profile = value as Profile;
    if (Profiles.updateUrl?.(profile)) {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(profile)) {
        if (!SYNC_EXCLUDED_KEYS.includes(k)) {
          cleaned[k] = v;
        }
      }
      return cleaned;
    }
  }

  return value;
}

/**
 * Options configuration
 */
export interface OptionsConfig {
  storage?: Storage;
  state?: Storage;
  log?: typeof Log;
}

/**
 * Options manager class
 */
export class Options {
  protected _options: OmegaOptions = {} as OmegaOptions;
  protected _storage: Storage;
  protected _state: Storage;
  protected log: typeof Log;

  protected _currentProfileName: string | null = null;
  protected _watchingProfiles: Record<string, boolean> = {};
  protected _isSystem = false;

  readonly fallbackProfileName = 'system';
  readonly debugStr = 'Options';

  /** Promise that resolves when options are ready */
  ready: Promise<OmegaOptions> | null = null;

  constructor(config: OptionsConfig = {}) {
    this._storage = config.storage ?? new Storage();
    this._state = config.state ?? new Storage();
    this.log = config.log ?? Log;
  }

  /**
   * Get default options for a fresh installation
   */
  getDefaultOptions(): OmegaOptions {
    const options: OmegaOptions = {
      '-schemaVersion': 2,
      '-startupProfileName': '',
      '-quickSwitchProfiles': [],
      '-refreshOnProfileChange': false,
      '-enableQuickSwitch': false,
      '-revertProxyChanges': false,
      '-showInspectMenu': true,
      '-downloadInterval': 1440, // 24 hours in minutes
    } as OmegaOptions;

    // Add default proxy profile
    const proxy = Profiles.create('proxy', 'FixedProfile');
    options['+proxy'] = proxy;

    // Add default auto switch profile
    const autoSwitch = Profiles.create('auto switch', 'SwitchProfile');
    options['+auto switch'] = autoSwitch;

    return options;
  }

  /**
   * Get all options
   */
  getAll(): OmegaOptions {
    return { ...this._options };
  }

  /**
   * Get a single option value
   */
  get<K extends keyof OmegaOptions>(key: K): OmegaOptions[K] | undefined {
    return this._options[key];
  }

  /**
   * Set option values
   */
  async set(changes: Partial<OmegaOptions>): Promise<void> {
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) {
        delete this._options[key as keyof OmegaOptions];
      } else {
        (this._options as Record<string, unknown>)[key] = value;
      }
    }

    await this._storage.set(changes);
  }

  /**
   * Get a profile by name
   */
  profile(name: string): Profile | undefined {
    return Profiles.byName(name, this._options as Record<string, Profile>);
  }

  /**
   * Get all profiles
   */
  profiles(): Profile[] {
    const profiles: Profile[] = [];
    Profiles.each(this._options as Record<string, Profile>, (_key, profile) => {
      profiles.push(profile);
    });
    return profiles;
  }

  /**
   * Add or update a profile
   */
  async addProfile(profile: Profile): Promise<Profile> {
    const key = Profiles.nameAsKey(profile.name);
    Profiles.updateRevision(profile);
    (this._options as Record<string, unknown>)[key] = profile;
    await this._storage.set({ [key]: profile });
    return profile;
  }

  /**
   * Remove a profile
   */
  async removeProfile(name: string): Promise<void> {
    const key = Profiles.nameAsKey(name);
    delete (this._options as Record<string, unknown>)[key];
    await this._storage.remove(key);
  }

  /**
   * Rename a profile
   */
  async renameProfile(oldName: string, newName: string): Promise<Profile> {
    const profile = this.profile(oldName);
    if (!profile) {
      throw new ProfileNotExistError(oldName);
    }

    const oldKey = Profiles.nameAsKey(oldName);
    const newKey = Profiles.nameAsKey(newName);

    // Update profile
    profile.name = newName;
    Profiles.updateRevision(profile);

    // Update references in other profiles
    for (const p of this.profiles()) {
      if (Profiles.replaceRef(p, oldName, newName)) {
        Profiles.updateRevision(p);
        await this._storage.set({ [Profiles.nameAsKey(p.name)]: p });
      }
    }

    // Update options
    delete (this._options as Record<string, unknown>)[oldKey];
    (this._options as Record<string, unknown>)[newKey] = profile;

    // Persist
    await this._storage.remove(oldKey);
    await this._storage.set({ [newKey]: profile });

    // Update current profile if needed
    if (this._currentProfileName === oldName) {
      this._currentProfileName = newName;
      await this._state.set({ currentProfileName: newName });
    }

    return profile;
  }

  /**
   * Get current profile name
   */
  getCurrentProfileName(): string {
    return this._currentProfileName ?? this.fallbackProfileName;
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): Profile | undefined {
    return this.profile(this.getCurrentProfileName());
  }

  /**
   * Apply a profile (make it the current profile)
   */
  async applyProfile(name: string): Promise<void> {
    const profile = this.profile(name);
    if (!profile) {
      throw new ProfileNotExistError(name);
    }

    this._currentProfileName = name;
    this._isSystem = profile.profileType === 'SystemProfile';

    await this._state.set({
      currentProfileName: name,
      isSystemProfile: this._isSystem,
    });

    // Subclasses should override to actually apply the proxy
  }

  /**
   * Load options from storage
   */
  async loadOptions(): Promise<OmegaOptions> {
    const options = await this._storage.get(null);

    if (!options || Object.keys(options).length === 0) {
      throw new NoOptionsError();
    }

    // Validate schema
    if (!options['-schemaVersion']) {
      throw new NoOptionsError();
    }

    this._options = options as OmegaOptions;
    return this._options;
  }

  /**
   * Initialize options
   */
  async init(): Promise<OmegaOptions> {
    this.ready = this.loadOptions()
      .catch(async (err) => {
        if (err instanceof NoOptionsError) {
          // First run - use defaults
          const defaults = this.getDefaultOptions();
          await this._storage.set(defaults);
          this._options = defaults;
          return defaults;
        }
        throw err;
      })
      .then(async (options) => {
        // Load current profile from state
        const state = await this._state.get({
          currentProfileName: this.fallbackProfileName,
          isSystemProfile: false,
        });

        const profileName = (state['currentProfileName'] as string) || this.fallbackProfileName;

        try {
          await this.applyProfile(profileName);
        } catch {
          await this.applyProfile(this.fallbackProfileName);
        }

        return options;
      });

    return this.ready;
  }

  /**
   * Export options as JSON string
   */
  exportOptions(): string {
    return JSON.stringify(this._options, null, 2);
  }

  /**
   * Import options from JSON string
   */
  async importOptions(json: string): Promise<OmegaOptions> {
    const options = JSON.parse(json) as OmegaOptions;

    // Clear and replace
    await this._storage.remove(null);
    await this._storage.set(options);

    this._options = options;
    return options;
  }

  toString(): string {
    return '<Options>';
  }
}

export default Options;
