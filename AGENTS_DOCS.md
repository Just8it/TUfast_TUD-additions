# AGENTS_DOCS.md

Knowledge base for agents. `AGENTS.md` directs agents to read this file at the start of every session — keep it short enough to stay worth that read. It carries gotchas, noteworthy bugfixes, major (design) decisions, and anything important for future development that does not fit in code comments or commit messages. Reference features, PRs, commits, GH issues, and GH discussions where appropriate — the link carries the full story, the entry here only the conclusion.

Organized by topic, not chronology: entries state current truth. Edit or delete entries that are no longer accurate. Keep entries to a few lines — this file is loaded into every agent's context. Add topic headings as the project needs them.

Routing rule: needed on every task → `AGENTS.md`. Durable area-specific knowledge or decision → here. Actionable work item → GitHub issue. Explanation of one specific change → commit/PR message.



## Gotchas

- Auto-login is the highest-risk area: failed-login loops have locked real ZIH student accounts (ZIH escalated; urgent fix in #156, recurrence in #160). Failure detection is literal string matching per portal (`findCredentialsError` in `src/contentScripts/login/*.ts`) plus a `loggedOut` cookie — there is no retry cap, so when a portal or the IdP changes its HTML, detection breaks silently and the loop runs (#148 broke this way for TOTP). Test the wrong-credentials path, not just the happy path.
- The Chrome Web Store rejects manifest asset paths with a `./` prefix — upload of 8.1.1.2 failed until icon paths became bare (#161).
- Firefox for Android has no `chrome.commands`; unguarded hotkey registration crashed the extension there (#166 — hence the `if (chrome.commands)` guard in `background.ts`). Mobile also renders the popup as a normal full page; known mobile issues are collected in #176.
- Classic manifest content scripts share one isolated-world global scope, so top-level/minified names can collide across files. This was observed in Firefox as `TUFAST_STRINGS_READY`/`TUFAST_STRINGS` failures during #194, but the root cause is shared-scope classic scripts; keep the IIFE wrapping in `vite.config.mjs` and the build guards in `scripts/verify-build.mjs`.
- Firefox WebExtension content scripts reject promises returned from `navigator.locks.request()` callbacks with `Permission denied to access property "then"` (Mozilla bug 1873028). Do not use Web Locks in content scripts.
- `chrome.runtime.sendMessage` request/response shapes are duplicated informally between `background.ts` and each consumer, with `as`-casts standing in for a contract — shape mismatches fail silently (`check_all_settings` answers `userData`, not the `login` key the settings UI expected; latent on `main`, surfaced as a literal "null" badge during #194, fixed there by merging instead of replacing state in `useAllSettingsStatus.ts`). Don't trust the casts; check the actual handler in `background.ts`. A potential fix would be a shared typed protocol module (per-`cmd` request/response types imported by both sides), which could be considered for a future messaging rewrite — it touches every `sendMessage` call site, so don't do it as a drive-by change.
- OPAL PDF handling: Chrome derives download filenames from the URL, so `pdfInInline` can give in-browser opening or the correct filename, not both (#82, wontfix).

## Design decisions

- Custom `src/i18n` runtime instead of `vue-i18n`: the dependency was tried during the i18n work (#191–#194) and removed because the custom helper already did everything — one clear mechanism preferred; rationale in `CONTRIBUTING.md`.
- SmartSearch V2 is enabled by default if merged. Keep the focused OPAL palette and adapter-only popup on the shared `opal_smart_search_query` provider; indexing is a button action, not another persistent toggle.
- SmartSearch consumes the existing `favoriten`/`meine_kurse` storage from `parseCourses.ts`. Improve reuses stored favorites, or publishes a cancellable `starting` job before navigating to favorites and waiting for the list to settle; pressing Improve again during startup or crawling cancels it.
- Active progress is the resumable job latch. `startedAt` is its generation id and `ownerTabId` its single-tab lease; every crawl, write, prune, and course commit must match both. Background-owned monotonic counters and idempotent commits prevent retries from moving progress backward or double-counting.
- Explicit numbers are strong title intent (`Serie_9` and `Serie9` tokenize alike). Plain topic queries favor folders, while `/f` and extension tokens favor files and may inherit a strongly matching parent folder title.
- Rendered iframe indexing is primary and fetch parsing is fallback. Expand `.pager-showall` before reading a numbered table; missing or unconfirmed expansion makes the course incomplete. Keep the iframe sandbox free of top-navigation, and expect the existing OPAL tab to be inconvenient while its job runs.
- CourseNode caps must cover courses with 25+ weekly sections; the five-minute per-course budget is the real safety brake. Markup-only files are stored once and never queued as folders.
- Centralize navigation/control filtering and course scoping in `urlPolicy.ts`. Explicit file signals must win over `CourseNode`, because OPAL downloads often contain both; cross-course results need a separate type rather than entering the course graph.
- Improve must revisit existing sections so extractor fixes can repair old data. Only a complete rendered crawl may prune stale nodes or count as successful; partial and fallback crawls may retain useful nodes but remain incomplete.
- Crawling and passive discovery record zero visits. Interrupted jobs resume under the same generation and owner with monotonic counters, while explicit cancellation returns to idle and must never resume.


## ToDo — improvement ideas

Agent-suggested improvements to the project and codebase, recorded as context for later. Not a task tracker: when an idea becomes concrete and actionable, open a GitHub issue and link it here, or remove the entry.

- Persistent retry counter as a failsafe for auto-login, capping attempts even when string detection breaks (maintainer-discussed in #156/#160; prototype in A-K-O-R-A's `feature.login-timouts` branch). Complements, not replaces, the string detection.
- Keep the temporary SmartSearch OPAL-console dump bridge during beta diagnosis at the user's discretion. Remove `opal_smart_search_dump_nodes` and `tufast-smart-search-debug-dump` before the merge-ready release build.

