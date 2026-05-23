import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { parseCSV, countDuplicates, buildCSVString } from './js/csv'
import { shuffle as shuffleArray, swapSides, csvEscape, escapeHtml, exceedsCsvLimit } from './js/utils'
import { isSupported } from './js/i18n'
import { buildDuplexHTML } from './js/cards'
import { I18nProvider, useI18n } from './hooks/useI18n'
import { ToastProvider, useToast } from './hooks/useToast'
import StepNav from './components/StepNav'
import Step1DataEntry from './components/Step1DataEntry'
import ThemeToggle from './components/ThemeToggle'
import LanguagePicker from './components/LanguagePicker'
import ToastContainer from './components/ToastContainer'
import { Dialog, DialogActions, DialogDescription, DialogTitle } from './components/catalyst/dialog'
import { Button } from './components/catalyst/button'

// Lazy-loaded step components (only loaded when the user navigates to them)
const Step2Preview = lazy(() => import('./components/Step2Preview'))
const Step3Print = lazy(() => import('./components/Step3Print'))

function StepLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200" />
    </div>
  )
}

function AppInner() {
  const { lang, t } = useI18n()
  const { addToast } = useToast()

  // ── State ──────────────────────────────────────────────────
  const [flashcards, setFlashcards] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [printFontSize, setPrintFontSize] = useState(18)
  const [gridLayout, setGridLayout] = useState('2x4')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [manualCards, setManualCards] = useState(() => {
    const empty = [{ front: '', back: '' }]
    try {
      const parsed = JSON.parse(localStorage.getItem('fc_manual') || '[]')
      // Reject anything that isn't a strictly-shaped {front, back} array — guards
      // against tampered localStorage values being interpreted as cards.
      if (!Array.isArray(parsed)) return empty
      const sanitized = parsed
        .filter((c) => c && typeof c.front === 'string' && typeof c.back === 'string')
        .map((c) => ({ front: c.front, back: c.back }))
      return sanitized.length ? sanitized : empty
    } catch {
      return empty
    }
  })

  // True when any card data exists (manual entries with content OR generated cards)
  const hasAnyCards = flashcards.length > 0 ||
    manualCards.some(c => c.front.trim() || c.back.trim())

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
        const dupes = countDuplicates(cards)
        if (dupes > 0) addToast(t('dupesDetected', dupes), 'warning')
        addToast(t('generatedCards', cards.length), 'success')
      }
    }

    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [flashcards, collectCards, currentStep, addToast, t])

  // ── CSV handling ───────────────────────────────────────────
  const handleCSVParsed = useCallback((text) => {
    if (exceedsCsvLimit(text)) {
      addToast(t('csvTooLarge'), 'error')
      return
    }
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

  // Open the confirmation dialog; no-op when there's nothing to clear.
  const requestClearAll = useCallback(() => {
    if (!hasAnyCards) return
    setShowClearConfirm(true)
  }, [hasAnyCards])

  // Wipes every card source: generated cards, manual rows, and the saved draft.
  const handleClearAll = useCallback(() => {
    const totalCleared = flashcards.length +
      manualCards.filter(c => c.front.trim() || c.back.trim()).length

    setFlashcards([])
    setManualCards([{ front: '', back: '' }])
    try { localStorage.removeItem('fc_manual') } catch {}
    setCurrentStep(1)
    setShowClearConfirm(false)
    if (totalCleared > 0) {
      addToast(t('clearedCards', totalCleared), 'warning')
    }
  }, [flashcards, manualCards, addToast, t])

  // ── Print ──────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const gridCls = gridLayout === '2x3' ? 'grid-2x3' : 'grid-2x4'
    const html = buildDuplexHTML(flashcards, {
      cardsPerPage, gridLayout, fontSize: printFontSize,
    })

    const printLang = isSupported(lang) ? lang : 'en'
    const doc = `<!DOCTYPE html>
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

    // Use a Blob URL instead of document.write — the popup loads its own
    // same-origin document, so it inherits a strict CSP and avoids the
    // document.write footgun.
    const blob = new Blob([doc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (!win) {
      URL.revokeObjectURL(url)
      addToast(t('popupBlocked') || 'Popup blocked', 'error')
      return
    }
    const triggerPrint = () => {
      const printNow = () => { win.focus(); win.print() }
      if (win.document.fonts?.ready) {
        win.document.fonts.ready.then(printNow).catch(printNow)
      } else {
        setTimeout(printNow, 100)
      }
    }
    const cleanup = () => URL.revokeObjectURL(url)
    if (win.document.readyState === 'complete') {
      triggerPrint()
      setTimeout(cleanup, 5000)
    } else {
      win.addEventListener('load', () => { triggerPrint(); setTimeout(cleanup, 5000) }, { once: true })
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
              onClearAll={requestClearAll}
              hasAnyCards={hasAnyCards}
              flashcards={flashcards}
              goToStep={goToStep}
              collectCards={collectCards}
              setFlashcards={setFlashcards}
            />
          )}

          {currentStep === 2 && (
            <Suspense fallback={<StepLoadingFallback />}>
              <Step2Preview
                flashcards={flashcards}
                printFontSize={printFontSize}
                setPrintFontSize={setPrintFontSize}
                gridLayout={gridLayout}
                setGridLayout={setGridLayout}
                cardsPerPage={cardsPerPage}
                onShuffle={handleShuffle}
                onSwap={handleSwap}
                onClearAll={requestClearAll}
                goToStep={goToStep}
              />
            </Suspense>
          )}

          {currentStep === 3 && (
            <Suspense fallback={<StepLoadingFallback />}>
              <Step3Print
                flashcards={flashcards}
                cardsPerPage={cardsPerPage}
                onPrint={handlePrint}
                onExportCSV={handleExportCSV}
                onClearAll={requestClearAll}
                goToStep={goToStep}
              />
            </Suspense>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="text-center py-8 px-4">
          <p className="text-xs font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
            Flashcard Generator &copy; 2026
          </p>
        </footer>
      </div>

      <Dialog open={showClearConfirm} onClose={setShowClearConfirm} size="md">
        <DialogTitle>{t('confirmClearTitle')}</DialogTitle>
        <DialogDescription>{t('confirmClearMessage')}</DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setShowClearConfirm(false)}>
            {t('cancel')}
          </Button>
          <Button color="red" onClick={handleClearAll}>
            {t('clearAll')}
          </Button>
        </DialogActions>
      </Dialog>

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
