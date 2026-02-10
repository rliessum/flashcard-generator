import React from 'react'
import { useI18n } from '../hooks/useI18n'
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from './catalyst/dropdown'
import { Button } from './catalyst/button'
import clsx from 'clsx'

function ChevronDownIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export default function LanguagePicker() {
  const { lang, setLang, LANGS } = useI18n()

  return (
    <Dropdown>
      <DropdownButton
        as="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer text-xs font-medium tracking-wider uppercase"
        aria-label="Select language"
      >
        <span className="text-base leading-none">{LANGS[lang]?.flag}</span>
        <span>{LANGS[lang]?.label}</span>
        <ChevronDownIcon className="w-2.5 h-2.5" />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        {Object.entries(LANGS).map(([code, { flag, name }]) => (
          <DropdownItem key={code} onClick={() => setLang(code)}>
            <span className="text-base">{flag}</span>
            <span className={clsx(lang === code && 'font-semibold')}>{name}</span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
