import { describe, it, expect } from 'vitest';
import { Log, str } from '../src/log';

describe('Log', () => {
  describe('str', () => {
    it('should format strings', () => {
      expect(str('hello')).toBe('hello');
    });

    it('should format numbers', () => {
      expect(str(42)).toBe('42');
    });

    it('should format objects as JSON', () => {
      const result = str({ a: 1, b: 2 });
      expect(result).toContain('"a": 1');
      expect(result).toContain('"b": 2');
    });

    it('should hide sensitive fields', () => {
      const result = str({ username: 'user', password: 'secret', data: 'visible' });
      expect(result).toContain('<secret>');
      expect(result).toContain('visible');
      // The key names remain, values are hidden
      expect(result).toContain('username');
      expect(result).not.toContain(': "user"');
      expect(result).not.toContain(': "secret"');
    });

    it('should use debugStr if available', () => {
      const obj = { debugStr: 'custom debug string' };
      expect(str(obj)).toBe('custom debug string');
    });

    it('should use debugStr function if available', () => {
      const obj = { debugStr: () => 'from function' };
      expect(str(obj)).toBe('from function');
    });

    it('should format Error objects with stack', () => {
      const err = new Error('test error');
      const result = str(err);
      expect(result).toContain('test error');
    });

    it('should format functions with name', () => {
      function myFunc() {}
      const result = str(myFunc);
      expect(result).toBe('<f: myFunc>');
    });
  });

  describe('Log object', () => {
    it('should have log method', () => {
      expect(typeof Log.log).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof Log.error).toBe('function');
    });

    it('should have func method', () => {
      expect(typeof Log.func).toBe('function');
    });

    it('should have method method', () => {
      expect(typeof Log.method).toBe('function');
    });
  });
});
