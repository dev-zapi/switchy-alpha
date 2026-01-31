import { describe, it, expect } from 'vitest';
import { Profiles, pacResult, nameAsKey, byName, create, match, directReferenceSet } from '../src/profiles';
import type { FixedProfile, SwitchProfile, RuleListProfile } from '../src/types';

describe('Profiles', () => {
  describe('nameAsKey', () => {
    it('should prefix profile name with +', () => {
      expect(nameAsKey('test')).toBe('+test');
      expect(nameAsKey({ name: 'profile1' })).toBe('+profile1');
    });
  });

  describe('pacResult', () => {
    it('should return DIRECT for no proxy', () => {
      expect(pacResult()).toBe('DIRECT');
      expect(pacResult({ scheme: 'direct' })).toBe('DIRECT');
    });

    it('should return correct PAC result for HTTP proxy', () => {
      expect(pacResult({ scheme: 'http', host: '127.0.0.1', port: 8080 })).toBe('PROXY 127.0.0.1:8080');
    });

    it('should return correct PAC result for SOCKS5 proxy with fallback', () => {
      const result = pacResult({ scheme: 'socks5', host: '127.0.0.1', port: 1080 });
      expect(result).toContain('SOCKS5');
      expect(result).toContain('SOCKS');
    });
  });

  describe('byName', () => {
    it('should get builtin profiles', () => {
      const direct = byName('direct');
      expect(direct?.profileType).toBe('DirectProfile');

      const system = byName('system');
      expect(system?.profileType).toBe('SystemProfile');
    });

    it('should get profiles from options', () => {
      const options = {
        '+custom': { name: 'custom', profileType: 'FixedProfile' as const } as FixedProfile,
      };
      const profile = byName('custom', options);
      expect(profile?.name).toBe('custom');
    });
  });

  describe('create', () => {
    it('should create FixedProfile with default bypass list', () => {
      const profile = create('test', 'FixedProfile') as FixedProfile;
      expect(profile.bypassList).toBeDefined();
      expect(profile.bypassList?.length).toBe(3);
    });

    it('should create SwitchProfile with default values', () => {
      const profile = create('test', 'SwitchProfile') as SwitchProfile;
      expect(profile.defaultProfileName).toBe('direct');
      expect(profile.rules).toEqual([]);
    });

    it('should create RuleListProfile with default values', () => {
      const profile = create('test', 'RuleListProfile') as RuleListProfile;
      expect(profile.format).toBe('Switchy');
      expect(profile.defaultProfileName).toBe('direct');
      expect(profile.matchProfileName).toBe('direct');
    });
  });

  describe('directReferenceSet', () => {
    it('should return empty for non-inclusive profiles', () => {
      const profile = create('test', 'DirectProfile');
      expect(directReferenceSet(profile)).toEqual({});
    });

    it('should return references for SwitchProfile', () => {
      const profile = create('test', 'SwitchProfile') as SwitchProfile;
      profile.defaultProfileName = 'fallback';
      profile.rules = [
        { condition: { conditionType: 'TrueCondition' }, profileName: 'proxy1' },
      ];

      const refs = directReferenceSet(profile);
      expect(refs['+fallback']).toBe('fallback');
      expect(refs['+proxy1']).toBe('proxy1');
    });
  });

  describe('match', () => {
    it('should match DirectProfile', () => {
      const profile = create('test', 'DirectProfile');
      const result = match(profile, { url: 'http://example.com', host: 'example.com', scheme: 'http' });
      expect(result?.profileName).toBe('direct');
    });

    it('should match FixedProfile with bypass', () => {
      const profile = create('test', 'FixedProfile') as FixedProfile;
      profile.fallbackProxy = { scheme: 'http', host: 'proxy.com', port: 8080 };

      // Should bypass localhost
      const result1 = match(profile, { url: 'http://localhost/', host: 'localhost', scheme: 'http' });
      expect(result1?.proxy?.scheme).toBe('direct');

      // Should use proxy for other hosts
      const result2 = match(profile, { url: 'http://example.com/', host: 'example.com', scheme: 'http' });
      expect(result2?.proxy?.scheme).toBe('http');
    });

    it('should match SwitchProfile rules', () => {
      const profile = create('test', 'SwitchProfile') as SwitchProfile;
      profile.defaultProfileName = 'direct';
      profile.rules = [
        {
          condition: { conditionType: 'HostWildcardCondition', pattern: '*.example.com' },
          profileName: 'proxy',
        },
      ];

      const result1 = match(profile, { url: 'http://www.example.com', host: 'www.example.com', scheme: 'http' });
      expect(result1?.profileName).toBe('proxy');

      const result2 = match(profile, { url: 'http://other.com', host: 'other.com', scheme: 'http' });
      expect(result2?.profileName).toBe('direct');
    });
  });
});
