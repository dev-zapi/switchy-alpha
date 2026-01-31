/**
 * Revision utilities for tracking profile changes
 */
export const Revision = {
  /**
   * Generate a revision string from a timestamp
   */
  fromTime(time?: Date | number | string): string {
    const date = time ? new Date(time) : new Date();
    return date.getTime().toString(16);
  },

  /**
   * Compare two revision strings
   * @returns positive if a > b, negative if a < b, 0 if equal
   */
  compare(a: string | null | undefined, b: string | null | undefined): number {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    if (a.length > b.length) return 1;
    if (a.length < b.length) return -1;
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  },
};

/**
 * A cache that attaches to objects and uses a tag function to invalidate
 */
export class AttachedCache<T, V> {
  private prop: string;
  private tagFn: (obj: T) => string;

  constructor(tagFn: (obj: T) => string, prop = '_cache') {
    this.tagFn = tagFn;
    this.prop = prop;
  }

  /**
   * Get the tag for an object
   */
  tag(obj: T): string {
    return this.tagFn(obj);
  }

  /**
   * Get cached value or compute it using the otherwise function
   */
  get(obj: T, otherwise: (() => V) | V): V {
    const tag = this.tag(obj);
    const cache = this.getCache(obj);
    if (cache && cache.tag === tag) {
      return cache.value;
    }
    const value = typeof otherwise === 'function' ? (otherwise as () => V)() : otherwise;
    this.setCache(obj, { tag, value });
    return value;
  }

  /**
   * Drop the cache for an object
   */
  drop(obj: T): void {
    const o = obj as Record<string, unknown>;
    if (o[this.prop] !== undefined) {
      o[this.prop] = undefined;
    }
  }

  private getCache(obj: T): { tag: string; value: V } | undefined {
    return (obj as Record<string, unknown>)[this.prop] as { tag: string; value: V } | undefined;
  }

  private setCache(obj: T, value: { tag: string; value: V }): void {
    const o = obj as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(obj, this.prop)) {
      Object.defineProperty(obj, this.prop, { writable: true, enumerable: false });
    }
    o[this.prop] = value;
  }
}

/**
 * Check if a domain is an IP address
 */
export function isIp(domain: string): boolean {
  if (domain.indexOf(':') > 0) return true; // IPv6
  const lastCharCode = domain.charCodeAt(domain.length - 1);
  if (lastCharCode >= 48 && lastCharCode <= 57) return true; // Ends with digit
  return false;
}

/**
 * Get the base domain (TLD + 1) from a domain
 * For now, uses a simplified approach without tldjs dependency
 */
export function getBaseDomain(domain: string): string {
  if (isIp(domain)) return domain;

  // Simple implementation: return last two parts for most domains
  // A proper implementation would use the public suffix list
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;

  // Handle common multi-part TLDs
  const lastTwo = parts.slice(-2).join('.');
  const commonMultiPartTlds = ['co.uk', 'com.au', 'co.jp', 'co.nz', 'com.br'];
  if (commonMultiPartTlds.includes(lastTwo) && parts.length > 2) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

/**
 * Get subdomain from a domain
 */
export function getSubdomain(domain: string): string {
  if (isIp(domain)) return '';

  const baseDomain = getBaseDomain(domain);
  if (domain === baseDomain) return '';

  return domain.slice(0, domain.length - baseDomain.length - 1);
}

/**
 * Generate a wildcard pattern for a domain
 */
export function wildcardForDomain(domain: string): string {
  if (isIp(domain)) return domain;
  return '*.' + getBaseDomain(domain);
}

/**
 * Generate a wildcard pattern for a URL
 */
export function wildcardForUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    if (isIp(domain)) return domain;
    return '*.' + domain;
  } catch {
    return url;
  }
}

/**
 * Parse a URL into a request object
 */
export function requestFromUrl(url: string | URL): { url: string; host: string; scheme: string } {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return {
    url: parsed.href,
    host: parsed.hostname,
    scheme: parsed.protocol.replace(':', ''),
  };
}
