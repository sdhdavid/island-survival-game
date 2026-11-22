"use strict";
// ================= Rendering =================
function render() {
  const t = Tm;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vw = W / Z, vh = Hs / Z, x0 = cam.x - vw / 2, y0 = cam.y - vh / 2;
  ctx.setTransform(DPR * Z, 0, 0, DPR * Z, DPR * (W / 2 - cam.x * Z), DPR * (Hs / 2 - cam.y * Z));
  // water
  const wg = ctx.createLinearGradient(x0, y0, x0, y0 + vh);
  wg.addColorStop(0, '#2b84b1'); wg.addColorStop(1, '#2f8fb9');
  ctx.fillStyle = wg; ctx.fillRect(x0 - 2, y0 - 2, vw + 4, vh + 4);
  // wave glints
  ctx.strokeStyle = 'rgba(220,250,255,.32)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  const cs = 70; ctx.beginPath();
  for (let gy = Math.floor(y0 / cs); gy <= Math.ceil((y0 + vh) / cs); gy++) for (let gx = Math.floor(x0 / cs); gx <= Math.ceil((x0 + vw) / cs); gx++) {
    const hsh = hashi(gx, gy, 5), ph = hsh * TAU;
    const x = gx * cs + hashi(gx, gy, 6) * cs + Math.sin(t * .4 + ph) * 10, y = gy * cs + hsh * cs;
    const k = Math.sin(t * 1.1 + ph); if (k < .2) continue;
    if (Hh(x, y) > -.03) continue;
    const l = 5 + k * 6; ctx.moveTo(x - l, y); ctx.quadraticCurveTo(x, y - 3, x + l, y);
  }
  ctx.stroke();
  // terrain
  ctx.imageSmoothingEnabled = true;
  const sx = clamp(x0, 0, WORLD), sy = clamp(y0, 0, WORLD), ex = clamp(x0 + vw, 0, WORLD), ey = clamp(y0 + vh, 0, WORLD);
  if (ex > sx && ey > sy) ctx.drawImage(terrainCv, sx / 2, sy / 2, (ex - sx) / 2, (ey - sy) / 2, sx, sy, ex - sx, ey - sy);
  // foam
  drawFoam(t, x0, y0, vw, vh);
  // footprints
  ctx.fillStyle = 'rgba(170,140,90,.35)';
  for (const f of footprints) { if (f.life <= 0) continue; ctx.globalAlpha = Math.min(1, f.life / 4); ctx.beginPath(); ctx.ellipse(f.x, f.y, 3.2, 1.8, f.a, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  // ripples under
  for (const q of particles) if (q.kind === 'ripple') { const k = 1 - q.life / q.max; ctx.strokeStyle = `rgba(255,255,255,${.5 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.size + k * 12, (q.size + k * 12) * .5, 0, 0, TAU); ctx.stroke(); }
  // sorted drawables
  const list = nearby(cam.x, cam.y, Math.max(vw, vh) / 2 + 140).filter(o => o.st !== 'gone' && o.type !== 'wreckpart');
  const drawables = list.map(o => ({ y: o.y, o }));
  for (const c of crabs) if (Math.abs(c.x - cam.x) < vw && Math.abs(c.y - cam.y) < vh) drawables.push({ y: c.y, crab: c });
  if (S && mode !== 'title') drawables.push({ y: S.p.y + (sail ? 1 : 0), player: true });
  if (placing && S) { const pp = placePos(); drawables.push({ y: pp.y, ghost: true, x: pp.x }); }
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) {
    if (d.player) drawPlayer(S.p, t);
    else if (d.crab) drawCrab(d.crab, t);
    else if (d.ghost) drawGhost(d.x, d.y, t);
    else DRAW[d.o.type] && DRAW[d.o.type](d.o, t);
  }
  if (fishing) drawFishing(t);
  // particles
  for (const q of particles) {
    if (q.kind === 'ripple') continue;
    const a = clamp(q.life / q.max, 0, 1);
    if (q.kind === 'leaf' || q.kind === 'chip') { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.globalAlpha = a; ctx.fillStyle = q.color; if (q.kind === 'leaf') { ctx.beginPath(); ctx.ellipse(0, 0, q.size + 1, q.size * .55, 0, 0, TAU); ctx.fill(); } else ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size); ctx.restore(); }
    else if (q.kind === 'spark') { ctx.globalAlpha = a; ctx.fillStyle = q.color; const s = q.size * (1 + Math.sin(q.life * 20) * .3); ctx.beginPath(); ctx.moveTo(q.x, q.y - s * 1.6); ctx.lineTo(q.x + s * .5, q.y); ctx.lineTo(q.x, q.y + s * 1.6); ctx.lineTo(q.x - s * .5, q.y); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(q.x - s * 1.6, q.y); ctx.lineTo(q.x, q.y + s * .5); ctx.lineTo(q.x + s * 1.6, q.y); ctx.lineTo(q.x, q.y - s * .5); ctx.fill(); }
    else if (q.kind === 'dust' || q.kind === 'splash') { ctx.globalAlpha = a * .8; ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill(); }
    else if (q.kind === 'smoke') { ctx.globalAlpha = a * .22; ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill(); }
    else if (q.kind === 'ember') { ctx.globalAlpha = a; ctx.fillStyle = q.life > 1 ? '#ffe08a' : '#ff8a3d'; ctx.fillRect(q.x - 1, q.y - 1, q.size, q.size); }
  }
  ctx.globalAlpha = 1;
  // butterflies
  for (const b of butterflies) { const f = Math.abs(Math.sin(b.t * 14)); ctx.fillStyle = 'rgba(40,60,30,.15)'; ctx.beginPath(); ctx.ellipse(b.x + 6, b.y + 14, 3, 1.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(b.x - 2.5 * f - .5, b.y, 3 * f + .6, 3.4, 0, 0, TAU); ctx.ellipse(b.x + 2.5 * f + .5, b.y, 3 * f + .6, 3.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a3a2a'; ctx.fillRect(b.x - .6, b.y - 2.5, 1.2, 5); }
  // floaters
  ctx.font = '800 13px Grandstander, "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (const f of floaters) { ctx.globalAlpha = clamp(f.life * 1.5, 0, 1); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(44,37,29,.8)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = '#fff4dc'; ctx.fillText(f.text, f.x, f.y); }
  ctx.globalAlpha = 1;
  // gulls (high above)
  for (const g of gulls) {
    ctx.fillStyle = 'rgba(30,50,60,.13)'; ctx.beginPath(); ctx.ellipse(g.x + 40, g.y + 70, 9, 3, 0, 0, TAU); ctx.fill();
    const f = Math.sin(g.t * 7) * 5; const dir = Math.sign(g.vx);
    ctx.strokeStyle = '#fbfbf6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.x - 12, g.y - f); ctx.quadraticCurveTo(g.x - 5, g.y - 6 - f * .3, g.x, g.y); ctx.quadraticCurveTo(g.x + 5, g.y - 6 - f * .3, g.x + 12, g.y - f); ctx.stroke();
    ctx.fillStyle = '#f3a43a'; ctx.beginPath(); ctx.arc(g.x + dir * 2, g.y + 1, 1.4, 0, TAU); ctx.fill();
  }
  // cloud shadows
  for (const c of clouds) {
    if (Math.abs(c.x - cam.x) > vw / 2 + c.r * 1.5 || Math.abs(c.y - cam.y) > vh / 2 + c.r * 1.5) continue;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, 'rgba(30,50,70,.10)'); g.addColorStop(.6, 'rgba(30,50,70,.07)'); g.addColorStop(1, 'rgba(30,50,70,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, c.r * 1.4, c.r, 0, 0, TAU); ctx.fill();
  }
  if (DEBUG.hitboxes) drawDebugWorld(x0, y0, vw, vh);
  // ===== screen-space overlays =====
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const hr = S ? hour() : 10.5, night = nightAmt(hr), rain = S ? S.weather.rain : 0;
  const warm = warmTint(hr);
  if (warm > .02) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,140,70,${warm * .55})`; ctx.fillRect(0, 0, W, Hs); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(255,150,90,${warm * .1})`; ctx.fillRect(0, 0, W, Hs); }
  if (rain > .02) { ctx.fillStyle = `rgba(60,80,100,${rain * .16})`; ctx.fillRect(0, 0, W, Hs); }
  drawLighting(night, rain, t);
  if (rain > .02) drawRain(rain, t);
  if (!vignette) { vignette = ctx.createRadialGradient(W / 2, Hs / 2, Math.min(W, Hs) * .35, W / 2, Hs / 2, Math.max(W, Hs) * .75); vignette.addColorStop(0, 'rgba(30,20,10,0)'); vignette.addColorStop(1, 'rgba(30,20,10,.28)'); }
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, Hs);
}
function drawFoam(t, x0, y0, vw, vh) {
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath();
  const pts = [];
  for (const p of shorePts) { if (p.x < x0 - 30 || p.x > x0 + vw + 30 || p.y < y0 - 30 || p.y > y0 + vh + 30) continue; pts.push(p); }
  for (const p of pts) { if (p.f) continue; const o = -17 + Math.sin(t * .8 + p.ph * .3) * 3; ctx.moveTo(p.x + p.nx * o + 6, p.y + p.ny * o); ctx.arc(p.x + p.nx * o, p.y + p.ny * o, 6, 0, TAU); }
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.beginPath();
  for (const p of pts) {
    const wv = (Math.sin(t * 1.3 + p.x * .004 + p.y * .003) + 1) / 2;
    const o = p.f ? -1 : -7 + wv * 11, r = p.f ? 2.5 : 5.5 + wv * 3;
    ctx.moveTo(p.x + p.nx * o + r, p.y + p.ny * o); ctx.arc(p.x + p.nx * o, p.y + p.ny * o, r, 0, TAU);
  }
  ctx.fill();
}
function drawLighting(night, rain, t) {
  const a = night * .74 + rain * .08;
  if (a < .01) return;
  const l = lctx, sc = .5, lw = lightCv.width, lh = lightCv.height;
  l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, lw, lh);
  l.fillStyle = `rgba(14,20,54,${a})`; l.fillRect(0, 0, lw, lh);
  l.globalCompositeOperation = 'destination-out';
  const lights = [];
  if (S && mode !== 'title') lights.push({ x: S.p.x, y: S.p.y - 12, r: 120, i: .75 });
  for (const o of nearby(cam.x, cam.y, Math.max(W, Hs) / Z)) if (o.type === 'campfire' && o.fuel > 0) { const fl = 1 + Math.sin(t * 9 + o.ph) * .03 + Math.sin(t * 23) * .02; lights.push({ x: o.x, y: o.y - 10, r: (190 + Math.min(o.fuel, 60)) * fl, i: 1, fire: true }); }
  for (const f of fireflies) lights.push({ x: f.x, y: f.y, r: 22, i: .5 * (.5 + .5 * Math.sin(f.t * 3)) });
  for (const L of lights) {
    const [x, y] = toS(L.x, L.y), r = L.r * Z * sc, X = x * sc, Y = y * sc;
    if (X < -r || Y < -r || X > lw + r || Y > lh + r) continue;
    const g = l.createRadialGradient(X, Y, 0, X, Y, r);
    g.addColorStop(0, `rgba(0,0,0,${L.i})`); g.addColorStop(.45, `rgba(0,0,0,${L.i * .7})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(X - r, Y - r, r * 2, r * 2);
  }
  ctx.drawImage(lightCv, 0, 0, W, Hs);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    const [x, y] = toS(L.x, L.y);
    if (L.fire) { const r = L.r * Z * .8; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,150,60,${.32 * night + .05})`); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    else if (L.r === 22) { const r = 7 * Z; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(230,255,140,${L.i * 1.6})`); g.addColorStop(1, 'rgba(200,255,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawRain(rain, t) {
  ctx.strokeStyle = `rgba(210,230,255,${.35 * rain})`; ctx.lineWidth = 1.2; ctx.beginPath();
  const n = Math.floor(220 * rain * (W * Hs) / (1280 * 720));
  for (let i = 0; i < n; i++) {
    const sx = hashi(i, 1, 2) * (W + 100), sp = 700 + hashi(i, 2, 2) * 300;
    const y = ((hashi(i, 3, 2) * Hs + t * sp) % (Hs + 40)) - 20, x = (sx - t * 120 * (sp / 900)) % (W + 100);
    const xx = x < 0 ? x + W + 100 : x;
    ctx.moveTo(xx, y); ctx.lineTo(xx - 3, y + 12);
  }
  ctx.stroke();
}

// --- Drawing helpers
function ell(x, y, rx, ry, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function shadow(x, y, rx, ry) { ell(x, y, rx, ry, 'rgba(28,52,36,.22)'); }
function canopyFade(cx, cy, rw, baseY) {
  if (!S || mode === 'title') return 1;
  const p = S.p; return (p.y < baseY - 2 && p.y > cy - rw && Math.abs(p.x - cx) < rw) ? .45 : 1;
}
const DRAW = {
  tree(o, t) {
    const s = o.s, pal = TREE_PALS[o.pal], shake = o.shake ? Math.sin(t * 60) * o.shake * .6 : 0;
    if (o.st === 'stump') { shadow(o.x + 3, o.y + 1, 11, 4); ell(o.x, o.y - 2, 9, 5, '#8a5a3b'); ell(o.x, o.y - 4, 8, 4.2, '#d1a06a'); ctx.strokeStyle = '#a8774a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(o.x, o.y - 4, 4, 2, 0, 0, TAU); ctx.stroke(); return; }
    const sway = Math.sin(t * 1.1 + o.ph) * 1.6 * s + shake;
    shadow(o.x + 14 * s, o.y + 3, 34 * s, 13 * s);
    ctx.fillStyle = '#835638'; rr(ctx, o.x - 5 * s + shake * .3, o.y - 30 * s, 10 * s, 31 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#6d452c'; ctx.fillRect(o.x + 1 * s + shake * .3, o.y - 28 * s, 3 * s, 28 * s);
    const cx = o.x + sway, cy = o.y - 48 * s;
    ctx.globalAlpha = canopyFade(cx, cy, 36 * s, o.y);
    const layers = [[2, 6, 22, pal[0]], [0, 0, 21, pal[1]], [-3, -5, 15, pal[2]]];
    for (const [ox, oy, r, col] of layers) { ctx.fillStyle = col; ctx.beginPath(); for (const b of o.blobs) { const bx = cx + (b[0] + ox) * s, by = cy + (b[1] + oy) * s, br = b[2] * r * s; ctx.moveTo(bx + br, by); ctx.arc(bx, by, br, 0, TAU); } ctx.fill(); }
    ctx.fillStyle = pal[3]; ctx.beginPath();
    for (let i = 0; i < 3; i++) { const b = o.blobs[(i * 2 + 1) % o.blobs.length]; const bx = cx + (b[0] - 6) * s, by = cy + (b[1] - 9) * s; ctx.moveTo(bx + 4.5 * s, by); ctx.arc(bx, by, 4.5 * s * b[2], 0, TAU); }
    ctx.fill();
    if (o.pal === 'blossom') { ctx.fillStyle = '#fff1f5'; for (let i = 0; i < 6; i++) circ(cx + Math.sin(o.ph * 7 + i * 2.1) * 22 * s, cy + Math.cos(o.ph * 5 + i * 1.7) * 14 * s, 1.8 * s, '#fff1f5'); }
    ctx.globalAlpha = 1;
  },
  pine(o, t) {
    const s = o.s, shake = o.shake ? Math.sin(t * 60) * o.shake * .6 : 0;
    if (o.st === 'stump') { shadow(o.x + 3, o.y + 1, 10, 4); ell(o.x, o.y - 2, 8, 4.5, '#7a5034'); ell(o.x, o.y - 4, 7, 3.8, '#caa070'); return; }
    const sway = Math.sin(t * 1.0 + o.ph) * 1.2 * s + shake;
    shadow(o.x + 14 * s, o.y + 3, 26 * s, 10 * s);
    ctx.fillStyle = '#7a5034'; ctx.fillRect(o.x - 4 * s, o.y - 16 * s, 8 * s, 17 * s);
    ctx.globalAlpha = canopyFade(o.x, o.y - 50 * s, 28 * s, o.y);
    const tiers = [[26, 12, '#2f6b52', '#3f8763'], [21, 30, '#367a5b', '#4b9a6f'], [15, 46, '#3d8762', '#5aae7d']];
    for (let i = 0; i < 3; i++) {
      const [w, off, dark, light] = tiers[i]; const by = o.y - off * s, tip = by - 30 * s, sw = sway * (i + 1) * .5;
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(o.x - w * s + sw * .3, by); ctx.quadraticCurveTo(o.x, by + 6 * s, o.x + w * s + sw * .3, by); ctx.lineTo(o.x + sw, tip); ctx.closePath(); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(o.x - w * s + sw * .3, by); ctx.quadraticCurveTo(o.x - w * .4 * s, by + 4 * s, o.x - 2 * s + sw * .5, by + 2 * s); ctx.lineTo(o.x + sw, tip); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  palm(o, t) {
    const s = o.s, shake = o.shake ? Math.sin(t * 50) * o.shake : 0;
    const tx = o.x + o.lean * 26 * s + shake, ty = o.y - 68 * s;
    ell(tx + 20, o.y + 4, 34 * s, 12 * s, 'rgba(28,52,36,.13)'); shadow(o.x + 2, o.y + 1, 7, 3);
    const cx1 = o.x + o.lean * 4 * s, cy1 = o.y - 38 * s;
    for (let i = 0; i <= 10; i++) { const k = i / 10, ix = (1 - k) * (1 - k) * o.x + 2 * (1 - k) * k * cx1 + k * k * tx, iy = (1 - k) * (1 - k) * o.y + 2 * (1 - k) * k * cy1 + k * k * ty; ell(ix, iy - 2, 5.5 * s * (1 - k * .3), 4 * s, i % 2 ? '#a77a4e' : '#8f6541'); }
    ctx.globalAlpha = canopyFade(tx, ty, 40 * s, o.y);
    const fronds = 7;
    for (let k = 0; k < fronds; k++) {
      const a = k / fronds * TAU + o.ph, sw = Math.sin(t * 1.3 + o.ph + k) * .06, aa = a + sw;
      const len = 40 * s, ca = Math.cos(aa), sa = Math.sin(aa);
      const ex = tx + ca * len, ey = ty + sa * len * .62 + 12 * s, mx = tx + ca * len * .55, my = ty + sa * len * .32 - 9 * s;
      const px = -sa * 7 * s, py = ca * 7 * s * .6;
      ctx.fillStyle = k % 2 ? '#4e9f55' : '#62b664';
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(mx + px, my + py, ex, ey); ctx.quadraticCurveTo(mx - px, my - py + 4 * s, tx, ty); ctx.fill();
      ctx.strokeStyle = 'rgba(30,80,40,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(mx, my + 2 * s, ex, ey); ctx.stroke();
    }
    for (let c = 0; c < o.c; c++) { const a = c * 2.1 + .5; circ(tx + Math.cos(a) * 5 * s, ty + 4 * s + Math.sin(a) * 3 * s, 4.6 * s, '#73492d'); circ(tx + Math.cos(a) * 5 * s - 1.4, ty + 2.6 * s + Math.sin(a) * 3 * s, 1.6 * s, '#9c6c45'); }
    circ(tx, ty, 4 * s, '#3f8a49');
    ctx.globalAlpha = 1;
  },
  rock(o, t) {
    const sh = o.shake ? Math.sin(t * 70) * o.shake * .5 : 0, x = o.x + sh, y = o.y;
    shadow(x + 6, y + 3, o.r * 1.15, o.r * .45);
    const k = o.hp / o.max * .2 + .8;
    ctx.fillStyle = '#7c8278'; ctx.beginPath(); o.pts.forEach(([px, py], i) => i ? ctx.lineTo(x + px * k, y + py * k - o.r * .3) : ctx.moveTo(x + px * k, y + py * k - o.r * .3)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a3a99f'; ctx.beginPath(); o.pts.forEach(([px, py], i) => { const X = x + px * .8 * k - 2, Y = y + py * .7 * k - o.r * .45; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill();
    ell(x - o.r * .3, y - o.r * .62, o.r * .28, o.r * .14, '#cdd2c8');
    if (o.moss) { ell(x + o.r * .2, y - o.r * .7, o.r * .35, o.r * .16, '#7fae5e'); ell(x + o.r * .35, y - o.r * .76, o.r * .18, o.r * .08, '#9cc874'); }
    if (o.hp < o.max) { ctx.strokeStyle = 'rgba(60,60,55,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 2, y - o.r * .8); ctx.lineTo(x + 3, y - o.r * .4); ctx.lineTo(x - 1, y - o.r * .1); ctx.stroke(); }
  },
  bush(o, t) {
    const s = o.s, sh = o.shake ? Math.sin(t * 60) * o.shake * .5 : 0, x = o.x + sh, y = o.y;
    shadow(x + 5, y + 2, 17 * s, 6 * s);
    const bl = [[-8, -8, 10], [8, -8, 10], [0, -14, 11], [0, -6, 11]];
    ctx.fillStyle = '#3f8645'; ctx.beginPath(); for (const [bx, by, r] of bl) { ctx.moveTo(x + bx * s + r * s + 1, y + by * s + 2); ctx.arc(x + bx * s + 1, y + by * s + 2, r * s, 0, TAU); } ctx.fill();
    ctx.fillStyle = '#58a453'; ctx.beginPath(); for (const [bx, by, r] of bl) { ctx.moveTo(x + bx * s + r * .85 * s - 1, y + by * s - 1); ctx.arc(x + bx * s - 1, y + by * s - 1, r * .85 * s, 0, TAU); } ctx.fill();
    ell(x - 5 * s, y - 18 * s, 4 * s, 2.5 * s, '#7cc464');
    if (o.c > 0) { const bs = [[-9, -9], [7, -12], [1, -5], [-3, -16], [10, -5], [-12, -4]]; for (const [bx, by] of bs) { circ(x + bx * s, y + by * s, 2.7 * s, '#c93f5c'); circ(x + bx * s - .8, y + by * s - .8, .9 * s, '#ffd1da'); } }
  },
  grass(o, t) {
    const s = o.s; ctx.lineCap = 'round';
    shadow(o.x + 2, o.y + 1, 8 * s, 3 * s);
    for (let i = 0; i < 6; i++) {
      const bx = o.x + (i - 2.5) * 2.6 * s, sw = Math.sin(t * 1.8 + o.ph + i * .5) * 2.4 + (i - 2.5) * 1.6, hgt = (13 + (i % 3) * 4) * s;
      ctx.strokeStyle = i % 2 ? '#6aac55' : '#86c564'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(bx, o.y); ctx.quadraticCurveTo(bx + sw * .3, o.y - hgt * .6, bx + sw, o.y - hgt); ctx.stroke();
    }
    ctx.fillStyle = '#d9c27a'; ctx.beginPath(); ctx.ellipse(o.x + Math.sin(t * 1.8 + o.ph) * 2.4, o.y - 19 * s, 1.8, 3.4, .2, 0, TAU); ctx.fill();
  },
  stick(o) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    ctx.fillStyle = 'rgba(28,52,36,.2)'; ctx.fillRect(-11, 1, 24, 4);
    ctx.strokeStyle = o.drift ? '#c9b393' : '#8a5d3b'; ctx.lineWidth = o.drift ? 4.5 : 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.moveTo(2, 0); ctx.lineTo(7, -5); ctx.stroke(); ctx.restore();
  },
  pebble(o) { shadow(o.x + 2, o.y + 1, 7, 3); ell(o.x - 2, o.y - 2, 5, 3.6, '#8c918a'); ell(o.x + 3, o.y - 1, 4, 3, '#a7aca4'); ell(o.x - 3, o.y - 3.4, 2, 1, '#d6dad2'); },
  shell(o, t) {
    ctx.save(); ctx.translate(o.x, o.y - 2); ctx.rotate(o.rot * .3);
    ctx.fillStyle = 'rgba(28,52,36,.18)'; ctx.beginPath(); ctx.ellipse(1, 3, 7, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = o.hue > .5 ? '#f6c0b4' : '#fbe3c8'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(-6, -2); ctx.quadraticCurveTo(0, -9, 6, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = o.hue > .5 ? '#e0968a' : '#d9b48e'; ctx.lineWidth = .9; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(0, 3.5); ctx.lineTo(i * 3.5, -5); ctx.stroke(); }
    ctx.restore();
    const tw = Math.sin(t * 2 + o.ph); if (tw > .85) { ctx.fillStyle = `rgba(255,255,240,${(tw - .85) * 6})`; ctx.beginPath(); ctx.arc(o.x + 3, o.y - 7, 1.6, 0, TAU); ctx.fill(); }
  },
  crate(o, t) {
    const x = o.x, y = o.y;
    shadow(x + 5, y + 2, 19, 6);
    if (o.st === 'open') {
      ctx.fillStyle = '#7a5032'; rr(ctx, x - 14, y - 16, 28, 17, 3); ctx.fill(); ctx.fillStyle = '#4a3020'; ctx.fillRect(x - 11, y - 14, 22, 6);
      ctx.save(); ctx.translate(x + 15, y - 6); ctx.rotate(.5); ctx.fillStyle = '#b07f4e'; rr(ctx, -2, -12, 6, 22, 2); ctx.fill(); ctx.restore();
      return;
    }
    const bob = 0;
    ctx.fillStyle = '#9a6a43'; rr(ctx, x - 14, y - 22 + bob, 28, 23, 3); ctx.fill();
    ctx.fillStyle = '#b8844f'; rr(ctx, x - 14, y - 26 + bob, 28, 8, 3); ctx.fill();
    ctx.strokeStyle = '#6d4a2e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 14, y - 11); ctx.lineTo(x + 14, y - 11); ctx.moveTo(x - 12, y - 18); ctx.lineTo(x + 12, y - 2); ctx.stroke();
    ctx.fillStyle = '#d9c08e'; ctx.fillRect(x - 3, y - 27, 6, 3);
    const tw = (Math.sin(t * 2.5 + o.ph) + 1) / 2; ctx.fillStyle = `rgba(255,236,160,${.4 + tw * .6})`;
    const sx = x + 9, sy = y - 32 - tw * 3, sz = 2 + tw * 2.5; ctx.beginPath(); ctx.moveTo(sx, sy - sz * 2); ctx.lineTo(sx + sz * .5, sy); ctx.lineTo(sx, sy + sz * 2); ctx.lineTo(sx - sz * .5, sy); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx - sz * 2, sy); ctx.lineTo(sx, sy - sz * .5); ctx.lineTo(sx + sz * 2, sy); ctx.lineTo(sx, sy + sz * .5); ctx.fill();
  },
  wreck(o, t) {
    const x = o.x, y = o.y;
    ell(x + 10, y + 6, 70, 16, 'rgba(28,52,36,.2)');
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
    ctx.fillStyle = '#6a4a33'; ctx.beginPath(); ctx.moveTo(-64, -10); ctx.quadraticCurveTo(-40, 14, 30, 12); ctx.lineTo(62, -6); ctx.lineTo(58, -26); ctx.quadraticCurveTo(0, -18, -60, -30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a6243'; ctx.beginPath(); ctx.moveTo(-58, -28); ctx.quadraticCurveTo(0, -16, 56, -24); ctx.lineTo(54, -32); ctx.quadraticCurveTo(0, -26, -56, -36); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,25,15,.5)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-60, -20 + i * 7); ctx.quadraticCurveTo(0, -8 + i * 6, 58, -16 + i * 6); ctx.stroke(); }
    ctx.fillStyle = '#3b2a1e'; ctx.beginPath(); ctx.ellipse(10, -6, 10, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a3e2a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(-24, -62); ctx.stroke();
    ctx.fillStyle = '#eadcbf'; ctx.beginPath(); ctx.moveTo(-23, -58); ctx.quadraticCurveTo(-2, -52 + Math.sin(t * 1.5) * 2, 4, -36); ctx.lineTo(-14, -34); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  campfire(o, t) {
    const x = o.x, y = o.y;
    ell(x, y - 2, 18, 8, 'rgba(50,35,25,.35)');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(x + Math.cos(a) * 15, y - 2 + Math.sin(a) * 7, 5, 3.8, i % 2 ? '#8f938c' : '#a6aba3'); }
    ctx.save(); ctx.translate(x, y - 4); ctx.fillStyle = '#7a5032'; ctx.rotate(.4); rr(ctx, -12, -2.5, 24, 5, 2); ctx.fill(); ctx.rotate(-.8); rr(ctx, -12, -2.5, 24, 5, 2); ctx.fill(); ctx.restore();
    if (o.fuel > 0) {
      const k = .6 + Math.min(1, o.fuel / 50) * .5;
      const f1 = Math.sin(t * 11 + o.ph) * 2, f2 = Math.sin(t * 17 + o.ph * 2) * 1.5;
      const flame = (w, h, col, dx) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w + dx, y - 4); ctx.quadraticCurveTo(x - w * 1.1 + dx, y - h * .5, x + f1 * .6 + dx, y - h + f2); ctx.quadraticCurveTo(x + w * 1.1 + dx, y - h * .5, x + w + dx, y - 4); ctx.closePath(); ctx.fill(); };
      flame(10 * k, 30 * k, '#ff7a35', 0); flame(7 * k, 23 * k, '#ffae45', f2 * .4); flame(4 * k, 14 * k, '#fff0a0', -f1 * .2);
      ell(x, y - 4, 8, 3, 'rgba(255,220,120,.6)');
    } else { ell(x, y - 4, 7, 3, '#4a4240'); ctx.fillStyle = 'rgba(200,200,200,.3)'; if (Math.random() < .02) particles.push({ x, y: y - 8, vx: 4, vy: -12, life: 2, max: 2, kind: 'smoke', size: 3 }); }
  },
  leanto(o, t) {
    const x = o.x, y = o.y;
    ell(x + 8, y + 2, 38, 10, 'rgba(28,52,36,.22)');
    ctx.fillStyle = '#c8644a'; rr(ctx, x - 18, y - 12, 36, 12, 4); ctx.fill(); ctx.fillStyle = '#e8a088'; rr(ctx, x - 18, y - 12, 10, 12, 4); ctx.fill();
    ctx.strokeStyle = '#7a5032'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 22, y - 46); ctx.moveTo(x + 30, y); ctx.lineTo(x + 22, y - 46); ctx.moveTo(x - 26, y - 44); ctx.lineTo(x + 26, y - 44); ctx.stroke();
    ctx.fillStyle = '#6f9445'; ctx.beginPath(); ctx.moveTo(x - 26, y - 46); ctx.lineTo(x + 26, y - 46); ctx.lineTo(x + 32, y - 20); ctx.lineTo(x - 32, y - 20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8cb35a'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 28 - i * .5, y - 40 + i * 6); ctx.lineTo(x + 28 + i * .5, y - 40 + i * 6); ctx.stroke(); }
    ctx.fillStyle = '#5a7e38'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(x - 27 + i * 9, y - 20, 5, 3, 0, 0, Math.PI); ctx.fill(); }
  },
  raft(o, t) {
    const x = o.x, y = o.y + Math.sin(t * 1.6) * 1.5, rot = Math.sin(t * 1.2) * .03;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ell(0, 6, 34, 10, 'rgba(20,60,80,.25)');
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#9a6a43' : '#b07a4c'; rr(ctx, -30, -18 + i * 6.5, 60, 6.5, 3); ctx.fill(); ell(-30, -14.8 + i * 6.5, 3, 3, '#d1a06a'); }
    ctx.fillStyle = '#d8b67a'; ctx.fillRect(-20, -18, 4, 39); ctx.fillRect(16, -18, 4, 39);
    ctx.strokeStyle = '#6d452c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -62); ctx.stroke();
    const billow = Math.sin(t * 1.4) * 3 + (mode === 'sailing' ? 6 : 0);
    ctx.fillStyle = '#f5ead2'; ctx.beginPath(); ctx.moveTo(2, -60); ctx.quadraticCurveTo(28 + billow, -42, 26 + billow * .5, -12); ctx.lineTo(2, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0775c'; ctx.beginPath(); ctx.moveTo(2, -32); ctx.lineTo(26 + billow * .7, -32); ctx.lineTo(26 + billow * .6, -26); ctx.lineTo(2, -26); ctx.fill();
    ctx.restore();
    if (Math.random() < .05) particles.push({ x: x + (Math.random() - .5) * 60, y: y + 18, vx: 0, vy: 0, life: 1, max: 1, kind: 'ripple', size: 6 });
  }
};
function drawGhost(x, y, t) {
  const ok = placeValid();
  ctx.globalAlpha = .55;
  const o = { x, y, fuel: 40, ph: 0, shake: 0 };
  DRAW[placing.id](o, t);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = ok ? 'rgba(160,240,140,.9)' : 'rgba(255,120,110,.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.ellipse(x, y, placing.id === 'campfire' ? 22 : 38, placing.id === 'campfire' ? 10 : 14, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
}
function drawFishing(t) {
  const f = fishing, p = S.p;
  const hx = p.x + p.dx * 22, hy = p.y - 30 + p.dy * 6;
  const bob = f.phase === 'bite' ? Math.sin(t * 30) * 2.5 + 2 : Math.sin(t * 3) * 1;
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + f.bx) / 2, Math.max(hy, f.by) + 8, f.bx, f.by + bob - 3); ctx.stroke();
  const rp = (t * .8) % 1; ctx.strokeStyle = `rgba(255,255,255,${.5 * (1 - rp)})`; ctx.beginPath(); ctx.ellipse(f.bx, f.by + 2, 5 + rp * 12, (5 + rp * 12) * .45, 0, 0, TAU); ctx.stroke();
  circ(f.bx, f.by + bob - 2, 4, '#e8574f'); ctx.fillStyle = '#fff'; ctx.fillRect(f.bx - 4, f.by + bob - 2, 8, 3);
  if (f.phase === 'bite') { ctx.font = '800 22px Grandstander, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#2c251d'; ctx.strokeText('!', f.bx, f.by - 14); ctx.fillStyle = '#ffc857'; ctx.fillText('!', f.bx, f.by - 14); }
}
function drawCrab(c, t) {
  const x = c.x, y = c.y, w = Math.sin(c.ph * 2);
  shadow(x + 2, y + 1, 11, 4);
  ctx.strokeStyle = '#c4502f'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < 3; i++) { const off = (i % 2 ? w : -w) * 2; ctx.moveTo(x - 6, y - 3 + i * 2); ctx.lineTo(x - 12, y + i * 2 + off); ctx.moveTo(x + 6, y - 3 + i * 2); ctx.lineTo(x + 12, y + i * 2 - off); }
  ctx.stroke();
  const col = c.hurt > 0 ? '#fff0e0' : '#e2643f';
  ell(x, y - 4, 9, 6, col); ell(x - 1, y - 6, 6, 3.4, '#f08159');
  circ(x - 11, y - 8 + w, 3.6, col); circ(x + 11, y - 8 - w, 3.6, col);
  ctx.strokeStyle = '#2c251d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, y - 9); ctx.lineTo(x - 3, y - 12); ctx.moveTo(x + 3, y - 9); ctx.lineTo(x + 3, y - 12); ctx.stroke();
  circ(x - 3, y - 12.5, 1.6, '#fff'); circ(x + 3, y - 12.5, 1.6, '#fff'); circ(x - 3, y - 12.5, .8, '#222'); circ(x + 3, y - 12.5, .8, '#222');
}
function drawPlayer(p, t) {
  const x = p.x, y = p.y, wp = p.walk;
  const inWater = Hh(x, y) < 0 && !sail;
  const bob = p.moving ? Math.abs(Math.sin(wp)) * 1.8 : Math.sin(t * 2) * .5;
  const face = Math.abs(p.dx) > Math.abs(p.dy) ? (p.dx > 0 ? 'r' : 'l') : (p.dy > 0 ? 'd' : 'u');
  if (!inWater) shadow(x + 2, y + 1, 11, 4.2);
  const by = y - 9 - bob;
  ctx.save();
  if (inWater) { ctx.beginPath(); ctx.rect(x - 30, y - 80, 60, 74); ctx.clip(); }
  // legs
  const l = p.moving ? Math.sin(wp) * 3 : 0;
  ctx.fillStyle = '#4b5d80';
  rr(ctx, x - 6, by + 1 - Math.max(0, l), 5, 9, 2); ctx.fill();
  rr(ctx, x + 1, by + 1 - Math.max(0, -l), 5, 9, 2); ctx.fill();
  ctx.fillStyle = '#5a3e2a'; ctx.fillRect(x - 6, by + 8 - Math.max(0, l), 5, 2); ctx.fillRect(x + 1, by + 8 - Math.max(0, -l), 5, 2);
  // tool behind when facing up
  const swingK = p.swing > 0 ? 1 - p.swing / .28 : -1;
  const drawTool = () => {
    if (!(p.swing > 0) || !p.tool) return;
    const dir = face === 'l' ? -1 : 1;
    const ang = (face === 'u' ? -Math.PI / 2 : face === 'd' ? Math.PI / 2 : face === 'l' ? Math.PI : 0) + (swingK * 1.8 - 1.2) * dir;
    ctx.save(); ctx.translate(x + (face === 'l' ? -7 : face === 'r' ? 7 : 6), by - 6); ctx.rotate(ang);
    ctx.strokeStyle = '#8a5d3b'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.stroke();
    if (p.tool === 'axe') { ctx.fillStyle = '#a7aca4'; ctx.beginPath(); ctx.moveTo(12, -1); ctx.lineTo(18, -7); ctx.lineTo(20, 1); ctx.closePath(); ctx.fill(); }
    if (p.tool === 'pickaxe') { ctx.strokeStyle = '#a7aca4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(15, -7); ctx.quadraticCurveTo(19, 0, 15, 7); ctx.stroke(); }
    if (p.tool === 'rod') { ctx.strokeStyle = '#a7774c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(26, 0); ctx.stroke(); }
    ctx.restore();
  };
  if (face === 'u') drawTool();
  // body
  ctx.fillStyle = '#e39a45'; rr(ctx, x - 8, by - 12, 16, 14, 6); ctx.fill();
  ctx.fillStyle = '#cf8638'; ctx.fillRect(x - 8, by - 5, 16, 2.4);
  ctx.fillStyle = '#f2c28a'; ctx.fillRect(x - 8, by - 9, 16, 1.4);
  // arms
  const arm = p.moving ? Math.sin(wp) * 2.5 : 0;
  circ(x - 9, by - 6 + arm, 3, '#e39a45'); circ(x + 9, by - 6 - arm, 3, '#e39a45');
  circ(x - 9.5, by - 3.5 + arm, 2.2, '#f3c9a1'); circ(x + 9.5, by - 3.5 - arm, 2.2, '#f3c9a1');
  // head
  const hx = x + (face === 'l' ? -1 : face === 'r' ? 1 : 0), hy = by - 19;
  circ(hx, hy, 8.5, '#f3c9a1');
  if (face === 'u') { ctx.fillStyle = '#6b4a32'; ctx.beginPath(); ctx.arc(hx, hy + 1, 8.3, 0, Math.PI); ctx.fill(); }
  else {
    const ex = face === 'l' ? -3 : face === 'r' ? 3 : 0;
    ctx.fillStyle = '#6b4a32'; ctx.beginPath(); ctx.arc(hx, hy - 1, 8.4, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    const blink = (t % 4) > 3.85;
    ctx.fillStyle = '#2c251d';
    if (blink) { ctx.fillRect(hx + ex - 4, hy + 1, 3, 1); ctx.fillRect(hx + ex + 1.5, hy + 1, 3, 1); }
    else { if (face !== 'r') circ(hx + ex - 3, hy + 1.2, 1.3, '#2c251d'); if (face !== 'l') circ(hx + ex + 3, hy + 1.2, 1.3, '#2c251d'); }
    ctx.fillStyle = 'rgba(240,120,110,.45)'; if (face !== 'r') circ(hx + ex - 5, hy + 3.5, 1.8, 'rgba(240,120,110,.45)'); if (face !== 'l') circ(hx + ex + 5, hy + 3.5, 1.8, 'rgba(240,120,110,.45)');
  }
  // straw hat
  ell(hx, hy - 4, 13.5, 5.6, '#d9b25a');
  ell(hx, hy - 5, 12.5, 4.8, '#ebc66c');
  ctx.fillStyle = '#f2d382'; ctx.beginPath(); ctx.ellipse(hx, hy - 8, 7.4, 5.4, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(hx - 7.4, hy - 8, 14.8, 2.5);
  ctx.fillStyle = '#c8553d'; ctx.fillRect(hx - 7.4, hy - 7.4, 14.8, 2.2);
  if (face !== 'u') drawTool();
  ctx.restore();
  if (inWater) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y - 6, 12 + Math.sin(t * 4) * 1.5, 4, 0, 0, TAU); ctx.stroke(); }
}
