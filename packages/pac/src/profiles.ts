/**
 * Profiles module - handles proxy profile management
 *
 * This module provides functionality to:
 * - Create and manage proxy profiles
 * - Match profiles against requests
 * - Compile profiles to PAC script fragments
 */

import { Conditions } from './conditions';
import { RuleList } from './rule-list';
import { AttachedCache, Revision } from './utils';
import type {
  Profile,
  ProfileType,
  Proxy,
  Request,
  FixedProfile,
  PacProfile,
  SwitchProfile,
  RuleListProfile,
  MatchResult,
  RuleListFormat,
} from './types';

/**
 * Profile key format: '+profileName'
 */
export function nameAsKey(profileName: string | { name: string }): string {
  const name = typeof profileName === 'string' ? profileName : profileName.name;
  return '+' + name;
}

/**
 * Builtin profiles
 */
export const builtinProfiles: Record<string, Profile> = {
  '+direct': {
    name: 'direct',
    profileType: 'DirectProfile',
    color: '#aaaaaa',
  },
  '+system': {
    name: 'system',
    profileType: 'SystemProfile',
    color: '#000000',
  },
};

/**
 * Proxy schemes for PAC output
 */
export const pacProtocols: Record<string, string> = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
};

/**
 * Scheme to property mapping for FixedProfile
 */
export const schemes = [
  { scheme: 'http', prop: 'proxyForHttp' as const },
  { scheme: 'https', prop: 'proxyForHttps' as const },
  { scheme: 'ftp', prop: 'proxyForFtp' as const },
  { scheme: '', prop: 'fallbackProxy' as const },
];

/**
 * Format by profile type
 */
export const formatByType: Record<string, string> = {
  SwitchyRuleListProfile: 'Switchy',
  AutoProxyRuleListProfile: 'AutoProxy',
};

/**
 * Supported rule list formats
 */
export const ruleListFormats = ['Switchy', 'AutoProxy'];

/**
 * Generate PAC result string for a proxy
 */
export function pacResult(proxy?: Proxy): string {
  if (!proxy || proxy.scheme === 'direct') {
    return 'DIRECT';
  }

  const protocol = pacProtocols[proxy.scheme];
  if (!protocol) {
    return 'DIRECT';
  }

  // Special handling for SOCKS5 compatibility
  if (proxy.scheme === 'socks5') {
    return `SOCKS5 ${proxy.host}:${proxy.port}; SOCKS ${proxy.host}:${proxy.port}`;
  }

  return `${protocol} ${proxy.host}:${proxy.port}`;
}

/**
 * Check if a URL is a file:// URL
 */
export function isFileUrl(url?: string): boolean {
  return url?.substring(0, 5).toUpperCase() === 'FILE:';
}

/**
 * Parse host:port string
 */
export function parseHostPort(
  str: string,
  scheme: string
): { scheme: string; host: string; port: number } | undefined {
  const sep = str.lastIndexOf(':');
  if (sep < 0) return undefined;

  const port = parseInt(str.substring(sep + 1)) || 80;
  const host = str.substring(0, sep);
  if (!host) return undefined;

  return { scheme, host, port };
}

/**
 * Get a profile by name
 */
export function byName(
  profileName: string | Profile,
  options: Record<string, Profile> = {}
): Profile | undefined {
  if (typeof profileName !== 'string') {
    return profileName;
  }

  const key = nameAsKey(profileName);
  return builtinProfiles[key] ?? options[key];
}

/**
 * Get a profile by key
 */
export function byKey(
  key: string | Profile,
  options: Record<string, Profile> = {}
): Profile | undefined {
  if (typeof key !== 'string') {
    return key;
  }

  return builtinProfiles[key] ?? options[key];
}

/**
 * Iterate over all profiles in options
 */
export function each(
  options: Record<string, Profile>,
  callback: (key: string, profile: Profile) => void
): void {
  const plusCharCode = '+'.charCodeAt(0);

  for (const [key, profile] of Object.entries(options)) {
    if (key.charCodeAt(0) === plusCharCode) {
      callback(key, profile);
    }
  }

  for (const [key, profile] of Object.entries(builtinProfiles)) {
    if (key.charCodeAt(0) === plusCharCode) {
      callback(key, profile);
    }
  }
}

/**
 * Profile cache
 */
