const OPAL_SMART_SEARCH_OPEN_AFTER_OPAL_LOAD_KEY = 'opalSmartSearchOpenAfterOpalLoad'
const OPAL_SMART_SEARCH_DEBUG_DUMP_EVENT = 'tufast-smart-search-debug-dump'
const OPAL_SMART_SEARCH_DEBUG_DUMP_READY_EVENT = 'tufast-smart-search-debug-dump-ready'
const OPAL_SMART_SEARCH_DEBUG_DUMP_ID = 'tufast-smart-search-debug-dump-json'

;(async () => {
  // Only run on OPAL pages
  if (!location.href.includes('/opal/')) return

  // Load feature modules dynamically, so OPAL gets only what it needs
  const settingsModule = await import(chrome.runtime.getURL('modules/opalSmartSearch/settings.js'))
  const indexerModule = await import(chrome.runtime.getURL('contentScripts/other/opal/smartSearch/indexer.js'))
  const highlightModule = await import(chrome.runtime.getURL('contentScripts/other/opal/smartSearch/highlight.js'))
  const paletteModule = await import(chrome.runtime.getURL('contentScripts/other/opal/smartSearch/palette.js'))

  const settings = await settingsModule.loadSmartSearchSettings()
  if (!settings.enabled) return
  const strings = (await globalThis.TUFAST_STRINGS_READY).opal.smartSearch

  if (indexerModule.canRunActiveIndexingOnCurrentPage()) {
    indexerModule.maybeRunActiveIndexing().catch(indexerModule.handleActiveIndexFailure)
  }

  // Setup UI and file highlighting
  paletteModule.bindOpalSmartSearchPalette(strings)
  bindDebugDumpBridge()
  await highlightModule.checkAndHighlightIndexedFile()
  await openPaletteFromPendingHotkey(paletteModule, strings)

  // Index what the user already sees
  await indexerModule.bootstrapCoursesFromStorage()
  await indexerModule.indexCurrentOpalPage()
})().catch((error) => console.warn('[TUfast Smart Search] Startup failed:', error))

function bindDebugDumpBridge(): void {
  const marker = '__tufastSmartSearchDebugDumpBound'
  if ((window as any)[marker]) return
  ;(window as any)[marker] = true

  // ponytail: temporary beta debug bridge; remove before the merge-ready release build.
  window.addEventListener(OPAL_SMART_SEARCH_DEBUG_DUMP_EVENT, () => {
    chrome.runtime
      .sendMessage({ cmd: 'opal_smart_search_dump_nodes' })
      .then((dump) => {
        writeDebugDump(JSON.stringify(dump, null, 2))
      })
      .catch((error) => {
        writeDebugDump(JSON.stringify({ error: String(error) }, null, 2))
      })
  })
}

function writeDebugDump(json: string): void {
  let target = document.getElementById(OPAL_SMART_SEARCH_DEBUG_DUMP_ID) as HTMLTextAreaElement | null
  if (!target) {
    target = document.createElement('textarea')
    target.id = OPAL_SMART_SEARCH_DEBUG_DUMP_ID
    target.hidden = true
    document.documentElement.appendChild(target)
  }

  target.value = json
  target.textContent = json
  window.dispatchEvent(new CustomEvent(OPAL_SMART_SEARCH_DEBUG_DUMP_READY_EVENT))
}

async function openPaletteFromPendingHotkey(
  paletteModule: typeof import('./palette'),
  strings: typeof globalThis.TUFAST_STRINGS.opal.smartSearch
): Promise<void> {
  const data = await chrome.storage.local.get([OPAL_SMART_SEARCH_OPEN_AFTER_OPAL_LOAD_KEY])
  const pending = readPendingPaletteOpen(data[OPAL_SMART_SEARCH_OPEN_AFTER_OPAL_LOAD_KEY])
  const expiresAt = pending.expiresAt
  if (!expiresAt) return

  await chrome.storage.local.remove([OPAL_SMART_SEARCH_OPEN_AFTER_OPAL_LOAD_KEY])
  if (Date.now() > expiresAt) return

  window.setTimeout(() => {
    paletteModule
      .openOpalSmartSearchPalette(strings, pending.rawQuery)
      .catch((error) => console.warn('[TUfast Smart Search] Could not open pending palette:', error))
  }, 250)
}

function readPendingPaletteOpen(value: unknown): { expiresAt: number; rawQuery?: string } {
  if (typeof value === 'number') return { expiresAt: value }
  if (value && typeof value === 'object') {
    const pending = value as { expiresAt?: unknown; rawQuery?: unknown }
    return {
      expiresAt: typeof pending.expiresAt === 'number' && Number.isFinite(pending.expiresAt) ? pending.expiresAt : 0,
      ...(typeof pending.rawQuery === 'string' ? { rawQuery: pending.rawQuery } : {})
    }
  }

  return { expiresAt: 0 }
}
