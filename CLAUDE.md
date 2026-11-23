# Yoni's Island (האי של יוני) — notes for working on this repo

- Plain HTML/CSS/JS, no build step, no dependencies. Must keep working when `index.html` is opened from `file://`, so no ES modules or fetch of local files.
- Scripts in `js/` are classic scripts that share globals. Load order in `index.html` matters for top-level code; code inside functions may use anything. New file → add a `<script>` tag in the right place.
- Every feature must work with both keyboard and touch (see `js/controls.js`). No hover-only or keyboard-only interactions. Check phone width (~390px) as well as desktop.
- Keyboard input uses `e.code` (physical key), not `e.key`, so it works on any layout (the owner uses a Hebrew layout).
- Debug mode: open with `?debug`. Add new debug buttons to `DEBUG_ACTIONS` in `js/debug.js`.
- The world is generated from fixed seeds; changing generation order in `genObjects` changes object ids and breaks existing saves (`serialize` stores object state by id). Bump `SAVE_KEY` if that happens.
- The owner writes in Hebrew; README is in Hebrew. Code and comments stay in English.
- All player-facing text goes through `t('key')` with entries in both `en` and `he` in `js/i18n.js` (static HTML uses `data-i18n*` attributes). Never hard-code UI text. The Hebrew audience includes an 8-year-old: short, simple sentences, masculine singular imperative. Check Hebrew layout (RTL) on desktop and phone.
- Versioning: every change merged to main bumps `GAME_VERSION` in `js/util.js` (shown in-game) and adds an entry at the top of `CHANGELOG.md` (in Hebrew). Patch (0.2.x) for fixes and small tweaks, minor (0.x.0) for new features or content.
- Workflow (approved by the owner): every change goes on its own branch with a pull request. Once the checks pass (load the game, play through the affected feature, desktop and phone widths, no console errors), merge the PR yourself without asking, then tell the owner the new version number and what changed.
- Link preview: Open Graph tags in `index.html` point to `og-image.jpg` (1200x630). If the title or look changes, regenerate it and `icon.png` with `node tools/make-preview-images.js`. Internal ids such as the `driftwood-*` storage keys keep their old name so saves survive.
- Full screen: `FS` in `js/controls.js`. Touch devices enter full screen inside the Begin/Continue/Play-again tap. iPhone Safari has no Fullscreen API, so it relies on the web app manifest + Apple meta tags (Add to Home Screen) and the title-screen hint `#iosHint`. Keep `env(safe-area-inset-*)` padding on anything fixed to a screen edge, since full screen and the home-screen app draw under the notch.
