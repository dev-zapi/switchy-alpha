/**
 * Shell expression (wildcard) to regular expression utilities
 */

/** Characters that need to be escaped in regular expressions */
const regExpMetaChars: Set<number> = new Set();
const metaCharsStr = '\\[^$.|?*+(){}/';
for (let i = 0; i < metaCharsStr.length; i++) {
  regExpMetaChars.add(metaCharsStr.charCodeAt(i));
}

export { regExpMetaChars };

const CHAR_CODE_SLASH = 47; // '/'
const CHAR_CODE_BACKSLASH = 92; // '\'
const CHAR_CODE_ASTERISK = 42; // '*'
const CHAR_CODE_QUESTION = 63; // '?'

/**
 * Escape forward slashes for use in regex literals
 */
export function escapeSlash(pattern: string): string {
  let escaped = false;
  let start = 0;
  let result = '';

  for (let i = 0; i < pattern.length; i++) {
    const code = pattern.charCodeAt(i);
    if (code === CHAR_CODE_SLASH && !escaped) {
      result += pattern.substring(start, i);
      result += '\\';
      start = i;
    }
    escaped = code === CHAR_CODE_BACKSLASH && !escaped;
  }

  result += pattern.substring(start);
  return result;
}

export interface ShExp2RegExpOptions {
  /** If true, trim leading and trailing asterisks */
  trimAsterisk?: boolean;
}

/**
 * Convert a shell expression (wildcard pattern) to a regular expression string
 *
 * @param pattern - The shell expression pattern (e.g., "*.example.com")
 * @param options - Conversion options
 * @returns A regular expression string
 */
export function shExp2RegExp(pattern: string, options: ShExp2RegExpOptions = {}): string {
  const trimAsterisk = options.trimAsterisk ?? false;
  let start = 0;
  let end = pattern.length;

  if (trimAsterisk) {
    // Trim leading asterisks
    while (start < end && pattern.charCodeAt(start) === CHAR_CODE_ASTERISK) {
      start++;
    }
    // Trim trailing asterisks
    while (start < end && pattern.charCodeAt(end - 1) === CHAR_CODE_ASTERISK) {
      end--;
    }
    // If only asterisks remain, return empty string (matches everything)
    if (end - start === 1 && pattern.charCodeAt(start) === CHAR_CODE_ASTERISK) {
      return '';
    }
  }

  let regex = '';

  // Add start anchor if not trimmed from beginning
  if (start === 0) {
    regex += '^';
  }

  for (let i = start; i < end; i++) {
    const code = pattern.charCodeAt(i);
    switch (code) {
      case CHAR_CODE_ASTERISK:
        regex += '.*';
        break;
      case CHAR_CODE_QUESTION:
        regex += '.';
        break;
      default:
        if (regExpMetaChars.has(code)) {
          regex += '\\';
        }
        regex += pattern[i];
    }
  }

  // Add end anchor if not trimmed from end
  if (end === pattern.length) {
    regex += '$';
  }

  return regex;
}

/**
 * Create a safe RegExp that won't throw on invalid patterns
 */
export function safeRegex(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch {
    // Return a regex that never matches
    return /(?!)/;
  }
}
