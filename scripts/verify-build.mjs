import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = path.join(rootDir, 'build')
const stringsFile = 'i18n/contentScriptStrings.js'

class BuildCheckError extends Error {
  constructor(message) {
    super(`Build check: ${message}`)
    this.name = 'BuildCheckError'
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath]
  })
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function collectMsgKeys(value, keys = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/__MSG_([^_][A-Za-z0-9_]*)__/g)) keys.add(match[1])
    return keys
  }
  if (Array.isArray(value)) {
    for (const item of value) collectMsgKeys(item, keys)
    return keys
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectMsgKeys(item, keys)
  }
  return keys
}

async function runContentScriptStrings(browserLocale, storedLocale) {
  const sandbox = {
    chrome: {
      i18n: {
        getUILanguage: () => browserLocale
      },
      storage: {
        local: {
          get: async () => ({ locale: storedLocale })
        }
      }
    }
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(fs.readFileSync(path.join(buildDir, stringsFile), 'utf8'), sandbox, {
    filename: stringsFile
  })
  await sandbox.TUFAST_STRINGS_READY
  return sandbox.TUFAST_STRINGS
}

function collectContentSections() {
  const sections = new Set()
  for (const filePath of walkFiles(path.join(rootDir, 'src')).filter((sourcePath) =>
    /\.(js|ts|vue)$/.test(sourcePath)
  )) {
    const source = fs.readFileSync(filePath, 'utf8')
    for (const match of source.matchAll(/\bTUFAST_STRINGS\.([A-Za-z_$][\w$]*)/g)) sections.add(match[1])
    for (const match of source.matchAll(/\bTUFAST_STRINGS\[['"]([^'"]+)['"]\]/g)) sections.add(match[1])
  }
  return [...sections].sort()
}

const manifest = readJson(path.join(buildDir, 'manifest.json'))
const defaultLocale = manifest.default_locale
if (!defaultLocale) throw new BuildCheckError('manifest.json has no default_locale')

const defaultMessages = readJson(path.join(buildDir, '_locales', defaultLocale, 'messages.json'))
for (const key of collectMsgKeys(manifest)) {
  const message = defaultMessages[key]?.message
  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new BuildCheckError(`missing non-empty _locales/${defaultLocale}/messages.json entry for ${key}`)
  }
}

const germanStrings = await runContentScriptStrings('de-DE')
const englishStrings = await runContentScriptStrings('en-US')
const fallbackStrings = await runContentScriptStrings('zz-ZZ')
const storedEnglishStrings = await runContentScriptStrings('de-DE', 'en')
const requiredContentSections = collectContentSections()

for (const [locale, strings] of [
  ['de-DE', germanStrings],
  ['en-US', englishStrings],
  ['zz-ZZ', fallbackStrings],
  ['stored en', storedEnglishStrings]
]) {
  for (const section of requiredContentSections) {
    if (!strings?.[section]) throw new BuildCheckError(`${stringsFile} did not populate ${section} for ${locale}`)
  }
}

if (JSON.stringify(fallbackStrings) !== JSON.stringify(englishStrings)) {
  throw new BuildCheckError('unknown browser locale did not fall back to English content strings')
}

if (JSON.stringify(storedEnglishStrings) !== JSON.stringify(englishStrings)) {
  throw new BuildCheckError('stored English locale did not override German browser locale')
}

const scriptsUsingStrings = walkFiles(path.join(buildDir, 'contentScripts'))
  .filter((filePath) => fs.readFileSync(filePath, 'utf8').includes('TUFAST_STRINGS'))
  .map((filePath) => toPosix(path.relative(buildDir, filePath)))
  .sort()

const directStringsAccess = /\bglobalThis\.TUFAST_STRINGS\b/
const directStringsAccessGlobal = /\bglobalThis\.TUFAST_STRINGS\b/g
const generatedStringsFallbackPrefix =
  'globalThis.TUFAST_STRINGS_READY=Promise.resolve(globalThis.TUFAST_STRINGS_READY).then('

for (const script of scriptsUsingStrings) {
  const source = fs.readFileSync(path.join(buildDir, script), 'utf8')
  const hasGeneratedFallback = source.startsWith(generatedStringsFallbackPrefix)
  let generatedFallbackAccesses = 0
  const sourceWithoutGeneratedFallback = hasGeneratedFallback
    ? source.replace(directStringsAccessGlobal, (match) => {
        generatedFallbackAccesses += 1
        return generatedFallbackAccesses <= 2 ? '' : match
      })
    : source

  if (!hasGeneratedFallback) {
    throw new BuildCheckError(`${script} has no fallback for missing TUFAST_STRINGS_READY`)
  }

  if (directStringsAccess.test(sourceWithoutGeneratedFallback)) {
    throw new BuildCheckError(`${script} reads TUFAST_STRINGS directly instead of awaiting TUFAST_STRINGS_READY`)
  }

  const entries = manifest.content_scripts.filter((entry) => entry.js?.includes(script))
  if (entries.length === 0) throw new BuildCheckError(`${script} uses TUFAST_STRINGS but is not in manifest.json`)

  for (const entry of entries) {
    if (entry.js.indexOf(stringsFile) === -1 || entry.js.indexOf(stringsFile) > entry.js.indexOf(script)) {
      throw new BuildCheckError(`${script} must load after ${stringsFile} in manifest.json`)
    }
  }
}

console.log('Build i18n check passed.')
