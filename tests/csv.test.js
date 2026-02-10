import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseCSVLine,
  parseCSV,
  countDuplicates,
  buildCSVString,
} from '../src/js/csv.js';
import { csvEscape } from '../src/js/utils.js';

// ─── detectDelimiter ──────────────────────────────────────────────────────────

describe('detectDelimiter', () => {
  it('detects comma delimiter', () => {
    expect(detectDelimiter('front,back\nhello,world')).toBe(',');
  });

  it('detects semicolon delimiter', () => {
    expect(detectDelimiter('front;back\nhello;world')).toBe(';');
  });

  it('detects tab delimiter', () => {
    expect(detectDelimiter('front\tback\nhello\tworld')).toBe('\t');
  });

  it('prefers tab when tab count equals comma count', () => {
    expect(detectDelimiter('a\tb,c\td,e')).toBe('\t');
  });

  it('prefers semicolon over comma when semicolon count is higher', () => {
    expect(detectDelimiter('a;b;c,d')).toBe(';');
  });

  it('defaults to comma when no delimiters found', () => {
    expect(detectDelimiter('hello')).toBe(',');
  });

  it('ignores delimiters inside quoted fields', () => {
    // The comma inside quotes should not be counted
    expect(detectDelimiter('"hello, world"\tback')).toBe('\t');
  });

  it('uses first non-empty line for detection', () => {
    expect(detectDelimiter('\n\nfront;back\nhello;world')).toBe(';');
  });

  it('handles empty string', () => {
    expect(detectDelimiter('')).toBe(',');
  });
});

// ─── parseCSVLine ─────────────────────────────────────────────────────────────

describe('parseCSVLine', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCSVLine('hello,world')).toEqual(['hello', 'world']);
  });

  it('parses semicolon-separated values', () => {
    expect(parseCSVLine('hello;world', ';')).toEqual(['hello', 'world']);
  });

  it('parses tab-separated values', () => {
    expect(parseCSVLine('hello\tworld', '\t')).toEqual(['hello', 'world']);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCSVLine('"hello, world",test')).toEqual(['hello, world', 'test']);
  });

  it('handles escaped quotes inside quoted fields', () => {
    expect(parseCSVLine('"say ""hi""",test')).toEqual(['say "hi"', 'test']);
  });

  it('trims whitespace around values', () => {
    expect(parseCSVLine('  hello , world  ')).toEqual(['hello', 'world']);
  });

  it('handles empty fields', () => {
    expect(parseCSVLine(',,')).toEqual(['', '', '']);
  });

  it('handles single field', () => {
    expect(parseCSVLine('hello')).toEqual(['hello']);
  });

  it('handles empty string', () => {
    expect(parseCSVLine('')).toEqual(['']);
  });

  it('handles multi-word quoted fields', () => {
    expect(parseCSVLine('"to put on",aandoen')).toEqual(['to put on', 'aandoen']);
  });

  it('handles three columns (takes first two for cards)', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });
});

