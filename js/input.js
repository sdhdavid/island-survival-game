"use strict";
// ================= Input =================
const keys = {};
let actHeld = false, joy = { x: 0, y: 0, active: false };
const isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
// Use the physical key position so WASD works on every keyboard layout (AZERTY, Hebrew, Cyrillic, IME…)
function keyName(e) {
  const c = e.code || '';
  if (c.startsWith('Key')) return c.slice(3).toLowerCase();
  const map = { ArrowUp: 'arrowup', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft', ArrowRight: 'arrowright', Space: ' ', Escape: 'escape', Enter: 'enter', NumpadEnter: 'enter' };
  if (map[c]) return map[c];
  return (e.key || '').toLowerCase();
}
function focusGame() { try { window.focus(); cv.focus({ preventScroll: true }); } catch (err) { } }
window.addEventListener('keydown', e => {
  const k = keyName(e);
  if (e.target && e.target.tagName === 'BUTTON' && (k === ' ' || k === 'enter') && mode === 'play') { e.preventDefault(); e.target.blur(); }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (mode !== 'play') { if (k === 'enter' && mode === 'title' && ready) startNew(); return; }
  keys[k] = true;
  if (e.repeat) return;
  if (k === 'c') toggleCraft();
  else if (k === 'h') toggleHelp();
  else if (k === 'escape') { if (!craftEl.hidden) toggleCraft(false); else if (!helpEl.hidden) toggleHelp(false); else if (placing) cancelPlacing(); }
  else if (k === 'm') toggleMute();
  else if (k === 'f' && !paused) eatBest();
  else if ((k === 'e' || k === ' ') && !paused) { actHeld = true; doAct(); }
});
window.addEventListener('keyup', e => { const k = keyName(e); keys[k] = false; if (k === 'e' || k === ' ') actHeld = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; actHeld = false; });
