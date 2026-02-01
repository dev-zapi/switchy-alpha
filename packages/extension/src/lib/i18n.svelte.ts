/**
 * i18n Store for SwitchyAlpha
 *
 * Svelte 5 reactive store for managing language with support for
 * all languages from omega-locales.
 */

import { languages as allLanguages, translations, type Language, type LanguageInfo } from './locales';

export type { Language, LanguageInfo };
export type TranslationKey = string;
export type TranslationParams = Record<string, string | number> | (string | number)[];

// Storage key
const STORAGE_KEY = '-language';

// Re-export languages
export const languages = allLanguages;

// Store state
let currentLanguage = $state<Language>('en');

/**
 * Detect browser language and map to closest supported language
 */
function detectLanguage(): Language {
  const browserLang = navigator.language || 'en';
  
  // Try exact match first
  const exactMatch = allLanguages.find(l => l.code === browserLang);
  if (exactMatch) return exactMatch.code;
  
  // Try base language match (e.g., 'zh-CN' -> 'zh')
  const baseLang = browserLang.split('-')[0];
  
  // Special handling for Chinese
  if (baseLang === 'zh') {
    if (browserLang === 'zh-TW' || browserLang === 'zh-HK' || browserLang === 'zh-Hant') {
      return 'zh-TW';
    }
    return 'zh-CN';
  }
  
  // Try to find a language that starts with the base
  const baseMatch = allLanguages.find(l => l.code === baseLang || l.code.startsWith(baseLang + '-'));
  if (baseMatch) return baseMatch.code;
  
  // Default to English
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
 * @param key - Translation key
 * @param params - Placeholder parameters (optional)
 * @param defaultValue - Default value if translation not found (optional)
 * @returns Translated string, defaultValue, or key (in order of priority)
 */
function t(key: TranslationKey, params?: TranslationParams, defaultValue?: string): string {
  const messages = translations[currentLanguage] || translations['en'];
  const fallback = translations['en'];
  let message = messages[key] || fallback[key];
  
  // If no translation found, use defaultValue or key
  if (!message) {
    return defaultValue ?? key;
  }

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
function getCurrentLanguageInfo(): LanguageInfo | undefined {
  return allLanguages.find(l => l.code === currentLanguage);
}

// Export store
const i18nStore = {
  get language() { return currentLanguage; },
  get languages() { return allLanguages; },
  get currentLanguageInfo() { return getCurrentLanguageInfo(); },
  init,
  setLanguage,
  t,
};

export default i18nStore;

// Also export t function directly for convenience
export { t };
