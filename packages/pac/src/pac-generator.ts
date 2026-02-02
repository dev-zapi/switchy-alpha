/**
 * PAC (Proxy Auto-Config) Script Generator
 *
 * This module generates PAC scripts from ZeroOmega profiles.
 * PAC scripts are JavaScript functions that determine which proxy to use for a given URL.
 */

import { Conditions } from './conditions';
import { Profiles, pacResult, schemes } from './profiles';
import { RuleList } from './rule-list';
import type {
  Profile,
  FixedProfile,
  PacProfile,
  SwitchProfile,
  RuleListProfile,
  Condition,
} from './types';

/**
 * Escape string for use in JavaScript
 */
function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Convert profile name to a valid JavaScript function name
 */
function profileFunctionName(name: string): string {
  // Replace non-alphanumeric characters with underscores
  return 'profile_' + name.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * PAC generator options
 */
export interface PacGeneratorOptions {
  /** Add comments to generated code for debugging */
  includeComments?: boolean;
  /** Line separator */
  eol?: string;
}

/**
 * PAC script generator class
 */
export class PacGenerator {
  private options: Record<string, Profile>;
  private generatedProfiles: Set<string> = new Set();
  private profileFunctions: string[] = [];
  private readonly eol: string;
  private readonly includeComments: boolean;

  constructor(options: Record<string, Profile>, generatorOptions: PacGeneratorOptions = {}) {
    this.options = options;
    this.eol = generatorOptions.eol ?? '\n';
    this.includeComments = generatorOptions.includeComments ?? false;
  }

  /**
   * Generate a complete PAC script for a profile
   */
  generate(profileName: string): string {
    this.generatedProfiles.clear();
    this.profileFunctions = [];

    // Get all referenced profiles (with fallback handler for missing profiles)
    const missingProfiles: Set<string> = new Set();
    const refs = Profiles.allReferenceSet(profileName, this.options, {
      profileNotFound: (name: string) => {
        missingProfiles.add(name);
        // Return a fake DirectProfile so it gets tracked
        return { name, profileType: 'DirectProfile' };
      },
    });

    // Generate function for each referenced profile
    for (const name of Object.values(refs)) {
      if (missingProfiles.has(name)) {
        // Generate a stub for missing profiles
        this.profileFunctions.push(this.generateNotFoundFunction(name));
        this.generatedProfiles.add(name);
      } else {
        this.generateProfileFunction(name);
      }
    }

    // Generate the main FindProxyForURL function
    const mainProfileFn = profileFunctionName(profileName);
    const mainFunction = this.generateMain(mainProfileFn);

    // Combine all functions
    return this.profileFunctions.join(this.eol + this.eol) + this.eol + this.eol + mainFunction;
  }

  /**
   * Generate the main FindProxyForURL function
   */
  private generateMain(mainProfileFn: string): string {
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push('// Main PAC function');
    }

    lines.push('function FindProxyForURL(url, host) {');
    lines.push('  "use strict";');
    lines.push('  var scheme = url.substr(0, url.indexOf(":"));');
    lines.push(`  return ${mainProfileFn}(url, host, scheme);`);
    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Generate a function for a profile
   */
  private generateProfileFunction(profileName: string): void {
    if (this.generatedProfiles.has(profileName)) {
      return;
    }
    this.generatedProfiles.add(profileName);

    const profile = Profiles.byName(profileName, this.options);
    if (!profile) {
      // Profile not found - generate a function that returns DIRECT
      this.profileFunctions.push(this.generateNotFoundFunction(profileName));
      return;
    }

    let fn: string;
    switch (profile.profileType) {
      case 'DirectProfile':
        fn = this.generateDirectProfile(profile);
        break;
      case 'SystemProfile':
        fn = this.generateSystemProfile(profile);
        break;
      case 'FixedProfile':
        fn = this.generateFixedProfile(profile as FixedProfile);
        break;
      case 'PacProfile':
        fn = this.generatePacProfile(profile as PacProfile);
        break;
      case 'SwitchProfile':
      case 'VirtualProfile':
        fn = this.generateSwitchProfile(profile as SwitchProfile);
        break;
      case 'RuleListProfile':
      case 'AutoProxyRuleListProfile':
        fn = this.generateRuleListProfile(profile as RuleListProfile);
        break;
      default:
        fn = this.generateNotFoundFunction(profileName);
    }

    this.profileFunctions.push(fn);
  }

  /**
   * Generate function for missing profile
   */
  private generateNotFoundFunction(profileName: string): string {
    const fnName = profileFunctionName(profileName);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// Profile "${profileName}" not found`);
    }
    lines.push(`function ${fnName}(url, host, scheme) {`);
    lines.push('  return "DIRECT";');
    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Generate function for DirectProfile
   */
  private generateDirectProfile(profile: Profile): string {
    const fnName = profileFunctionName(profile.name);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// DirectProfile: ${profile.name}`);
    }
    lines.push(`function ${fnName}(url, host, scheme) {`);
    lines.push('  return "DIRECT";');
    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Generate function for SystemProfile
   * Note: PAC scripts cannot use system proxy, so we return DIRECT
   */
  private generateSystemProfile(profile: Profile): string {
    const fnName = profileFunctionName(profile.name);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// SystemProfile: ${profile.name} (not supported in PAC, using DIRECT)`);
    }
    lines.push(`function ${fnName}(url, host, scheme) {`);
    lines.push('  return "DIRECT";');
    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Generate function for FixedProfile
   */
  private generateFixedProfile(profile: FixedProfile): string {
    const fnName = profileFunctionName(profile.name);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// FixedProfile: ${profile.name}`);
    }
    lines.push(`function ${fnName}(url, host, scheme) {`);

    // Check bypass list
    if (profile.bypassList && profile.bypassList.length > 0) {
      if (this.includeComments) {
        lines.push('  // Bypass list');
      }
      for (const condition of profile.bypassList) {
        const condCode = this.compileCondition(condition);
        lines.push(`  if (${condCode}) return "DIRECT";`);
      }
    }

    // Check scheme-specific proxies
    const hasSchemeSpecific =
      profile.proxyForHttp || profile.proxyForHttps || profile.proxyForFtp;

    if (hasSchemeSpecific) {
      for (const s of schemes) {
        if (s.scheme && profile[s.prop]) {
          const result = pacResult(profile[s.prop]);
          lines.push(`  if (scheme === "${s.scheme}") return "${escapeJsString(result)}";`);
        }
      }
    }

    // Fallback proxy
    const fallback = pacResult(profile.fallbackProxy);
    lines.push(`  return "${escapeJsString(fallback)}";`);

    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Generate function for PacProfile
   * Embeds the PAC script directly or references the URL
   */
  private generatePacProfile(profile: PacProfile): string {
    const fnName = profileFunctionName(profile.name);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// PacProfile: ${profile.name}`);
    }

    if (profile.pacScript) {
      // Embed the PAC script and call its FindProxyForURL
      const pacFnName = `_pac_${fnName}`;

      // Wrap the PAC script in an IIFE to avoid conflicts
      lines.push(`var ${pacFnName} = (function() {`);
      lines.push(profile.pacScript);
      lines.push('  return FindProxyForURL;');
      lines.push('})();');
      lines.push('');
      lines.push(`function ${fnName}(url, host, scheme) {`);
      lines.push(`  return ${pacFnName}(url, host);`);
      lines.push('}');
    } else if (profile.pacUrl) {
      // For URL-based PAC, we cannot fetch it at runtime in a PAC script
      // This would need to be handled by the extension fetching and embedding the script
      if (this.includeComments) {
        lines.push(`// Note: PAC URL "${profile.pacUrl}" should be fetched and embedded`);
      }
      lines.push(`function ${fnName}(url, host, scheme) {`);
      lines.push('  return "DIRECT";');
      lines.push('}');
    } else {
      lines.push(`function ${fnName}(url, host, scheme) {`);
      lines.push('  return "DIRECT";');
      lines.push('}');
    }

    return lines.join(this.eol);
  }

  /**
   * Generate function for SwitchProfile
   */
  private generateSwitchProfile(profile: SwitchProfile): string {
    const fnName = profileFunctionName(profile.name);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// SwitchProfile: ${profile.name}`);
    }
    lines.push(`function ${fnName}(url, host, scheme) {`);

    // Generate rule checks
    for (const rule of profile.rules || []) {
      const condCode = this.compileCondition(rule.condition);
      const targetFn = profileFunctionName(rule.profileName);
      lines.push(`  if (${condCode}) return ${targetFn}(url, host, scheme);`);
    }

    // Default profile
    const defaultFn = profileFunctionName(profile.defaultProfileName);
    lines.push(`  return ${defaultFn}(url, host, scheme);`);

    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Generate function for RuleListProfile
   */
  private generateRuleListProfile(profile: RuleListProfile): string {
    const fnName = profileFunctionName(profile.name);
    const lines: string[] = [];

    if (this.includeComments) {
      lines.push(`// RuleListProfile: ${profile.name} (format: ${profile.format})`);
    }
    lines.push(`function ${fnName}(url, host, scheme) {`);

    // Parse the rule list
    const format = RuleList[profile.format];
    if (format && profile.ruleList) {
      const rules = format.parse(profile.ruleList, profile.matchProfileName, profile.defaultProfileName);

      for (const rule of rules) {
        const condCode = this.compileCondition(rule.condition);
        const targetFn = profileFunctionName(rule.profileName);
        lines.push(`  if (${condCode}) return ${targetFn}(url, host, scheme);`);
      }
    }

    // Default profile
    const defaultFn = profileFunctionName(profile.defaultProfileName);
    lines.push(`  return ${defaultFn}(url, host, scheme);`);

    lines.push('}');

    return lines.join(this.eol);
  }

  /**
   * Compile a condition to JavaScript expression
   */
  private compileCondition(condition: Condition): string {
    try {
      return Conditions.compile(condition);
    } catch (e) {
      // If compilation fails, return false (never matches)
      if (this.includeComments) {
        return `false /* Error compiling condition: ${(e as Error).message} */`;
      }
      return 'false';
    }
  }
}

/**
 * Generate a PAC script from options for a given profile
 */
export function generatePacScript(
  options: Record<string, Profile>,
  profileName: string,
  generatorOptions?: PacGeneratorOptions
): string {
  const generator = new PacGenerator(options, generatorOptions);
  return generator.generate(profileName);
}

export default { PacGenerator, generatePacScript };
