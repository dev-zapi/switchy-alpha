/**
 * Rule List module - parses various rule list formats
 *
 * Supports:
 * - AutoProxy format
 * - Switchy/SwitchyOmega format
 */

import { Conditions, urlWildcard2HostWildcard } from './conditions';
import type { Condition, SwitchRule } from './types';

function strStartsWith(str: string, prefix: string): boolean {
  return str.substring(0, prefix.length) === prefix;
}

export interface ParsedRule extends SwitchRule {
  source?: string;
  note?: string;
}

export interface RuleListFormat {
  /** Detect if text is in this format */
  detect?: (text: string) => boolean | undefined;
  /** Preprocess text before parsing */
  preprocess?: (text: string) => string;
  /** Parse text into rules */
  parse: (text: string, matchProfileName: string, defaultProfileName: string) => ParsedRule[];
  /** Get direct reference set from profile */
  directReferenceSet?: (profile: {
    ruleList?: string;
    matchProfileName: string;
    defaultProfileName: string;
  }) => Record<string, string> | undefined;
  /** Compose rules into text format */
  compose?: (
    profile: { rules: ParsedRule[]; defaultProfileName: string },
    options?: { withResult?: boolean; useExclusive?: boolean }
  ) => string;
}

/**
 * AutoProxy format parser
 */
const AutoProxy: RuleListFormat = {
  // Base64 encoded "[AutoProxy"
  detect: (text: string) => {
    const magicPrefix = 'W0F1dG9Qcm94';
    if (strStartsWith(text, magicPrefix)) return true;
    if (strStartsWith(text, '[AutoProxy')) return true;
    return undefined;
  },

  preprocess: (text: string) => {
    const magicPrefix = 'W0F1dG9Qcm94';
    if (strStartsWith(text, magicPrefix)) {
      // Decode base64
      try {
        return atob(text);
      } catch {
        return text;
      }
    }
    return text;
  },

  parse: (text: string, matchProfileName: string, defaultProfileName: string): ParsedRule[] => {
    const normalRules: ParsedRule[] = [];
    const exclusiveRules: ParsedRule[] = [];

    for (const rawLine of text.split(/\n|\r/)) {
      const line = rawLine.trim();
      if (line.length === 0 || line[0] === '!' || line[0] === '[') continue;

      const source = line;
      let profile = matchProfileName;
      let list = normalRules;
      let pattern = line;

      // Exclusive rule (whitelist)
      if (line[0] === '@' && line[1] === '@') {
        profile = defaultProfileName;
        list = exclusiveRules;
        pattern = line.substring(2);
      }

      let cond: Condition;

      if (pattern[0] === '/') {
        // Regex pattern
        cond = {
          conditionType: 'UrlRegexCondition',
          pattern: pattern.substring(1, pattern.length - 1),
        };
      } else if (pattern[0] === '|') {
        if (pattern[1] === '|') {
          // Domain anchor
          cond = {
            conditionType: 'HostWildcardCondition',
            pattern: '*.' + pattern.substring(2),
          };
        } else {
          // URL start anchor
          cond = {
            conditionType: 'UrlWildcardCondition',
            pattern: pattern.substring(1) + '*',
          };
        }
      } else if (pattern.indexOf('*') < 0) {
        // Plain keyword
        cond = {
          conditionType: 'KeywordCondition',
          pattern: pattern,
        };
      } else {
        // URL wildcard
        cond = {
          conditionType: 'UrlWildcardCondition',
          pattern: 'http://*' + pattern + '*',
        };
      }

      list.push({ condition: cond, profileName: profile, source });
    }

    // Exclusive rules have higher priority
    return [...exclusiveRules, ...normalRules];
  },
};

/**
 * Switchy/SwitchyOmega format parser
 */
const Switchy: RuleListFormat = {
  detect: (text: string) => {
    const omegaPrefix = '[SwitchyOmega Conditions';
    if (strStartsWith(text, omegaPrefix)) return true;
    return undefined;
  },

  parse: (text: string, matchProfileName: string, defaultProfileName: string): ParsedRule[] => {
    const parser = getParser(text);
    if (parser === 'parseLegacy') {
      return parseLegacy(text, matchProfileName, defaultProfileName);
    }
    return parseOmega(text, matchProfileName, defaultProfileName);
  },

  directReferenceSet: ({ ruleList, defaultProfileName }) => {
    if (!ruleList) return undefined;
    const text = ruleList.trim();
    const parser = getParser(text);
    if (parser !== 'parseOmega') return undefined;
    if (!/(^|\n)@with\s+results?(\r|\n|$)/i.test(text)) return undefined;

    const refs: Record<string, string> = {};
    const specialLineStart = '[;#@!';

    for (const rawLine of text.split(/\n|\r/)) {
      const line = rawLine.trim();
      if (specialLineStart.indexOf(line[0] ?? '') >= 0) continue;

      const iSpace = line.lastIndexOf(' +');
      const profile = iSpace < 0 ? defaultProfileName || 'direct' : line.substring(iSpace + 2).trim();
      refs['+' + profile] = profile;
    }

    return refs;
  },

  compose: ({ rules, defaultProfileName }, options = {}) => {
    const { withResult = false, useExclusive = options.useExclusive ?? !withResult } = options;
    const eol = '\r\n';
    let ruleList = '[SwitchyOmega Conditions]' + eol;

    if (withResult) {
      ruleList += '@with result' + eol + eol;
    } else {
      ruleList += eol;
    }

    const specialLineStart = '[;#@!+';

    for (const rule of rules) {
      if (rule.note) {
        ruleList += '@note ' + rule.note + eol;
      }

      let line = Conditions.str(rule.condition);

      if (useExclusive && rule.profileName === defaultProfileName) {
        line = '!' + line;
      } else {
        if (specialLineStart.indexOf(line[0] ?? '') >= 0) {
          line = ': ' + line;
        }
        if (withResult) {
          line += ' +' + rule.profileName;
        }
      }

      ruleList += line + eol;
    }

    if (withResult) {
      ruleList += eol + '* +' + defaultProfileName + eol;
    }

    return ruleList;
  },
};

