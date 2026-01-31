/**
 * Simple i18n module for ZeroOmega
 *
 * Loads translations from Chrome extension API or provides fallback.
 */

export type TranslationKey = string;
export type TranslationParams = Record<string, string | number> | (string | number)[];

// Fallback translations (English)
const fallbackMessages: Record<string, string> = {
  appNameShort: 'ZeroOmega',
  manifest_app_name: 'ZeroOmega',
  manifest_app_description: 'Manage and switch between multiple proxies quickly & easily.',

  // Profile types
  profile_direct: '[Direct]',
  profile_system: '[System Proxy]',
  profile_FixedProfile: 'Proxy Profile',
  profile_PacProfile: 'PAC Profile',
  profile_SwitchProfile: 'Switch Profile',
  profile_RuleListProfile: 'Rule List Profile',
  profile_VirtualProfile: 'Virtual Profile',

  // Conditions
  condition_HostWildcardCondition: 'Host wildcard',
  condition_HostRegexCondition: 'Host regex',
  condition_HostLevelsCondition: 'Host levels',
  condition_IpCondition: 'IP Literals',
  condition_UrlWildcardCondition: 'URL wildcard',
  condition_UrlRegexCondition: 'URL regex',
  condition_KeywordCondition: 'Keyword',
  condition_BypassCondition: 'Bypass',
  condition_WeekdayCondition: 'Weekday',
  condition_TimeCondition: 'Time',
  condition_TrueCondition: 'Always',
  condition_FalseCondition: 'Never',

  // Options page
  options_title: 'ZeroOmega Options',
  options_group_proxyServers: 'Proxy servers',
  options_group_bypassList: 'Bypass List',
  options_group_switchRules: 'Switch rules',
  options_group_ruleListConfig: 'Rule List Config',
  options_group_ruleListText: 'Rule List Text',
  options_group_ruleListUrl: 'Rule List URL',
  options_group_attachProfile: 'Attach Rule List',
  options_group_conditionHelp: 'Condition Help',

  options_proxy_scheme: 'Scheme',
  options_proxy_protocol: 'Protocol',
  options_proxy_server: 'Server',
  options_proxy_port: 'Port',
  options_proxy_auth: 'Auth',
  options_proxy_expand: 'Show advanced',
  options_scheme_default: '(default)',

  options_bypassListHelp: 'Servers in the bypass list will be contacted directly.',
  options_bypassListHelpLinkText: 'View syntax reference',

  options_conditionType: 'Condition Type',
  options_conditionDetails: 'Condition Details',
  options_resultProfile: 'Profile',
  options_conditionActions: 'Actions',
  options_ruleNote: 'Note',
  options_addCondition: 'Add condition',
  options_deleteRule: 'Delete rule',
  options_cloneRule: 'Clone rule',
  options_resetRules: 'Reset',
  options_switchDefaultProfile: 'Default',
  options_hostLevelsBetween: 'to',
  options_hourBetween: 'to',
  options_sort: 'Sort',

  options_ruleListFormat: 'Rule List Format',
  options_ruleListUrlHelp: 'Leave empty to use inline rule list.',
  options_downloadProfileNow: 'Update now',
  options_ruleListLastUpdate: 'Last update: $1',
  options_ruleListObsolete: 'Rule list not downloaded yet!',
  options_attachProfile: 'Add a rule list',
  options_attachProfileHelp: 'Rule lists make it easy to maintain many rules.',

  options_profileEditSource: 'Source',
  options_showConditionTypeHelp: 'Show help',
  options_deleteAttached: 'Remove rule list',
  options_resetRules_help: 'Reset rules to match the rule list',

  // Rule list formats
  ruleListFormat_AutoProxy: 'AutoProxy',
  ruleListFormat_Switchy: 'Switchy',

  // Actions
  options_apply: 'Apply changes',
  options_revert: 'Revert changes',
  options_newProfile: 'New profile...',
  options_renameProfile: 'Rename',
  options_deleteProfile: 'Delete',
  options_exportProfile: 'Export PAC',

  // Navigation
  nav_general: 'General',
  nav_importExport: 'Import/Export',
  nav_about: 'About',

  // General settings
  options_startupProfile: 'Startup Profile',
  options_startupProfileHelp: 'Profile applied when browser starts.',
  options_quickSwitch: 'Quick Switch',
  options_quickSwitchHelp: 'Profiles available in the popup for quick switching.',
  options_enableQuickSwitch: 'Enable Quick Switch',
  options_refreshOnProfileChange: 'Refresh current tab on profile change',
  options_downloadInterval: 'Download interval (minutes)',
  options_showInspectMenu: 'Show inspect menu item',
  options_revertProxyChanges: 'Revert proxy changes by other apps',

  // Import/Export
  options_importOptions: 'Import Options',
  options_exportOptions: 'Export Options',
  options_importHelp: 'Import settings from a backup file.',
  options_exportHelp: 'Export current settings to a backup file.',
  options_restoreLocal: 'Restore from file',
  options_makeBackup: 'Download backup',

  // About
  about_title: 'About ZeroOmega',
  about_version: 'Version',
  about_description: 'A modern proxy switcher for your browser.',

  // Popup
  popup_addRule: 'Add rule',
  popup_tempRule: 'Temp rule',
  popup_openOptions: 'Options',
  popup_reportIssue: 'Report Issue',
  popup_currentProfile: 'Current Profile',

  // Dialogs
  dialog_close: 'Close',
  dialog_ok: 'OK',
  dialog_cancel: 'Cancel',
  dialog_save: 'Save',
  dialog_delete: 'Delete',

  // Errors
  error_profileNotFound: 'Profile not found: $1',
  error_invalidFormat: 'Invalid format',
};

/**
 * Get Chrome extension i18n API if available
 */
function getChromeI18n(): typeof chrome.i18n | undefined {
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    return chrome.i18n;
  }
  return undefined;
}

/**
 * Translate a message key to localized string
 */
export function t(key: TranslationKey, params?: TranslationParams): string {
  const chromeI18n = getChromeI18n();

  // Try Chrome extension API first
  if (chromeI18n) {
    const substitutions = params
      ? Array.isArray(params)
        ? params.map(String)
        : Object.values(params).map(String)
      : undefined;

    const result = chromeI18n.getMessage(key, substitutions);
    if (result) return result;
  }

  // Fall back to built-in messages
  let message = fallbackMessages[key] || key;

  // Replace placeholders
  if (params) {
    if (Array.isArray(params)) {
      params.forEach((val, i) => {
        message = message.replace(`$${i + 1}`, String(val));
      });
    } else {
      Object.entries(params).forEach(([k, v]) => {
        message = message.replace(`{${k}}`, String(v));
        message = message.replace(`$${k}`, String(v));
      });
    }
  }

  return message;
}

/**
 * Get current locale
 */
export function getLocale(): string {
  const chromeI18n = getChromeI18n();
  if (chromeI18n) {
    return chromeI18n.getUILanguage();
  }
  return navigator.language || 'en';
}

export default { t, getLocale };
