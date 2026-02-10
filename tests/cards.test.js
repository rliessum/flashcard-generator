import { describe, it, expect } from 'vitest';
import {
  getPageCards,
  cardHTML,
  previewCardHTML,
  buildPageHTML,
  buildDuplexHTML,
  buildPreviewHTML,
} from '../src/js/cards.js';

const sampleCards = [
  { front: 'hello', back: 'hallo' },
  { front: 'cat', back: 'kat' },
  { front: 'dog', back: 'hond' },
  { front: 'house', back: 'huis' },
  { front: 'tree', back: 'boom' },
  { front: 'water', back: 'water' },
  { front: 'sky', back: 'lucht' },
  { front: 'sun', back: 'zon' },
  { front: 'moon', back: 'maan' },
  { front: 'star', back: 'ster' },
];

// ─── getPageCards ─────────────────────────────────────────────────────────────

describe('getPageCards', () => {
  it('returns correct cards for first page with 8 per page', () => {
    const result = getPageCards(sampleCards, 0, 8);
    expect(result).toHaveLength(8);
    expect(result[0]).toEqual({ front: 'hello', back: 'hallo' });
    expect(result[7]).toEqual({ front: 'sun', back: 'zon' });
  });

  it('pads with null for incomplete last page', () => {
    const result = getPageCards(sampleCards, 1, 8);
    expect(result).toHaveLength(8);
    expect(result[0]).toEqual({ front: 'moon', back: 'maan' });
    expect(result[1]).toEqual({ front: 'star', back: 'ster' });
    expect(result[2]).toBeNull();
    expect(result[7]).toBeNull();
  });

  it('returns all nulls for page beyond data', () => {
    const result = getPageCards(sampleCards, 5, 8);
    expect(result.every((c) => c === null)).toBe(true);
  });

  it('works with 6 cards per page layout', () => {
    const result = getPageCards(sampleCards, 0, 6);
    expect(result).toHaveLength(6);
    expect(result[5]).toEqual({ front: 'water', back: 'water' });
  });

  it('handles empty card array', () => {
    const result = getPageCards([], 0, 8);
    expect(result).toHaveLength(8);
    expect(result.every((c) => c === null)).toBe(true);
  });
});

// ─── cardHTML ─────────────────────────────────────────────────────────────────

describe('cardHTML', () => {
  it('renders front card with correct class', () => {
    const html = cardHTML({ front: 'hello', back: 'hallo' }, 'front', 18);
    expect(html).toContain('flashcard-front');
    expect(html).toContain('hello');
    expect(html).toContain('font-size:18pt');
  });

  it('renders back card with correct class', () => {
    const html = cardHTML({ front: 'hello', back: 'hallo' }, 'back', 14);
    expect(html).toContain('flashcard-back');
    expect(html).toContain('hallo');
    expect(html).toContain('font-size:14pt');
  });

  it('returns empty flashcard div for null card', () => {
    const html = cardHTML(null, 'front', 18);
    expect(html).toBe('<div class="flashcard"></div>');
  });

  it('escapes HTML in card content', () => {
    const html = cardHTML({ front: '<b>bold</b>', back: 'test' }, 'front', 18);
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).not.toContain('<b>bold</b>');
  });

  it('handles special characters', () => {
    const html = cardHTML({ front: 'Tom & Jerry', back: 'test' }, 'front', 18);
    expect(html).toContain('Tom &amp; Jerry');
  });
});

// ─── previewCardHTML ──────────────────────────────────────────────────────────

describe('previewCardHTML', () => {
  it('renders flip card with both sides', () => {
    const html = previewCardHTML({ front: 'hello', back: 'hallo' }, 18);
    expect(html).toContain('flip-card');
    expect(html).toContain('flashcard-front');
    expect(html).toContain('flashcard-back');
    expect(html).toContain('hello');
    expect(html).toContain('hallo');
  });

  it('renders empty flip card for null', () => {
    const html = previewCardHTML(null, 18);
    expect(html).toContain('flip-card');
    expect(html).toContain('flashcard-front');
    expect(html).toContain('flashcard-back');
  });

  it('includes font size', () => {
    const html = previewCardHTML({ front: 'a', back: 'b' }, 22);
    expect(html).toContain('font-size:22pt');
  });
});

