# Ultimate Flashcards

A modern, installable PWA for creating duplex-ready flashcards at [ultimateflash.cards](https://ultimateflash.cards). Upload CSV or type cards manually, preview with flip animation, then print perfectly aligned double-sided pages.

## Features

- **Rich text markup** — `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[links](https://...)`, and bullet lists in cards
- **CSV import** — drag & drop or paste; auto-detects comma, semicolon, and tab delimiters (including UTF-8 BOM)
- **Manual entry** — fast keyboard-driven input with Enter to advance, Tab between fields, and tab-separated paste support
- **Duplex printing** — pages are pre-mirrored for long-edge duplex printing with perfect front/back registration
- **Live preview** — interactive flip cards with real-time font size and layout changes
- **Flexible layouts** — 2×4 (8 cards) or 2×3 (6 cards) per A4 page
- **Export / Import** — round-trip your cards as CSV at any time
- **Auto-save** — drafts are saved to localStorage
- **5 languages** — English, Dutch, German, French, Spanish
- **PWA** — installable on desktop and mobile. Fully usable offline after first visit (cached assets + localStorage).
- **Dark mode** — full system preference support

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- Vitest + Testing Library (161 tests)
- Custom lightweight markup parser (no external dependencies)
- Service Worker + manifest for PWA

## Development

```bash
npm install
npm run dev          # Starts on http://localhost:3000
```

**Important for HMR stability**: The dev server uses a dedicated WebSocket port (`24678`) for Hot Module Replacement. This greatly reduces WebSocket connection failures on many networks.

```bash
npm test             # Run test suite
npm run build        # Production build (outputs to dist/)
```

### Useful Commands

| Command            | Description                     |
|--------------------|---------------------------------|
| `npm run dev`      | Development server (port 3000)  |
| `npm test`         | Run all tests                   |
| `npm run build`    | Production build                |
| `npm run preview`  | Preview production build locally|

## Project Structure

```
src/
├── App.jsx                 # Main app + print logic
├── components/
│   ├── ErrorBoundary.jsx   # Top-level error recovery UI
│   ├── Step1DataEntry.jsx  # CSV + manual entry
│   ├── Step2Preview.jsx    # Interactive flip preview
│   ├── Step3Print.jsx      # Print controls
│   └── catalyst/           # Vendored UI component library
├── hooks/
│   ├── useFlashcards.js    # Core state + localStorage persistence
│   ├── useI18n.jsx         # Internationalization
│   └── useToast.jsx
├── js/
│   ├── cards.js            # Duplex layout + HTML generation
│   ├── csv.js              # Robust CSV parser
│   ├── utils.js            # escapeHtml, formatCardMarkup, etc.
│   └── i18n.js             # Translations
└── app.css
```

## Usage

1. Enter cards manually or import a CSV.
2. Go to Preview — click any card to flip it.
3. Adjust font size and grid layout as needed.
4. Go to Print → "Print Duplex". A popup window will open with correctly ordered pages.

### CSV Format

```csv
front,back
hello,hallo
goodbye,tot ziens
```

- First row is treated as a header (ignored).
- Supports comma, semicolon, and tab delimiters.
- Quoted fields and embedded newlines are supported.

## Rich Text in Cards

You can use lightweight markup when entering cards:

- `**bold**` or `__bold__`
- `*italic*` or `_italic_`
- `` `code` ``
- `~~strikethrough~~`
- `[link text](https://example.com)`
- Bullet lists: `- item` or `* item`
- Line breaks

Markup is rendered safely in both the preview and the printed output.

## Deployment

```bash
npm run build
netlify deploy --prod --dir=dist
# or any static host (Vercel, Cloudflare Pages, GitHub Pages, etc.)
```

The app is a pure static site after building.

## License

Apache-2.0 — see [LICENSE](LICENSE).

## Security

See [SECURITY.md](SECURITY.md) for the security policy and reporting instructions.
