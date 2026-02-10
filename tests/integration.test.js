import { describe, it, expect, beforeEach } from 'vitest';
import { parseCSV, countDuplicates } from '../src/js/csv.js';
import { buildDuplexHTML, buildPreviewHTML } from '../src/js/cards.js';
import { shuffle, swapSides, csvEscape } from '../src/js/utils.js';
import { buildCSVString } from '../src/js/csv.js';

/**
 * Integration tests — testing module interactions and real-world workflows
 */

describe('Full CSV-to-cards workflow', () => {
  const sampleCSV = `english,dutch
cap,pet
comfortable,comfortabel
jacket,jas
jumper,trui
leather,lederen
pretty,mooi
"to put on",aandoen
raincoat,regenjas
shorts,"korte broek"`;

  it('parses CSV and generates duplex HTML', () => {
    const { cards } = parseCSV(sampleCSV);
    expect(cards).toHaveLength(9);

    const html = buildDuplexHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
      cols: 2,
    });

    // 9 cards → 2 pages → 4 containers (2 front + 2 back)
    const containerCount = (html.match(/flashcard-container/g) || []).length;
    expect(containerCount).toBe(4);

    // Check quoted field was parsed correctly
    expect(html).toContain('to put on');
    expect(html).toContain('korte broek');
  });

  it('parses CSV, shuffles, and generates preview', () => {
    const { cards } = parseCSV(sampleCSV);
    const original = cards.map((c) => c.front);

    shuffle(cards);

    const html = buildPreviewHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
    });

    // All cards should still be present
    original.forEach((front) => {
      expect(html).toContain(front);
    });
  });

  it('round-trips: parse → export → re-parse', () => {
    const { cards } = parseCSV(sampleCSV);
    const csvString = buildCSVString(cards, csvEscape);

    const { cards: reparsed } = parseCSV(csvString);
    expect(reparsed).toEqual(cards);
  });
});

describe('Manual entry workflow', () => {
  it('builds cards from manual input and generates preview', () => {
    const manualCards = [
      { front: 'apple', back: 'appel' },
      { front: 'banana', back: 'banaan' },
      { front: '', back: '' }, // empty row — should be filtered by UI
    ];

    const validCards = manualCards.filter((c) => c.front && c.back);
    expect(validCards).toHaveLength(2);

    const html = buildPreviewHTML(validCards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
    });

    expect(html).toContain('apple');
    expect(html).toContain('banaan');
  });

  it('detects duplicates in manual cards', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
      { front: 'Hello', back: 'Hallo' }, // case-insensitive duplicate
    ];
    expect(countDuplicates(cards)).toBe(1);
  });
});

describe('Swap and re-render', () => {
  it('swapping sides updates duplex HTML correctly', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ];

    const beforeSwap = buildDuplexHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
      cols: 2,
    });

    // Front page should have 'hello' as front
    expect(beforeSwap).toContain('flashcard-front');

    swapSides(cards);

    expect(cards[0].front).toBe('hallo');
    expect(cards[0].back).toBe('hello');

    const afterSwap = buildDuplexHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
      cols: 2,
    });

    // After swap, front page should now have 'hallo'
    expect(afterSwap).toContain('hallo');
  });
});

describe('Grid layout switching', () => {
  const cards = Array.from({ length: 16 }, (_, i) => ({
    front: `word${i}`,
    back: `vertaling${i}`,
  }));

  it('2x4 layout creates 2 pages for 16 cards', () => {
    const html = buildDuplexHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
      cols: 2,
    });
    const pages = (html.match(/flashcard-container/g) || []).length;
    expect(pages).toBe(4); // 2 front + 2 back
  });

  it('2x3 layout creates 3 pages for 16 cards', () => {
    const html = buildDuplexHTML(cards, {
      cardsPerPage: 6,
      gridLayout: '2x3',
      fontSize: 18,
      cols: 2,
    });
    const pages = (html.match(/flashcard-container/g) || []).length;
    expect(pages).toBe(6); // 3 front + 3 back
  });
});

describe('Font size rendering', () => {
  it('different font sizes appear in output', () => {
    const cards = [{ front: 'test', back: 'test' }];
    const opts = { cardsPerPage: 8, gridLayout: '2x4', cols: 2 };

    const small = buildDuplexHTML(cards, { ...opts, fontSize: 10 });
    const large = buildDuplexHTML(cards, { ...opts, fontSize: 28 });

    expect(small).toContain('font-size:10pt');
    expect(large).toContain('font-size:28pt');
  });
});

describe('Edge cases', () => {
  it('handles Unicode characters', () => {
    const csv = 'front,back\ncafé,café\nüber,über\n日本語,japanese';
    const { cards } = parseCSV(csv);
    expect(cards).toHaveLength(3);
    expect(cards[0]).toEqual({ front: 'café', back: 'café' });
    expect(cards[2]).toEqual({ front: '日本語', back: 'japanese' });
  });

  it('handles emoji in cards', () => {
    const csv = 'front,back\n🐱,cat\n🐕,dog';
    const { cards } = parseCSV(csv);
    const html = buildPreviewHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
    });
    expect(html).toContain('🐱');
    expect(html).toContain('🐕');
  });

  it('handles very long card text', () => {
    const longText = 'a'.repeat(1000);
    const cards = [{ front: longText, back: 'short' }];
    const html = buildPreviewHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
    });
    expect(html).toContain(longText);
  });

  it('handles single card', () => {
    const cards = [{ front: 'only', back: 'one' }];
    const html = buildDuplexHTML(cards, {
      cardsPerPage: 8,
      gridLayout: '2x4',
      fontSize: 18,
      cols: 2,
    });
    expect(html).toContain('only');
    expect(html).toContain('one');
    // Should have 2 containers (1 front page + 1 back page)
    const containers = (html.match(/flashcard-container/g) || []).length;
    expect(containers).toBe(2);
  });
});
