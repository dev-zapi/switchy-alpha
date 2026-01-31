/**
 * Proxy types supported by PAC
 */
export type ProxyScheme = 'direct' | 'http' | 'https' | 'socks4' | 'socks5' | 'socks';

/**
 * Proxy server configuration
 */
export interface Proxy {
  scheme: ProxyScheme;
  host?: string;
  port?: number;
}

/**
 * Authentication credentials for a proxy
 */
export interface ProxyAuth {
  username: string;
  password: string;
}

/**
 * HTTP request information used for matching conditions
 */
export interface Request {
  url: string;
  host: string;
  scheme: string;
}

/**
 * All supported condition types
 */
export type ConditionType =
  | 'TrueCondition'
  | 'FalseCondition'
  | 'UrlRegexCondition'
  | 'UrlWildcardCondition'
  | 'HostRegexCondition'
  | 'HostWildcardCondition'
  | 'BypassCondition'
  | 'KeywordCondition'
  | 'IpCondition'
  | 'HostLevelsCondition'
  | 'WeekdayCondition'
  | 'TimeCondition';

/**
 * Base condition interface
 */
export interface BaseCondition {
  conditionType: ConditionType;
}

export interface PatternCondition extends BaseCondition {
  pattern: string;
}

export interface IpCondition extends BaseCondition {
  conditionType: 'IpCondition';
  ip: string;
  prefixLength: number;
}

export interface HostLevelsCondition extends BaseCondition {
  conditionType: 'HostLevelsCondition';
  minValue: number;
  maxValue: number;
}

export interface WeekdayCondition extends BaseCondition {
  conditionType: 'WeekdayCondition';
  days?: string;
  startDay?: number;
  endDay?: number;
}

export interface TimeCondition extends BaseCondition {
  conditionType: 'TimeCondition';
  startHour: number;
  endHour: number;
}

export type Condition =
  | PatternCondition
  | IpCondition
  | HostLevelsCondition
  | WeekdayCondition
  | TimeCondition;

/**
 * Profile types
 */
export type ProfileType =
  | 'DirectProfile'
  | 'SystemProfile'
  | 'FixedProfile'
  | 'PacProfile'
  | 'SwitchProfile'
  | 'VirtualProfile'
  | 'RuleListProfile'
  | 'AutoProxyRuleListProfile';

/**
 * Base profile interface
 */
export interface BaseProfile {
  name: string;
  profileType: ProfileType;
  color?: string;
  revision?: string;
}

export interface DirectProfile extends BaseProfile {
  profileType: 'DirectProfile';
}

export interface SystemProfile extends BaseProfile {
  profileType: 'SystemProfile';
}

export interface FixedProfile extends BaseProfile {
  profileType: 'FixedProfile';
  fallbackProxy?: Proxy;
  proxyForHttp?: Proxy;
  proxyForHttps?: Proxy;
  proxyForFtp?: Proxy;
  bypassList?: Condition[];
  auth?: {
    fallbackProxy?: ProxyAuth;
    proxyForHttp?: ProxyAuth;
    proxyForHttps?: ProxyAuth;
    proxyForFtp?: ProxyAuth;
  };
}

export interface PacProfile extends BaseProfile {
  profileType: 'PacProfile';
  pacUrl?: string;
  pacScript?: string;
}

export interface SwitchRule {
  condition: Condition;
  profileName: string;
}

export interface SwitchProfile extends BaseProfile {
  profileType: 'SwitchProfile';
  rules: SwitchRule[];
  defaultProfileName: string;
}

export interface VirtualProfile extends BaseProfile {
  profileType: 'VirtualProfile';
  defaultProfileName: string;
}

export type RuleListFormat = 'Switchy' | 'AutoProxy';

export interface RuleListProfile extends BaseProfile {
  profileType: 'RuleListProfile' | 'AutoProxyRuleListProfile';
  format: RuleListFormat;
  ruleList?: string;
  sourceUrl?: string;
  matchProfileName: string;
  defaultProfileName: string;
  lastUpdate?: string;
}

export type Profile =
  | DirectProfile
  | SystemProfile
  | FixedProfile
  | PacProfile
  | SwitchProfile
  | VirtualProfile
  | RuleListProfile;

/**
 * Options storage format - profiles are keyed by '+name'
 */
export type ProfileKey = `+${string}`;

export interface OmegaOptions {
  [key: ProfileKey]: Profile;
  '-startupProfileName'?: string;
  '-quickSwitchProfiles'?: string[];
  '-refreshOnProfileChange'?: boolean;
  '-enableQuickSwitch'?: boolean;
  '-revertProxyChanges'?: boolean;
  '-showInspectMenu'?: boolean;
  '-downloadInterval'?: number;
}

/**
 * Match result when a profile matches a request
 */
export interface MatchResult {
  profileName: string;
  source?: string | Condition;
  proxy?: Proxy;
  auth?: ProxyAuth;
}
