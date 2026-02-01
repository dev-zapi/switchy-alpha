/**
 * i18n Store for SwitchyAlpha
 *
 * Svelte 5 reactive store for managing language with support for
 * English, Simplified Chinese, and Traditional Chinese.
 */

export type Language = 'en' | 'zh-CN' | 'zh-TW';
export type TranslationKey = string;
export type TranslationParams = Record<string, string | number> | (string | number)[];

// Storage key
const STORAGE_KEY = '-language';

// Supported languages
export const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文' },
  { code: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文' },
];

// English translations
const en: Record<string, string> = {
  appNameShort: 'SwitchyAlpha',
  manifest_app_name: 'SwitchyAlpha',
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
  options_title: 'SwitchyAlpha Options',
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
  options_profileName: 'Profile Name',
  options_profileType: 'Profile Type',
  options_renameProfile: 'Rename',
  options_deleteProfile: 'Delete',
  options_exportProfile: 'Export PAC',

  // Navigation
  nav_general: 'General',
  nav_importExport: 'Import/Export',
  nav_about: 'About',

  // Theme
  theme_light: 'Light',
  theme_dark: 'Dark',
  theme_system: 'System',

  // Language
  language_label: 'Language',

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
  about_title: 'About SwitchyAlpha',
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

// Simplified Chinese translations
const zhCN: Record<string, string> = {
  appNameShort: 'SwitchyAlpha',
  manifest_app_name: 'SwitchyAlpha',
  manifest_app_description: '快速便捷地管理和切换多个代理。',

  // Profile types
  profile_direct: '[直接连接]',
  profile_system: '[系统代理]',
  profile_FixedProfile: '代理服务器',
  profile_PacProfile: 'PAC 脚本',
  profile_SwitchProfile: '自动切换',
  profile_RuleListProfile: '规则列表',
  profile_VirtualProfile: '虚拟情景模式',

  // Conditions
  condition_HostWildcardCondition: '域名通配符',
  condition_HostRegexCondition: '域名正则',
  condition_HostLevelsCondition: '域名级数',
  condition_IpCondition: 'IP 地址',
  condition_UrlWildcardCondition: '网址通配符',
  condition_UrlRegexCondition: '网址正则',
  condition_KeywordCondition: '关键字',
  condition_BypassCondition: '例外规则',
  condition_WeekdayCondition: '星期',
  condition_TimeCondition: '时间',
  condition_TrueCondition: '始终',
  condition_FalseCondition: '从不',

  // Options page
  options_title: 'SwitchyAlpha 选项',
  options_group_proxyServers: '代理服务器',
  options_group_bypassList: '不代理的地址列表',
  options_group_switchRules: '切换规则',
  options_group_ruleListConfig: '规则列表设置',
  options_group_ruleListText: '规则列表文本',
  options_group_ruleListUrl: '规则列表网址',
  options_group_attachProfile: '附加规则列表',
  options_group_conditionHelp: '条件类型说明',

  options_proxy_scheme: '协议',
  options_proxy_protocol: '代理协议',
  options_proxy_server: '服务器',
  options_proxy_port: '端口',
  options_proxy_auth: '认证',
  options_proxy_expand: '显示高级选项',
  options_scheme_default: '（默认）',

  options_bypassListHelp: '在列表中的服务器将直接连接，不使用代理。',
  options_bypassListHelpLinkText: '查看语法参考',

  options_conditionType: '条件类型',
  options_conditionDetails: '条件设置',
  options_resultProfile: '情景模式',
  options_conditionActions: '操作',
  options_ruleNote: '备注',
  options_addCondition: '添加条件',
  options_deleteRule: '删除规则',
  options_cloneRule: '克隆规则',
  options_resetRules: '重置',
  options_switchDefaultProfile: '默认情景模式',
  options_hostLevelsBetween: '至',
  options_hourBetween: '至',
  options_sort: '排序',

  options_ruleListFormat: '规则列表格式',
  options_ruleListUrlHelp: '留空以使用内联规则列表。',
  options_downloadProfileNow: '立即更新',
  options_ruleListLastUpdate: '上次更新：$1',
  options_ruleListObsolete: '规则列表尚未下载！',
  options_attachProfile: '添加规则列表',
  options_attachProfileHelp: '规则列表可以方便地维护大量规则。',

  options_profileEditSource: '来源',
  options_showConditionTypeHelp: '显示帮助',
  options_deleteAttached: '移除规则列表',
  options_resetRules_help: '重置规则以匹配规则列表',

  // Rule list formats
  ruleListFormat_AutoProxy: 'AutoProxy',
  ruleListFormat_Switchy: 'Switchy',

  // Actions
  options_apply: '应用更改',
  options_revert: '撤销更改',
  options_newProfile: '新建情景模式...',
  options_profileName: '情景模式名称',
  options_profileType: '情景模式类型',
  options_renameProfile: '重命名',
  options_deleteProfile: '删除',
  options_exportProfile: '导出 PAC',

  // Navigation
  nav_general: '通用',
  nav_importExport: '导入/导出',
  nav_about: '关于',

  // Theme
  theme_light: '浅色',
  theme_dark: '深色',
  theme_system: '跟随系统',

  // Language
  language_label: '语言',

  // General settings
  options_startupProfile: '启动时情景模式',
  options_startupProfileHelp: '浏览器启动时应用的情景模式。',
  options_quickSwitch: '快速切换',
  options_quickSwitchHelp: '在弹出窗口中显示的快速切换情景模式。',
  options_enableQuickSwitch: '启用快速切换',
  options_refreshOnProfileChange: '切换情景模式时刷新当前标签页',
  options_downloadInterval: '下载间隔（分钟）',
  options_showInspectMenu: '显示检查菜单项',
  options_revertProxyChanges: '撤销其他应用的代理更改',

  // Import/Export
  options_importOptions: '导入设置',
  options_exportOptions: '导出设置',
  options_importHelp: '从备份文件导入设置。',
  options_exportHelp: '将当前设置导出到备份文件。',
  options_restoreLocal: '从文件恢复',
  options_makeBackup: '下载备份',

  // About
  about_title: '关于 SwitchyAlpha',
  about_version: '版本',
  about_description: '现代化的浏览器代理切换器。',

  // Popup
  popup_addRule: '添加规则',
  popup_tempRule: '临时规则',
  popup_openOptions: '选项',
  popup_reportIssue: '报告问题',
  popup_currentProfile: '当前情景模式',

  // Dialogs
  dialog_close: '关闭',
  dialog_ok: '确定',
  dialog_cancel: '取消',
  dialog_save: '保存',
  dialog_delete: '删除',

  // Errors
  error_profileNotFound: '未找到情景模式：$1',
  error_invalidFormat: '格式无效',
};

// Traditional Chinese translations
const zhTW: Record<string, string> = {
  appNameShort: 'SwitchyAlpha',
  manifest_app_name: 'SwitchyAlpha',
  manifest_app_description: '快速便捷地管理和切換多個代理。',

  // Profile types
  profile_direct: '[直接連線]',
  profile_system: '[系統代理]',
  profile_FixedProfile: '代理伺服器',
  profile_PacProfile: 'PAC 腳本',
  profile_SwitchProfile: '自動切換',
  profile_RuleListProfile: '規則列表',
  profile_VirtualProfile: '虛擬情境模式',

  // Conditions
  condition_HostWildcardCondition: '網域萬用字元',
  condition_HostRegexCondition: '網域正則',
  condition_HostLevelsCondition: '網域層級',
  condition_IpCondition: 'IP 位址',
  condition_UrlWildcardCondition: '網址萬用字元',
  condition_UrlRegexCondition: '網址正則',
  condition_KeywordCondition: '關鍵字',
  condition_BypassCondition: '例外規則',
  condition_WeekdayCondition: '星期',
  condition_TimeCondition: '時間',
  condition_TrueCondition: '始終',
  condition_FalseCondition: '從不',

  // Options page
  options_title: 'SwitchyAlpha 選項',
  options_group_proxyServers: '代理伺服器',
  options_group_bypassList: '不代理的地址列表',
  options_group_switchRules: '切換規則',
  options_group_ruleListConfig: '規則列表設定',
  options_group_ruleListText: '規則列表文字',
  options_group_ruleListUrl: '規則列表網址',
  options_group_attachProfile: '附加規則列表',
  options_group_conditionHelp: '條件類型說明',

  options_proxy_scheme: '協定',
  options_proxy_protocol: '代理協定',
  options_proxy_server: '伺服器',
  options_proxy_port: '連接埠',
  options_proxy_auth: '認證',
  options_proxy_expand: '顯示進階選項',
  options_scheme_default: '（預設）',

  options_bypassListHelp: '在列表中的伺服器將直接連線，不使用代理。',
  options_bypassListHelpLinkText: '檢視語法參考',

  options_conditionType: '條件類型',
  options_conditionDetails: '條件設定',
  options_resultProfile: '情境模式',
  options_conditionActions: '操作',
  options_ruleNote: '備註',
  options_addCondition: '新增條件',
  options_deleteRule: '刪除規則',
  options_cloneRule: '複製規則',
  options_resetRules: '重設',
  options_switchDefaultProfile: '預設情境模式',
  options_hostLevelsBetween: '至',
  options_hourBetween: '至',
  options_sort: '排序',

  options_ruleListFormat: '規則列表格式',
  options_ruleListUrlHelp: '留空以使用內嵌規則列表。',
  options_downloadProfileNow: '立即更新',
  options_ruleListLastUpdate: '上次更新：$1',
  options_ruleListObsolete: '規則列表尚未下載！',
  options_attachProfile: '新增規則列表',
  options_attachProfileHelp: '規則列表可以方便地維護大量規則。',

  options_profileEditSource: '來源',
  options_showConditionTypeHelp: '顯示說明',
  options_deleteAttached: '移除規則列表',
  options_resetRules_help: '重設規則以符合規則列表',

  // Rule list formats
  ruleListFormat_AutoProxy: 'AutoProxy',
  ruleListFormat_Switchy: 'Switchy',

  // Actions
  options_apply: '套用變更',
  options_revert: '撤銷變更',
  options_newProfile: '新建情境模式...',
  options_profileName: '情境模式名稱',
  options_profileType: '情境模式類型',
  options_renameProfile: '重新命名',
  options_deleteProfile: '刪除',
  options_exportProfile: '匯出 PAC',

  // Navigation
  nav_general: '一般',
  nav_importExport: '匯入/匯出',
  nav_about: '關於',

  // Theme
  theme_light: '淺色',
  theme_dark: '深色',
  theme_system: '跟隨系統',

  // Language
  language_label: '語言',

  // General settings
  options_startupProfile: '啟動時情境模式',
  options_startupProfileHelp: '瀏覽器啟動時套用的情境模式。',
  options_quickSwitch: '快速切換',
  options_quickSwitchHelp: '在彈出視窗中顯示的快速切換情境模式。',
  options_enableQuickSwitch: '啟用快速切換',
  options_refreshOnProfileChange: '切換情境模式時重新整理目前分頁',
  options_downloadInterval: '下載間隔（分鐘）',
  options_showInspectMenu: '顯示檢查選單項目',
  options_revertProxyChanges: '撤銷其他應用程式的代理變更',

  // Import/Export
  options_importOptions: '匯入設定',
  options_exportOptions: '匯出設定',
  options_importHelp: '從備份檔案匯入設定。',
  options_exportHelp: '將目前設定匯出到備份檔案。',
  options_restoreLocal: '從檔案還原',
  options_makeBackup: '下載備份',

  // About
  about_title: '關於 SwitchyAlpha',
  about_version: '版本',
  about_description: '現代化的瀏覽器代理切換器。',

  // Popup
  popup_addRule: '新增規則',
  popup_tempRule: '臨時規則',
  popup_openOptions: '選項',
  popup_reportIssue: '回報問題',
  popup_currentProfile: '目前情境模式',

  // Dialogs
  dialog_close: '關閉',
  dialog_ok: '確定',
  dialog_cancel: '取消',
  dialog_save: '儲存',
  dialog_delete: '刪除',

  // Errors
  error_profileNotFound: '未找到情境模式：$1',
  error_invalidFormat: '格式無效',
};

// All translations
const translations: Record<Language, Record<string, string>> = {
  'en': en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

// Store state
let currentLanguage = $state<Language>('en');

/**
 * Detect browser language
 */
function detectLanguage(): Language {
  const browserLang = navigator.language || 'en';
  if (browserLang.startsWith('zh')) {
    // Check for Traditional Chinese regions
    if (browserLang === 'zh-TW' || browserLang === 'zh-HK' || browserLang === 'zh-Hant') {
      return 'zh-TW';
    }
    return 'zh-CN';
  }
  return 'en';
}

/**
 * Initialize language store
 */
async function init(): Promise<void> {
  // Load saved preference
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        currentLanguage = result[STORAGE_KEY] as Language;
        return;
      }
    } else if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentLanguage = saved as Language;
        return;
      }
    }
  } catch (e) {
    console.warn('Failed to load language preference:', e);
  }

  // Use detected language if no saved preference
  currentLanguage = detectLanguage();
}

/**
 * Set language
 */
async function setLanguage(lang: Language): Promise<void> {
  currentLanguage = lang;

  // Save preference
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [STORAGE_KEY]: lang });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  } catch (e) {
    console.warn('Failed to save language preference:', e);
  }
}

/**
 * Translate a message key to localized string
 */
function t(key: TranslationKey, params?: TranslationParams): string {
  const messages = translations[currentLanguage] || en;
  let message = messages[key] || en[key] || key;

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
 * Get current language info
 */
function getCurrentLanguageInfo() {
  return languages.find(l => l.code === currentLanguage) || languages[0];
}

// Export store
const i18nStore = {
  get language() { return currentLanguage; },
  get languages() { return languages; },
  get currentLanguageInfo() { return getCurrentLanguageInfo(); },
  init,
  setLanguage,
  t,
};

export default i18nStore;

// Also export t function directly for convenience
export { t };
