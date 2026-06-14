# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chrome Extension (Manifest V3) built with Vite + Vue 3 + `@crxjs/vite-plugin`. The plugin reads `manifest.json` as the entry point config and outputs a ready-to-load extension into `dist/`.

```
pnpm build       # production build → dist/
pnpm dev         # watch mode (vite build --watch)
```

To test, load `dist/` as an unpacked extension in Chrome via `chrome://extensions` → "Load unpacked". Reload after each build.

## Architecture

The extension has two runtime contexts that cannot share code directly:

**Content script (`src/content/index.js`)** — injected into `https://github.com/*/compare/*` pages. Reads settings from `chrome.storage.sync`, manipulates the GitHub PR form DOM, and injects a "Fill PR" button next to the submit button. Uses a `retryOperation` helper for polling DOM elements that load asynchronously. Plain JS — no Vue.

**Popup (`src/popup/`)** — Vue 3 SFC app (`App.vue`) mounted via `main.js` / `index.html`. Manages settings UI for reviewers, always-on labels, and conditional label rules. Reads/writes `chrome.storage.sync` in `onMounted` and the `save()` function.

## Storage schema

All settings live in `chrome.storage.sync` under these keys:
- `issueBaseUrl` — string, base URL prepended to extracted issue keys
- `reviewersList` — string[], GitHub usernames to auto-assign as reviewers
- `labelsList` — string[], labels always applied
- `conditionalLabels` — array of `{ label, field, operator, branchPattern }` where `field` is `"Branch name"` or `"Base branch"` and `operator` is `"contains"`, `"starts with"`, or `"ends with"`

## Branch parsing

`getBranchInfo()` in `content.js` reads from `#head-ref-selector .css-truncate` and matches the pattern `/^([^/]+)\/([A-Z]+-\d+)$/` (e.g. `feature/PROJ-1234`). If the branch doesn't match, `isValid` is false and the issue link falls back to just the base URL or bare issue number.

## DOM interaction pattern

GitHub's sidebar menus (reviewers, labels) are `<details>` elements that load content asynchronously. The flow for each: `openPopup` → `selectPopupItems` → `closePopup`, each backed by `retryOperation` with configurable `maxRetries` and `retryInterval`. Failures are caught and logged rather than surfaced to the user.
