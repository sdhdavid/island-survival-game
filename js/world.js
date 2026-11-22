"use strict";
// ================= World constants =================
const WORLD = 3200, CX = 1600, CY = 1600, G = 4, GN = WORLD / G + 1;
const HG = new Float32Array(GN * GN), BG = new Float32Array(GN * GN), PG = new Float32Array(GN * GN);
const POND = { x: CX - 360, y: CY - 250, r: 115 };
const MOUNT = { x: CX + 380, y: CY - 330, r: 340 };
const DAY_LEN = 360; // seconds per in-game day

function rawH(x, y) {
  const dx = (x - CX) / 1220, dy = (y - CY) / 1080;
  const d = Math.hypot(dx, dy);
  const n = fbm(x / 600 + 3, y / 600 + 7, 4, 11);
  const c = fbm(x / 170, y / 170, 3, 23);
  let h = (1 - d) + (n - .5) * .75 + (c - .5) * .16 - .08;
  h -= smooth(1.08, 1.35, d) * .7;
  const md = Math.hypot(x - MOUNT.x, y - MOUNT.y) / MOUNT.r;
  h += .42 * Math.exp(-md * md * 2.2);
  const pd = Math.hypot(x - POND.x, y - POND.y);
  if (pd < POND.r * 2.2) {
    const pr = POND.r * (.85 + .3 * fbm(x / 60, y / 60, 2, 5));
    const pf = smooth(pr * 1.7, pr * .55, pd);
    h = h * (1 - pf) + (-.14) * pf;
  }
  return h;
}
function sampleGrid(A, x, y) {
  x = clamp(x, 0, WORLD - .01) / G; y = clamp(y, 0, WORLD - .01) / G;
  const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, i = yi * GN + xi;
  const a = A[i], b = A[i + 1], c = A[i + GN], d = A[i + GN + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const Hh = (x, y) => sampleGrid(HG, x, y);
const isFresh = (x, y) => Math.hypot(x - POND.x, y - POND.y) < POND.r * 2.1;
function grad(x, y) { const e = 6; const gx = Hh(x + e, y) - Hh(x - e, y), gy = Hh(x, y + e) - Hh(x, y - e); const l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; }

// ================= Terrain generation =================
const TS = 1600; // terrain canvas size (half resolution)
const terrainCv = document.createElement('canvas'); terrainCv.width = TS; terrainCv.height = TS;
let shorePts = [];

function genHeights() {
  for (let gy = 0; gy < GN; gy++) for (let gx = 0; gx < GN; gx++) {
    const x = gx * G, y = gy * G, i = gy * GN + gx;
    HG[i] = rawH(x, y);
    BG[i] = fbm(x / 340 + 50, y / 340 + 9, 3, 41);
    PG[i] = fbm(x / 110 + 4, y / 110 + 2, 2, 77);
  }
}
const COL = {
  sandUnder: [222, 214, 166], shallow: [98, 210, 204], pond: [84, 168, 150], mud: [168, 158, 106],
  wetSand: [221, 196, 138], sand: [244, 224, 170], grassA: [154, 208, 106], grassB: [104, 176, 84],
  grassC: [190, 216, 112], rockA: [160, 164, 144], rockB: [132, 138, 124]
};
function genTerrainImage() {
  const tctx = terrainCv.getContext('2d');
  const img = tctx.createImageData(TS, TS), D = img.data;
  const pr2 = (POND.r * 2.1) ** 2;
  let k = 0;
  for (let py = 0; py < TS; py++) {
    const wy = py * 2 + 1, gyf = wy / G, yi = gyf | 0, fy = gyf - yi;
    for (let px = 0; px < TS; px++, k += 4) {
      const wx = px * 2 + 1, gxf = wx / G, xi = gxf | 0, fx = gxf - xi, i = yi * GN + xi;
      let a = HG[i], b = HG[i + 1], c = HG[i + GN], d = HG[i + GN + 1];
      const h = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      a = BG[i]; b = BG[i + 1]; c = BG[i + GN]; d = BG[i + GN + 1];
      const bio = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      a = PG[i]; b = PG[i + 1]; c = PG[i + GN]; d = PG[i + GN + 1];
      const pat = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
      const fresh = (wx - POND.x) ** 2 + (wy - POND.y) ** 2 < pr2;
      const grain = (hashi(px, py, 3) - .5) * 9;
      let r, g, bl, al = 255;
      if (h < 0) {
        const t = clamp(-h / .32, 0, 1);
        if (fresh) {
          const m = smooth(0, .25, t);
          r = lerp(COL.mud[0], COL.pond[0], m); g = lerp(COL.mud[1], COL.pond[1], m); bl = lerp(COL.mud[2], COL.pond[2], m);
          al = 255 * (1 - smooth(.1, .5, t) * .55);
        } else {
          const m = smooth(0, .42, t) ;
          const cz = (pat - .5) * 18 * (1 - m);
          r = lerp(COL.sandUnder[0], COL.shallow[0], m) + cz; g = lerp(COL.sandUnder[1], COL.shallow[1], m) + cz; bl = lerp(COL.sandUnder[2], COL.shallow[2], m) + cz * .5;
          al = 255 * (1 - smooth(.28, 1, t));
        }
      } else {
        // sand
        const sm = smooth(0, .028, h);
        let sr = lerp(COL.wetSand[0], COL.sand[0], sm), sg = lerp(COL.wetSand[1], COL.sand[1], sm), sb = lerp(COL.wetSand[2], COL.sand[2], sm);
        if (fresh) { sr = lerp(COL.mud[0], 120, .45); sg = lerp(COL.mud[1], 180, .45); sb = lerp(COL.mud[2], 92, .45); }
        // grass
        const fm = smooth(.45, .68, bio);
        let gr = lerp(COL.grassA[0], COL.grassB[0], fm), gg = lerp(COL.grassA[1], COL.grassB[1], fm), gb = lerp(COL.grassA[2], COL.grassB[2], fm);
        const mp = smooth(.56, .76, pat) * .6 * (1 - fm);
        gr = lerp(gr, COL.grassC[0], mp); gg = lerp(gg, COL.grassC[1], mp); gb = lerp(gb, COL.grassC[2], mp);
        const hl = smooth(.62, .8, h) * .85;
        const rr = lerp(COL.rockA[0], COL.rockB[0], pat), rg = lerp(COL.rockA[1], COL.rockB[1], pat), rb = lerp(COL.rockA[2], COL.rockB[2], pat);
        gr = lerp(gr, rr, hl); gg = lerp(gg, rg, hl); gb = lerp(gb, rb, hl);
        const gs = smooth(.05, .095, h);
        r = lerp(sr, gr, gs); g = lerp(sg, gg, gs); bl = lerp(sb, gb, gs);
        const edge = 1 - .07 * Math.exp(-(((gs - .5) / .22) ** 2));
        r *= edge; g *= edge; bl *= edge;
        if (h < .006 && !fresh) { const w = 1 - h / .006; r -= 10 * w; g -= 8 * w; bl -= 2 * w; }
      }
      D[k] = r + grain; D[k + 1] = g + grain; D[k + 2] = bl + grain * .6; D[k + 3] = al;
    }
  }
  tctx.putImageData(img, 0, 0);
  // Baked decor in world coordinates
  tctx.setTransform(.5, 0, 0, .5, 0, 0);
  const rnd = mulberry32(99);
  tctx.lineCap = 'round';
  for (let n = 0; n < 16000; n++) {
    const x = 200 + rnd() * 2800, y = 200 + rnd() * 2800, h = Hh(x, y);
    if (h < .1 || h > .7 || isFresh(x, y) && h < .12) continue;
    const bio = sampleGrid(BG, x, y);
    const dark = rnd() < .5;
    tctx.strokeStyle = dark ? (bio > .55 ? 'rgba(60,120,60,.55)' : 'rgba(84,150,70,.5)') : 'rgba(200,236,140,.45)';
    tctx.lineWidth = 1.6;
    tctx.beginPath(); const l = 4 + rnd() * 4, lean = (rnd() - .5) * 4;
    tctx.moveTo(x, y); tctx.quadraticCurveTo(x + lean * .3, y - l * .6, x + lean, y - l); tctx.stroke();
  }
  const fcols = ['#fff6e8', '#ffd86b', '#f7a8c4', '#c9b3f2', '#ff9f80'];
  for (let n = 0; n < 2600; n++) {
    const x = 200 + rnd() * 2800, y = 200 + rnd() * 2800, h = Hh(x, y);
    if (h < .12 || h > .6) continue;
    const pat = sampleGrid(PG, x, y), bio = sampleGrid(BG, x, y);
    if (pat < .5 || bio > .55) continue;
    const c = fcols[(rnd() * fcols.length) | 0];
    for (let m = 0; m < 3; m++) {
      const fx = x + (rnd() - .5) * 14, fy = y + (rnd() - .5) * 10;
      tctx.fillStyle = 'rgba(40,90,40,.25)'; tctx.beginPath(); tctx.arc(fx + .6, fy + 1, 2.4, 0, TAU); tctx.fill();
      tctx.fillStyle = c; tctx.beginPath(); tctx.arc(fx, fy, 2.2, 0, TAU); tctx.fill();
      tctx.fillStyle = '#fff3b0'; tctx.beginPath(); tctx.arc(fx, fy, .8, 0, TAU); tctx.fill();
    }
  }
  for (let n = 0; n < 5000; n++) {
    const x = 200 + rnd() * 2800, y = 200 + rnd() * 2800, h = Hh(x, y);
    if (h < .004 || h > .07) continue;
    tctx.fillStyle = rnd() < .5 ? 'rgba(190,160,110,.45)' : 'rgba(255,250,230,.6)';
    tctx.fillRect(x, y, 2, 2);
  }
  for (let n = 0; n < 1400; n++) { // forest floor leaves
    const x = 200 + rnd() * 2800, y = 200 + rnd() * 2800, h = Hh(x, y);
    if (h < .12 || h > .6 || sampleGrid(BG, x, y) < .56) continue;
    tctx.fillStyle = rnd() < .5 ? 'rgba(70,120,50,.45)' : 'rgba(150,140,70,.35)';
    tctx.beginPath(); tctx.ellipse(x, y, 3, 1.6, rnd() * 3, 0, TAU); tctx.fill();
  }
  for (let n = 0; n < 900; n++) { // highland gravel
    const x = 200 + rnd() * 2800, y = 200 + rnd() * 2800, h = Hh(x, y);
    if (h < .66) continue;
    tctx.fillStyle = rnd() < .5 ? 'rgba(110,112,100,.5)' : 'rgba(210,210,196,.5)';
    tctx.beginPath(); tctx.ellipse(x, y, 2 + rnd() * 3, 1.5 + rnd() * 2, rnd() * 3, 0, TAU); tctx.fill();
  }
  for (let n = 0; n < 14; n++) { // lily pads
    const a = rnd() * TAU, rr = rnd() * POND.r * .75, x = POND.x + Math.cos(a) * rr, y = POND.y + Math.sin(a) * rr;
    if (Hh(x, y) > -.05) continue;
    const s = 6 + rnd() * 5, rot = rnd() * TAU;
    tctx.fillStyle = 'rgba(30,70,50,.25)'; tctx.beginPath(); tctx.arc(x + 1.5, y + 2, s, 0, TAU); tctx.fill();
    tctx.fillStyle = '#6fb763'; tctx.beginPath(); tctx.moveTo(x, y); tctx.arc(x, y, s, rot + .35, rot + TAU - .35); tctx.closePath(); tctx.fill();
    if (rnd() < .4) { tctx.fillStyle = '#ffd1e0'; tctx.beginPath(); tctx.arc(x - s * .2, y - s * .2, 2.4, 0, TAU); tctx.fill(); }
  }
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  // shoreline points for foam
  shorePts = [];
  const st = 11;
  for (let y = 150; y < WORLD - 150; y += st) for (let x = 150; x < WORLD - 150; x += st) {
    const h0 = Hh(x, y), h1 = Hh(x + st, y), h2 = Hh(x, y + st);
    const add = (px, py) => { const [nx, ny] = grad(px, py); shorePts.push({ x: px, y: py, nx, ny, ph: hashi(px | 0, py | 0, 9) * TAU, f: isFresh(px, py) }); };
    if ((h0 < 0) !== (h1 < 0)) { const t = h0 / (h0 - h1); add(x + t * st, y); }
    if ((h0 < 0) !== (h2 < 0)) { const t = h0 / (h0 - h2); add(x, y + t * st); }
  }
}
