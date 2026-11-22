# Driftwood Isle — notes for working on this repo

- Plain HTML/CSS/JS, no build step, no dependencies. Must keep working when `index.html` is opened from `file://`, so no ES modules or fetch of local files.
- Scripts in `js/` are classic scripts that share globals. Load order in `index.html` matters for top-level code; code inside functions may use anything. New file → add a `<script>` tag in the right place.
- Every feature must work with both keyboard and touch (see `js/controls.js`). No hover-only or keyboard-only interactions. Check phone width (~390px) as well as desktop.
- Keyboard input uses `e.code` (physical key), not `e.key`, so it works on any layout (the owner uses a Hebrew layout).
- Debug mode: open with `?debug`. Add new debug buttons to `DEBUG_ACTIONS` in `js/debug.js`.
- The world is generated from fixed seeds; changing generation order in `genObjects` changes object ids and breaks existing saves (`serialize` stores object state by id). Bump `SAVE_KEY` if that happens.
- The owner writes in Hebrew; README is in Hebrew. Code and comments stay in English.
