/**
 * Conditions module - handles URL/host matching conditions
 *
 * This module provides functionality to:
 * - Parse condition strings
 * - Match conditions against requests
 * - Analyze conditions for caching
 */

import { shExp2RegExp, escapeSlash, safeRegex } from './shexp-utils';
import { AttachedCache, requestFromUrl } from './utils';
import type { Condition, ConditionType, Request } from './types';

/** Character code for colon */
const COLON_CHAR_CODE = ':'.charCodeAt(0);

/** Local hosts that bypass proxy */
export const LOCAL_HOSTS = ['127.0.0.1', '[::1]', 'localhost'];

/**
 * Condition analysis cache
 */
interface ConditionCache {
  analyzed: unknown;
  compiled?: unknown;
}

/**
 * Condition handler interface
 */
interface ConditionHandler {
  /** Abbreviations for this condition type */
  abbrs: string[];
  /** Analyze the condition and return cached data */
  analyze: (condition: Condition) => unknown;
  /** Match the condition against a request */
  match: (condition: Condition, request: Request, cache: ConditionCache) => boolean;
  /** Convert condition to string */
  str?: (condition: Condition) => string;
  /** Parse condition from string */
  fromStr?: (str: string, condition: Partial<Condition>) => Condition;
}

/**
 * Parse IP address (simplified version)
 */
export function parseIp(ip: string): { v4: boolean; address: string } | null {
  // Remove brackets for IPv6
  if (ip.charCodeAt(0) === '['.charCodeAt(0)) {
    ip = ip.substring(1, ip.length - 1);
  }

  // Check for IPv6
  if (ip.indexOf(':') >= 0) {
    // Basic IPv6 validation
    if (/^[0-9a-fA-F:]+$/.test(ip)) {
      return { v4: false, address: ip };
    }
    return null;
  }

  // Check for IPv4
  const parts = ip.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p) && parseInt(p) <= 255)) {
    return { v4: true, address: ip };
  }

  return null;
}

/**
 * Check if an IP is in a subnet (simplified)
 */