// ─── parseCSV ─────────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses standard CSV with header', () => {
    const csv = 'front,back\nhello,hallo\ncat,kat';
    const { cards, error } = parseCSV(csv);
    expect(error).toBeNull();
    expect(cards).toEqual([
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ]);
  });

  it('skips rows with missing front or back', () => {
    const csv = 'front,back\nhello,hallo\n,missing\nempty,';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([{ front: 'hello', back: 'hallo' }]);
  });

  it('handles Windows-style line endings (\\r\\n)', () => {
    const csv = 'front,back\r\nhello,hallo\r\ncat,kat';
    const { cards } = parseCSV(csv);
    expect(cards).toHaveLength(2);
  });

  it('returns error for single-column CSV', () => {
    const csv = 'word\nhello\nworld';
    const { cards, error } = parseCSV(csv);
    expect(error).toBe('csvMin2Cols');
    expect(cards).toEqual([]);
  });

  it('returns error when no valid data rows', () => {
    const csv = 'front,back\n,\n,';
    const { cards, error } = parseCSV(csv);
    expect(error).toBe('noValidData');
  });

  it('handles semicolon-delimited CSV', () => {
    const csv = 'english;dutch\ncap;pet\nshoes;schoenen';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([
      { front: 'cap', back: 'pet' },
      { front: 'shoes', back: 'schoenen' },
    ]);
  });

  it('handles tab-delimited CSV', () => {
    const csv = 'english\tdutch\ncap\tpet';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([{ front: 'cap', back: 'pet' }]);
  });

  it('handles quoted fields with embedded delimiters', () => {
    const csv = 'front,back\n"to put on",aandoen\n"short, brief",kort';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([
      { front: 'to put on', back: 'aandoen' },
      { front: 'short, brief', back: 'kort' },
    ]);
  });

  it('handles UTF-8 BOM in header', () => {
    const csv = '\uFEFFfront,back\nhello,hallo';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([{ front: 'hello', back: 'hallo' }]);
  });

  it('handles blank lines between rows', () => {
    const csv = 'front,back\n\nhello,hallo\n\ncat,kat\n';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ]);
  });

  it('handles quoted fields with newlines', () => {
    const csv = 'front,back\n"hello\nworld",hallo';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([{ front: 'hello\nworld', back: 'hallo' }]);
  });

  it('handles leading/trailing whitespace in CSV', () => {
    const csv = '  front , back \n  hello , world  ';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([{ front: 'hello', back: 'world' }]);
  });

  it('handles large CSV with many rows', () => {
    const rows = ['front,back'];
    for (let i = 0; i < 500; i++) {
      rows.push(`word${i},translation${i}`);
    }
    const { cards } = parseCSV(rows.join('\n'));
    expect(cards).toHaveLength(500);
    expect(cards[0]).toEqual({ front: 'word0', back: 'translation0' });
    expect(cards[499]).toEqual({ front: 'word499', back: 'translation499' });
  });

  it('handles CSV with extra columns (ignores beyond first two)', () => {
    const csv = 'front,back,notes\nhello,hallo,greeting\ncat,kat,animal';
    const { cards } = parseCSV(csv);
    expect(cards).toEqual([
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ]);
  });
});

// ─── countDuplicates ──────────────────────────────────────────────────────────

describe('countDuplicates', () => {
  it('returns 0 for unique cards', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ];
    expect(countDuplicates(cards)).toBe(0);
  });

  it('detects exact duplicates', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'hello', back: 'hallo' },
    ];
    expect(countDuplicates(cards)).toBe(1);
  });

  it('detects case-insensitive duplicates', () => {
    const cards = [
      { front: 'Hello', back: 'Hallo' },
      { front: 'hello', back: 'hallo' },
    ];
    expect(countDuplicates(cards)).toBe(1);
  });

  it('counts multiple duplicate occurrences', () => {
    const cards = [
      { front: 'a', back: 'b' },
      { front: 'a', back: 'b' },
      { front: 'a', back: 'b' },
    ];
    expect(countDuplicates(cards)).toBe(2);
  });

  it('handles empty array', () => {
    expect(countDuplicates([])).toBe(0);
  });

  it('treats different fronts with same back as unique', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'hi', back: 'hallo' },
    ];
    expect(countDuplicates(cards)).toBe(0);
  });
});

// ─── buildCSVString ───────────────────────────────────────────────────────────

describe('buildCSVString', () => {
  it('builds CSV with header and data', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: 'cat', back: 'kat' },
    ];
    const result = buildCSVString(cards, csvEscape);
    expect(result).toBe('front,back\nhello,hallo\ncat,kat');
  });

  it('escapes values with commas', () => {
    const cards = [{ front: 'hello, world', back: 'hallo' }];
    const result = buildCSVString(cards, csvEscape);
    expect(result).toBe('front,back\n"hello, world",hallo');
  });

  it('skips cards with both sides empty', () => {
    const cards = [
      { front: 'hello', back: 'hallo' },
      { front: '', back: '' },
    ];
    const result = buildCSVString(cards, csvEscape);
    expect(result).toBe('front,back\nhello,hallo');
  });

  it('includes cards with one side filled', () => {
    const cards = [{ front: 'hello', back: '' }];
    const result = buildCSVString(cards, csvEscape);
    expect(result).toBe('front,back\nhello,');
  });

  it('handles empty card array', () => {
    const result = buildCSVString([], csvEscape);
    expect(result).toBe('front,back');
  });
});
