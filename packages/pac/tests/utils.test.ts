import { describe, it, expect } from 'vitest';
import { shExp2RegExp, escapeSlash, safeRegex } from '../src/shexp-utils';
import { isIp, getBaseDomain, Revision, requestFromUrl } from '../src/utils';

describe('shexp-utils', () => {
  describe('shExp2RegExp', () => {
    it('should convert simple wildcard to regex', () => {
      expect(shExp2RegExp('*.example.com')).toBe('^.*\\.example\\.com$');
    });

    it('should handle question mark wildcard', () => {
      expect(shExp2RegExp('test?.com')).toBe('^test.\\.com$');
    });

    it('should trim asterisks when option is set', () => {
      const result = shExp2RegExp('*example*', { trimAsterisk: true });
      expect(result).toBe('example');
    });

    it('should escape regex metacharacters', () => {
      expect(shExp2RegExp('test.com')).toBe('^test\\.com$');
    });
  });

  describe('escapeSlash', () => {
    it('should escape forward slashes', () => {
      expect(escapeSlash('http://example.com')).toBe('http:\\/\\/example.com');
    });

    it('should not double-escape already escaped slashes', () => {
      expect(escapeSlash('test\\/path')).toBe('test\\/path');
    });
  });

  describe('safeRegex', () => {
    it('should return valid regex for valid pattern', () => {
      const regex = safeRegex('^test$');
      expect(regex.test('test')).toBe(true);
      expect(regex.test('other')).toBe(false);
    });

    it('should return non-matching regex for invalid pattern', () => {
      const regex = safeRegex('[invalid');
      expect(regex.test('anything')).toBe(false);
    });
  });
});

describe('utils', () => {
  describe('isIp', () => {
    it('should detect IPv4 addresses', () => {
      expect(isIp('192.168.1.1')).toBe(true);
      expect(isIp('127.0.0.1')).toBe(true);
    });

    it('should detect IPv6 addresses', () => {
      expect(isIp('::1')).toBe(true);
      expect(isIp('2001:db8::1')).toBe(true);
    });

    it('should return false for domain names', () => {
      expect(isIp('example.com')).toBe(false);
      expect(isIp('www.google.com')).toBe(false);
    });
  });

  describe('getBaseDomain', () => {
    it('should return IP as-is', () => {
      expect(getBaseDomain('192.168.1.1')).toBe('192.168.1.1');
    });

    it('should extract base domain from subdomain', () => {
      expect(getBaseDomain('www.example.com')).toBe('example.com');
      expect(getBaseDomain('sub.domain.example.com')).toBe('example.com');
    });

    it('should handle domains without subdomain', () => {
      expect(getBaseDomain('example.com')).toBe('example.com');
    });
  });

  describe('Revision', () => {
    it('should generate revision from time', () => {
      const rev = Revision.fromTime(new Date('2024-01-01'));
      expect(typeof rev).toBe('string');
      expect(rev.length).toBeGreaterThan(0);
    });

    it('should compare revisions correctly', () => {
      const rev1 = Revision.fromTime(new Date('2024-01-01'));
      const rev2 = Revision.fromTime(new Date('2024-01-02'));
      expect(Revision.compare(rev1, rev2)).toBeLessThan(0);
      expect(Revision.compare(rev2, rev1)).toBeGreaterThan(0);
      expect(Revision.compare(rev1, rev1)).toBe(0);
    });

    it('should handle null/undefined comparisons', () => {
      expect(Revision.compare(null, null)).toBe(0);
      expect(Revision.compare('abc', null)).toBe(1);
      expect(Revision.compare(null, 'abc')).toBe(-1);
    });
  });

  describe('requestFromUrl', () => {
    it('should parse URL into request object', () => {
      const req = requestFromUrl('https://example.com/path');
      expect(req.host).toBe('example.com');
      expect(req.scheme).toBe('https');
      expect(req.url).toBe('https://example.com/path');
    });
  });
});
