import { describe, expect, it } from 'vitest';
import { generatePacScript, PacGenerator } from '../src/pac-generator';
import { Profiles } from '../src/profiles';
import type { Profile, FixedProfile, SwitchProfile, RuleListProfile } from '../src/types';

describe('PAC Generator', () => {
  describe('generatePacScript', () => {
    it('should generate PAC script for DirectProfile', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
      };

      const pacScript = generatePacScript(options, 'direct');

      expect(pacScript).toContain('function FindProxyForURL');
      expect(pacScript).toContain('return "DIRECT"');
    });

    it('should generate PAC script for FixedProfile', () => {
      const options: Record<string, Profile> = {
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
      };

      const pacScript = generatePacScript(options, 'proxy');

      expect(pacScript).toContain('function FindProxyForURL');
      expect(pacScript).toContain('PROXY proxy.example.com:8080');
    });

    it('should generate PAC script for FixedProfile with bypass list', () => {
      const options: Record<string, Profile> = {
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
          bypassList: [
            { conditionType: 'BypassCondition', pattern: 'localhost' },
            { conditionType: 'BypassCondition', pattern: '127.0.0.1' },
          ],
        } as FixedProfile,
      };

      const pacScript = generatePacScript(options, 'proxy');

      expect(pacScript).toContain('return "DIRECT"');
      expect(pacScript).toContain('PROXY proxy.example.com:8080');
    });

    it('should generate PAC script for SwitchProfile', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'HostWildcardCondition', pattern: '*.google.com' },
              profileName: 'proxy',
            },
          ],
        } as SwitchProfile,
      };

      const pacScript = generatePacScript(options, 'auto');

      expect(pacScript).toContain('function FindProxyForURL');
      expect(pacScript).toContain('profile_auto');
      expect(pacScript).toContain('profile_proxy');
      expect(pacScript).toContain('profile_direct');
    });

    it('should generate PAC script for SystemProfile as DIRECT', () => {
      const options: Record<string, Profile> = {
        '+system': { name: 'system', profileType: 'SystemProfile' },
      };

      const pacScript = generatePacScript(options, 'system');

      expect(pacScript).toContain('function FindProxyForURL');
      expect(pacScript).toContain('return "DIRECT"');
    });
  });

  describe('PacGenerator class', () => {
    it('should include comments when option is set', () => {
      const options: Record<string, Profile> = {
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
      };

      const generator = new PacGenerator(options, { includeComments: true });
      const pacScript = generator.generate('proxy');

      expect(pacScript).toContain('// FixedProfile: proxy');
    });

    it('should not include comments by default', () => {
      const options: Record<string, Profile> = {
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
      };

      const generator = new PacGenerator(options, { includeComments: false });
      const pacScript = generator.generate('proxy');

      expect(pacScript).not.toContain('// FixedProfile');
    });
  });

  describe('Condition compilation', () => {
    it('should compile HostWildcardCondition correctly', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'HostWildcardCondition', pattern: '*.example.com' },
              profileName: 'proxy',
            },
          ],
        } as SwitchProfile,
      };

      const pacScript = generatePacScript(options, 'auto');

      // Should contain a regex test for the host pattern
      expect(pacScript).toContain('.test(host)');
    });

    it('should compile KeywordCondition correctly', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'KeywordCondition', pattern: 'blocked' },
              profileName: 'proxy',
            },
          ],
        } as SwitchProfile,
      };

      const pacScript = generatePacScript(options, 'auto');

      // KeywordCondition should check scheme and indexOf
      expect(pacScript).toContain("scheme === 'http'");
      expect(pacScript).toContain('indexOf');
    });
  });

  describe('Profile references', () => {
    it('should generate functions for all referenced profiles', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
        '+proxy1': {
          name: 'proxy1',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy1.example.com', port: 8080 },
        } as FixedProfile,
        '+proxy2': {
          name: 'proxy2',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'socks5', host: 'proxy2.example.com', port: 1080 },
        } as FixedProfile,
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'HostWildcardCondition', pattern: '*.site1.com' },
              profileName: 'proxy1',
            },
            {
              condition: { conditionType: 'HostWildcardCondition', pattern: '*.site2.com' },
              profileName: 'proxy2',
            },
          ],
        } as SwitchProfile,
      };

      const pacScript = generatePacScript(options, 'auto');

      expect(pacScript).toContain('function profile_auto');
      expect(pacScript).toContain('function profile_direct');
      expect(pacScript).toContain('function profile_proxy1');
      expect(pacScript).toContain('function profile_proxy2');
    });

    it('should handle missing referenced profiles gracefully', () => {
      const options: Record<string, Profile> = {
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'nonexistent',
          rules: [],
        } as SwitchProfile,
      };

      // Should not throw
      const pacScript = generatePacScript(options, 'auto');

      expect(pacScript).toContain('function profile_nonexistent');
      expect(pacScript).toContain('return "DIRECT"');
    });
  });

  describe('PAC script execution', () => {
    it('should generate valid JavaScript', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'HostWildcardCondition', pattern: '*.example.com' },
              profileName: 'proxy',
            },
          ],
        } as SwitchProfile,
      };

      const pacScript = generatePacScript(options, 'auto');

      // Should be valid JavaScript (no syntax errors)
      expect(() => new Function(pacScript)).not.toThrow();
    });

    it('should generate working FindProxyForURL function', () => {
      const options: Record<string, Profile> = {
        '+direct': { name: 'direct', profileType: 'DirectProfile' },
        '+proxy': {
          name: 'proxy',
          profileType: 'FixedProfile',
          fallbackProxy: { scheme: 'http', host: 'proxy.example.com', port: 8080 },
        } as FixedProfile,
        '+auto': {
          name: 'auto',
          profileType: 'SwitchProfile',
          defaultProfileName: 'direct',
          rules: [
            {
              condition: { conditionType: 'HostWildcardCondition', pattern: '*.example.com' },
              profileName: 'proxy',
            },
          ],
        } as SwitchProfile,
      };

      const pacScript = generatePacScript(options, 'auto');

      // Create a function from the PAC script
      const fn = new Function(pacScript + '\nreturn FindProxyForURL;');
      const FindProxyForURL = fn();

      // Test the function
      expect(FindProxyForURL('http://www.example.com/', 'www.example.com')).toBe(
        'PROXY proxy.example.com:8080'
      );
      expect(FindProxyForURL('http://www.google.com/', 'www.google.com')).toBe('DIRECT');
    });
  });
});