export function isIpInSubnet(ip: string, subnet: string, prefixLength: number): boolean {
  const ipAddr = parseIp(ip);
  const subnetAddr = parseIp(subnet);

  if (!ipAddr || !subnetAddr) return false;
  if (ipAddr.v4 !== subnetAddr.v4) return false;

  if (ipAddr.v4) {
    // IPv4 subnet check
    const ipNum = ipToNumber(ipAddr.address);
    const subnetNum = ipToNumber(subnetAddr.address);
    const mask = (0xffffffff << (32 - prefixLength)) >>> 0;
    return (ipNum & mask) === (subnetNum & mask);
  }

  // IPv6 - simplified, just check prefix match
  // A proper implementation would use a library
  return false;
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map((p) => parseInt(p));
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

/**
 * Convert URL wildcard pattern to host wildcard pattern
 */
export function urlWildcard2HostWildcard(pattern: string): string | null {
  const match = pattern.match(/^\*:\/\/((?:\w|[?*._-])+)\/\*$/);
  return match ? match[1]! : null;
}

/**
 * Condition handlers for each condition type
 */
const conditionTypes: Record<string, ConditionHandler> = {
  TrueCondition: {
    abbrs: ['True'],
    analyze: () => null,
    match: () => true,
    str: () => '',
    fromStr: (_str, condition) => condition as Condition,
  },

  FalseCondition: {
    abbrs: ['False', 'Disabled'],
    analyze: () => null,
    match: () => false,
    fromStr: (str, condition) => {
      if (str.length > 0) {
        (condition as { pattern: string }).pattern = str;
      }
      return condition as Condition;
    },
  },

  UrlRegexCondition: {
    abbrs: ['UR', 'URegex', 'UrlR', 'UrlRegex'],
    analyze: (condition) => safeRegex(escapeSlash((condition as { pattern: string }).pattern)),
    match: (_condition, request, cache) => (cache.analyzed as RegExp).test(request.url),
  },

  UrlWildcardCondition: {
    abbrs: ['U', 'UW', 'Url', 'UrlW', 'UWild', 'UWildcard', 'UrlWild', 'UrlWildcard'],
    analyze: (condition) => {
      const parts = (condition as { pattern: string }).pattern
        .split('|')
        .filter(Boolean)
        .map((p) => shExp2RegExp(p, { trimAsterisk: true }));
      return safeRegex(parts.join('|'));
    },
    match: (_condition, request, cache) => (cache.analyzed as RegExp).test(request.url),
  },

  HostRegexCondition: {
    abbrs: ['R', 'HR', 'Regex', 'HostR', 'HRegex', 'HostRegex'],
    analyze: (condition) => safeRegex(escapeSlash((condition as { pattern: string }).pattern)),
    match: (_condition, request, cache) => (cache.analyzed as RegExp).test(request.host),
  },

  HostWildcardCondition: {
    abbrs: ['', 'H', 'W', 'HW', 'Wild', 'Wildcard', 'Host', 'HostW', 'HWild', 'HWildcard', 'HostWild', 'HostWildcard'],
    analyze: (condition) => {
      const parts = (condition as { pattern: string }).pattern
        .split('|')
        .filter(Boolean)
        .map((pattern) => {
          let p = pattern;
          // Handle leading dot
          if (p.charCodeAt(0) === '.'.charCodeAt(0)) {
            p = '*' + p;
          }

          if (p.indexOf('**.') === 0) {
            return shExp2RegExp(p.substring(1), { trimAsterisk: true });
          } else if (p.indexOf('*.') === 0) {
            return shExp2RegExp(p.substring(2), { trimAsterisk: false })
              .replace(/./, '(?:^|\\.)')
              .replace(/\.\*\$$/, '');
          } else {
            return shExp2RegExp(p, { trimAsterisk: true });
          }
        });
      return safeRegex(parts.join('|'));
    },
    match: (_condition, request, cache) => (cache.analyzed as RegExp).test(request.host),
  },

  BypassCondition: {
    abbrs: ['B', 'Bypass'],
    analyze: (condition) => {
      const cache: {
        host: string | RegExp | null;
        ip: { ip: string; prefixLength: number } | null;
        scheme: string | null;
        url: RegExp | null;
        port: string | null;
        normalizedPattern: string;
      } = {
        host: null,
        ip: null,
        scheme: null,
        url: null,
        port: null,
        normalizedPattern: '',
      };

      let server = (condition as { pattern: string }).pattern;

      if (server === '<local>') {
        cache.host = server;
        return cache;
      }

      // Check for scheme
      const schemeParts = server.split('://');
      if (schemeParts.length > 1) {
        cache.scheme = schemeParts[0]!;
        cache.normalizedPattern = cache.scheme + '://';
        server = schemeParts[1]!;
      }

      // Check for IP/CIDR
      const cidrParts = server.split('/');
      if (cidrParts.length > 1) {
        const ip = parseIp(cidrParts[0]!);
        const prefixLen = parseInt(cidrParts[1]!);
        if (ip && !isNaN(prefixLen)) {
          cache.ip = { ip: ip.address, prefixLength: prefixLen };
          cache.normalizedPattern += cache.ip.ip + '/' + cache.ip.prefixLength;
          return cache;
        }
      }

      // Check for port
      let matchPort: string | undefined;
      const serverIp = parseIp(server);
      if (!serverIp) {
        const pos = server.lastIndexOf(':');
        if (pos >= 0) {
          matchPort = server.substring(pos + 1);
          server = server.substring(0, pos);
        }
      }

      if (serverIp) {
        server = serverIp.address;
        cache.normalizedPattern += serverIp.v4 ? server : '[' + server + ']';
      } else {
        if (server.charCodeAt(0) === '.'.charCodeAt(0)) {
          server = '*' + server;
        }
        cache.normalizedPattern = server;
      }

      if (matchPort) {
        cache.port = matchPort;
        cache.normalizedPattern += ':' + cache.port;
        const serverRegex = shExp2RegExp(server);
        const innerRegex = serverRegex.substring(1, serverRegex.length - 1);
        const scheme = cache.scheme ?? '[^:]+';
        cache.url = safeRegex('^' + scheme + ':\\/\\/' + innerRegex + ':' + matchPort + '\\/');
      } else if (server !== '*') {
        const serverRegex = shExp2RegExp(server, { trimAsterisk: true });
        cache.host = safeRegex(serverRegex);
      }

      return cache;
    },
    match: (condition, request, cache) => {
      const c = cache.analyzed as {
        host: string | RegExp | null;
        ip: { ip: string; prefixLength: number } | null;
        scheme: string | null;
        url: RegExp | null;
      };

      if (c.scheme && c.scheme !== request.scheme) return false;

      if (c.ip && !isIpInSubnet(request.host, c.ip.ip, c.ip.prefixLength)) {
        return false;
      }

      if (c.host) {
        if (c.host === '<local>') {
          return (
            request.host === '127.0.0.1' ||
            request.host === '::1' ||
            request.host.indexOf('.') < 0
          );
        } else if (!(c.host as RegExp).test(request.host)) {
          return false;
        }
      }

      if (c.url && !c.url.test(request.url)) return false;

      return true;
    },
    str: (condition) => {
      const cache = conditionTypes['BypassCondition']!.analyze(condition) as { normalizedPattern: string };
      return cache.normalizedPattern || (condition as { pattern: string }).pattern;
    },
  },

  KeywordCondition: {
    abbrs: ['K', 'KW', 'Keyword'],
    analyze: () => null,
    match: (condition, request) => {
      return request.scheme === 'http' && request.url.indexOf((condition as { pattern: string }).pattern) >= 0;
    },
  },

  IpCondition: {
    abbrs: ['Ip'],
    analyze: (condition) => {
      const c = condition as { ip: string; prefixLength: number };
      let ip = c.ip;
      if (ip.charCodeAt(0) === '['.charCodeAt(0)) {
        ip = ip.substring(1, ip.length - 1);
      }
      const addr = parseIp(ip);
      if (!addr) {
        throw new Error(`Invalid IP address ${ip}/${c.prefixLength}`);
      }
      return { addr, normalized: addr.address };
    },
    match: (condition, request, cache) => {
      const c = condition as { ip: string; prefixLength: number };
      const hostAddr = parseIp(request.host);
      if (!hostAddr) return false;

      const { addr } = cache.analyzed as { addr: { v4: boolean; address: string } };
      if (hostAddr.v4 !== addr.v4) return false;

      return isIpInSubnet(request.host, c.ip, c.prefixLength);
    },
    str: (condition) => {
      const c = condition as { ip: string; prefixLength: number };
      return c.ip + '/' + c.prefixLength;
    },
    fromStr: (str, condition) => {
      const addr = parseIp(str.split('/')[0]!);
      const prefixLength = parseInt(str.split('/')[1] ?? '32');
      if (addr) {
        (condition as { ip: string; prefixLength: number }).ip = addr.address;
        (condition as { ip: string; prefixLength: number }).prefixLength = prefixLength;
      } else {
        (condition as { ip: string; prefixLength: number }).ip = '0.0.0.0';
        (condition as { ip: string; prefixLength: number }).prefixLength = 0;
      }
      return condition as Condition;
    },
  },

  HostLevelsCondition: {
    abbrs: ['Lv', 'Level', 'Levels', 'HL', 'HLv', 'HLevel', 'HLevels', 'HostL', 'HostLv', 'HostLevel', 'HostLevels'],
    analyze: () => '.'.charCodeAt(0),
    match: (condition, request, cache) => {
      const c = condition as { minValue: number; maxValue: number };
      const dotCharCode = cache.analyzed as number;
      let dotCount = 0;
      for (let i = 0; i < request.host.length; i++) {
        if (request.host.charCodeAt(i) === dotCharCode) {
          dotCount++;
          if (dotCount > c.maxValue) return false;
        }
      }
      return dotCount >= c.minValue;
    },
    str: (condition) => {
      const c = condition as { minValue: number; maxValue: number };
      return c.minValue + '~' + c.maxValue;
    },
    fromStr: (str, condition) => {
      const [minValue, maxValue] = str.split('~').map((s) => parseInt(s, 10));
      (condition as { minValue: number; maxValue: number }).minValue = minValue! > 0 ? minValue! : 1;
      (condition as { minValue: number; maxValue: number }).maxValue = maxValue! > 0 ? maxValue! : 1;
      return condition as Condition;
    },
  },

  WeekdayCondition: {
    abbrs: ['WD', 'Week', 'Day', 'Weekday'],
    analyze: () => null,
    match: (condition) => {
      const c = condition as { days?: string; startDay?: number; endDay?: number };
      const day = new Date().getDay();
      if (c.days) {
        return c.days.charCodeAt(day) > 64;
      }
      return (c.startDay ?? 0) <= day && day <= (c.endDay ?? 6);
    },
    str: (condition) => {
      const c = condition as { days?: string; startDay?: number; endDay?: number };
      return c.days ?? c.startDay + '~' + c.endDay;
    },
    fromStr: (str, condition) => {
      if (str.indexOf('~') < 0 && str.length === 7) {
        (condition as { days: string }).days = str;
      } else {
        const [startDay, endDay] = str.split('~').map((s) => parseInt(s, 10));
        (condition as { startDay: number; endDay: number }).startDay =
          startDay !== undefined && startDay >= 0 && startDay <= 6 ? startDay : 0;
        (condition as { endDay: number }).endDay =
          endDay !== undefined && endDay >= 0 && endDay <= 6 ? endDay : 0;
      }
      return condition as Condition;
    },
  },

  TimeCondition: {
    abbrs: ['T', 'Time', 'Hour'],
    analyze: () => null,
    match: (condition) => {
      const c = condition as { startHour: number; endHour: number };
      const hour = new Date().getHours();
      return c.startHour <= hour && hour <= c.endHour;
    },
    str: (condition) => {
      const c = condition as { startHour: number; endHour: number };
      return c.startHour + '~' + c.endHour;
    },
    fromStr: (str, condition) => {
      const [startHour, endHour] = str.split('~').map((s) => parseInt(s, 10));
      (condition as { startHour: number; endHour: number }).startHour =
        startHour !== undefined && startHour >= 0 && startHour < 24 ? startHour : 0;
      (condition as { endHour: number }).endHour =
        endHour !== undefined && endHour >= 0 && endHour < 24 ? endHour : 0;
      return condition as Condition;
    },
  },
};

/** Abbreviation to condition type mapping */
let abbrMap: Record<string, ConditionType> | null = null;

function getAbbrMap(): Record<string, ConditionType> {
  if (!abbrMap) {
    abbrMap = {};
    for (const [type, handler] of Object.entries(conditionTypes)) {
      abbrMap[type.toUpperCase()] = type as ConditionType;
      for (const abbr of handler.abbrs) {
        abbrMap[abbr.toUpperCase()] = type as ConditionType;
      }
    }
  }
  return abbrMap;
}

/**
 * Get handler for a condition type
 */
function getHandler(conditionType: ConditionType | string): ConditionHandler {
  const handler = conditionTypes[conditionType];
  if (!handler) {
    throw new Error(`Unknown condition type: ${conditionType}`);
  }
  return handler;
}

/**
 * Condition cache using revision-based invalidation
 */
const condCache = new AttachedCache<Condition, ConditionCache>((condition) => {
  const handler = getHandler(condition.conditionType);
  const tag = handler.str ? handler.str(condition) : (condition as { pattern?: string }).pattern ?? '';
  return condition.conditionType + '$' + tag;
});

/**
 * Conditions module API
 */
export const Conditions = {
  /**
   * Create a request object from a URL
   */
  requestFromUrl,

  /**
   * Convert URL wildcard to host wildcard if possible
   */
  urlWildcard2HostWildcard,

  /**
   * Get the cache tag for a condition
   */
  tag: (condition: Condition): string => condCache.tag(condition),

  /**
   * Analyze a condition and cache the result
   */
  analyze: (condition: Condition): ConditionCache => {
    return condCache.get(condition, () => ({
      analyzed: getHandler(condition.conditionType).analyze(condition),
    }));
  },

  /**
   * Match a condition against a request
   */
  match: (condition: Condition, request: Request): boolean => {
    const cache = Conditions.analyze(condition);
    return getHandler(condition.conditionType).match(condition, request, cache);
  },

  /**
   * Convert a condition to its string representation
   */
  str: (condition: Condition, options: { abbr?: number } = {}): string => {
    const { abbr = -1 } = options;
    const handler = getHandler(condition.conditionType);

    // For HostWildcardCondition with empty first abbr, try to return just the pattern
    if (handler.abbrs[0]?.length === 0) {
      const pattern = (condition as { pattern?: string }).pattern;
      if (pattern) {
        const endCode = pattern.charCodeAt(pattern.length - 1);
        if (endCode !== COLON_CHAR_CODE && pattern.indexOf(' ') < 0) {
          return pattern;
        }
      }
    }

    const typeStr =
      typeof abbr === 'number'
        ? handler.abbrs[(handler.abbrs.length + abbr) % handler.abbrs.length]
        : condition.conditionType;

    let result = typeStr + ':';
    const part = handler.str ? handler.str(condition) : (condition as { pattern?: string }).pattern;
    if (part) {
      result += ' ' + part;
    }
    return result;
  },

  /**
   * Get condition type from abbreviation
   */
  typeFromAbbr: (abbr: string): ConditionType | null => {
    return getAbbrMap()[abbr.toUpperCase()] ?? null;
  },

  /**
   * Parse a condition from its string representation
   */
  fromStr: (str: string): Condition | null => {
    str = str.trim();
    let i = str.indexOf(' ');
    if (i < 0) i = str.length;

    let conditionType: ConditionType | null = null;
    if (str.charCodeAt(i - 1) === COLON_CHAR_CODE) {
      conditionType = Conditions.typeFromAbbr(str.substring(0, i - 1));
      str = str.substring(i + 1).trim();
    } else {
      conditionType = Conditions.typeFromAbbr('');
    }

    if (!conditionType) return null;

    const condition: Partial<Condition> = { conditionType };
    const handler = getHandler(conditionType);

    if (handler.fromStr) {
      return handler.fromStr(str, condition);
    } else {
      (condition as { pattern: string }).pattern = str;
      return condition as Condition;
    }
  },

  /**
   * Local hosts list
   */
  localHosts: LOCAL_HOSTS,

  /**
   * Get weekday list from condition
   */
  getWeekdayList: (condition: { days?: string; startDay?: number; endDay?: number }): boolean[] => {
    if (condition.days) {
      return Array.from({ length: 7 }, (_, i) => condition.days!.charCodeAt(i) > 64);
    }
    return Array.from(
      { length: 7 },
      (_, i) => (condition.startDay ?? 0) <= i && i <= (condition.endDay ?? 6)
    );
  },
};

export default Conditions;
