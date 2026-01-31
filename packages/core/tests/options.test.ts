import { describe, it, expect, beforeEach } from 'vitest';
import { Options } from '../src/options';
import { Storage } from '../src/storage';
import { ProfileNotExistError, NoOptionsError } from '../src/errors';
import { Profiles } from '@anthropic-demo/onemega-pac';

describe('Options', () => {
  let options: Options;
  let storage: Storage;
  let state: Storage;

  beforeEach(() => {
    storage = new Storage();
    state = new Storage();
    options = new Options({ storage, state });
  });

  describe('getDefaultOptions', () => {
    it('should return default options with schema version', () => {
      const defaults = options.getDefaultOptions();
      expect(defaults['-schemaVersion']).toBe(2);
    });

    it('should include default profiles', () => {
      const defaults = options.getDefaultOptions();
      expect(defaults['+proxy']).toBeDefined();
      expect(defaults['+auto switch']).toBeDefined();
    });
  });

  describe('init', () => {
    it('should initialize with defaults when storage is empty', async () => {
      await options.init();
      const all = options.getAll();
      expect(all['-schemaVersion']).toBe(2);
    });

    it('should load existing options from storage', async () => {
      await storage.set({
        '-schemaVersion': 2,
        '+test': Profiles.create('test', 'FixedProfile'),
      });

      await options.init();
      expect(options.profile('test')).toBeDefined();
    });
  });

  describe('profile operations', () => {
    beforeEach(async () => {
      await options.init();
    });

    it('should get profile by name', () => {
      const proxy = options.profile('proxy');
      expect(proxy).toBeDefined();
      expect(proxy?.name).toBe('proxy');
    });

    it('should return undefined for non-existent profile', () => {
      expect(options.profile('nonexistent')).toBeUndefined();
    });

    it('should list all profiles', () => {
      const profiles = options.profiles();
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles.some((p) => p.name === 'proxy')).toBe(true);
    });

    it('should add a profile', async () => {
      const profile = Profiles.create('new-profile', 'FixedProfile');
      await options.addProfile(profile);

      expect(options.profile('new-profile')).toBeDefined();
    });

    it('should remove a profile', async () => {
      const profile = Profiles.create('to-remove', 'FixedProfile');
      await options.addProfile(profile);
      expect(options.profile('to-remove')).toBeDefined();

      await options.removeProfile('to-remove');
      expect(options.profile('to-remove')).toBeUndefined();
    });

    it('should rename a profile', async () => {
      const profile = Profiles.create('old-name', 'FixedProfile');
      await options.addProfile(profile);

      const renamed = await options.renameProfile('old-name', 'new-name');
      expect(renamed.name).toBe('new-name');
      expect(options.profile('old-name')).toBeUndefined();
      expect(options.profile('new-name')).toBeDefined();
    });

    it('should throw when renaming non-existent profile', async () => {
      await expect(options.renameProfile('nope', 'new')).rejects.toThrow(ProfileNotExistError);
    });
  });

  describe('current profile', () => {
    beforeEach(async () => {
      await options.init();
    });

    it('should have fallback profile initially', () => {
      expect(options.getCurrentProfileName()).toBe('system');
    });

    it('should apply a profile', async () => {
      await options.applyProfile('proxy');
      expect(options.getCurrentProfileName()).toBe('proxy');
    });

    it('should throw when applying non-existent profile', async () => {
      await expect(options.applyProfile('nonexistent')).rejects.toThrow(ProfileNotExistError);
    });
  });

  describe('import/export', () => {
    beforeEach(async () => {
      await options.init();
    });

    it('should export options as JSON', () => {
      const json = options.exportOptions();
      const parsed = JSON.parse(json);
      expect(parsed['-schemaVersion']).toBe(2);
    });

    it('should import options from JSON', async () => {
      const newOptions = {
        '-schemaVersion': 2,
        '+imported': Profiles.create('imported', 'FixedProfile'),
      };

      await options.importOptions(JSON.stringify(newOptions));
      expect(options.profile('imported')).toBeDefined();
    });
  });
});
