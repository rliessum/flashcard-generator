/**
 * Card generation and layout module for the Flashcard Generator
 */
import { escapeHtml } from './utils.js';

/**
 * Get cards for a given page index
 * @param {Array<{front: string, back: string}>} flashcards
 * @param {number} pageIndex
 * @param {number} cardsPerPage
 * @returns {Array<{front: string, back: string}|null>}
 */
export function getPageCards(flashcards, pageIndex, cardsPerPage) {
  return Array.from({ length: cardsPerPage }, (_, i) => {
    const idx = pageIndex * cardsPerPage + i;
    return idx < flashcards.length ? flashcards[idx] : null;
  });
}

/**
 * Generate HTML for a single card (print layout)
 * @param {{front: string, back: string}|null} card
 * @param {'front'|'back'} side
 * @param {number} fontSize
 * @returns {string}
 */
export function cardHTML(card, side, fontSize) {
  if (!card) return '<div class="flashcard"></div>';
  const cls = side === 'front' ? 'flashcard-front' : 'flashcard-back';
  return `<div class="flashcard ${cls}" style="font-size:${fontSize}pt">${escapeHtml(card[side])}</div>`;
}

/**
 * Generate HTML for a single card (screen preview with flip)
 * @param {{front: string, back: string}|null} card
 * @param {number} fontSize
 * @returns {string}
 */
export function previewCardHTML(card, fontSize) {
  if (!card) {
    return '<div class="flip-card"><div class="flip-card-inner"><div class="flashcard flashcard-front"></div><div class="flashcard flashcard-back"></div></div></div>';
  }
  return `<div class="flip-card" title="Click to flip"><div class="flip-card-inner"><div class="flashcard flashcard-front" style="font-size:${fontSize}pt">${escapeHtml(card.front)}</div><div class="flashcard flashcard-back" style="font-size:${fontSize}pt">${escapeHtml(card.back)}</div></div></div>`;
}

/**
 * Build print HTML for one side across all pages
 * @param {Array<{front: string, back: string}>} flashcards
 * @param {'front'|'back'} side
 * @param {object} opts
 * @param {number} opts.cardsPerPage
 * @param {string} opts.gridLayout - '2x3' or '2x4'
 * @param {number} opts.fontSize
 * @returns {string}
 */
export function buildPageHTML(flashcards, side, { cardsPerPage, gridLayout, fontSize }) {
  const pages = Math.ceil(flashcards.length / cardsPerPage);
  const gridCls = gridLayout === '2x3' ? 'grid-2x3' : 'grid-2x4';
  let html = '';
  for (let p = 0; p < pages; p++) {
    html += `<div class="flashcard-container ${gridCls}">`;
    html += getPageCards(flashcards, p, cardsPerPage)
      .map((c) => cardHTML(c, side, fontSize))
      .join('');
    html += '</div>';
  }
  return html;
}

/**
 * Build duplex print HTML (front page, then mirrored back page per chunk)
 * @param {Array<{front: string, back: string}>} flashcards
 * @param {object} opts
 * @param {number} opts.cardsPerPage
 * @param {string} opts.gridLayout
 * @param {number} opts.fontSize
 * @param {number} opts.cols
 * @returns {string}
 */
export function buildDuplexHTML(flashcards, { cardsPerPage, gridLayout, fontSize, cols = 2 }) {
  const pages = Math.ceil(flashcards.length / cardsPerPage);
  const gridCls = gridLayout === '2x3' ? 'grid-2x3' : 'grid-2x4';
  const rows = cardsPerPage / cols;
  let html = '';
  for (let p = 0; p < pages; p++) {
    const cards = getPageCards(flashcards, p, cardsPerPage);
    // Front page
    html += `<div class="flashcard-container ${gridCls}">`;
    html += cards.map((c) => cardHTML(c, 'front', fontSize)).join('');
    html += '</div>';
    // Back page (mirrored horizontally for duplex printing)
    html += `<div class="flashcard-container ${gridCls}">`;
    for (let r = 0; r < rows; r++) {
      for (let c = cols - 1; c >= 0; c--) {
        html += cardHTML(cards[r * cols + c], 'back', fontSize);
      }
    }
    html += '</div>';
  }
  return html;
}

/**
 * Build preview HTML for screen display
 * @param {Array<{front: string, back: string}>} flashcards
 * @param {object} opts
 * @param {number} opts.cardsPerPage
 * @param {string} opts.gridLayout
 * @param {number} opts.fontSize
 * @returns {string}
 */
export function buildPreviewHTML(flashcards, { cardsPerPage, gridLayout, fontSize }) {
  const pages = Math.ceil(flashcards.length / cardsPerPage);
  const gridCls = gridLayout === '2x3' ? 'grid-2x3' : 'grid-2x4';
  let html = '';
  for (let p = 0; p < pages; p++) {
    html += `<div class="flashcard-container ${gridCls}">`;
    html += getPageCards(flashcards, p, cardsPerPage)
      .map((c) => previewCardHTML(c, fontSize))
      .join('');
    html += '</div>';
  }
  return html;
}
