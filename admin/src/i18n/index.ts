import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

const STORAGE_KEY = 'fc-admin-locale'

function detectLocale(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return stored
  const lang = navigator.language
  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

const locale = detectLocale()

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: { en, 'zh-CN': zhCN },
})

export function setLocale(lang: string) {
  ;(i18n.global.locale as any).value = lang
  localStorage.setItem(STORAGE_KEY, lang)
}

export default i18n
