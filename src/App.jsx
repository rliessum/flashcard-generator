import React, { useState, useCallback, useRef, useEffect } from 'react'
import { LANGS, I18N, t } from './js/i18n'
import { parseCSV, countDuplicates, buildCSVString } from './js/csv'
import { shuffle as shuffleArray, swapSides, escapeHtml, csvEscape } from './js/utils'
import { I18nProvider, useI18n } from './hooks/useI18n'
import { ToastProvider, useToast } from './hooks/useToast'
import StepNav from './components/StepNav'
import Step1DataEntry from './components/Step1DataEntry'
import Step2Preview from './components/Step2Preview'
import Step3Print from './components/Step3Print'
import ThemeToggle from './components/ThemeToggle'
import LanguagePicker from './components/LanguagePicker'
import ToastContainer from './components/ToastContainer'

function AppInner() {
  const { lang, setLang, t } = useI18n()
  const { addToast } = useToast()

  // ── State ──────────────────────────────────────────────────
  const [flashcards, setFlashcards] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [printFontSize, setPrintFontSize] = useState(18)
  const [gridLayout, setGridLayout] = useState('2x4')
  const [manualCards, setManualCards] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fc_manual') || '[]')
      return saved.length ? saved : [{ front: '', back: '' }]
    } catch {
      return [{ front: '', back: '' }]
    }
  })

  const prevCardsRef = useRef(null)
  const printAreaRef = useRef(null)

  const cardsPerPage = gridLayout === '2x3' ? 6 : 8

  // Auto-save manual cards
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem('fc_manual', JSON.stringify(manualCards)) } catch {}
    }, 400)
    return () => clearTimeout(timer)
  }, [manualCards])

  // ── Step navigation ────────────────────────────────────────
  const collectCards = useCallback(() => {
    return manualCards.filter(c => c.front.trim() && c.back.trim())
      .map(c => ({ front: c.front.trim(), back: c.back.trim() }))
  }, [manualCards])

  const goToStep = useCallback((step) => {
    if (step < 1 || step > 3) return

    if (step > 1) {
      let cards = flashcards
      if (!cards.length) {
        cards = collectCards()
        if (!cards.length) {
          addToast(t('enterOneCard'), 'error')
          return
        }
        setFlashcards(cards)
      }
      // Check duplicates on first forward move
      if (step === 2 && currentStep === 1) {
        const dupes = countDuplicates(cards.length ? cards : collectCards())
        if (dupes > 0) addToast(t('dupesDetected', dupes), 'warning')
        addToast(t('generatedCards', (cards.length || collectCards().length)), 'success')
      }
    }

    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [flashcards, collectCards, currentStep, addToast, t])

  // ── CSV handling ───────────────────────────────────────────
  const handleCSVParsed = useCallback((text) => {
    const result = parseCSV(text)
    if (result.error) {
      addToast(t(result.error), 'error')
      return
    }
    setFlashcards(result.cards)
    const dupes = countDuplicates(result.cards)
    if (dupes > 0) addToast(t('dupesDetected', dupes), 'warning')
    addToast(t('loadedCards', result.cards.length), 'success')
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [addToast, t])

  // ── Card operations ────────────────────────────────────────
  const handleShuffle = useCallback(() => {
    if (flashcards.length < 2) return
    setFlashcards(prev => shuffleArray([...prev]))
    addToast(t('cardsShuffled'), 'success')
  }, [flashcards.length, addToast, t])

  const handleSwap = useCallback(() => {
    if (!flashcards.length) return
    setFlashcards(prev => {
      const copy = prev.map(c => ({ ...c }))
      swapSides(copy)
      return copy
    })
    addToast(t('sidesSwapped'), 'success')
  }, [flashcards.length, addToast, t])

  const handleExportCSV = useCallback(() => {
    const cards = flashcards.length ? flashcards : collectCards()
    if (!cards.length) { addToast(t('noCardsExport'), 'warning'); return }
    const csvString = buildCSVString(cards, csvEscape)
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'flashcards.csv'; a.click()
    URL.revokeObjectURL(url)
    addToast(t('exportedCards', cards.length), 'success')
  }, [flashcards, collectCards, addToast, t])

  const handleClear = useCallback(() => {
    prevCardsRef.current = [...flashcards]
    setFlashcards([])
    addToast(t('clearedCards', prevCardsRef.current.length), 'warning')
  }, [flashcards, addToast, t])

  const handleStartOver = useCallback(() => {
    prevCardsRef.current = [...flashcards]
    setFlashcards([])
    setCurrentStep(1)
    if (prevCardsRef.current.length) {
      addToast(t('clearedCards', prevCardsRef.current.length), 'warning')
    }
  }, [flashcards, addToast, t])

  // ── Print ──────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const cols = 2
    const rows = cardsPerPage / cols
    const pages = Math.ceil(flashcards.length / cardsPerPage)
    const gridCls = gridLayout === '2x3' ? 'grid-2x3' : 'grid-2x4'

    // Build duplex HTML
    let html = ''
    for (let p = 0; p < pages; p++) {
      const pageCards = Array.from({ length: cardsPerPage }, (_, i) => {
        const idx = p * cardsPerPage + i
        return idx < flashcards.length ? flashcards[idx] : null
      })

      // Front
      html += `<div class="flashcard-container ${gridCls}">`
      pageCards.forEach(c => {
        html += c
          ? `<div class="flashcard flashcard-front" style="font-size:${printFontSize}pt">${escapeHtml(c.front)}</div>`
          : '<div class="flashcard"></div>'
      })
      html += '</div>'

      // Back (mirrored)
      html += `<div class="flashcard-container ${gridCls}">`
      for (let r = 0; r < rows; r++) {
        for (let c = cols - 1; c >= 0; c--) {
          const card = pageCards[r * cols + c]
          html += card
            ? `<div class="flashcard flashcard-back" style="font-size:${printFontSize}pt">${escapeHtml(card.back)}</div>`
            : '<div class="flashcard"></div>'
        }
      }
      html += '</div>'
    }

    const doc = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${t('title')}</title>
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
  .flashcard-container.grid-2x4 { grid-template-rows: repeat(4, 1fr); }
  .flashcard-container.grid-2x3 { grid-template-rows: repeat(3, 1fr); }
  .flashcard {
    width: 100%; height: 100%;
    border: 1px solid #000;
    display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 8mm;
    page-break-inside: avoid;
    color: #000; font-family: inherit;
  }
  .flashcard-front { background: #fff; }
  .flashcard-back  { background: #f5f5f5; }
</style>
</head>
<body>${html}</body>
</html>`

    const win = window.open('', '_blank')
    if (!win) {
      addToast(t('popupBlocked') || 'Popup blocked', 'error')
      return
    }
    win.document.open()
    win.document.write(doc)
    win.document.close()
    const printNow = () => { win.focus(); win.print() }
    if (win.document.fonts?.ready) {
      win.document.fonts.ready.then(printNow).catch(printNow)
    } else {
      setTimeout(printNow, 100)
    }
  }, [flashcards, cardsPerPage, gridLayout, printFontSize, lang, t, addToast])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-200">
      <div className="no-print">
        {/* ── Header ──────────────────────────────────────────── */}
        <header className="text-center pt-12 sm:pt-16 pb-6 px-4">
          <div className="flex justify-end items-center gap-2 mb-4 max-w-3xl mx-auto">
            <ThemeToggle />
            <LanguagePicker />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white uppercase">
            {t('title')}
          </h1>
        </header>

        {/* ── Step Navigation ─────────────────────────────────── */}
        <StepNav currentStep={currentStep} goToStep={goToStep} />

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          {currentStep === 1 && (
            <Step1DataEntry
              manualCards={manualCards}
              setManualCards={setManualCards}
              onCSVParsed={handleCSVParsed}
              onExportCSV={handleExportCSV}
              onClear={handleClear}
              flashcards={flashcards}
              goToStep={goToStep}
              collectCards={collectCards}
              setFlashcards={setFlashcards}
            />
          )}

          {currentStep === 2 && (
            <Step2Preview
              flashcards={flashcards}
              printFontSize={printFontSize}
              setPrintFontSize={setPrintFontSize}
              gridLayout={gridLayout}
              setGridLayout={setGridLayout}
              cardsPerPage={cardsPerPage}
              onShuffle={handleShuffle}
              onSwap={handleSwap}
              goToStep={goToStep}
            />
          )}

          {currentStep === 3 && (
            <Step3Print
              flashcards={flashcards}
              cardsPerPage={cardsPerPage}
              onPrint={handlePrint}
              onExportCSV={handleExportCSV}
              onStartOver={handleStartOver}
              goToStep={goToStep}
            />
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="text-center py-8 px-4">
          <p className="text-xs font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
            Flashcard Generator &copy; 2026
          </p>
        </footer>
      </div>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </I18nProvider>
  )
}
