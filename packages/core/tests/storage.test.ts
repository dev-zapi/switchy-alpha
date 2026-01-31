import { describe, it, expect } from 'vitest';
import { Storage } from '../src/storage';

describe('Storage', () => {
  describe('operationsForChanges', () => {
    it('should calculate set operations', () => {
      const changes = { a: 1, b: 2 };
      const ops = Storage.operationsForChanges(changes);

      expect(ops.set).toEqual({ a: 1, b: 2 });
      expect(ops.remove).toEqual([]);
    });

    it('should calculate remove operations for undefined values', () => {
      const changes = { a: undefined, b: 2 };
      const ops = Storage.operationsForChanges(changes);

      expect(ops.set).toEqual({ b: 2 });
      expect(ops.remove).toEqual(['a']);
    });

    it('should skip unchanged values when base is provided', () => {
      const base = { a: 1, b: 2 };
      const changes = { a: 1, b: 3 };
      const ops = Storage.operationsForChanges(changes, { base });

      expect(ops.set).toEqual({ b: 3 });
      expect(ops.remove).toEqual([]);
    });

    it('should use merge function if provided', () => {
      const changes = { count: 5 };
      const base = { count: 10 };
      const merge = (_key: string, newVal: unknown, oldVal: unknown) =>
        (newVal as number) + (oldVal as number);

      const ops = Storage.operationsForChanges(changes, { base, merge });

      expect(ops.set).toEqual({ count: 15 });
    });
  });

  describe('get/set/remove', () => {
    it('should get and set values', async () => {
      const storage = new Storage();

      await storage.set({ key1: 'value1', key2: 'value2' });

      const result = await storage.get(['key1', 'key2']);
      expect(result['key1']).toBe('value1');
      expect(result['key2']).toBe('value2');
    });

    it('should get single key as string', async () => {
      const storage = new Storage();
      await storage.set({ myKey: 'myValue' });

      const result = await storage.get('myKey');
      expect(result['myKey']).toBe('myValue');
    });

    it('should use defaults from object keys', async () => {
      const storage = new Storage();
      await storage.set({ existing: 'value' });

      const result = await storage.get({ existing: 'default', missing: 'default2' });
      expect(result['existing']).toBe('value');
      expect(result['missing']).toBe('default2');
    });

    it('should remove values', async () => {
      const storage = new Storage();
      await storage.set({ a: 1, b: 2, c: 3 });

      await storage.remove('a');
      let result = await storage.get(null);
      expect(result['a']).toBeUndefined();
      expect(result['b']).toBe(2);

      await storage.remove(['b', 'c']);
      result = await storage.get(null);
      expect(Object.keys(result)).toEqual([]);
    });

    it('should clear all on remove(null)', async () => {
      const storage = new Storage();
      await storage.set({ a: 1, b: 2 });

      await storage.remove(null);
      const result = await storage.get(null);
      expect(Object.keys(result)).toEqual([]);
    });
  });

  describe('apply', () => {
    it('should apply write operations', async () => {
      const storage = new Storage();
      await storage.set({ a: 1, b: 2, c: 3 });

      await storage.apply({
        set: { d: 4 },
        remove: ['a', 'b'],
      });

      const result = await storage.get(null);
      expect(result['a']).toBeUndefined();
      expect(result['b']).toBeUndefined();
      expect(result['c']).toBe(3);
      expect(result['d']).toBe(4);
    });

    it('should calculate operations from changes', async () => {
      const storage = new Storage();
      await storage.set({ a: 1 });

      await storage.apply({
        changes: { a: undefined, b: 2 },
      });

      const result = await storage.get(null);
      expect(result['a']).toBeUndefined();
      expect(result['b']).toBe(2);
    });
  });
});
