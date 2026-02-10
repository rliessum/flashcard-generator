import { describe, it, expect } from 'vitest';
import { escapeHtml, csvEscape, shuffle, swapSides } from '../src/js/utils.js';

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('does not change safe strings', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('handles numbers by converting to string', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('handles multiple special characters', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'
    );
  });
});

// ─── csvEscape ────────────────────────────────────────────────────────────────

describe('csvEscape', () => {
  it('returns plain value unchanged', () => {
    expect(csvEscape('hello')).toBe('hello');
  });

  it('wraps value with comma in quotes', () => {
    expect(csvEscape('hello, world')).toBe('"hello, world"');
  });

  it('wraps value with newline in quotes', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps value with quote and escapes inner quotes', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('handles empty string', () => {
    expect(csvEscape('')).toBe('');
  });

  it('handles value with all special characters', () => {
    expect(csvEscape('"a,b\nc"')).toBe('"""a,b\nc"""');
  });
});

// ─── shuffle ──────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('returns the same array reference (in-place)', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toBe(arr);
  });

  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    shuffle(arr);
    expect(arr.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('preserves array length', () => {
    const arr = [1, 2, 3];
    shuffle(arr);
    expect(arr).toHaveLength(3);
  });

  it('handles single element array', () => {
    const arr = [42];
    shuffle(arr);
    expect(arr).toEqual([42]);
  });

  it('handles empty array', () => {
    const arr = [];
    shuffle(arr);
    expect(arr).toEqual([]);
  });

  it('actually shuffles (probabilistic — large array)', () => {
    const original = Array.from({ length: 100 }, (_, i) => i);
    const copy = [...original];
    shuffle(copy);
    // Extremely unlikely to remain in exact same order
    const samePosition = copy.filter((v, i) => v === original[i]).length;
    expect(samePosition).toBeLessThan(100);
  });
});

// ─── swapSides ────────────────────────────────────────────────────────────────

describe('swapSides', () => {
  it('swaps front and back of all cards', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ];
    swapSides(cards);
    expect(cards).toEqual([
      { front: 'hallo', back: 'hello' },
      { front: 'kat', back: 'cat' },
    ]);
  });

  it('returns the same array reference', () => {
    const cards = [{ front: 'a', back: 'b' }];
    expect(swapSides(cards)).toBe(cards);
  });

  it('handles empty array', () => {
    const cards = [];
    swapSides(cards);
    expect(cards).toEqual([]);
  });

  it('double swap restores original', () => {
    const cards = [{ front: 'x', back: 'y' }];
    swapSides(cards);
    swapSides(cards);
    expect(cards).toEqual([{ front: 'x', back: 'y' }]);
  });
});
