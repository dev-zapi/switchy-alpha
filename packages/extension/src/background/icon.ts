/**
 * Icon drawing module for browser toolbar icon
 *
 * Draws dynamic icons with:
 * - Rounded rectangle filled with profile color
 * - Emoji or first letter of profile name centered
 * - Optional border for result color (when rule matches)
 */

// Icon sizes required by Chrome extension API
// Including 128px for maximum size support
export const ICON_SIZES = [16, 19, 24, 32, 38, 128] as const;
export type IconSize = (typeof ICON_SIZES)[number];

// Border width ratio (15% of icon size)
const BORDER_RATIO = 0.15;

// Corner radius ratio (20% of icon size)
const CORNER_RADIUS_RATIO = 0.2;

// Icon cache to avoid redrawing
const iconCache = new Map<string, Record<number, ImageData>>();

/**
 * Options for drawing an icon
 */
export interface IconOptions {
  /** Profile background color (hex) */
  color: string;
  /** Emoji or single character to display */
  text: string;
  /** Optional result color for border (hex) */
  resultColor?: string;
  /** Icon size in pixels */
  size: IconSize;
}

/**
 * Generate a cache key for the icon options
 */
function getCacheKey(options: Omit<IconOptions, 'size'>): string {
  return `${options.color}|${options.text}|${options.resultColor || ''}`;
}

/**
 * Check if a character is an emoji
 */
export function isEmoji(char: string): boolean {
  // Check for emoji using Unicode ranges
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;

  // Common emoji ranges
  return (
    (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) || // Misc Symbols, Emoticons, etc
    (codePoint >= 0x2600 && codePoint <= 0x26ff) || // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) || // Dingbats
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) || // Transport
    (codePoint >= 0x1f1e0 && codePoint <= 0x1f1ff) // Flags
  );
}

/**
 * Get display text from profile icon or name
 */
export function getDisplayText(icon?: string, name?: string): string {
  if (icon) {
    // Return the first grapheme (handles emoji with modifiers)
    const match = icon.match(/^.(?:\u{FE0F})?(?:\u{200D}.+)?/u);
    return match ? match[0] : icon.charAt(0);
  }
  if (name) {
    return name.charAt(0).toUpperCase();
  }
  return '?';
}

/**
 * Draw a rounded rectangle path
 */
function drawRoundedRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draw a single icon at specified size
 */
export function drawIcon(options: IconOptions): ImageData {
  const { color, text, resultColor, size } = options;

  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  const borderWidth = resultColor ? Math.round(size * BORDER_RATIO) : 0;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw result color border (outer rounded rect)
  if (resultColor && borderWidth > 0) {
    ctx.fillStyle = resultColor;
    drawRoundedRect(ctx, 0, 0, size, size, Math.round(size * CORNER_RADIUS_RATIO));
    ctx.fill();
  }

  // Draw text (emoji or letter) - fills the entire icon
  const isEmojiText = isEmoji(text);

  // Calculate font size to fill the entire icon as much as possible
  // Using 0.9 to maximize the icon/emoji size while leaving minimal padding
  const fontSize = Math.round(size * 0.9);

  if (isEmojiText) {
    // For emoji, use system emoji font
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  } else {
    // For letters, use bold sans-serif with profile color as background
    const cornerRadius = Math.round(size * CORNER_RADIUS_RATIO);
    const inset = borderWidth;
    const innerSize = size - borderWidth * 2;
    const innerRadius = Math.max(1, cornerRadius - borderWidth);
    
    ctx.fillStyle = color;
    drawRoundedRect(ctx, inset, inset, innerSize, innerSize, innerRadius);
    ctx.fill();
    
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = getContrastColor(color);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Center position (accounting for border)
  const centerX = size / 2;
  const centerY = size / 2 + 1; // Slight offset for better visual centering

  // Draw the text
  ctx.fillText(text, centerX, centerY);

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Get contrasting text color (black or white) based on background
 */
export function getContrastColor(hexColor: string): string {
  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Create icons for all required sizes
 */
export function createIconImageData(
  options: Omit<IconOptions, 'size'>
): Record<number, ImageData> {
  const cacheKey = getCacheKey(options);

  // Check cache
  const cached = iconCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Generate icons for all sizes
  const result: Record<number, ImageData> = {};

  for (const size of ICON_SIZES) {
    result[size] = drawIcon({ ...options, size });
  }

  // Cache the result
  iconCache.set(cacheKey, result);

  return result;
}

/**
 * Clear the icon cache
 */
export function clearIconCache(): void {
  iconCache.clear();
}

/**
 * Set the browser action icon using ImageData
 */
export async function setActionIcon(
  imageData: Record<number, ImageData>,
  tabId?: number
): Promise<void> {
  try {
    await chrome.action.setIcon({
      imageData,
      ...(tabId !== undefined && { tabId }),
    });
  } catch (e) {
    // Ignore "No tab with id" errors - tab may have been closed
    const errorMessage = e instanceof Error ? e.message : String(e);
    if (errorMessage.includes('No tab with id')) {
      return;
    }
    console.error('Failed to set action icon:', e);
  }
}

/**
 * Update the browser action icon for a profile
 */
export async function updateIconForProfile(
  profile: { color?: string; icon?: string; name: string },
  resultColor?: string,
  tabId?: number
): Promise<void> {
  const color = profile.color || '#5b9bd5';
  const text = getDisplayText(profile.icon, profile.name);

  const imageData = createIconImageData({
    color,
    text,
    resultColor,
  });

  await setActionIcon(imageData, tabId);
}
