import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  formatCardMarkup,
  csvEscape,
  shuffle,
  swapSides,
  clampFontSize,
  exceedsCsvLimit,
  MAX_CSV_BYTES,
} from '../src/js/utils.js';

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

describe('formatCardMarkup', () => {
  it('renders bold and italic markup', () => {
    expect(formatCardMarkup('**bold** and *italic*')).toBe('<strong>bold</strong> and <em>italic</em>');
  });

  it('keeps unknown HTML escaped', () => {
    expect(formatCardMarkup('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('supports line breaks', () => {
    expect(formatCardMarkup('line 1\nline 2')).toBe('line 1<br />line 2');
  });

  it('renders safe http links', () => {
    expect(formatCardMarkup('[site](https://example.com)')).toContain('<a href="https://example.com"');
  });

  it('renders bullet lists', () => {
    expect(formatCardMarkup('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('renders __bold__ and _italic_ variants', () => {
    expect(formatCardMarkup('__bold__ and _italic_')).toBe('<strong>bold</strong> and <em>italic</em>');
  });

  it('keeps markup literal inside code spans (no inner formatting)', () => {
    expect(formatCardMarkup('`**not bold**`')).toBe('<code>**not bold**</code>');
    expect(formatCardMarkup('`*code*`')).toBe('<code>*code*</code>');
  });

  it('does not create links with dangerous characters in the URL (quote breaks the regex match after escape)', () => {
    const html = formatCardMarkup('[x](https://ex.com/" onclick="alert(1))');
    // Because " becomes &quot; before the link regex runs, the URL no longer matches the pattern.
    // Result: the dangerous payload stays as plain (escaped) text — safe.
    expect(html).not.toContain('<a');
    // The literal word "onclick" may appear inside the escaped text content (safe).
    // The important thing is no <a href="...onclick..."> was ever emitted.
    expect(html).toContain('https://ex.com/&quot;');
  });

  it('supports links with query strings and fragments', () => {
    const html = formatCardMarkup('[ref](https://ex.com/a?b=1#sec)');
    expect(html).toContain('<a href="https://ex.com/a?b=1#sec"');
  });

  it('renders lists containing inline markup', () => {
    const html = formatCardMarkup('- **bold** item\n- `code` item');
    expect(html).toBe('<ul><li><strong>bold</strong> item</li><li><code>code</code> item</li></ul>');
  });

  it('handles mixed formatting and links', () => {
    expect(formatCardMarkup('**bold [link](https://x.com)**')).toContain('<strong>bold <a href="https://x.com"');
  });

  it('applies inline formatting inside link labels (current design)', () => {
    const html = formatCardMarkup('[see **this** page](https://ex.com)');
    expect(html).toContain('<a href="https://ex.com" target="_blank" rel="noreferrer noopener">see <strong>this</strong> page</a>');
  });

  it('leaves unclosed delimiters literal (regex requires matching closer)', () => {
    expect(formatCardMarkup('**open bold')).toBe('**open bold');
    expect(formatCardMarkup('`open code')).toBe('`open code');
  });

  it('produces safe output for attempted XSS in various positions', () => {
    const bad = '<img src=x onerror=alert(1)> **bold** `code` [x](javascript:alert(2))';
    const out = formatCardMarkup(bad);
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<a href="javascript:');
    // Dangerous attribute/event payloads remain as literal (escaped) text — never turned into executable HTML.
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(out).toContain('javascript:alert(2)');
    expect(out).toContain('<strong>bold</strong>');
  });

  // Additional adversarial & edge case coverage
  it('handles multiple lists and paragraphs correctly', () => {
    const input = '- first\n- second\n\nSome text after\n- another list';
    const html = formatCardMarkup(input);
    expect(html).toContain('<ul><li>first</li><li>second</li></ul>');
    expect(html).toContain('Some text after');
    expect(html).toContain('<ul><li>another list</li></ul>');
  });

  it('escapes dangerous content inside lists', () => {
    const html = formatCardMarkup('- <script>alert(1)</script>');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
  });

  it('supports very long input without crashing', () => {
    const long = 'word '.repeat(2000) + '**bold**';
    const html = formatCardMarkup(long);
    expect(html).toContain('<strong>bold</strong>');
  });

  it('handles mixed ** and __ on same line', () => {
    expect(formatCardMarkup('**bold** and __also bold__')).toBe('<strong>bold</strong> and <strong>also bold</strong>');
  });

  it('does not break on empty or whitespace-only input', () => {
    expect(formatCardMarkup('')).toBe('');
    // Whitespace-only input is preserved as text + breaks (acceptable behavior)
    const ws = formatCardMarkup('   \n\n  ');
    expect(ws).toContain('<br />');
  });

  it('preserves order of complex mixed markup', () => {
    const html = formatCardMarkup('**bold** `code` *italic* [link](https://x.com) ~~strike~~');
    expect(html).toMatch(/<strong>bold<\/strong>.*<code>code<\/code>.*<em>italic<\/em>.*<a href="https:\/\/x.com".*strike/);
  });
});

// ─── clampFontSize ────────────────────────────────────────────────────────────

describe('clampFontSize', () => {
  it('clamps to min/max range', () => {
    expect(clampFontSize(5)).toBe(10);
    expect(clampFontSize(99)).toBe(28);
    expect(clampFontSize(18)).toBe(18);
  });

  it('rounds fractional values', () => {
    expect(clampFontSize(18.7)).toBe(19);
  });

  it('rejects non-numeric input', () => {
    expect(clampFontSize('18pt; background:url(javascript:alert(1))')).toBe(10);
    expect(clampFontSize(NaN)).toBe(10);
  });
});

describe('exceedsCsvLimit', () => {
  it('returns false under the limit', () => {
    expect(exceedsCsvLimit('a,b\n')).toBe(false);
  });

  it('returns true over the limit', () => {
    const big = 'x'.repeat(MAX_CSV_BYTES + 1);
    expect(exceedsCsvLimit(big)).toBe(true);
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
