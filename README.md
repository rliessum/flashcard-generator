# Flashcard Generator

A single-page web app for creating duplex-ready flashcards from CSV files or manual entry. Print double-sided with perfect front–back alignment — ready to cut and study.

## Features

- **CSV upload** — drag-and-drop or browse; auto-detects comma, semicolon & tab delimiters
- **Manual entry** — type cards directly with Enter-key navigation and tab-separated paste support
- **Duplex printing** — pages pre-arranged for long-edge duplex with correct front/back alignment
- **Interactive preview** — click any card to flip and see both sides
- **Print settings** — adjustable font size, grid layout (2×4 or 2×3), shuffle, swap sides
- **Export** — download manual cards as CSV
- **Auto-save** — manual cards persist in localStorage
- **Mobile-friendly** — responsive layout with touch-optimised controls

## Project Structure

```
├── index.html       # Entire application (HTML + CSS + JS)
├── data/            # Sample CSV files
│   ├── sample.csv   # English → Dutch vocabulary
│   └── duits.csv    # German → Dutch conjugations
├── netlify.toml     # Netlify deployment config
├── .gitignore
└── README.md
```

## Usage

Open `index.html` in a browser — no build step or dependencies required.

### CSV Format

Two columns, first row is the header:

```csv
front,back
hello,hallo
goodbye,tot ziens
```

Semicolons, commas, and tabs are auto-detected.

## Deployment

Hosted on Netlify as a static site:

```sh
netlify deploy --prod
```

## License

MIT
