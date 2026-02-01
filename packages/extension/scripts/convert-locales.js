#!/usr/bin/env node
/**
 * Convert omega-locales .po files to JSON for the extension
 * 
 * This script reads all .po files from omega-locales and generates
 * a single TypeScript file with all translations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../../../omega-locales');
const OUTPUT_FILE = path.resolve(__dirname, '../src/lib/locales.ts');

// Language metadata
const languageMeta = {
  'en_US': { code: 'en', label: 'English', nativeLabel: 'English' },
  'zh_CN': { code: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文' },
  'zh_TW': { code: 'zh-TW', label: 'Traditional Chinese (Taiwan)', nativeLabel: '繁體中文（台灣）' },
  'zh_Hant': { code: 'zh-Hant', label: 'Traditional Chinese', nativeLabel: '繁體中文' },
  'de': { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  'fr': { code: 'fr', label: 'French', nativeLabel: 'Français' },
  'es': { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  'es_AR': { code: 'es-AR', label: 'Spanish (Argentina)', nativeLabel: 'Español (Argentina)' },
  'it': { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  'ja': { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  'ru': { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  'pt': { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  'pt_BR': { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português (Brasil)' },
  'pl': { code: 'pl', label: 'Polish', nativeLabel: 'Polski' },
  'nl': { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands' },
  'tr': { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  'uk': { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська' },
  'cs': { code: 'cs', label: 'Czech', nativeLabel: 'Čeština' },
  'sk': { code: 'sk', label: 'Slovak', nativeLabel: 'Slovenčina' },
  'sl': { code: 'sl', label: 'Slovenian', nativeLabel: 'Slovenščina' },
  'he_IL': { code: 'he', label: 'Hebrew', nativeLabel: 'עברית' },
  'fa': { code: 'fa', label: 'Persian', nativeLabel: 'فارسی' },
  'nb_NO': { code: 'nb', label: 'Norwegian Bokmål', nativeLabel: 'Norsk bokmål' },
  'is': { code: 'is', label: 'Icelandic', nativeLabel: 'Íslenska' },
  'si': { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල' },
  'lzh': { code: 'lzh', label: 'Literary Chinese', nativeLabel: '文言' },
  'ach': { code: 'ach', label: 'Acholi', nativeLabel: 'Acholi' },
};

/**
 * Parse a .po file and return an object with msgid -> msgstr mappings
 */
function parsePo(content) {
  const translations = {};
  const lines = content.split('\n');
  
  let currentMsgid = null;
  let currentMsgstr = '';
  let inMsgstr = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('msgid "')) {
      // Save previous entry
      if (currentMsgid && currentMsgstr) {
        translations[currentMsgid] = currentMsgstr;
      }
      // Start new entry
      currentMsgid = trimmed.slice(7, -1);
      currentMsgstr = '';
      inMsgstr = false;
    } else if (trimmed.startsWith('msgstr "')) {
      currentMsgstr = trimmed.slice(8, -1);
      inMsgstr = true;
    } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      // Continuation line
      const continued = trimmed.slice(1, -1);
      if (inMsgstr) {
        currentMsgstr += continued;
      } else if (currentMsgid !== null) {
        currentMsgid += continued;
      }
    }
  }
  
  // Save last entry
  if (currentMsgid && currentMsgstr) {
    translations[currentMsgid] = currentMsgstr;
  }
  
  return translations;
}

/**
 * Unescape PO string escapes
 */
function unescapePoString(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function main() {
  console.log('Converting omega-locales to TypeScript...');
  
  const allTranslations = {};
  const languages = [];
  
  // Read all locale directories
  const localeDirs = fs.readdirSync(LOCALES_DIR);
  
  for (const localeDir of localeDirs) {
    const poFile = path.join(LOCALES_DIR, localeDir, 'LC_MESSAGES', 'omega-web.po');
    
    if (!fs.existsSync(poFile)) {
      console.warn(`  Skipping ${localeDir}: no omega-web.po found`);
      continue;
    }
    
    const meta = languageMeta[localeDir];
    if (!meta) {
      console.warn(`  Skipping ${localeDir}: no metadata defined`);
      continue;
    }
    
    console.log(`  Processing ${localeDir} -> ${meta.code}`);
    
    const content = fs.readFileSync(poFile, 'utf-8');
    const translations = parsePo(content);
    
    // Unescape all strings
    const unescaped = {};
    for (const [key, value] of Object.entries(translations)) {
      if (key) { // Skip empty msgid (header)
        unescaped[key] = unescapePoString(value);
      }
    }
    
    allTranslations[meta.code] = unescaped;
    languages.push(meta);
  }
  
  // Sort languages by label
  languages.sort((a, b) => a.label.localeCompare(b.label));
  
  // Generate TypeScript file
  const output = `/**
 * Auto-generated locale data from omega-locales
 * Generated by scripts/convert-locales.js
 * 
 * DO NOT EDIT MANUALLY
 */

export type Language = ${languages.map(l => `'${l.code}'`).join(' | ')};

export interface LanguageInfo {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const languages: LanguageInfo[] = ${JSON.stringify(languages, null, 2)};

export const translations: Record<Language, Record<string, string>> = ${JSON.stringify(allTranslations, null, 2)};

export default translations;
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`\nGenerated ${OUTPUT_FILE}`);
  console.log(`  ${languages.length} languages`);
  console.log(`  ${Object.keys(allTranslations['en'] || {}).length} translation keys`);
}

main();
