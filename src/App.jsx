import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { parseCSV, countDuplicates, buildCSVString } from './js/csv'
import { shuffle as shuffleArray, swapSides, csvEscape, exceedsCsvLimit } from './js/utils'
import { isSupported } from './js/i18n'
import { generatePrintDocument } from './js/print'
import { I18nProvider, useI18n } from './hooks/useI18n'
import { ToastProvider, useToast } from './hooks/useToast'
import { useFlashcards } from './hooks/useFlashcards'
import { useOnlineStatus } from './hooks/useOnlineStatus'
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
  const isOnline = useOnlineStatus()

  // PWA Install prompt (Add to Home Screen)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  // Service Worker update handling
  useEffect(() => {
    const handleUpdate = () => {
      addToast(
        'A new version is available.',
        'info',
        8000,
        {
          label: 'Reload now',
          onClick: () => window.location.reload(),
          dismiss: true
        }
      )
    }

    const handleControllerChange = () => {
      addToast('Update installed.', 'success', 4000, {
        label: 'Reload',
        onClick: () => window.location.reload()
      })
    }

    window.addEventListener('sw-update-available', handleUpdate)
    window.addEventListener('sw-controller-changed', handleControllerChange)

    const handleStorageQuota = () => {
      addToast('Storage is full. Your cards may not save. Try clearing some data.', 'warning')
    }
    window.addEventListener('storage-quota-exceeded', handleStorageQuota)

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate)
      window.removeEventListener('sw-controller-changed', handleControllerChange)
      window.removeEventListener('storage-quota-exceeded', handleStorageQuota)
    }
  }, [addToast])

  // PWA "Add to Home Screen" / Install prompt handling
  useEffect(() => {
    // Detect if already running as installed PWA
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator && window.navigator.standalone === true)
      setIsInstalled(standalone)
    }
    checkInstalled()

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      addToast('App installed successfully. Thanks!', 'success')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [addToast])

  // ── State ──────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1)
  const [printFontSize, setPrintFontSize] = useState(18)
  const [gridLayout, setGridLayout] = useState('2x4')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const {
    flashcards,
    setFlashcards,
    manualCards,
    setManualCards,
    selectedIconId,
    setSelectedIconId,
    collectCards,
    clearAllCards,
    hasAnyCards,
  } = useFlashcards()

  // cardsPerPage is derived from the selected grid layout (2 columns × N rows)
  const cardsPerPage = ({ '2x3': 6, '2x5': 10, '2x6': 12 }[gridLayout] ?? 8)

  // ── Step navigation ────────────────────────────────────────
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

    clearAllCards()
    setCurrentStep(1)
    setShowClearConfirm(false)
    if (totalCleared > 0) {
      addToast(t('clearedCards', totalCleared), 'warning')
    }
  }, [flashcards, manualCards, clearAllCards, addToast, t])

  // ── Print ──────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const doc = generatePrintDocument(flashcards, {
      cardsPerPage,
      gridLayout,
      fontSize: printFontSize,
      iconId: selectedIconId,
      lang,
      t,
    })

    // Use a Blob URL instead of document.write — the popup loads its own
    // same-origin document, so it inherits a strict CSP and avoids the
    // document.write footgun.
    const blob = new Blob([doc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (!win) {
      URL.revokeObjectURL(url)
      addToast(t('popupBlocked') || 'Popup blocked. Please allow popups for this site.', 'error')
      return
    }

    // More robust print trigger: wait for fonts + load, then print.
    // Also inject a visible "Print" button inside the popup as a fallback
    // for cases where window.print() is blocked or unreliable.
    const triggerPrint = () => {
      const printNow = () => {
        try {
          win.focus()
          win.print()
        } catch {
          // Some browsers block programmatic print; the button below remains available
        }
      }

      const doPrint = () => {
        if (win.document.fonts?.ready) {
          win.document.fonts.ready.then(printNow).catch(printNow)
        } else {
          setTimeout(printNow, 120)
        }
      }

      // Inject a small print button at the top of the popup (helpful fallback)
      try {
        const btn = win.document.createElement('button')
        btn.textContent = 'Print now'
        btn.style.cssText = 'position:fixed;top:8px;right:8px;z-index:9999;padding:6px 14px;border:1px solid #ccc;background:#fff;font-size:13px;border-radius:4px;cursor:pointer;'
        btn.onclick = () => {
          btn.style.display = 'none'
          printNow()
        }
        win.document.body.prepend(btn)
      } catch {}

      doPrint()
    }

    const cleanup = () => URL.revokeObjectURL(url)

    const onReady = () => {
      triggerPrint()
      setTimeout(cleanup, 8000)
    }

    if (win.document.readyState === 'complete') {
      onReady()
    } else {
      win.addEventListener('load', onReady, { once: true })
    }
  }, [flashcards, cardsPerPage, gridLayout, printFontSize, selectedIconId, lang, t, addToast])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the native install prompt
    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      addToast('Installing the app...', 'success')
    } else {
      addToast('Installation dismissed', 'warning')
    }

    // Clear the deferred prompt since it can only be used once
    setDeferredPrompt(null)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 font-sans transition-colors duration-200">
      <div className="no-print">
        {/* ── Header ──────────────────────────────────────────── */}
        <header className="text-center pt-12 sm:pt-16 pb-6 px-4">
          <div className="flex justify-between items-center gap-2 mb-4 max-w-3xl mx-auto px-1">
            <div>
              {!isOnline && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> OFFLINE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isInstalled && deferredPrompt && hasAnyCards && (
                <button
                  onClick={handleInstallClick}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  title="Install this app for quick access and offline use"
                >
                  Install
                </button>
              )}
              <ThemeToggle />
              <LanguagePicker />
            </div>
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
              selectedIconId={selectedIconId}
              setSelectedIconId={setSelectedIconId}
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
                selectedIconId={selectedIconId}
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
            Ultimate Flashcards &copy; 2026
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