// ─── buildPageHTML ────────────────────────────────────────────────────────────

describe('buildPageHTML', () => {
  const opts = { cardsPerPage: 8, gridLayout: '2x4', fontSize: 18 };

  it('generates correct number of pages', () => {
    const html = buildPageHTML(sampleCards, 'front', opts);
    const pageCount = (html.match(/flashcard-container/g) || []).length;
    expect(pageCount).toBe(2); // 10 cards / 8 per page = 2 pages
  });

  it('uses correct grid class for 2x4', () => {
    const html = buildPageHTML(sampleCards, 'front', opts);
    expect(html).toContain('grid-2x4');
    expect(html).not.toContain('grid-2x3');
  });

  it('uses correct grid class for 2x3', () => {
    const opts3 = { cardsPerPage: 6, gridLayout: '2x3', fontSize: 18 };
    const html = buildPageHTML(sampleCards, 'front', opts3);
    expect(html).toContain('grid-2x3');
  });

  it('contains all card fronts', () => {
    const html = buildPageHTML(sampleCards, 'front', opts);
    sampleCards.forEach((c) => {
      expect(html).toContain(c.front);
    });
  });

  it('handles empty array', () => {
    const html = buildPageHTML([], 'front', opts);
    expect(html).toBe('');
  });
});

// ─── buildDuplexHTML ──────────────────────────────────────────────────────────

describe('buildDuplexHTML', () => {
  const opts = { cardsPerPage: 8, gridLayout: '2x4', fontSize: 18, cols: 2 };

  it('generates front + back page for each chunk', () => {
    const html = buildDuplexHTML(sampleCards, opts);
    // 10 cards → 2 chunks → 4 pages total (2 front + 2 back)
    const pageCount = (html.match(/flashcard-container/g) || []).length;
    expect(pageCount).toBe(4);
  });

  it('contains both front and back text', () => {
    const cards = [{ front: 'hello', back: 'hallo' }];
    const html = buildDuplexHTML(cards, opts);
    expect(html).toContain('hello');
    expect(html).toContain('hallo');
  });

  it('back page mirrors columns for correct duplex alignment', () => {
    // With 2 columns, back page should have col 1 and col 0 swapped per row
    const cards = [
      { front: 'A', back: 'a' },
      { front: 'B', back: 'b' },
      { front: 'C', back: 'c' },
      { front: 'D', back: 'd' },
    ];
    const html = buildDuplexHTML(cards, { ...opts, cardsPerPage: 4 });

    // Extract the second container (back page)
    const containers = html.split('</div><div class="flashcard-container');
    expect(containers.length).toBeGreaterThan(1);

    // The back page should have 'b' before 'a' and 'd' before 'c'
    const backPage = containers[1];
    const posB = backPage.indexOf('b');
    const posA = backPage.indexOf('>a<');
    const posD = backPage.indexOf('d');
    const posC = backPage.indexOf('>c<');
    expect(posB).toBeLessThan(posA);
    expect(posD).toBeLessThan(posC);
  });

  it('handles empty cards', () => {
    const html = buildDuplexHTML([], opts);
    expect(html).toBe('');
  });
});

// ─── buildPreviewHTML ─────────────────────────────────────────────────────────

describe('buildPreviewHTML', () => {
  const opts = { cardsPerPage: 8, gridLayout: '2x4', fontSize: 18 };

  it('generates flip cards', () => {
    const html = buildPreviewHTML(sampleCards, opts);
    const flipCount = (html.match(/flip-card/g) || []).length;
    // Each flip-card appears 3 times in the HTML (class name + inner references)
    expect(flipCount).toBeGreaterThanOrEqual(sampleCards.length);
  });

  it('contains all card text', () => {
    const html = buildPreviewHTML(sampleCards, opts);
    sampleCards.forEach((c) => {
      expect(html).toContain(c.front);
      expect(html).toContain(c.back);
    });
  });
});
