# Contributing

## TL;DR
- Before implementing a feature, we recommend communicating with us via GitHub - code maintainers often have good suggestions for the implementation.
- Commit any changes (new features or hot-fixes) directly against the main branch.
- The use of coding agents is encouraged, but see restrictions below.

## Design Philosophy

TUfast works out of the box — a nice-to-use and beautiful tool. It's meant to make student life easier rather than adding complexity on top, which includes non-technical users. Thus, TUfast requires minimal setup: prefer sensible defaults over options. User-facing interactions are lightweight and easy to understand. New features ship mostly **enabled by default** — meaning we only build features that matter, and test them well. This keeps TUfast simple: sensible default settings, minimal setup required. For details, see [discussion](https://github.com/TUfast-TUD/TUfast_TUD/discussions/180#discussioncomment-17564566).

## Coding agents
- All agents must read AGENTS.md (should usually happend automatically)
- Any **text used to directly communicate with other humans** (contributors, maintainers, other developers) **must be written by humans** mostly. This applies to Issues, Discussions, PRs, and files like README.md and CONTRIBUTING.md. If partially or fully written by AI, it must be flagged as such by starting the text with `🤖 AI-generated` (or `🤖 partially AI-generated`). PR Summaries etc can be AI-generated, but explicitly **flagged as such**. This is to keep communication fair - in those documents we are looking for genuine human insights.


## Getting started with browser extensions

If you never worked with browser extensions before, you should read this [tutorial](https://developer.chrome.com/docs/extensions/get-started) by Google, or these [instructions](https://developer.mozilla.org/de/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension) from mozilla. Make sure you understand the difference between conten scripts and background scripts, their scopes, and how they exchange information using messages.

## Working with this repo

Everything related to the browser extension can be found in `/src`: the `manifest.json`, the `background.js`, and so on. Content scripts are in `/src/contentScripts`. In `/src/freshContent` you can find newly created content required for, e.g., the popup and settings page. `/docs` contains further instructions for users of TUfast, _not_ documentation for the code. 

Steps to contribute:

1. Create your local clone of this repo `git clone <url-of-your-repo>`.
3. Create your new branch directly from the main branch `git checkout -b <my_new_feature_branch>`.
4. Install all dependencies via `npm ci`. (You need node package manager [`npm`](https://www.npmjs.com/) installed.)
5. Run `npm run useChrome` or `npm run useFF` to select the browser you are developing for - this will copy the corresponding manifest.json.
6. Run `npm run dev` while developing. This is will compile `.sass` and `.ts` files and watch for changes in your working tree.
7. Load the `./build` directory as an unpacked extension in your browser to test the extension.

After developing:

8. Run `npm run test` locally before pushing code. This will also check if your code is formatted correctly. You can use [this extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) to automatically format your code (recommended) or use `npm run prettier:fix`. (See also below.) Wrong formatting will result in failing CI on GitHub!
9. **Increase the version number in `package.json` according to [SemVer](https://semver.org/). The version number will be automatically copied over to the manifest*.json file during build. An increase in version number is strictly required for new TUfast releases!**
10. Create a pull request against `main`.
11. Await our review.

**Note:** as a project member you can also directly work in this repo directly and manage PRs, making the contribution process easier.

## Used frameworks
- **Build tool**: [Vite](https://vite.dev/). Run `npm run dev` to compile sass and ts files.
- **CSS-Preprocessor**: We are using [SASS](https://sass-lang.com/).
- **Code style and linting**: We are using ESlint and prettier. Run `npm run test` to check your code style and linting before pushing code. Wrong formatting will result in a failing CI. You should configure your editor to automatically format on save with prettier for which VSCode provides [this extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
- **Localization**: TUfast uses the custom `src/i18n` helper with JSON locale files in `src/i18n/locales/*.json`, so the same translations work in Vue pages, popup, background, and content scripts.

## Strings and locales

User-facing strings are stored in `src/i18n/locales/*.json`. Do not write user-facing copy inline in Vue components, content scripts, popup code, background code, or shared modules. The language setting defaults to `auto` (use the browser UI language). If not supported, it falls back to English.  Manual language choice overrides `auto`. German (`de.json`) is the reference for the locale structure (for legacy reasons). 

The build generates browser `_locales/<lang>/messages.json` from each locale’s `manifest` block. Locale checks are part of `npm run test`.

### Adding or changing user-facing text

1. Add the string to `src/i18n/locales/de.json`.
2. Add the same key to every other locale.
3. Keep the key structure identical across all locale files.
4. Use `t('path.to.string')` in Vue pages, popup code, background code, and shared modules.
5. Put manifest-loaded content script strings in the locale’s `content` block. They are exposed through `globalThis.TUFAST_STRINGS`.
6. Run `npm run test`.

### Adding a language

1. Copy `src/i18n/locales/de.json` to `src/i18n/locales/<language>.json`.
2. Translate values only.
3. Keep all keys unchanged.
4. Run `npm run test`.



## Known peculiarities and bugs
- `Unchecked runtime.lastError: The message port closed before a response was received.` Promisifying chrome.runtime.sendMessage({...}) doesnt work, because when you define a callback (Promise.resolve) sendMessage will wait until sendResponse is called in the message handler. It just stalls execution and then dies if it's never called. **Solutions:** 1) Unpromisify sendMessage. 2) Always return a value (return true is fine).
- **Prettier in Windows**: `npm run prettier` might show warning and git might show changes, although all files are formatted correctly visually. This is due to end-of-line conventions. For information and fix see [this issue](https://github.com/TUfast-TUD/TUfast_TUD/pull/157).

## Have fun developing! 🔥
