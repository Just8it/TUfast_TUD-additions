import type { OpalSmartSearchSettings } from './types'

export const OPAL_SMART_SEARCH_SETTINGS_KEY = 'opalSmartSearchSettings'
export const OPAL_SMART_SEARCH_HIGHLIGHT_KEY = 'opalSmartSearchHighlight'
export const OPAL_SMART_SEARCH_ACTIVE_PROGRESS_KEY = 'opalSmartSearchActiveProgress'
export const OPAL_SMART_SEARCH_ACTIVE_PROGRESS_EVENT = 'tufast-opal-smart-search-progress'
export const OPAL_SMART_SEARCH_ACTIVE_RUNS_KEY = 'opalSmartSearchActiveIndexRuns'
export const OPAL_SMART_SEARCH_SUCCESSFUL_RUNS_KEY = 'opalSmartSearchSuccessfulRuns'
export const OPAL_SMART_SEARCH_OPEN_AFTER_OPAL_LOAD_KEY = 'opalSmartSearchOpenAfterOpalLoad'
export const OPAL_SMART_SEARCH_FAVORITES_DETECTED_KEY = 'opalSmartSearchFavoritesDetectedAt'
export const OPAL_SMART_SEARCH_START_STALE_MS = 60 * 1000
export const OPAL_SMART_SEARCH_JOB_STALE_MS = 2 * 60 * 60 * 1000

export const DEFAULT_SMART_SEARCH_SETTINGS: OpalSmartSearchSettings = {
  enabled: true
}

export async function loadSmartSearchSettings(): Promise<OpalSmartSearchSettings> {
  const data = await chrome.storage.local.get({
    [OPAL_SMART_SEARCH_SETTINGS_KEY]: DEFAULT_SMART_SEARCH_SETTINGS
  })

  return { enabled: data[OPAL_SMART_SEARCH_SETTINGS_KEY]?.enabled ?? true }
}

export async function saveSmartSearchSettings(settings: OpalSmartSearchSettings): Promise<void> {
  await chrome.storage.local.set({ [OPAL_SMART_SEARCH_SETTINGS_KEY]: settings })
}
