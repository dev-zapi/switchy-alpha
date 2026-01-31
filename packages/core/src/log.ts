/**
 * Logging module for omega-target
 *
 * Provides logging utilities with privacy protection for sensitive fields.
 */

/** Fields that should be hidden in logs for privacy */
const SENSITIVE_FIELDS = new Set([
  'username',
  'password',
  'host',
  'port',
  'token',
  'gistToken',
  'gistId',
]);

/**
 * JSON replacer that hides sensitive values
 */
function sensitiveReplacer(key: string, value: unknown): unknown {
  if (SENSITIVE_FIELDS.has(key)) {
    return '<secret>';
  }
  return value;
}

/**
 * Pretty-print an object for logging
 */
export function str(obj: unknown): string {
  if (typeof obj === 'object' && obj !== null) {
    // Check for debugStr property
    const o = obj as { debugStr?: string | (() => string) };
    if (o.debugStr !== undefined) {
      return typeof o.debugStr === 'function' ? o.debugStr() : o.debugStr;
    }

    // Handle Error objects
    if (obj instanceof Error) {
      return obj.stack ?? obj.message;
    }

    // Default to JSON
    return JSON.stringify(obj, sensitiveReplacer, 4);
  }

  if (typeof obj === 'function') {
    const fn = obj as { name?: string };
    return fn.name ? `<f: ${fn.name}>` : obj.toString();
  }

  return String(obj);
}

/**
 * Log module API
 */
export const Log = {
  str,

  /**
   * Print to console log
   */
  log: console.log.bind(console),

  /**
   * Print to console error
   */
  error: console.error.bind(console),

  /**
   * Log a function call with arguments
   */
  func(name: string, args: unknown[]): void {
    this.log(name, '(', Array.from(args), ')');
  },

  /**
   * Log a method call with target and arguments
   */
  method(name: string, self: unknown, args: unknown[]): void {
    this.log(str(self), '<<', name, Array.from(args));
  },
};

export default Log;
