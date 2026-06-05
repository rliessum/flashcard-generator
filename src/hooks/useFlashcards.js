import { useCallback, useEffect, useMemo, useState } from 'react'

const EMPTY_CARD_ROW = { front: '', back: '' }
const ICON_STORAGE_KEY = 'fc_icon'
const DEFAULT_ICON_ID = 'none'

function sanitizeCards(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter((card) => card && typeof card.front === 'string' && typeof card.back === 'string')
    .map((card) => ({ front: card.front, back: card.back }))
}

function getInitialManualCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem('fc_manual') || '[]')
    const sanitized = sanitizeCards(parsed)
    return sanitized.length ? sanitized : [EMPTY_CARD_ROW]
  } catch {
    return [EMPTY_CARD_ROW]
  }
}

function toManualRows(cards) {
  return cards.length ? cards : [EMPTY_CARD_ROW]
}

export function useFlashcards() {
  const [flashcards, setFlashcardsState] = useState([])
  const [manualCards, setManualCards] = useState(getInitialManualCards)
  const [selectedIconId, setSelectedIconId] = useState(() => {
    try {
      return localStorage.getItem(ICON_STORAGE_KEY) || DEFAULT_ICON_ID
    } catch {
      return DEFAULT_ICON_ID
    }
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('fc_manual', JSON.stringify(manualCards))
      } catch (err) {
        // Handle storage quota or private mode errors more explicitly
        if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.warn('[Flashcards] localStorage quota exceeded — cards will not persist.')
          window.dispatchEvent(new CustomEvent('storage-quota-exceeded'))
        }
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [manualCards])

  useEffect(() => {
    try {
      localStorage.setItem(ICON_STORAGE_KEY, selectedIconId || DEFAULT_ICON_ID)
    } catch {
      // Ignore storage quota/private mode errors.
    }
  }, [selectedIconId])

  const collectCards = useCallback(() => {
    return manualCards
      .filter((card) => card.front.trim() && card.back.trim())
      .map((card) => ({ front: card.front.trim(), back: card.back.trim() }))
  }, [manualCards])

  const setFlashcards = useCallback((nextOrUpdater) => {
    setFlashcardsState((current) => {
      const nextInput = typeof nextOrUpdater === 'function'
        ? nextOrUpdater(current)
        : nextOrUpdater
      const nextCards = sanitizeCards(nextInput)
      setManualCards(toManualRows(nextCards))
      return nextCards
    })
  }, [])

  const clearAllCards = useCallback(() => {
    setFlashcardsState([])
    setManualCards([EMPTY_CARD_ROW])
    setSelectedIconId(DEFAULT_ICON_ID)
    try {
      localStorage.removeItem('fc_manual')
      localStorage.removeItem(ICON_STORAGE_KEY)
    } catch {
      // Ignore storage quota/private mode errors.
    }
  }, [])

  const hasAnyCards = useMemo(() => {
    return flashcards.length > 0 ||
      manualCards.some((card) => card.front.trim() || card.back.trim())
  }, [flashcards, manualCards])

  return {
    flashcards,
    setFlashcards,
    manualCards,
    setManualCards,
    selectedIconId,
    setSelectedIconId,
    collectCards,
    clearAllCards,
    hasAnyCards,
  }
}
