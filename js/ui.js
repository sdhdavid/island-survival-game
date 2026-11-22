"use strict";
// ================= UI helpers =================
const $ = id => document.getElementById(id);
let msgTimer = 0, bannerTimer = 0, flashSlot = null;
function showMessage(title, text, secs = 6) { $('mTitle').textContent = title; $('mText').textContent = text; $('message').classList.add('show'); msgTimer = secs; }
function showBanner(big, small, secs = 2.8) { $('bBig').textContent = big; $('bSmall').textContent = small; $('banner').classList.add('show'); bannerTimer = secs; }
function fadeTo(on, text) { $('fade').classList.toggle('on', on); $('fadeText').textContent = text || ''; $('fadeText').classList.toggle('on', !!(on && text)); }
function renderHotbar() {
  const hb = $('hotbar'); hb.innerHTML = '';
  for (const id of ORDER) {
    if (!has(id)) continue;
    const it = ITEMS[id];
    const b = document.createElement('button');
    b.className = 'slot' + (it.food ? ' food' : '') + (it.tool ? ' tool' : '') + (flashSlot === id ? ' flash' : '');
    b.title = it.food ? `${it.n}: click to eat` : it.n; b.setAttribute('aria-label', b.title);
    b.innerHTML = `<img src="${ICON[id]}" alt="">${it.tool ? '' : `<b>${cnt(id)}</b>`}`;
    if (it.food) b.addEventListener('click', () => { if (mode === 'play' && !paused) eat(id); });
    hb.appendChild(b);
  }
  flashSlot = null;
}
const statEls = {};
for (const k of ['health', 'hunger', 'thirst', 'warmth']) { const el = $('s-' + k); statEls[k] = { el, bar: el.querySelector('i'), num: el.querySelector('.num'), last: -1 }; }
let lastPrompt = '';
function updateHUD() {
  for (const k in statEls) {
    const v = Math.round(S.st[k]), e = statEls[k];
    if (v !== e.last) { e.bar.style.width = v + '%'; e.num.textContent = v; e.el.classList.toggle('low', v < 25); e.last = v; }
  }
  const q = QUESTS[S.q];
  const qt = q.t, qp = q.p ? q.p() : '';
  if ($('qText').textContent !== qt) $('qText').textContent = qt;
  if ($('qProg').textContent !== qp) $('qProg').textContent = qp;
  const step = `${S.q + 1}/${QUESTS.length}`; if ($('qStep').textContent !== step) $('qStep').textContent = step;
  const day = 'Day ' + (Math.floor(S.time) + 1);
  if ($('dayLabel').textContent !== day) $('dayLabel').textContent = day;
  const hr = hour(), hh = Math.floor(hr), mm = Math.floor((hr - hh) * 6) * 10;
  const tl = `${(hh % 12) || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}${S.weather.rain > .3 ? ' · rain' : ''}`;
  if ($('timeLabel').textContent !== tl) $('timeLabel').textContent = tl;
  // prompt
  let html = '', off = false;
  if (placing) { html = placeValid() ? `<kbd>${isTouch ? 'Use' : 'E'}</kbd> Place ${placing.n}` : `${placing.id === 'raft' ? 'Face the shallow sea near a beach' : 'Find an open, flat spot'}`; off = !placeValid(); html += ` <button class="x" id="cancelPlace">Cancel</button>`; }
  else if (fishing) { html = fishing.phase === 'bite' ? `<kbd>${isTouch ? 'Use' : 'E'}</kbd> Reel it in!` : `Waiting for a bite… <kbd>${isTouch ? 'Use' : 'E'}</kbd> to reel in`; }
  else if (mode === 'play') { const a = actionFor(findTarget()); if (a) { if (a.fn) html = `<kbd>${isTouch ? 'Use' : 'E'}</kbd> ${a.t}`; else { html = a.t; off = true; } } }
  if (html !== lastPrompt) {
    const pe = $('prompt'); pe.innerHTML = html; pe.hidden = !html; pe.classList.toggle('off', off); lastPrompt = html;
    const cb = $('cancelPlace'); if (cb) cb.addEventListener('click', cancelPlacing);
  }
  if (hotbarDirty) { renderHotbar(); hotbarDirty = false; if (!craftEl.hidden) renderRecipes(); }
}
function hour() { return ((S.time % 1) + 1) % 1 * 24; }
function nightAmt(hr) {
  if (hr >= 7 && hr <= 18) return 0;
  if (hr > 18 && hr < 20.5) return smooth(18, 20.5, hr);
  if (hr >= 20.5 || hr < 4.5) return 1;
  return 1 - smooth(4.5, 7, hr);
}
function warmTint(hr) { return Math.max(Math.exp(-(((hr - 18.9) / 1.1) ** 2)), Math.exp(-(((hr - 6) / .9) ** 2)) * .8); }

