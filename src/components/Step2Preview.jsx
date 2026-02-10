import React, { useState, useCallback, useMemo } from 'react'
import { useI18n } from '../hooks/useI18n'
import { Button } from './catalyst/button'
import { Select } from './catalyst/select'
import { Heading, Subheading } from './catalyst/heading'
import { Badge } from './catalyst/badge'
import { escapeHtml } from '../js/utils'
import clsx from 'clsx'

// Icons
function ShuffleIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.6-8.6c.8-1.1 2-1.7 3.3-1.7H20m0 0-3-3m3 3-3 3M2 6h1.4c1.3 0 2.5.6 3.3 1.7l1.1 1.4M20 18h-3.4c-1.3 0-2.5-.6-3.3-1.7l-1.1-1.4m7.8 3.1-3 3m3-3-3-3" />
    </svg>
  )
}

function SwapIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M7 16V4m0 12-4-4m4 4 4-4m6-4v12m0-12 4 4m-4-4-4 4" />
    </svg>
  )
}

function ChevronLeftIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
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

// ── Flashcard Preview Grid ───────────────────────────────────
function FlashcardGrid({ flashcards, cardsPerPage, gridLayout, fontSize }) {
  const [flippedCards, setFlippedCards] = useState(new Set())
  const [showSide, setShowSide] = useState('front') // 'front' | 'back' | null
  const { t } = useI18n()

  const pages = Math.ceil(flashcards.length / cardsPerPage)
  const gridCls = gridLayout === '2x3' ? 'grid-2x3' : 'grid-2x4'

  const toggleCard = useCallback((idx) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    setShowSide(null) // reset tab state when individual card is flipped
  }, [])

  const showAllFront = useCallback(() => {
    setFlippedCards(new Set())
    setShowSide('front')
  }, [])

  const showAllBack = useCallback(() => {
    setFlippedCards(new Set(flashcards.map((_, i) => i)))
    setShowSide('back')
  }, [flashcards])

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge color="zinc">
            <strong className="font-semibold text-zinc-950 dark:text-white">{flashcards.length}</strong>
            {' '}card{flashcards.length !== 1 ? 's' : ''} · {pages} page{pages !== 1 ? 's' : ''}
          </Badge>
          <span className="text-xs italic text-zinc-400 dark:text-zinc-500">{t('clickFlip')}</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={showAllFront}
            className={clsx(
              'px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors',
              showSide === 'front' || (showSide === null && flippedCards.size === 0)
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            )}
          >
            {t('allFront')}
          </button>
          <button
            onClick={showAllBack}
            className={clsx(
              'px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors',
              showSide === 'back'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white'
                : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            )}
          >
            {t('allBack')}
          </button>
        </div>
      </div>

      {Array.from({ length: pages }, (_, p) => (
        <div
          key={p}
          className={clsx(
            'flashcard-container bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl',
            gridCls
          )}
        >
          {Array.from({ length: cardsPerPage }, (_, i) => {
            const idx = p * cardsPerPage + i
            const card = idx < flashcards.length ? flashcards[idx] : null
            if (!card) {
              return (
                <div key={i} className="flip-card">
                  <div className="flip-card-inner">
                    <div className="flashcard flashcard-front bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800" />
                    <div className="flashcard flashcard-back bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800" />
                  </div>
                </div>
              )
            }
            return (
              <div
                key={i}
                className={clsx('flip-card', flippedCards.has(idx) && 'flipped')}
                onClick={() => toggleCard(idx)}
                title="Click to flip"
              >
                <div className="flip-card-inner">
                  <div
                    className="flashcard flashcard-front bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                    style={{ fontSize: `${fontSize}pt` }}
                  >
                    {card.front}
                  </div>
                  <div
                    className="flashcard flashcard-back bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700"
                    style={{ fontSize: `${fontSize}pt` }}
                  >
                    {card.back}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main Step 2 Component ────────────────────────────────────
export default function Step2Preview({
  flashcards,
  printFontSize,
  setPrintFontSize,
  gridLayout,
  setGridLayout,
  cardsPerPage,
  onShuffle,
  onSwap,
  goToStep,
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      {/* ── Print Settings ────────────────────────────────── */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <Subheading className="mb-4">{t('printSettings')}</Subheading>

        <div className="flex flex-wrap gap-4 items-center p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700">
          {/* Font size */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
              {t('font')}
            </span>
            <input
              type="range"
              min="10"
              max="28"
              value={printFontSize}
              onChange={e => setPrintFontSize(+e.target.value)}
              className="w-24 h-1 bg-zinc-200 dark:bg-zinc-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-950 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
              aria-label="Font size"
            />
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {printFontSize}pt
            </span>
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

          {/* Grid */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
              {t('grid')}
            </span>
            <Select
              value={gridLayout}
              onChange={e => setGridLayout(e.target.value)}
              aria-label="Grid layout"
              className="!w-auto"
            >
              <option value="2x4">{t('grid2x4')}</option>
              <option value="2x3">{t('grid2x3')}</option>
            </Select>
          </div>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

          {/* Shuffle & Swap */}
          <div className="flex gap-2">
            <Button plain onClick={onShuffle} title={t('shuffle')}>
              <ShuffleIcon data-slot="icon" className="w-4 h-4" />
              {t('shuffle')}
            </Button>
            <Button plain onClick={onSwap} title={t('swapSides')}>
              <SwapIcon data-slot="icon" className="w-4 h-4" />
              {t('swapSides')}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Preview ───────────────────────────────────────── */}
      <FlashcardGrid
        flashcards={flashcards}
        cardsPerPage={cardsPerPage}
        gridLayout={gridLayout}
        fontSize={printFontSize}
      />

      {/* ── Step Actions ──────────────────────────────────── */}
      <div className="flex justify-between items-center gap-3 pt-2">
        <Button outline onClick={() => goToStep(1)}>
          <ChevronLeftIcon data-slot="icon" className="w-4 h-4" />
          {t('backData')}
        </Button>
        <Button color="dark/zinc" onClick={() => goToStep(3)}>
          {t('nextPrint')}
          <ChevronRightIcon data-slot="icon" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
