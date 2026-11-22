"use strict";
// ================= Debug mode =================
// Active only when the page is opened with ?debug (or #debug).
// Toggle the panel with the ` key (left of 1) or the "Debug" button.
// Uses its own save slot (see SAVE_KEY in util.js), so it never touches a real game.

const DEBUG_SPEEDS = [1, 5, 20, 60];
let debugEl = null, debugInfoEl = null, debugInfoTimer = 0, debugFrames = 0, debugFpsTime = 0;

function debugReady() { return S && mode === 'play'; }

// Find the nearest spot where the player can stand: walkable and not inside a solid object.
function findStandSpot(x, y) {
  for (let r = 0; r < 400; r += 8) {
    for (let a = 0; a < TAU; a += r ? 8 / r : TAU) {
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (!walkable(px, py) || Hh(px, py) < 0) continue;
      if (nearby(px, py, 60).some(o => { const sr = solidR(o); return sr && dist(px, py, o.x, o.y) < sr + 12; })) continue;
      return { x: px, y: py };
    }
  }
  return { x: SPAWN.x, y: SPAWN.y };
}
function debugTeleport(x, y) {
  if (!debugReady()) return;
  const p = findStandSpot(x, y);
  S.p.x = p.x; S.p.y = p.y; cam.x = p.x; cam.y = p.y; fishing = null;
}
function debugGive(items) {
  if (!debugReady()) return;
  for (const [k, n] of Object.entries(items)) S.inv[k] = cnt(k) + n;
  hotbarDirty = true; SFX.pop();
}
function debugSetHour(h) {
  if (!debugReady()) return;
  S.time = Math.floor(S.time) + h / 24;
}

const DEBUG_ACTIONS = [
  { group: 'Items' },
  { label: '+20 materials', fn: () => debugGive({ wood: 20, stone: 20, fiber: 20, rope: 5 }) },
  { label: 'All tools', fn: () => { if (!debugReady()) return; for (const t of ['axe', 'pickaxe', 'rod']) if (!has(t)) S.inv[t] = 1; hotbarDirty = true; } },
  { label: 'Raw food', fn: () => debugGive({ fish: 3, crab: 2, berries: 5, coconut: 2 }) },
  { label: '3 cooked meals', fn: () => debugGive({ cookedFish: 3 }) },
  { label: 'Raft kit', fn: () => debugGive({ wood: 16, rope: 4, sail: 1 }) },
  { label: 'Clear bag', fn: () => { if (!debugReady()) return; S.inv = {}; hotbarDirty = true; } },
  { group: 'Time and weather' },
  { label: 'Speed ×1', id: 'dbgSpeed', fn: () => { const i = DEBUG_SPEEDS.indexOf(DEBUG.timeScale); DEBUG.timeScale = DEBUG_SPEEDS[(i + 1) % DEBUG_SPEEDS.length]; } },
  { label: 'Morning', fn: () => debugSetHour(7) },
  { label: 'Noon', fn: () => debugSetHour(12) },
  { label: 'Dusk', fn: () => debugSetHour(18.6) },
  { label: 'Night', fn: () => debugSetHour(22) },
  { label: 'Next day', fn: () => { if (debugReady()) S.time = Math.floor(S.time) + 1.3; } },
  { label: 'Toggle rain', fn: () => { if (!debugReady()) return; const w = S.weather; if (w.target > 0) { w.target = 0; w.rain = 0; } else { w.target = 1; w.rain = .8; } w.next = 60; } },
  { group: 'Player' },
  { label: 'God mode: off', id: 'dbgGod', fn: () => { DEBUG.god = !DEBUG.god; } },
  { label: 'Fill needs', fn: () => { if (debugReady()) S.st = { health: 100, hunger: 100, thirst: 100, warmth: 100 }; } },
  { label: 'Drain needs', fn: () => { if (debugReady()) S.st = { health: 30, hunger: 5, thirst: 5, warmth: 5 }; } },
  { label: 'Hitboxes: off', id: 'dbgHit', fn: () => { DEBUG.hitboxes = !DEBUG.hitboxes; } },
  { group: 'Teleport' },
  { label: 'Beach (start)', fn: () => debugTeleport(SPAWN.x, SPAWN.y) },
  { label: 'Pond', fn: () => debugTeleport(POND.x, POND.y + POND.r * 1.35) },
  { label: 'Mountain', fn: () => debugTeleport(MOUNT.x, MOUNT.y) },
  { label: 'Crate 1', fn: () => crates[0] && debugTeleport(crates[0].x, crates[0].y + 30) },
  { label: 'Crate 2', fn: () => crates[1] && debugTeleport(crates[1].x, crates[1].y + 30) },
  { label: 'Crate 3', fn: () => crates[2] && debugTeleport(crates[2].x, crates[2].y + 30) },
  { group: 'Objectives' },
  { label: 'Skip objective', fn: () => { if (!debugReady()) return; if (S.q < QUESTS.length - 1) { S.q++; SFX.quest(); } } },
  { label: 'Restart objectives', fn: () => { if (debugReady()) S.q = 0; } },
  { label: 'New debug game', fn: () => { if (ready && mode !== 'loading') { $('end').hidden = true; sail = null; startNew(); } } }
];

