import type de from './locales/de.json'

type ContentMessages = typeof de.content

declare const __TUFAST_CONTENT_LOCALES__: Record<string, ContentMessages>

const contentLocales = __TUFAST_CONTENT_LOCALES__
const fallbackLocale = 'de'

function getBrowserLocale() {
  const raw =
    (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.()) ||
    (typeof navigator !== 'undefined' && navigator.language) ||
    fallbackLocale
  return raw.toLowerCase().split(/[-_]/)[0]
}

function getContentStrings(localeSetting?: unknown) {
  const requestedLocale =
    typeof localeSetting === 'string' && localeSetting !== 'auto' ? localeSetting : getBrowserLocale()
  const locale = requestedLocale.toLowerCase().split(/[-_]/)[0]
  return contentLocales[locale] || contentLocales[fallbackLocale]
}

globalThis.TUFAST_STRINGS = getContentStrings()
globalThis.TUFAST_STRINGS_READY = (async () => {
  try {
    const { locale } = await chrome.storage.local.get(['locale'])
    globalThis.TUFAST_STRINGS = getContentStrings(locale)
  } catch (e) {
    globalThis.TUFAST_STRINGS = getContentStrings()
  }
  return globalThis.TUFAST_STRINGS
})()
