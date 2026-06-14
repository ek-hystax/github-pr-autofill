# GitHub PR Autofill

Chrome extension (Manifest V3) that autofills GitHub PR forms from branch naming conventions. Built with Vite + Vue 3 + `@crxjs/vite-plugin`.

## Setup

```sh
pnpm install
pnpm build       # outputs to dist/
pnpm dev         # watch mode
```

Load `dist/` as an unpacked extension in `chrome://extensions`.

## How it works

Injects a **Fill PR** button on `github.com/*/compare/*`. On click it:

1. Parses the source branch (`type/PROJ-1234` → extracts issue key)
2. Populates the PR body with an issue link (`issueBaseUrl + issueKey`)
3. Assigns the PR to the current user
4. Applies configured reviewers and labels via DOM interaction with GitHub's sidebar menus

## Configuration

Managed via the extension popup:

| Setting | Description |
|---|---|
| Issue Base URL | Prepended to the extracted issue key (e.g. `https://yourorg.atlassian.net/browse/`) |
| Reviewers | GitHub usernames auto-assigned on fill |
| Labels | Labels always applied |
| Conditional Labels | Labels applied when branch name or base branch matches a pattern (`contains` / `starts with` / `ends with`) |

Settings are persisted in `chrome.storage.sync`.

## Project structure

```
src/
  content/index.js   # content script — DOM interaction, branch parsing
  popup/
    index.html
    main.js
    App.vue          # settings UI (Vue 3 SFC)
manifest.json
vite.config.js
```
