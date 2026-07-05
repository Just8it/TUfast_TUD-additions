# AGENTS.md

Guidance for AI agents working in this repository. Keep changes small, trace the existing flow first, and prefer the local patterns over new abstractions.

## Fast Start

1. Use Node 22 and npm 10. `.nvmrc` pins Node 22; do not regenerate `package-lock.json` with another npm major.
2. Install dependencies with `npm ci` if `node_modules` is missing.
3. Pick a browser manifest with `npm run useChrome` or `npm run useFF`.
4. Run `npm run dev` while developing, then load `build/` as an unpacked extension.
5. Before handoff, run the checks described below.
6. For release-bound changes, increase `package.json` according to SemVer. The build copies the version into `manifest*.json`.

## Change Checklist

1. Scan the closest existing files before editing. Match their imports, naming, comments, error handling, storage access, and whether logic lives locally or in a shared module.
2. Decide the entrypoint: settings page, popup, background command, content script, or shared module.
3. If user-facing text changes, add matching locale keys to every locale JSON and use `t()` or `TUFAST_STRINGS` according to the runtime.
4. If manifest behavior changes, update both browser-specific manifests with the narrowest useful `matches`, `run_at`, CSS, permissions, and web-accessible resources.
5. If settings state is needed, store it in `chrome.storage.local`, add defaults/migrations in `background.ts`, and update settings status logic if the dashboard shows it.
6. If background behavior is needed, add one `cmd` branch in `background.ts` and keep the request/response shape simple.
7. Do not edit generated `build/` output.
8. During iteration, run the narrowest useful check. Before handoff/commit/push for code changes, run `npm run test` and `git diff --check`. For docs-only changes, no test is required unless package, config, build, or command docs changed.

`npm run test` runs typecheck, lint, prettier check, build, locale validation, and build-output validation. Existing lint warnings for `vue/no-v-html` in onboarding pages are known.

If browser extensions are new to you, read Google's extension tutorial or Mozilla's WebExtension intro first. Understand content scripts, background scripts, their scopes, and message passing before editing runtime behavior.

- Chrome tutorial: https://developer.chrome.com/docs/extensions/get-started
- Firefox tutorial: https://developer.mozilla.org/de/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension

Contribution flow from `CONTRIBUTING.md`: talk to maintainers on GitHub before larger features, branch from `main`, run the test pipeline, open a PR against `main`, and wait for review.

Before starting larger work, read `CONTRIBUTING.md` and `README.md`. If they contain workflow, build, or feature information that is missing here or makes this file look outdated, tell the user and suggest updating `AGENTS.md` first.

## Project Map

- `src/manifest.chrome.json` and `src/manifest.firefox.json`: browser-specific extension manifests. Keep them in sync when changing permissions, content scripts, commands, icons, or default locale.
- `src/manifest.json`: active local manifest copied from one browser-specific manifest by `npm run useChrome` or `npm run useFF`.
- `src/background.ts`: MV3 service worker. Owns install/update defaults, migrations, hotkeys, tab actions, storage-backed settings, and `chrome.runtime.onMessage` commands.
- `src/contentScripts/login`: auto-login scripts and their shared login helper.
- `src/contentScripts/other`: page enhancements for OPAL, HisQis, SELMA, OTP, OWA, etc.
- `src/contentScripts/forward`: search-engine and OPAL forwarders.
- `src/freshContent/popup`: popup HTML and classic popup JavaScript.
- `src/freshContent/settings`: Vue settings app, setting pages, onboarding, composables, and shared settings metadata.
- `src/modules`: shared extension modules used mainly by the background worker and login/content scripts.
- `src/i18n`: custom localization runtime and JSON locale files.
- `docs`: user-facing TUfast documentation, not internal code documentation.
- `scripts`: build and validation helpers.
- `build`: generated output. Do not edit it.

## Build Notes

- Vite treats most files under `src/` as build inputs and writes to `build/`.
- The stack is Vite, Vue 3, TypeScript, SASS, ESLint, Prettier, and a custom i18n helper.
- Keep `package-lock.json` on npm 10. Do not regenerate or rebase the lockfile with another npm major version; it can rewrite the lockfile incorrectly for this repo.
- `vite.config.mjs` keeps most content scripts as classic manifest-loaded scripts. Be careful when adding imports or dynamic imports to content scripts.
- Browser `_locales/<lang>/messages.json` files are generated from each locale JSON file's `manifest` block.
- `i18n/contentScriptStrings.js` is built from `src/i18n/contentScriptStrings.ts`; the Vite plugin injects locale data from `src/i18n/locales/*.json`.
- Use `npm run prettier:fix`, `npm run lint:fix`, or `npm run test:fix` only when intentionally rewriting formatting/lint fixes. The repo recommends the VSCode Prettier extension for format-on-save.
- On Windows, Prettier/git can report end-of-line noise even when files look formatted. Check `.gitattributes`, `.prettierrc.json`, and the existing CONTRIBUTING note before doing unrelated churn.

## Localization Rules

- TUfast uses the custom `src/i18n` helper. Do not add `vue-i18n` runtime usage.
- User-facing copy belongs in `src/i18n/locales/*.json`, not inline in Vue, popup, background, shared modules, or content scripts.
- `de.json` is the structure and type reference. Unsupported runtime locales fall back to English.
- The language setting defaults to `auto`: use the browser UI language when supported, otherwise English. Manual user choice in `chrome.storage.local.locale` overrides `auto`.
- Use `await initLocale()` before rendering translated UI that depends on the stored locale.
- Do not call `t()` at module top level for exported arrays or objects. Export a factory such as `getSettings()` or `getOnboardingSteps()` so translation happens after locale init.
- Content scripts that use translated strings must list `i18n/contentScriptStrings.js` before the content script in the manifest and must await `globalThis.TUFAST_STRINGS_READY` before reading `globalThis.TUFAST_STRINGS`.
- Content-script strings live under the locale JSON `content` block.
- Locale status is stored as `localeStatus` in each locale JSON. The language selector reads it from there.

## Extension API Rules

- For async `sendResponse` in `chrome.runtime.onMessage`, return `true` from the message handler branch.
- Do not promisify `chrome.runtime.sendMessage` with a callback unless the receiver definitely responds. Fire-and-forget messages should not wait for a response.
- `chrome.storage.local` is the source of truth for extension settings. Do not mirror locale or settings into `localStorage`.
- If adding a setting, add install defaults, update migration defaults, UI wiring, and any status tile behavior together.
- Current defaults that should stay consistent:
  - `locale`: `auto`
  - unsupported locale fallback: English
  - `improveSelma`: missing value means enabled
  - `studiengang`: missing or unknown value falls back to the stable key `general`

## Review Bias

- Keep PRs narrow and reviewable.
- Contributors should branch from `main`; project members can also work directly in the main repo when that matches the maintainers' workflow.
- Prefer deletion and local patterns over new helpers.
- Do not add dependencies for small logic.
- Touch generated files only through the build.
- If a reviewer asks for project-specific style over general best practice, follow the project style and keep the change explicit.
