/**
 * Utility functions for the Flashcard Generator
 */

/** Max CSV upload size (2 MB) — limits memory use from pasted/uploaded files */
export const MAX_CSV_BYTES = 2 * 1024 * 1024;

/**
 * @param {string} text
 * @returns {boolean}
 */
export function exceedsCsvLimit(text) {
  return new TextEncoder().encode(String(text ?? '')).byteLength > MAX_CSV_BYTES;
}

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 28;

/**
 * Clamp font size to a safe integer for inline CSS (prevents injection via style attrs)
 * @param {number} size
 * @param {number} [min]
 * @param {number} [max]
 * @returns {number}
 */
export function clampFontSize(size, min = FONT_SIZE_MIN, max = FONT_SIZE_MAX) {
  const n = Number(size);
  if (!Number.isFinite(n)) return FONT_SIZE_MIN;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * HTML-escape a string to prevent XSS
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (ch) => map[ch]);
}

/**
 * Escape a value for CSV output — wraps in quotes if it contains commas, quotes, or newlines
 * @param {string} val
 * @returns {string}
 */
export function csvEscape(val) {
  if (/[",\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

/**
 * Fisher-Yates shuffle (in-place, returns same array)
 * @param {Array} arr
 * @returns {Array}
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Swap front and back of all cards (in-place, returns same array)
 * @param {Array<{front: string, back: string}>} cards
 * @returns {Array<{front: string, back: string}>}
 */
export function swapSides(cards) {
  cards.forEach((c) => {
    [c.front, c.back] = [c.back, c.front];
  });
  return cards;
}
