# Oneko for Chrome

Puts the Oneko cat on every site. It runs the same engine as `oneko.js`, bundled into the
extension: Manifest V3 does not allow remotely hosted code.

```bash
pnpm build:extension
```

This writes the unpacked extension to `dist/extension` and the Web Store upload to
`dist/oneko-chrome-<version>.zip`. To try it, open `chrome://extensions`, turn on Developer mode,
and choose **Load unpacked** with `dist/extension`.

| File              | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `manifest.json`   | Manifest. Bump `version` before each upload.                     |
| `loader.js`       | Classic content script that imports the ES module engine.        |
| `src/content.ts`  | Mounts the cat and applies settings live.                        |
| `src/popup.ts`    | Toolbar popup: on/off, per-site switch, coat, size, and toggles. |
| `src/settings.ts` | Settings stored in `chrome.storage.sync`.                        |

## Chrome Web Store listing

**Single purpose:** shows an animated pixel cat that follows the cursor on web pages.

**Permission justifications**

- `storage`: saves the chosen coat, size, and on/off settings, synced across the user's browsers.
- `activeTab`: reads the current tab's host name when the popup opens, for the "On this site"
  switch.
- Host access (`<all_urls>` content script): the cat is drawn on the pages the user visits. The
  script reads no page content and sends nothing anywhere.

**Remote code:** none. All JavaScript ships in the package.

**Data use:** the extension collects no user data.