function getParser(text: string): 'parseOmega' | 'parseLegacy' {
  const omegaPrefix = '[SwitchyOmega Conditions';
  if (!strStartsWith(text, omegaPrefix)) {
    if (text[0] === '#' || text.indexOf('\n#') >= 0) {
      return 'parseLegacy';
    }
  }
  return 'parseOmega';
}

function conditionFromLegacyWildcard(pattern: string): Condition {
  let p = pattern;

  if (p[0] === '@') {
    p = p.substring(1);
  } else {
    if (p.indexOf('://') <= 0 && p[0] !== '*') {
      p = '*' + p;
    }
    if (p[p.length - 1] !== '*') {
      p += '*';
    }
  }

  const host = urlWildcard2HostWildcard(p);
  if (host) {
    return { conditionType: 'HostWildcardCondition', pattern: host };
  }
  return { conditionType: 'UrlWildcardCondition', pattern: p };
}

function parseLegacy(
  text: string,
  matchProfileName: string,
  defaultProfileName: string
): ParsedRule[] {
  const normalRules: ParsedRule[] = [];
  const exclusiveRules: ParsedRule[] = [];
  let begin = false;
  let section = 'WILDCARD';

  for (const rawLine of text.split(/\n|\r/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line[0] === ';') continue;

    if (!begin) {
      if (line.toUpperCase() === '#BEGIN') {
        begin = true;
      }
      continue;
    }

    if (line.toUpperCase() === '#END') break;

    if (line[0] === '[' && line[line.length - 1] === ']') {
      section = line.substring(1, line.length - 1).toUpperCase();
      continue;
    }

    const source = line;
    let profile = matchProfileName;
    let list = normalRules;
    let pattern = line;

    if (line[0] === '!') {
      profile = defaultProfileName;
      list = exclusiveRules;
      pattern = line.substring(1);
    }

    let cond: Condition | null = null;
    switch (section) {
      case 'WILDCARD':
        cond = conditionFromLegacyWildcard(pattern);
        break;
      case 'REGEXP':
        cond = { conditionType: 'UrlRegexCondition', pattern };
        break;
    }

    if (cond) {
      list.push({ condition: cond, profileName: profile, source });
    }
  }

  return [...exclusiveRules, ...normalRules];
}

function parseOmega(
  text: string,
  matchProfileName: string,
  defaultProfileName: string,
  options: { strict?: boolean; source?: boolean } = {}
): ParsedRule[] {
  const { strict = false, source: includeSource = true } = options;

  const rules: ParsedRule[] = [];
  const rulesWithDefaultProfile: ParsedRule[] = [];
  let withResult = false;
  let exclusiveProfile: string | null = null;
  let noteForNextRule: string | null = null;

  for (const rawLine of text.split(/\n|\r/)) {
    let line = rawLine.trim();
    if (line.length === 0) continue;

    switch (line[0]) {
      case '[': // Header
      case ';': // Comment
        continue;
      case '@': {
        // Directive
        const iSpace = line.indexOf(' ');
        const directive = line.substring(1, iSpace < 0 ? line.length : iSpace);
        const directiveValue = iSpace < 0 ? '' : line.substring(iSpace + 1).trim();

        switch (directive.toUpperCase()) {
          case 'WITH': {
            const feature = directiveValue.toUpperCase();
            if (feature === 'RESULT' || feature === 'RESULTS') {
              withResult = true;
            }
            break;
          }
          case 'NOTE':
            noteForNextRule = directiveValue;
            break;
        }
        continue;
      }
    }

    let source: string | undefined;
    let profile: string | null = null;

    if (strict) exclusiveProfile = null;

    if (line[0] === '!') {
      profile = withResult ? null : defaultProfileName;
      source = line;
      line = line.substring(1);
    } else if (withResult) {
      const iSpace = line.lastIndexOf(' +');
      if (iSpace < 0) {
        if (strict) {
          throw new Error('Missing result profile name: ' + line);
        }
        continue;
      }
      profile = line.substring(iSpace + 2).trim();
      line = line.substring(0, iSpace).trim();
      if (line === '*') {
        exclusiveProfile = profile;
      }
    } else {
      profile = matchProfileName;
    }

    const cond = Conditions.fromStr(line);
    if (!cond) {
      if (strict) {
        throw new Error('Invalid rule: ' + line);
      }
      continue;
    }

    const rule: ParsedRule = {
      condition: cond,
      profileName: profile ?? '',
      source: includeSource ? source ?? line : undefined,
    };

    if (noteForNextRule) {
      rule.note = noteForNextRule;
      noteForNextRule = null;
    }

    rules.push(rule);

    if (!profile) {
      rulesWithDefaultProfile.push(rule);
    }
  }

  if (withResult) {
    if (!exclusiveProfile) {
      if (strict) {
        throw new Error("Missing default rule with catch-all '*' condition");
      }
      exclusiveProfile = defaultProfileName || 'direct';
    }
    for (const rule of rulesWithDefaultProfile) {
      rule.profileName = exclusiveProfile;
    }
  }

  return rules;
}

/**
 * Rule list formats registry
 */
export const RuleList: Record<string, RuleListFormat> = {
  AutoProxy,
  Switchy,
};

export default RuleList;