const profileCache = new AttachedCache<Profile, { analyzed?: unknown; directReferenceSet?: Record<string, string> }>(
  (profile) => profile.revision ?? ''
);

/**
 * Check if a profile can be included in PAC
 */
export function isIncludable(profile: Profile): boolean {
  switch (profile.profileType) {
    case 'DirectProfile':
    case 'FixedProfile':
    case 'SwitchProfile':
    case 'RuleListProfile':
    case 'AutoProxyRuleListProfile':
      return true;
    case 'PacProfile':
      return !isFileUrl((profile as PacProfile).pacUrl);
    case 'VirtualProfile':
      return true;
    default:
      return false;
  }
}

/**
 * Check if a profile references other profiles
 */
export function isInclusive(profile: Profile): boolean {
  switch (profile.profileType) {
    case 'SwitchProfile':
    case 'VirtualProfile':
    case 'RuleListProfile':
    case 'AutoProxyRuleListProfile':
      return true;
    default:
      return false;
  }
}

/**
 * Create a new profile with default values
 */
export function create(name: string | Partial<Profile>, profileType?: ProfileType): Profile {
  const profile: Partial<Profile> =
    typeof name === 'string' ? { name, profileType } : { ...name, profileType: profileType ?? name.profileType };

  switch (profile.profileType) {
    case 'FixedProfile': {
      const fixed = profile as FixedProfile;
      fixed.bypassList ??= [
        { conditionType: 'BypassCondition', pattern: '127.0.0.1' },
        { conditionType: 'BypassCondition', pattern: '[::1]' },
        { conditionType: 'BypassCondition', pattern: 'localhost' },
      ];
      break;
    }
    case 'PacProfile': {
      const pac = profile as PacProfile;
      pac.pacScript ??= `function FindProxyForURL(url, host) {
  return "DIRECT";
}`;
      break;
    }
    case 'SwitchProfile':
    case 'VirtualProfile': {
      const sw = profile as SwitchProfile;
      sw.defaultProfileName ??= 'direct';
      sw.rules ??= [];
      break;
    }
    case 'RuleListProfile':
    case 'AutoProxyRuleListProfile': {
      const rl = profile as RuleListProfile;
      rl.format ??= (formatByType[profile.profileType ?? ''] ?? 'Switchy') as RuleListFormat;
      rl.defaultProfileName ??= 'direct';
      rl.matchProfileName ??= 'direct';
      rl.ruleList ??= '';
      break;
    }
  }

  return profile as Profile;
}

/**
 * Update profile revision
 */
export function updateRevision(profile: Profile, revision?: string): void {
  profile.revision = revision ?? Revision.fromTime();
}

/**
 * Drop cached data for a profile
 */
export function dropCache(profile: Profile): void {
  profileCache.drop(profile);
}

/**
 * Get directly referenced profile names
 */
export function directReferenceSet(profile: Profile): Record<string, string> {
  if (!isInclusive(profile)) return {};

  const cache = profileCache.get(profile, {});
  if (cache.directReferenceSet) return cache.directReferenceSet;

  const refs: Record<string, string> = {};

  switch (profile.profileType) {
    case 'SwitchProfile':
    case 'VirtualProfile': {
      const sw = profile as SwitchProfile;
      refs[nameAsKey(sw.defaultProfileName)] = sw.defaultProfileName;
      for (const rule of sw.rules ?? []) {
        refs[nameAsKey(rule.profileName)] = rule.profileName;
      }
      break;
    }
    case 'RuleListProfile':
    case 'AutoProxyRuleListProfile': {
      const rl = profile as RuleListProfile;
      if (rl.ruleList) {
        const format = RuleList[rl.format];
        if (format?.directReferenceSet) {
          const formatRefs = format.directReferenceSet(rl);
          if (formatRefs) {
            cache.directReferenceSet = formatRefs;
            return formatRefs;
          }
        }
      }
      refs[nameAsKey(rl.matchProfileName)] = rl.matchProfileName;
      refs[nameAsKey(rl.defaultProfileName)] = rl.defaultProfileName;
      break;
    }
  }

  cache.directReferenceSet = refs;
  return refs;
}

/**
 * Get all referenced profiles recursively
 */
