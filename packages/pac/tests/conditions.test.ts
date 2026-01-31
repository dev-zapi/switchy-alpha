import { describe, it, expect } from 'vitest';
import { Conditions } from '../src/conditions';

describe('Conditions', () => {
  describe('match', () => {
    it('should match TrueCondition always', () => {
      const cond = { conditionType: 'TrueCondition' as const };
      const request = { url: 'http://example.com', host: 'example.com', scheme: 'http' };
      expect(Conditions.match(cond, request)).toBe(true);
    });

    it('should never match FalseCondition', () => {
      const cond = { conditionType: 'FalseCondition' as const, pattern: 'test' };
      const request = { url: 'http://example.com', host: 'example.com', scheme: 'http' };
      expect(Conditions.match(cond, request)).toBe(false);
    });

    it('should match HostWildcardCondition', () => {
      const cond = { conditionType: 'HostWildcardCondition' as const, pattern: '*.example.com' };
      const request1 = { url: 'http://www.example.com', host: 'www.example.com', scheme: 'http' };
      const request2 = { url: 'http://other.com', host: 'other.com', scheme: 'http' };

      expect(Conditions.match(cond, request1)).toBe(true);
      expect(Conditions.match(cond, request2)).toBe(false);
    });

    it('should match UrlWildcardCondition', () => {
      const cond = { conditionType: 'UrlWildcardCondition' as const, pattern: '*example*' };
      const request1 = { url: 'http://www.example.com/path', host: 'www.example.com', scheme: 'http' };
      const request2 = { url: 'http://other.com', host: 'other.com', scheme: 'http' };

      expect(Conditions.match(cond, request1)).toBe(true);
      expect(Conditions.match(cond, request2)).toBe(false);
    });

    it('should match UrlRegexCondition', () => {
      const cond = { conditionType: 'UrlRegexCondition' as const, pattern: 'example\\.com' };
      const request1 = { url: 'http://example.com', host: 'example.com', scheme: 'http' };
      const request2 = { url: 'http://other.com', host: 'other.com', scheme: 'http' };

      expect(Conditions.match(cond, request1)).toBe(true);
      expect(Conditions.match(cond, request2)).toBe(false);
    });

    it('should match KeywordCondition for http only', () => {
      const cond = { conditionType: 'KeywordCondition' as const, pattern: 'example' };
      const request1 = { url: 'http://example.com', host: 'example.com', scheme: 'http' };
      const request2 = { url: 'https://example.com', host: 'example.com', scheme: 'https' };

      expect(Conditions.match(cond, request1)).toBe(true);
      expect(Conditions.match(cond, request2)).toBe(false);
    });

    it('should match BypassCondition with <local>', () => {
      const cond = { conditionType: 'BypassCondition' as const, pattern: '<local>' };

      expect(Conditions.match(cond, { url: 'http://localhost', host: 'localhost', scheme: 'http' })).toBe(true);
      expect(Conditions.match(cond, { url: 'http://127.0.0.1', host: '127.0.0.1', scheme: 'http' })).toBe(true);
      expect(Conditions.match(cond, { url: 'http://example.com', host: 'example.com', scheme: 'http' })).toBe(false);
    });

    it('should match HostLevelsCondition', () => {
      const cond = { conditionType: 'HostLevelsCondition' as const, minValue: 2, maxValue: 3 };

      // 2 dots = 3 levels
      expect(Conditions.match(cond, { url: 'http://a.b.com', host: 'a.b.com', scheme: 'http' })).toBe(true);
      // 1 dot = 2 levels
      expect(Conditions.match(cond, { url: 'http://example.com', host: 'example.com', scheme: 'http' })).toBe(false);
    });
  });

  describe('str', () => {
    it('should convert condition to string', () => {
      const cond = { conditionType: 'HostWildcardCondition' as const, pattern: '*.example.com' };
      expect(Conditions.str(cond)).toBe('*.example.com');
    });

    it('should include type prefix for non-host conditions', () => {
      const cond = { conditionType: 'UrlRegexCondition' as const, pattern: 'test' };
      expect(Conditions.str(cond)).toContain('UrlRegex');
    });
  });

  describe('fromStr', () => {
    it('should parse host wildcard condition', () => {
      const cond = Conditions.fromStr('*.example.com');
      expect(cond?.conditionType).toBe('HostWildcardCondition');
      expect((cond as { pattern: string }).pattern).toBe('*.example.com');
    });

    it('should parse typed condition', () => {
      const cond = Conditions.fromStr('UrlRegex: test\\.com');
      expect(cond?.conditionType).toBe('UrlRegexCondition');
      expect((cond as { pattern: string }).pattern).toBe('test\\.com');
    });

    it('should parse IP condition', () => {
      const cond = Conditions.fromStr('Ip: 192.168.1.0/24');
      expect(cond?.conditionType).toBe('IpCondition');
      expect((cond as { ip: string }).ip).toBe('192.168.1.0');
      expect((cond as { prefixLength: number }).prefixLength).toBe(24);
    });
  });
});