function setupDebug() {
  debugEl = document.createElement('div');
  debugEl.id = 'debug';
  debugEl.className = 'card';
  debugEl.innerHTML = `<div class="dbg-head"><span class="label">Debug</span><button id="dbgToggle" class="dbg-min" aria-label="Collapse debug panel">–</button></div><div class="dbg-body"><pre id="dbgInfo"></pre><div id="dbgActions"></div><div class="dbg-hint">Press <kbd>\`</kbd> to hide or show</div></div>`;
  document.body.appendChild(debugEl);
  debugInfoEl = debugEl.querySelector('#dbgInfo');
  const box = debugEl.querySelector('#dbgActions');
  for (const a of DEBUG_ACTIONS) {
    if (a.group) { const h = document.createElement('div'); h.className = 'dbg-group'; h.textContent = a.group; box.appendChild(h); continue; }
    const b = document.createElement('button');
    b.textContent = a.label; if (a.id) b.id = a.id;
    b.addEventListener('click', () => { a.fn(); debugLabels(); focusGame(); });
    box.appendChild(b);
  }
  debugEl.querySelector('#dbgToggle').addEventListener('click', () => { debugCollapse(); focusGame(); });
  if (isTouch) debugCollapse(true);
  window.addEventListener('keydown', e => { if (e.code === 'Backquote') debugCollapse(); });
  debugLabels();
}
function debugCollapse(force) {
  const c = debugEl.classList.toggle('collapsed', force);
  const b = debugEl.querySelector('#dbgToggle');
  b.textContent = c ? '+' : '–'; b.setAttribute('aria-label', c ? 'Expand debug panel' : 'Collapse debug panel');
}
function debugLabels() {
  const set = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  set('dbgSpeed', `Speed ×${DEBUG.timeScale}`);
  set('dbgGod', `God mode: ${DEBUG.god ? 'on' : 'off'}`);
  set('dbgHit', `Hitboxes: ${DEBUG.hitboxes ? 'on' : 'off'}`);
  document.getElementById('dbgGod')?.classList.toggle('on', DEBUG.god);
  document.getElementById('dbgHit')?.classList.toggle('on', DEBUG.hitboxes);
  document.getElementById('dbgSpeed')?.classList.toggle('on', DEBUG.timeScale > 1);
}
function debugTick(dt) {
  debugFrames++; debugFpsTime += dt;
  if (debugFpsTime >= .5) { DEBUG.fps = Math.round(debugFrames / debugFpsTime); debugFrames = 0; debugFpsTime = 0; }
  debugInfoTimer -= dt;
  if (debugInfoTimer > 0 || !debugInfoEl || debugEl.classList.contains('collapsed')) return;
  debugInfoTimer = .2;
  const lines = [`fps   ${DEBUG.fps}   mode ${mode}`];
  if (S) {
    const h = Hh(S.p.x, S.p.y), hr = hour();
    lines.push(`pos   ${S.p.x | 0}, ${S.p.y | 0}   h ${h.toFixed(3)}`);
    lines.push(`time  day ${Math.floor(S.time) + 1}  ${String(Math.floor(hr)).padStart(2, '0')}:${String(Math.floor((hr % 1) * 60)).padStart(2, '0')}  night ${nightAmt(hr).toFixed(2)}`);
    lines.push(`rain  ${S.weather.rain.toFixed(2)}  next change ${Math.max(0, S.weather.next) | 0}s`);
    lines.push(`quest ${S.q + 1}/${QUESTS.length}`);
    lines.push(`objs  ${objects.length}  crabs ${crabs.length}  fx ${particles.length}`);
  }
  debugInfoEl.textContent = lines.join('\n');
}

// Drawn in world coordinates (called from render() when hitboxes are on)
function drawDebugWorld(x0, y0, vw, vh) {
  ctx.lineWidth = 1.5;
  for (const o of nearby(cam.x, cam.y, Math.max(vw, vh) / 2 + 60)) {
    const r = solidR(o);
    if (r) { ctx.strokeStyle = 'rgba(255,70,70,.9)'; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, TAU); ctx.stroke(); }
    if (o.type === 'campfire' && o.fuel > 0) { ctx.strokeStyle = 'rgba(255,170,60,.8)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(o.x, o.y, 135, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }
  if (!S || mode === 'title') return;
  const p = S.p;
  ctx.strokeStyle = 'rgba(120,200,255,.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.dx * 16, p.y + p.dy * 16); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,200,255,.5)'; ctx.beginPath(); ctx.arc(p.x + p.dx * 16, p.y + p.dy * 16, 30, 0, TAU); ctx.stroke();
  const T = findTarget();
  if (T) {
    const tx = T.kind === 'obj' ? T.o.x : T.kind === 'crab' ? T.c.x : T.x, ty = T.kind === 'obj' ? T.o.y : T.kind === 'crab' ? T.c.y : T.y;
    ctx.strokeStyle = 'rgba(255,220,80,1)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(tx, ty, 14, 0, TAU); ctx.stroke();
  }
}
