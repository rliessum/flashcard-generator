/**
 * Utility functions for Ultimate Flashcards
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
 * Escape a value for use inside a double-quoted HTML attribute.
 * Used for link hrefs etc.
 * @param {string} value
 * @returns {string}
 */
function escapeHtmlAttribute(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(value).replace(/[&<>"']/g, (ch) => map[ch]);
}

/**
 * Convert lightweight card markup into safe HTML.
 * Supported syntax:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code` (literal, no inner markup)
 * - ~~strikethrough~~
 * - [text](https://...)
 * - Bullet lists starting with "- " or "* "
 * - Line breaks
 * @param {string} text
 * @returns {string}
 */
export function formatCardMarkup(text) {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n');
  if (!lines.length) return '';

  const formatInline = (raw) => {
    let safe = escapeHtml(raw);

    // 1. Protect code spans first (they must be literal; no markup inside).
    // Use a placeholder that cannot appear in user input after escaping.
    const codePlaceholders = [];
    safe = safe.replace(/`([^`\n]+)`/g, (_m, inner) => {
      const placeholder = `\u0000CODE${codePlaceholders.length}\u0000`;
      codePlaceholders.push(`<code>${inner}</code>`);
      return placeholder;
    });

    // 2. Links (escape the URL for the attribute context).
    safe = safe.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
      const safeUrl = escapeHtmlAttribute(url);
      return `<a href="${safeUrl}" target="_blank" rel="noreferrer noopener">${label}</a>`;
    });

    // 3. Other inline markup (bold, italic, strikethrough).
    // These cannot affect protected code regions because placeholders contain none of the delimiter chars.
    safe = safe
      .replace(/\*\*([^\n*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^\n_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^\n*]+)\*/g, '<em>$1</em>')
      .replace(/_([^\n_]+)_/g, '<em>$1</em>')
      .replace(/~~([^\n~]+)~~/g, '<s>$1</s>');

    // 4. Restore protected code spans.
    codePlaceholders.forEach((replacement, i) => {
      safe = safe.replace(`\u0000CODE${i}\u0000`, replacement);
    });

    return safe;
  };

  const blocks = [];
  let listItems = [];
  const flushList = () => {
    if (!listItems.length) return;
    const listHtml = `<ul>${listItems.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ul>`;
    blocks.push(listHtml);
    listItems = [];
  };

  lines.forEach((line) => {
    const bulletMatch = /^\s*[-*]\s+(.+)\s*$/.exec(line);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList();
    blocks.push(formatInline(line));
  });
  flushList();

  return blocks
    .map((block, index) => {
      if (index === 0) return block;
      const prev = blocks[index - 1];
      const isPrevList = prev.startsWith('<ul>');
      const isCurrentList = block.startsWith('<ul>');
      return isPrevList || isCurrentList ? block : `<br />${block}`;
    })
    .join('');
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

/**
 * CSS rules for rendered markup inside .flashcard-text (strong, em, code, lists, links).
 * Used both by the main app (via app.css) and the self-contained print popup.
 * Print version intentionally uses print-friendly values (no CSS variables, fixed units).
 */
export const CARD_MARKUP_CSS = `
.flashcard-text strong { font-weight: 700; }
.flashcard-text em { font-style: italic; }
.flashcard-text s { text-decoration: line-through; }
.flashcard-text code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.9em;
  padding: 0.08em 0.25em;
  border-radius: 0.25rem;
  background: #f4f4f5;
  border: 0.2mm solid #d4d4d8;
}
.flashcard-text ul { margin: 0; padding-left: 4mm; text-align: left; }
.flashcard-text li { margin: 0.8mm 0; }
.flashcard-text a { color: inherit; text-decoration: underline; }
`;