export function allReferenceSet(
  profile: string | Profile,
  options: Record<string, Profile>,
  args: { out?: Record<string, string>; profileNotFound?: (name: string) => Profile | null } = {}
): Record<string, string> {
  const result = args.out ?? {};
  const resolved = typeof profile === 'string' ? byName(profile, options) : profile;

  if (!resolved) {
    if (args.profileNotFound) {
      const fallback = args.profileNotFound(typeof profile === 'string' ? profile : profile.name);
      if (fallback) {
        result[nameAsKey(fallback.name)] = fallback.name;
      }
    }
    return result;
  }

  result[nameAsKey(resolved.name)] = resolved.name;

  for (const name of Object.values(directReferenceSet(resolved))) {
    allReferenceSet(name, options, { ...args, out: result });
  }

  return result;
}

/**
 * Match a profile against a request
 */
export function match(profile: Profile, request: Request): MatchResult | null {
  switch (profile.profileType) {
    case 'SystemProfile':
      return null;

    case 'DirectProfile':
      return { profileName: 'direct', proxy: { scheme: 'direct' } };

    case 'FixedProfile': {
      const fixed = profile as FixedProfile;

      // Check bypass list
      if (fixed.bypassList) {
        for (const cond of fixed.bypassList) {
          if (Conditions.match(cond, request)) {
            return {
              profileName: pacResult(),
              source: cond,
              proxy: { scheme: 'direct' },
            };
          }
        }
      }

      // Find matching proxy for scheme
      for (const s of schemes) {
        if (s.scheme === request.scheme && fixed[s.prop]) {
          return {
            profileName: pacResult(fixed[s.prop]),
            source: s.scheme,
            proxy: fixed[s.prop],
            auth: fixed.auth?.[s.prop] ?? fixed.auth?.['all' as keyof typeof fixed.auth],
          };
        }
      }

      // Use fallback
      return {
        profileName: pacResult(fixed.fallbackProxy),
        source: '',
        proxy: fixed.fallbackProxy,
        auth: fixed.auth?.fallbackProxy ?? fixed.auth?.['all' as keyof typeof fixed.auth],
      };
    }

    case 'SwitchProfile':
    case 'VirtualProfile': {
      const sw = profile as SwitchProfile;
      for (const rule of sw.rules ?? []) {
        if (Conditions.match(rule.condition, request)) {
          return { profileName: rule.profileName, source: rule.condition };
        }
      }
      return { profileName: sw.defaultProfileName };
    }

    case 'RuleListProfile':
    case 'AutoProxyRuleListProfile': {
      const rl = profile as RuleListProfile;
      const format = RuleList[rl.format];
      if (!format) return null;

      const rules = format.parse(rl.ruleList ?? '', rl.matchProfileName, rl.defaultProfileName);
      for (const rule of rules) {
        if (Conditions.match(rule.condition, request)) {
          return { profileName: rule.profileName, source: rule.source };
        }
      }
      return { profileName: rl.defaultProfileName };
    }

    case 'PacProfile':
      // PAC profiles need runtime evaluation
      return null;

    default:
      return null;
  }
}

/**
 * Replace references to a profile with another
 */
export function replaceRef(profile: Profile, fromName: string, toName: string): boolean {
  if (!isInclusive(profile)) return false;

  let changed = false;

  switch (profile.profileType) {
    case 'SwitchProfile':
    case 'VirtualProfile': {
      const sw = profile as SwitchProfile;
      if (sw.defaultProfileName === fromName) {
        sw.defaultProfileName = toName;
        changed = true;
      }
      for (const rule of sw.rules ?? []) {
        if (rule.profileName === fromName) {
          rule.profileName = toName;
          changed = true;
        }
      }
      break;
    }
    case 'RuleListProfile':
    case 'AutoProxyRuleListProfile': {
      const rl = profile as RuleListProfile;
      if (rl.defaultProfileName === fromName) {
        rl.defaultProfileName = toName;
        changed = true;
      }
      if (rl.matchProfileName === fromName) {
        rl.matchProfileName = toName;
        changed = true;
      }
      break;
    }
  }

  return changed;
}

/**
 * Profiles module API
 */
export const Profiles = {
  nameAsKey,
  builtinProfiles,
  pacProtocols,
  schemes,
  formatByType,
  ruleListFormats,
  pacResult,
  isFileUrl,
  parseHostPort,
  byName,
  byKey,
  each,
  isIncludable,
  isInclusive,
  create,
  updateRevision,
  dropCache,
  directReferenceSet,
  allReferenceSet,
  match,
  replaceRef,
};

export default Profiles;
