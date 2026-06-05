import { escapeHtml } from './utils'
import { CARD_MARKUP_CSS } from './utils'
import { isSupported } from './i18n'
import { buildDuplexHTML } from './cards'

/**
 * Generates a complete, self-contained HTML document for printing.
 * This keeps the giant template out of App.jsx.
 */
export function generatePrintDocument(flashcards, {
  cardsPerPage,
  gridLayout,
  fontSize,
  iconId,
  lang,
  t,
}) {
  const html = buildDuplexHTML(flashcards, {
    cardsPerPage,
    gridLayout,
    fontSize,
    iconId,
  })

  const printLang = isSupported(lang) ? lang : 'en'

  return `<!DOCTYPE html>
<html lang="${printLang}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(t('title'))}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .flashcard-container {
    page-break-after: always;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10mm; padding: 15mm;
    width: 210mm; height: 297mm;
  }
  .flashcard-container.grid-2x6 { grid-template-rows: repeat(6, 1fr); }
  .flashcard-container.grid-2x5 { grid-template-rows: repeat(5, 1fr); }
  .flashcard-container.grid-2x4 { grid-template-rows: repeat(4, 1fr); }
  .flashcard-container.grid-2x3 { grid-template-rows: repeat(3, 1fr); }
  .flashcard {
    width: 100%; height: 100%;
    border: 1px solid #000;
    position: relative;
    display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 8mm;
    page-break-inside: avoid;
    color: #000; font-family: inherit;
  }
  .flashcard-text {
    display: block;
    max-width: 100%;
    line-height: 1.35;
  }
  ${CARD_MARKUP_CSS}
  .flashcard-icon {
    position: absolute;
    top: 4mm;
    right: 4mm;
    width: 6mm;
    height: 6mm;
    color: #52525b;
  }
  .flashcard-icon svg {
    width: 100%;
    height: 100%;
  }
  .flashcard-front { background: #fff; }
  .flashcard-back  {
    background: #f4f4f5;
    /* Very faint pattern for clear front/back distinction when printed */
    background-image: repeating-linear-gradient(
      135deg,
      rgba(0,0,0,0.018) 0 1px,
      transparent 1px 4px
    );
  }
</style>
</head>
<body>${html}</body>
</html>`
}
