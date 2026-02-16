import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import ms from './locales/ms.json'

const SUPPORTED_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ms', 'id', 'th', 'ja', 'ko'] as const
const STORAGE_KEY = 'fc-locale'

function detectLocale(): string {
  // 1. URL parameter
  const urlParams = new URLSearchParams(window.location.search)
  const urlLang = urlParams.get('lang')
  if (urlLang && SUPPORTED_LOCALES.includes(urlLang as any)) {
    return urlLang
  }

  // 2. LocalStorage
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as any)) {
    return stored
  }

  // 3. Browser language
  const browserLang = navigator.language
  if (SUPPORTED_LOCALES.includes(browserLang as any)) {
    return browserLang
  }
  // Try matching base language (e.g., "zh" -> "zh-CN")
  const baseLang = browserLang.split('-')[0]
  const match = SUPPORTED_LOCALES.find(l => l.startsWith(baseLang))
  if (match) return match

  // 4. Default
  return 'en'
}

const locale = detectLocale()
localStorage.setItem(STORAGE_KEY, locale)

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN,
    ms,
  },
})

export function setLocale(lang: string) {
  if (SUPPORTED_LOCALES.includes(lang as any)) {
    ;(i18n.global.locale as any).value = lang
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }
}

export { SUPPORTED_LOCALES }
export default i18n