// Dial + minimap
const dial = $('dial'), dctx = dial.getContext('2d');
const mm = $('minimap'), mctx = mm.getContext('2d');
const mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = 256;
const MM0 = 250, MMS = 2700;
function buildMinimap() {
  const c = mmBase.getContext('2d'); c.fillStyle = '#2f8bb5'; c.fillRect(0, 0, 256, 256);
  c.drawImage(terrainCv, MM0 / 2, MM0 / 2, MMS / 2, MMS / 2, 0, 0, 256, 256);
  // trees as tiny dots for texture
  for (const o of objects) if (o.type === 'tree' || o.type === 'pine') { c.fillStyle = o.type === 'pine' ? 'rgba(40,100,70,.55)' : 'rgba(50,120,60,.45)'; c.beginPath(); c.arc((o.x - MM0) / MMS * 256, (o.y - MM0) / MMS * 256, 2.2, 0, TAU); c.fill(); }
}
function drawMinimap() {
  mctx.drawImage(mmBase, 0, 0);
  const m = (x, y) => [(x - MM0) / MMS * 256, (y - MM0) / MMS * 256];
  for (const o of objects) {
    if (o.type === 'crate' && o.st !== 'open') { const [x, y] = m(o.x, o.y); mctx.fillStyle = '#ffc857'; mctx.strokeStyle = '#3b2c1a'; mctx.lineWidth = 2; mctx.beginPath(); mctx.rect(x - 5, y - 5, 10, 10); mctx.fill(); mctx.stroke(); }
    if (o.placed) { const [x, y] = m(o.x, o.y); mctx.fillStyle = o.type === 'campfire' ? (o.fuel > 0 ? '#ff8a3d' : '#8a8a8a') : o.type === 'raft' ? '#fff4dc' : '#a5703f'; mctx.beginPath(); mctx.arc(x, y, 5, 0, TAU); mctx.fill(); mctx.strokeStyle = '#2c251d'; mctx.lineWidth = 1.5; mctx.stroke(); }
  }
  const [px, py] = m(S.p.x, S.p.y), a = Math.atan2(S.p.dy, S.p.dx);
  mctx.save(); mctx.translate(px, py); mctx.rotate(a);
  mctx.fillStyle = '#fff'; mctx.strokeStyle = '#2c251d'; mctx.lineWidth = 2;
  mctx.beginPath(); mctx.moveTo(9, 0); mctx.lineTo(-6, -6); mctx.lineTo(-3, 0); mctx.lineTo(-6, 6); mctx.closePath(); mctx.fill(); mctx.stroke(); mctx.restore();
  // view rectangle
  const vw = W / Z / MMS * 256, vh = Hs / Z / MMS * 256; const [cx, cy] = m(cam.x, cam.y);
  mctx.strokeStyle = 'rgba(255,255,255,.55)'; mctx.lineWidth = 1.5; mctx.strokeRect(cx - vw / 2, cy - vh / 2, vw, vh);
}
function drawDial() {
  const c = dctx, hr = hour(), n = nightAmt(hr), s = 88;
  c.clearRect(0, 0, s, s); c.save(); c.beginPath(); c.arc(44, 44, 44, 0, TAU); c.clip();
  const sky = c.createLinearGradient(0, 0, 0, s);
  sky.addColorStop(0, `rgb(${lerp(126, 30, n)},${lerp(206, 38, n)},${lerp(240, 92, n)})`);
  sky.addColorStop(1, `rgb(${lerp(255, 70, n)},${lerp(226, 60, n)},${lerp(170, 120, n)})`);
  c.fillStyle = sky; c.fillRect(0, 0, s, s);
  const a = (hr / 24) * TAU + Math.PI / 2;
  const sx = 44 + Math.cos(a) * 26, sy = 50 + Math.sin(a) * 26;
  c.fillStyle = '#ffd25e'; c.beginPath(); c.arc(sx, sy, 9, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,230,140,.35)'; c.beginPath(); c.arc(sx, sy, 14, 0, TAU); c.fill();
  const mx = 44 - Math.cos(a) * 26, my = 50 - Math.sin(a) * 26;
  c.fillStyle = '#f4f1e6'; c.beginPath(); c.arc(mx, my, 7.5, 0, TAU); c.fill();
  c.fillStyle = `rgb(${lerp(126, 30, n)},${lerp(206, 38, n)},${lerp(240, 92, n)})`; c.beginPath(); c.arc(mx + 3.5, my - 2, 6.5, 0, TAU); c.fill();
  c.fillStyle = '#6fbf5e'; c.fillRect(0, 60, s, s); c.fillStyle = '#58a84f'; c.beginPath(); c.ellipse(20, 62, 30, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(70, 64, 28, 9, 0, 0, TAU); c.fill();
  c.restore();
}
