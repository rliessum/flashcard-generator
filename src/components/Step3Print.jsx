import React, { useMemo, useCallback } from 'react'
import { useI18n } from '../hooks/useI18n'
import { Button } from './catalyst/button'
import { Subheading } from './catalyst/heading'
import { Text } from './catalyst/text'
import { Divider } from './catalyst/divider'

// Icons
function PrinterIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
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

function ChevronLeftIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default function Step3Print({
  flashcards,
  cardsPerPage,
  onPrint,
  onExportCSV,
  onStartOver,
  goToStep,
}) {
  const { t } = useI18n()

  const goBack = useCallback(() => goToStep(2), [goToStep])

  const stats = useMemo(() => {
    const pages = Math.ceil(flashcards.length / cardsPerPage)
    return {
      cards: flashcards.length,
      pages: pages * 2,
      sheets: pages,
    }
  }, [flashcards.length, cardsPerPage])

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <Subheading className="mb-4">{t('printSave')}</Subheading>

        {/* Info box */}
        <div className="bg-zinc-50 dark:bg-zinc-800/30 border-l-2 border-zinc-300 dark:border-zinc-600 rounded-r-lg p-4 mb-6">
          <Text className="!text-sm">
            <strong className="font-medium text-zinc-950 dark:text-white">
              {t('duplexInfo').replace(/<[^>]*>/g, '').split(':')[0]}:
            </strong>
            {' '}{t('duplexInfo').replace(/<[^>]*>/g, '').split(':').slice(1).join(':')}
          </Text>
        </div>

        {/* Summary stats */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mb-6">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('summaryCards')}</span>
            <span className="text-sm font-semibold text-zinc-950 dark:text-white">{stats.cards}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('summaryPages')}</span>
            <span className="text-sm font-semibold text-zinc-950 dark:text-white">{stats.pages}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('summarySheets')}</span>
            <span className="text-sm font-semibold text-zinc-950 dark:text-white">{stats.sheets}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button color="dark/zinc" onClick={onPrint}>
            <PrinterIcon data-slot="icon" className="w-4 h-4" />
            {t('printDuplex')}
          </Button>
          <Button outline onClick={onExportCSV}>
            <DownloadIcon data-slot="icon" className="w-4 h-4" />
            {t('exportCsv')}
          </Button>
        </div>
      </section>

      {/* ── Step Actions ──────────────────────────────────── */}
      <div className="flex justify-between items-center gap-3 pt-2">
        <Button outline onClick={goBack}>
          <ChevronLeftIcon data-slot="icon" className="w-4 h-4" />
          {t('backPreview')}
        </Button>
        <Button plain onClick={onStartOver}>
          {t('startOver')}
        </Button>
      </div>
    </div>
  )
}
