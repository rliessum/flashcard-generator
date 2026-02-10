/**
 * CSV parsing module for the Flashcard Generator
 */

/**
 * Auto-detect the delimiter used in CSV text (tab, semicolon, or comma)
 * @param {string} text - Raw CSV content
 * @returns {string} The detected delimiter character
 */
export function detectDelimiter(text) {
  const lines = String(text ?? '').split(/\r?\n/);
  let firstLine = lines.find((line) => line.trim().length > 0) ?? '';
  if (firstLine.startsWith('\uFEFF')) firstLine = firstLine.slice(1);
  const counts = { '\t': 0, ';': 0, ',': 0 };
  let inQ = false;
  for (const ch of firstLine) {
    if (ch === '"') inQ = !inQ;
    else if (!inQ && ch in counts) counts[ch]++;
  }
  if (counts['\t'] > 0 && counts['\t'] >= counts[','] && counts['\t'] >= counts[';']) return '\t';
  if (counts[';'] > counts[',']) return ';';
  return ',';
}

function normalizeCsvText(raw) {
  let text = String(raw ?? '');
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  return text;
}

function parseCSVRecords(text, delim = ',') {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === delim && !inQ) {
      row.push(cur.trim());
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQ) {
      row.push(cur.trim());
      cur = '';
      if (ch === '\r' && text[i + 1] === '\n') i++;
      rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }

  row.push(cur.trim());
  rows.push(row);
  return rows;
}

/**
 * Parse a single CSV line respecting quoted fields
 * @param {string} line - A single line of CSV text
 * @param {string} delim - The delimiter character
 * @returns {string[]} Array of field values
 */
export function parseCSVLine(line, delim = ',') {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === delim && !inQ) {
      result.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  result.push(cur.trim());
  return result;
}

/**
 * Parse full CSV text into an array of flashcard objects
 * @param {string} text - Raw CSV content (with header row)
 * @returns {{ cards: Array<{front: string, back: string}>, error: string|null }}
 */
export function parseCSV(text) {
  const normalized = normalizeCsvText(text);
  const delim = detectDelimiter(normalized);
  const rows = parseCSVRecords(normalized, delim);
  const headerIndex = rows.findIndex((row) => row.some((cell) => cell !== ''));

  if (headerIndex === -1 || rows[headerIndex].length < 2) {
    return { cards: [], error: 'csvMin2Cols' };
  }

  const cards = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length >= 2 && row[0] && row[1]) {
      cards.push({ front: row[0], back: row[1] });
    }
  }

  if (!cards.length) {
    return { cards: [], error: 'noValidData' };
  }

  return { cards, error: null };
}

/**
 * Detect duplicate cards in an array
 * @param {Array<{front: string, back: string}>} cards
 * @returns {number} Number of duplicates found
 */
export function countDuplicates(cards) {
  const seen = new Map();
  let dupes = 0;
  cards.forEach((c) => {
    const key = `${c.front.toLowerCase()}|${c.back.toLowerCase()}`;
    if (seen.has(key)) {
      dupes++;
    } else {
      seen.set(key, true);
    }
  });
  return dupes;
}

/**
 * Build CSV string from card data
 * @param {Array<{front: string, back: string}>} cards
 * @param {function} escapeFn - CSV escape function
 * @returns {string}
 */
export function buildCSVString(cards, escapeFn) {
  const rows = [['front', 'back']];
  cards.forEach((c) => {
    if (c.front || c.back) {
      rows.push([escapeFn(c.front), escapeFn(c.back)]);
    }
  });
  return rows.map((r) => r.join(',')).join('\n');
}
