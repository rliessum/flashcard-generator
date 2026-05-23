import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useToast } from '../hooks/useToast'
import { Button } from './catalyst/button'
import { Input } from './catalyst/input'
import { Textarea } from './catalyst/textarea'
import { Subheading } from './catalyst/heading'
import { Text } from './catalyst/text'
import { Divider } from './catalyst/divider'
import HeroiconGlyph from './HeroiconGlyph'
import clsx from 'clsx'
import { MAX_CSV_BYTES, exceedsCsvLimit } from '../js/utils'
import { HEROICON_OPTIONS } from '../js/heroicons'

// Icons
function UploadIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 16V4m0 0L8 8m4-4 4 4" />
      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
    </svg>
  )
}

function DownloadIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 10v6m0 0 3-3m-3 3-3-3" />
      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
    </svg>
  )
}

function ChevronRightIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function XIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

// ── Manual Card Row ──────────────────────────────────────────
const CardRow = React.memo(function CardRow({ index, card, onChange, onRemove, canRemove, frontPlaceholder, backPlaceholder, removePlaceholder }) {
  return (
    <div className="flex gap-2 items-center group" role="listitem">
      <span className="w-6 text-center shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500 hidden sm:block">
        {index + 1}
      </span>
      <div className="flex-1">
        <Input
          type="text"
          placeholder={frontPlaceholder}
          value={card.front}
          onChange={e => onChange(index, 'front', e.target.value)}
          aria-label={`Card ${index + 1} front`}
        />
      </div>
      <div className="flex-1">
        <Input
          type="text"
          placeholder={backPlaceholder}
          value={card.back}
          onChange={e => onChange(index, 'back', e.target.value)}
          aria-label={`Card ${index + 1} back`}
        />
      </div>
      <button
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className={clsx(
          'shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
          canRemove
            ? 'text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-950/30'
            : 'text-zinc-200 dark:text-zinc-700 cursor-not-allowed'
        )}
        title={removePlaceholder}
        aria-label={removePlaceholder}
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
})

// ── Drop Zone ────────────────────────────────────────────────
function DropZone({ onFile }) {
  const { t } = useI18n()
  const { addToast } = useToast()
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file) => {
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      addToast(t('dropFileError'), 'error')
      return
    }
    if (file.size > MAX_CSV_BYTES) {
      addToast(t('csvTooLarge'), 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => onFile(e.target.result)
    reader.readAsText(file)
  }, [onFile, addToast, t])

  return (
    <div
      className={clsx(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        dragOver
          ? 'border-zinc-400 bg-zinc-50 dark:border-zinc-500 dark:bg-zinc-800/50'
          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
      )}
      onClick={() => fileRef.current?.click()}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
      onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload CSV file"
    >
      <UploadIcon className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
      <Text className="text-zinc-500! dark:text-zinc-400!">
        {t('dropText').replace(/<[^>]*>/g, '')}
      </Text>
      <p className="mt-1 text-[0.7rem] font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
        {t('delimiterNote')}
      </p>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".csv,.tsv,.txt"
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]) }}
      />
    </div>
  )
}

