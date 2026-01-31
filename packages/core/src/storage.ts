/**
 * Storage abstraction for omega-target
 *
 * Provides a Promise-based storage interface that can be implemented
 * for different backends (localStorage, chrome.storage, etc.)
 */

import { Log } from './log';

/**
 * Write operations to be performed on storage
 */
export interface WriteOperations {
  /** Items to set (key -> value) */
  set: Record<string, unknown>;
  /** Keys to remove */
  remove: string[];
}

/**
 * Options for calculating write operations from changes
 */
export interface OperationsForChangesOptions {
  /** Base values to compare against */
  base?: Record<string, unknown>;
  /** Merge function for combining values */
  merge?: (key: string, newVal: unknown, oldVal: unknown) => unknown;
}

/**
 * Watch callback for storage changes
 */
export type WatchCallback = (changes: Record<string, unknown>) => void;

/**
 * Abstract storage class
 *
 * Subclasses should override get, set, remove, and watch methods
 * to implement actual storage backends.
 */
export class Storage {
  protected _items: Record<string, unknown> = {};
  debugStr = 'Storage';

  /**
   * Calculate write operations from a set of changes
   */
  static operationsForChanges(
    changes: Record<string, unknown>,
    options: OperationsForChangesOptions = {}
  ): WriteOperations {
    const { base, merge } = options;
    const set: Record<string, unknown> = {};
    const remove: string[] = [];

    for (const [key, rawNewVal] of Object.entries(changes)) {
      const oldVal = base?.[key] ?? rawNewVal;
      const newVal = merge ? merge(key, rawNewVal, oldVal) : rawNewVal;

      // Skip if no change
      if (base && newVal === oldVal) continue;

      if (newVal === undefined) {
        if (oldVal !== undefined || !base) {
          remove.push(key);
        }
      } else {
        set[key] = newVal;
      }
    }

    return { set, remove };
  }

  /**
   * Get values from storage
   *
   * @param keys - Keys to retrieve, or null for all, or object with defaults
   */
  async get(
    keys?: string | string[] | Record<string, unknown> | null
  ): Promise<Record<string, unknown>> {
    Log.method('Storage#get', this, [keys]);

    if (!this._items) {
      return {};
    }

    if (keys === null || keys === undefined) {
      return { ...this._items };
    }

    const map: Record<string, unknown> = {};

    if (typeof keys === 'string') {
      map[keys] = this._items[keys];
    } else if (Array.isArray(keys)) {
      for (const key of keys) {
        map[key] = this._items[key];
      }
    } else if (typeof keys === 'object') {
      for (const [key, defaultValue] of Object.entries(keys)) {
        map[key] = this._items[key] ?? defaultValue;
      }
    }

    return map;
  }

  /**
   * Set values in storage
   *
   * @param items - Key-value pairs to set
   */
  async set(items: Record<string, unknown>): Promise<Record<string, unknown>> {
    Log.method('Storage#set', this, [items]);

    this._items ??= {};
    for (const [key, value] of Object.entries(items)) {
      this._items[key] = value;
    }

    return items;
  }

  /**
   * Remove values from storage
   *
   * @param keys - Keys to remove, or null to clear all
   */
  async remove(keys?: string | string[] | null): Promise<void> {
    Log.method('Storage#remove', this, [keys]);

    if (!this._items) return;

    if (keys === null || keys === undefined) {
      this._items = {};
    } else if (Array.isArray(keys)) {
      for (const key of keys) {
        delete this._items[key];
      }
    } else {
      delete this._items[keys];
    }
  }

  /**
   * Watch for changes to storage
   *
   * @param keys - Keys to watch, or null for all
   * @param callback - Called when changes occur
   * @returns Function to stop watching
   */
  watch(_keys: string | string[] | null, _callback: WatchCallback): () => void {
    Log.method('Storage#watch', this, [_keys]);
    return () => {};
  }

  /**
   * Apply write operations to storage
   *
   * @param operations - Operations to apply, or changes object
   */
  async apply(
    operations: WriteOperations | { changes: Record<string, unknown> } & OperationsForChangesOptions
  ): Promise<WriteOperations> {
    let ops: WriteOperations;

    if ('changes' in operations) {
      ops = Storage.operationsForChanges(operations.changes, operations);
    } else {
      ops = operations;
    }

    await this.set(ops.set);
    await this.remove(ops.remove);

    return ops;
  }
}

export default Storage;
