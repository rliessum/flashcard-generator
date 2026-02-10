import React from 'react'
import { useI18n } from '../hooks/useI18n'
import clsx from 'clsx'

const steps = [
  { key: 1, labelKey: 'step1Label', titleKey: 'step1Title' },
  { key: 2, labelKey: 'step2Label', titleKey: 'step2Title' },
  { key: 3, labelKey: 'step3Label', titleKey: 'step3Title' },
]

const StepNav = React.memo(function StepNav({ currentStep, goToStep }) {
  const { t } = useI18n()

  return (
    <nav className="max-w-3xl mx-auto px-4 pb-4" aria-label="Progress">
      <ol role="list" className="flex">
        {steps.map(({ key, labelKey, titleKey }) => {
          const isCompleted = key < currentStep
          const isCurrent = key === currentStep
          const isUpcoming = key > currentStep
          return (
            <li key={key} className="flex-1">
              <button
                onClick={() => (isCompleted || isCurrent) && goToStep(key)}
                className={clsx(
                  'flex flex-col border-t-4 pt-3 w-full text-left transition-colors',
                  isCompleted && 'border-zinc-950 dark:border-white cursor-pointer hover:border-zinc-500 dark:hover:border-zinc-400',
                  isCurrent && 'border-zinc-950 dark:border-white cursor-default',
                  isUpcoming && 'border-zinc-200 dark:border-zinc-700 cursor-default'
                )}
                disabled={isUpcoming}
              >
                <span className={clsx(
                  'text-[0.7rem] font-semibold tracking-wider uppercase mb-0.5',
                  (isCompleted || isCurrent) ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600'
                )}>
                  {t(labelKey)}
                </span>
                <span className={clsx(
                  'text-sm font-semibold',
                  isUpcoming ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-950 dark:text-white'
                )}>
                  {t(titleKey)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
})

export default StepNav
