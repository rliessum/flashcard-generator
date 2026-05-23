const HEROICON_DEFINITIONS = [
  { id: 'none', label: 'None', paths: [] },
  {
    id: 'academic-cap',
    label: 'Academic Cap',
    paths: [
      'M4.26 10.147a60.426 60.426 0 0 1 15.48 0M21 12.75a56.36 56.36 0 0 0-9 0m9 0a56.36 56.36 0 0 1-9 0m9 0v5.25a2.25 2.25 0 0 1-2.25 2.25h-1.386a2.25 2.25 0 0 1-2.122-1.5l-.24-.72a2.25 2.25 0 0 0-2.122-1.5H9.122a2.25 2.25 0 0 0-2.122 1.5l-.24.72a2.25 2.25 0 0 1-2.122 1.5H3.25A2.25 2.25 0 0 1 1 18V12.75m20 0-9-4.5-9 4.5',
    ],
  },
  {
    id: 'book-open',
    label: 'Book Open',
    paths: [
      'M12 6.042A8.967 8.967 0 0 0 6 3.75a8.967 8.967 0 0 0-6 2.292m12 0A8.967 8.967 0 0 1 18 3.75a8.967 8.967 0 0 1 6 2.292m-12 0v13.5m0 0A8.967 8.967 0 0 0 6 17.25a8.967 8.967 0 0 0-6 2.292V6.042m12 13.5A8.967 8.967 0 0 1 18 17.25a8.967 8.967 0 0 1 6 2.292V6.042',
    ],
  },
  {
    id: 'light-bulb',
    label: 'Light Bulb',
    paths: [
      'M12 18v3m-3.75 0h7.5M12 3a6 6 0 0 0-3.75 10.688V15a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5v-1.312A6 6 0 0 0 12 3Z',
    ],
  },
  {
    id: 'rocket-launch',
    label: 'Rocket Launch',
    paths: [
      'M15.59 14.37a6 6 0 0 0-5.84-5.84m5.84 5.84c-1.06 1.06-2.24 2.02-3.53 2.86m3.53-2.86a7.48 7.48 0 0 0 0-10.58 7.48 7.48 0 0 0-10.58 0m10.58 0L12 7.5m0 0a7.48 7.48 0 0 0-10.58 0 7.48 7.48 0 0 0 0 10.58m10.58-10.58c-.84 1.29-1.8 2.47-2.86 3.53m0 0a6 6 0 0 0 5.84 5.84m-5.84-5.84L7.5 12m0 0-3.71 3.71a.75.75 0 0 0 .326 1.275l2.973.85.85 2.973a.75.75 0 0 0 1.275.326L12 16.5m-4.5-4.5L6 10.5',
    ],
  },
  {
    id: 'sparkles',
    label: 'Sparkles',
    paths: [
      'M9.813 15.904 9 18l-.813-2.096L6 15l2.187-.904L9 12l.813 2.096L12 15l-2.187.904ZM18.259 8.715 18 9.5l-.259-.785L17 8.456l.741-.259L18 7.5l.259.697.741.259-.741.259ZM12 3l1.286 3.214L16.5 7.5l-3.214 1.286L12 12l-1.286-3.214L7.5 7.5l3.214-1.286L12 3ZM18 13.5l.964 2.036L21 16.5l-2.036.964L18 19.5l-.964-2.036L15 16.5l2.036-.964L18 13.5Z',
    ],
  },
  {
    id: 'star',
    label: 'Star',
    paths: [
      'm11.48 3.499 2.105 4.264 4.706.684-3.405 3.318.804 4.687L11.5 14.25 7.31 16.452l.804-4.687-3.405-3.318 4.706-.684L11.52 3.5Z',
    ],
  },
  {
    id: 'globe-alt',
    label: 'Globe',
    paths: [
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.485 0 4.5-4.03 4.5-9s-2.015-9-4.5-9m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m-8.68 3h17.36M3.32 16h17.36',
    ],
  },
  {
    id: 'beaker',
    label: 'Beaker',
    paths: [
      'M14.25 3v2.25m0 0v3.378c0 .275.112.54.31.735l5.067 5.068a2.25 2.25 0 0 1-1.591 3.841H5.964a2.25 2.25 0 0 1-1.59-3.84l5.066-5.069a1.04 1.04 0 0 0 .31-.735V5.25m4.5 0h-4.5m4.5 0h1.5m-6 0h-1.5m7.5 6.75h-7.5',
    ],
  },
]

export const DEFAULT_HEROICON_ID = 'none'

export const HEROICON_OPTIONS = HEROICON_DEFINITIONS.map(({ id, label }) => ({ id, label }))

export function getHeroiconDefinition(iconId) {
  const match = HEROICON_DEFINITIONS.find((icon) => icon.id === iconId)
  return match || HEROICON_DEFINITIONS[0]
}

export function getHeroiconPrintMarkup(iconId) {
  const icon = getHeroiconDefinition(iconId)
  if (!icon.paths.length) return ''

  const paths = icon.paths
    .map((path) => `<path stroke-linecap="round" stroke-linejoin="round" d="${path}" />`)
    .join('')

  return `<span class="flashcard-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${paths}</svg></span>`
}
