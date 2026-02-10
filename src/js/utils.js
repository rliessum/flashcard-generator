/**
 * Utility functions for the Flashcard Generator
 */

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