// ── Main Step 1 Component ────────────────────────────────────
export default function Step1DataEntry({
  manualCards,
  setManualCards,
  onCSVParsed,
  onExportCSV,
  onClearAll,
  hasAnyCards,
  flashcards,
  goToStep,
  collectCards,
  setFlashcards,
  selectedIconId,
  setSelectedIconId,
}) {
  const { t } = useI18n()
  const { addToast } = useToast()
  const [pasteText, setPasteText] = useState('')
  const [iconQuery, setIconQuery] = useState('')
  const manualListRef = useRef(null)
  const iconButtonRefs = useRef({})
  const [focusedIconId, setFocusedIconId] = useState(selectedIconId)
  const filteredIconOptions = useMemo(() => {
    const query = iconQuery.trim().toLowerCase()
    if (!query) return HEROICON_OPTIONS
    return HEROICON_OPTIONS.filter((icon) => {
      const translatedNone = t('iconNone').toLowerCase()
      const label = icon.id === 'none' ? translatedNone : icon.label.toLowerCase()
      return label.includes(query) || icon.id.includes(query)
    })
  }, [iconQuery, t])
  const selectedIconLabel = useMemo(() => {
    const icon = HEROICON_OPTIONS.find((item) => item.id === selectedIconId)
    if (!icon) return t('iconNone')
    return icon.id === 'none' ? t('iconNone') : icon.label
  }, [selectedIconId, t])
  const activeIconId = useMemo(() => {
    const ids = filteredIconOptions.map((icon) => icon.id)
    if (ids.includes(focusedIconId)) return focusedIconId
    if (ids.includes(selectedIconId)) return selectedIconId
    return ids[0] || null
  }, [filteredIconOptions, focusedIconId, selectedIconId])

  useEffect(() => {
    if (!activeIconId) return
    setFocusedIconId(activeIconId)
  }, [activeIconId])

  const moveIconFocus = useCallback((nextIconId) => {
    if (!nextIconId) return
    setFocusedIconId(nextIconId)
    iconButtonRefs.current[nextIconId]?.focus()
  }, [])

  const handleIconGridKeyDown = useCallback((event, index, iconId) => {
    const isHorizontal = event.key === 'ArrowRight' || event.key === 'ArrowLeft'
    const isVertical = event.key === 'ArrowUp' || event.key === 'ArrowDown'
    const isBoundary = event.key === 'Home' || event.key === 'End'
    const isSelect = event.key === 'Enter' || event.key === ' '
    if (!isHorizontal && !isVertical && !isBoundary && !isSelect) return

    event.preventDefault()
    if (isSelect) {
      setSelectedIconId(iconId)
      setFocusedIconId(iconId)
      return
    }

    if (!filteredIconOptions.length) return
    if (event.key === 'Home') {
      moveIconFocus(filteredIconOptions[0]?.id)
      return
    }
    if (event.key === 'End') {
      moveIconFocus(filteredIconOptions[filteredIconOptions.length - 1]?.id)
      return
    }

    const columns = window.matchMedia('(min-width: 640px)').matches ? 3 : 2
    const nextIndex = (() => {
      if (event.key === 'ArrowRight') return Math.min(filteredIconOptions.length - 1, index + 1)
      if (event.key === 'ArrowLeft') return Math.max(0, index - 1)
      if (event.key === 'ArrowDown') return Math.min(filteredIconOptions.length - 1, index + columns)
      return Math.max(0, index - columns)
    })()

    moveIconFocus(filteredIconOptions[nextIndex]?.id)
  }, [filteredIconOptions, moveIconFocus, setSelectedIconId])

  const updateCard = useCallback((index, field, value) => {
    setManualCards(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }, [setManualCards])

  const removeCard = useCallback((index) => {
    setManualCards(prev => prev.filter((_, i) => i !== index))
  }, [setManualCards])

  const addCard = useCallback(() => {
    setManualCards(prev => [...prev, { front: '', back: '' }])
  }, [setManualCards])

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    // Add a new row if we're on the last input
    const inputs = manualListRef.current?.querySelectorAll('input')
    if (!inputs) return
    const idx = Array.from(inputs).indexOf(e.target)
    if (idx === inputs.length - 1) {
      addCard()
      // Focus will happen on re-render
      setTimeout(() => {
        const newInputs = manualListRef.current?.querySelectorAll('input')
        newInputs?.[newInputs.length - 2]?.focus()
      }, 50)
    } else if (inputs[idx + 1]) {
      inputs[idx + 1].focus()
    }
  }, [addCard])

  const handlePaste = useCallback((e) => {
    const raw = (e.clipboardData || window.clipboardData).getData('text')
    if (!raw.includes('\t') && !raw.includes('\n')) return
    if (exceedsCsvLimit(raw)) {
      addToast(t('csvTooLarge'), 'error')
      return
    }
    e.preventDefault()
    const lines = raw.trim().split(/\r?\n/).map(l => l.split('\t'))
    const newCards = lines
      .filter(l => l.length >= 2 && (l[0].trim() || l[1].trim()))
      .map(l => ({ front: l[0].trim(), back: l[1].trim() }))
    if (newCards.length) {
      setManualCards(prev => [...prev.filter(c => c.front || c.back), ...newCards])
      addToast(t('pastedCards', newCards.length), 'success')
    }
  }, [setManualCards, addToast, t])

  const handleParsePaste = useCallback(() => {
    if (!pasteText.trim()) {
      addToast(t('pasteEmpty') || 'Paste some CSV data first', 'warning')
      return
    }
    if (exceedsCsvLimit(pasteText)) {
      addToast(t('csvTooLarge'), 'error')
      return
    }
    onCSVParsed(pasteText)
  }, [pasteText, onCSVParsed, addToast, t])

  const handleNextStep = useCallback(() => {
    const manual = collectCards()
    const cards = manual.length ? manual : flashcards
    if (!cards.length) {
      addToast(t('enterOneCard'), 'error')
      return
    }
    setFlashcards(cards)
    goToStep(2)
  }, [collectCards, flashcards, setFlashcards, goToStep, addToast, t])

  return (
    <div className="space-y-6">
      {/* ── Manual Entry Card ─────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Subheading>{t('typeCards')}</Subheading>
          <Button plain onClick={onExportCSV}>
            <DownloadIcon data-slot="icon" className="w-4 h-4" />
            {t('exportCsv')}
          </Button>
        </div>

        <Text className="text-sm! mb-1">
          {t('manualHint').replace(/<[^>]*>/g, '')}
        </Text>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
          {t('autoSaved')}
        </p>

        <div
          ref={manualListRef}
          className="space-y-2"
          role="list"
          aria-label="Manual flashcard entries"
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        >
          {manualCards.map((card, i) => (
            <CardRow
              key={i}
              index={i}
              card={card}
              onChange={updateCard}
              onRemove={removeCard}
              canRemove={manualCards.length > 1}
              frontPlaceholder={t('front')}
              backPlaceholder={t('back')}
              removePlaceholder={t('remove')}
            />
          ))}
        </div>

        <div className="mt-4">
          <Button plain onClick={addCard}>
            {t('addCard')}
          </Button>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <Subheading className="mb-2">{t('iconLabel')}</Subheading>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
          {t('iconHint')}
          {' '}
          <a
            href="https://heroicons.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-zinc-500 dark:hover:text-zinc-300"
          >
            heroicons.com
          </a>
        </p>

        <div className="flex items-center gap-4">
          <Input
            value={iconQuery}
            onChange={e => setIconQuery(e.target.value)}
            placeholder={t('iconSearchPlaceholder')}
            aria-label={t('iconSearchPlaceholder')}
            className="w-64!"
          />
        </div>

        {filteredIconOptions.length === 0 && (
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">{t('iconNoResults')}</p>
        )}

        {filteredIconOptions.length > 0 && (
          <div
            className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
            role="listbox"
            aria-label={t('iconLabel')}
          >
            {filteredIconOptions.map((icon, index) => {
              const isSelected = icon.id === selectedIconId
              const isFocusable = icon.id === activeIconId
              const label = icon.id === 'none' ? t('iconNone') : icon.label
              return (
                <button
                  key={icon.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isFocusable ? 0 : -1}
                  onClick={() => setSelectedIconId(icon.id)}
                  onFocus={() => setFocusedIconId(icon.id)}
                  onKeyDown={(event) => handleIconGridKeyDown(event, index, icon.id)}
                  ref={(node) => {
                    if (node) iconButtonRefs.current[icon.id] = node
                  }}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                    isSelected
                      ? 'border-zinc-500 bg-zinc-100 text-zinc-950 dark:border-zinc-300 dark:bg-zinc-800 dark:text-white'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50'
                  )}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 dark:text-zinc-300">
                    <HeroiconGlyph iconId={icon.id} className="w-4 h-4" />
                    {icon.id === 'none' && <span className="text-xs">-</span>}
                  </span>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{t('iconLabel')}:</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 dark:border-zinc-700">
            <HeroiconGlyph iconId={selectedIconId} className="w-3.5 h-3.5" />
            <span>{selectedIconLabel}</span>
          </span>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="relative">
        <Divider />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-950 px-3 text-[0.7rem] font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
          {t('orCsv')}
        </span>
      </div>

      {/* ── CSV Upload ────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <Subheading className="mb-4">{t('uploadCsv')}</Subheading>
        <DropZone onFile={onCSVParsed} />
      </section>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="relative">
        <Divider />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-950 px-3 text-[0.7rem] font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
          {t('orPaste')}
        </span>
      </div>

      {/* ── Paste CSV ─────────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <Subheading className="mb-2">{t('pasteCsv')}</Subheading>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">{t('pasteHint')}</p>
        <Textarea
          rows={6}
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder={t('pastePlaceholder')}
          className="font-mono"
          aria-label="Paste CSV data"
        />
        <div className="mt-3">
          <Button plain onClick={handleParsePaste}>
            {t('loadPasted')}
          </Button>
        </div>
      </section>

      {/* ── Step Actions ──────────────────────────────────── */}
      <div className="flex justify-between items-center gap-3 pt-2">
        <div />
        <div className="flex gap-3 items-center">
          <Button
            color="red"
            outline
            onClick={onClearAll}
            disabled={!hasAnyCards}
          >
            {t('clearAll')}
          </Button>
          <Button color="dark/zinc" onClick={handleNextStep}>
            {t('nextPreview')}
            <ChevronRightIcon data-slot="icon" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
