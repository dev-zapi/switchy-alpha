/**
 * @anthropic-demo/switchyalpha-pac
 *
 * PAC (Proxy Auto-Config) generation module for ZeroOmega.
 * Handles profile model and compiles profiles into PAC scripts.
 */

// Types
export * from './types';

// Utilities
export {
  Revision,
  AttachedCache,
  isIp,
  getBaseDomain,
  getSubdomain,
  wildcardForDomain,
  wildcardForUrl,
  requestFromUrl,
} from './utils';

// Shell expression utilities
export { shExp2RegExp, escapeSlash, safeRegex, regExpMetaChars } from './shexp-utils';

// Conditions
export { Conditions, parseIp, isIpInSubnet, urlWildcard2HostWildcard, LOCAL_HOSTS } from './conditions';

// Rule List
export { RuleList } from './rule-list';
export type { ParsedRule, RuleListFormat } from './rule-list';

// Profiles
export {
  Profiles,
  nameAsKey,
  builtinProfiles,
  pacProtocols,
  pacResult,
  isFileUrl,
  parseHostPort,
  byName,
  byKey,
  isIncludable,
  isInclusive,
} from './profiles';

// PAC Generator
export { PacGenerator, generatePacScript } from './pac-generator';
export type { PacGeneratorOptions } from './pac-generator';
