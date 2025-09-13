// src/utils/color.js

/**
 * Parses a color string in various formats into an RGB object.
 * @param {string} c - The color string (e.g., '#RRGGBB' or 'rgb(...)').
 * @returns {{r: number, g: number, b: number}} An object with r, g, b properties.
 */
export function parseColor(c) {
  if (!c) return { r: 0, g: 0, b: 0 };
  if (c.startsWith('#')) {
    const hex = c.substring(1);
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  } else if (c.startsWith('rgb')) {
    const parts = c.substring(c.indexOf('(') + 1, c.length - 1).split(',');
    return {
      r: parseInt(parts[0].trim()),
      g: parseInt(parts[1].trim()),
      b: parseInt(parts[2].trim())
    };
  }
  return { r: 0, g: 0, b: 0 };
}