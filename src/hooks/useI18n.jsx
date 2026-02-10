import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { LANGS, I18N, t as translate, isSupported } from '../js/i18n'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('fc_lang')
      return saved && isSupported(saved) ? saved : 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = useCallback((newLang) => {
    if (!isSupported(newLang)) return
    setLangState(newLang)
    try { localStorage.setItem('fc_lang', newLang) } catch {}
    document.documentElement.lang = newLang
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'title')
  }, [lang])

  const t = useCallback((key, ...args) => translate(lang, key, ...args), [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t, LANGS }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
