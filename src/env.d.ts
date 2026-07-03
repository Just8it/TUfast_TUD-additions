/* eslint-disable no-var, no-unused-vars */

type TufastContentStrings = typeof import('./i18n/locales/de.json').default.content

declare global {
  var TUFAST_STRINGS: TufastContentStrings
  var TUFAST_STRINGS_READY: Promise<TufastContentStrings>

  interface Window {
    TUFAST_STRINGS: TufastContentStrings
    TUFAST_STRINGS_READY: Promise<TufastContentStrings>
  }

  interface ImportMeta {
    glob<T>(pattern: string, options: { eager: true; import: 'default' }): Record<string, T>
  }
}

export {}
