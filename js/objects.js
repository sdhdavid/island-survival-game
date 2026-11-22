"use strict";
// ================= Objects =================
const BK = 128, BN = Math.ceil(WORLD / BK);
let buckets = [], objects = [];
function bucketAdd(o) { const i = clamp((o.y / BK) | 0, 0, BN - 1) * BN + clamp((o.x / BK) | 0, 0, BN - 1); buckets[i].push(o); }
function bucketRemove(o) { const i = clamp((o.y / BK) | 0, 0, BN - 1) * BN + clamp((o.x / BK) | 0, 0, BN - 1); const b = buckets[i]; const j = b.indexOf(o); if (j >= 0) b.splice(j, 1); }
function nearby(x, y, r) {
  const out = [];
  const c0 = clamp(((x - r) / BK) | 0, 0, BN - 1), c1 = clamp(((x + r) / BK) | 0, 0, BN - 1);
  const r0 = clamp(((y - r) / BK) | 0, 0, BN - 1), r1 = clamp(((y + r) / BK) | 0, 0, BN - 1);
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) { const b = buckets[cy * BN + cx]; for (let k = 0; k < b.length; k++) { const o = b[k]; if (Math.abs(o.x - x) < r && Math.abs(o.y - y) < r) out.push(o); } }
  return out;
}
const SPACING = { tree: 30, pine: 26, palm: 30, rock: 26, bush: 20, grass: 11, stick: 9, pebble: 9, shell: 9, crate: 30, wreck: 60, wreckpart: 20 };
function freeAt(x, y, r) { for (const o of nearby(x, y, r + 64)) { if (dist(x, y, o.x, o.y) < r + (SPACING[o.type] || 14) * .6) return false; } return true; }
const TREE_PALS = {
  green: ['#3b7d44', '#53a352', '#74c061', '#a4db7c'],
  deep: ['#336f42', '#468f4c', '#62ac57', '#8fcd70'],
  autumn: ['#b85f34', '#d98443', '#efa955', '#f8cf7f'],
  blossom: ['#b9708f', '#dd93b0', '#f0b6cb', '#fbdbe6']
};

let SPAWN = { x: CX, y: CY + 900 }, crates = [];
function findShore(angle, targetH) {
  let last = null;
  for (let r = 0; r < 1700; r += 3) { const x = CX + Math.cos(angle) * r, y = CY + Math.sin(angle) * r; if (Hh(x, y) >= targetH) last = { x, y, r }; }
  return last;
}
function genObjects() {
  objects = []; buckets = []; for (let i = 0; i < BN * BN; i++) buckets.push([]);
  const rnd = mulberry32(20261121);
  const add = o => { o.id = objects.length; o.st = o.st || 'ok'; o.shake = 0; o.ph = rnd() * TAU; objects.push(o); bucketAdd(o); return o; };
  // spawn + wreck + crates
  const sa = Math.PI / 2 + .12;
  const sh = findShore(sa, .035);
  SPAWN = { x: sh.x - Math.cos(sa) * 40, y: sh.y - Math.sin(sa) * 40 };
  const wr = findShore(sa + .09, -.03);
  const wreck = add({ type: 'wreck', x: wr.x, y: wr.y + 6 });
  for (let k = -2; k <= 2; k++) add({ type: 'wreckpart', x: wreck.x + k * 22, y: wreck.y - 4 + Math.abs(k) * 2, solid: 14 });
  const crateDefs = [
    { a: sa - .2, loot: { wood: 2, berries: 3, cloth: 1 }, note: 'note1' },
    { a: -.38, loot: { cloth: 1, rope: 2, coconut: 1 }, note: 'note2' },
    { a: Math.PI + .55, loot: { cloth: 1, fiber: 3, stone: 2 }, note: 'note3' }
  ];
  crates = [];
  for (const cd of crateDefs) {
    const p = findShore(cd.a, .03); if (!p) continue;
    crates.push(add({ type: 'crate', x: p.x - Math.cos(cd.a) * 22, y: p.y - Math.sin(cd.a) * 22, loot: cd.loot, note: cd.note }));
  }
  const avoid = (x, y) => dist(x, y, SPAWN.x, SPAWN.y) < 130 || crates.some(c => dist(x, y, c.x, c.y) < 60) || dist(x, y, wreck.x, wreck.y) < 110;
  const rp = () => [CX - 1450 + rnd() * 2900, CY - 1450 + rnd() * 2900];
  // trees
  let count = 0;
  for (let n = 0; n < 14000 && count < 330; n++) {
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .11 || h > .7 || avoid(x, y)) continue;
    const bio = sampleGrid(BG, x, y);
    const prob = smooth(.4, .62, bio) * .95 + .03;
    if (rnd() > prob) continue;
    if (!freeAt(x, y, 30)) continue;
    if (h > .56 && rnd() < .7) { add({ type: 'pine', x, y, s: .85 + rnd() * .35, hp: 3, max: 3 }); }
    else {
      const rv = rnd();
      const pal = rv < .07 ? 'blossom' : rv < .17 ? 'autumn' : bio > .58 ? 'deep' : 'green';
      const s = .85 + rnd() * .4;
      const blobs = [];
      const nb = 5 + (rnd() * 2 | 0);
      for (let b = 0; b < nb; b++) { const ang = b / nb * TAU + rnd() * .5; const rr = b === 0 ? 0 : 13 + rnd() * 5; blobs.push([Math.cos(ang) * rr * (b === 0 ? 0 : 1), Math.sin(ang) * rr * .75 - (b === 0 ? 4 : 0), b === 0 ? 1.05 : .7 + rnd() * .2]); }
      add({ type: 'tree', x, y, s, pal, blobs, hp: 4, max: 4 });
    }
    count++;
  }
  for (let n = 0; n < 4000; n++) { // extra pines up high
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .62 || rnd() > .4 || !freeAt(x, y, 26)) continue;
    add({ type: 'pine', x, y, s: .8 + rnd() * .35, hp: 3, max: 3 });
  }
  count = 0;
  for (let n = 0; n < 6000 && count < 70; n++) { // palms
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .016 || h > .085 || isFresh(x, y) || avoid(x, y)) continue;
    if (rnd() > .5 || !freeAt(x, y, 42)) continue;
    const [gx, gy] = grad(x, y);
    add({ type: 'palm', x, y, s: .9 + rnd() * .3, lean: clamp(-gx + (rnd() - .5) * .6, -1, 1), c: 2 + (rnd() * 2 | 0) });
    count++;
  }
  count = 0;
  for (let n = 0; n < 6000 && count < 95; n++) { // boulders
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .1 || avoid(x, y) || isFresh(x, y)) continue;
    if (rnd() > (h > .58 ? .6 : .045)) continue;
    if (!freeAt(x, y, 28)) continue;
    const r = 13 + rnd() * 9, pts = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; const rr = r * (.82 + rnd() * .3); pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .72]); }
    add({ type: 'rock', x, y, r, pts, moss: rnd() < .5, hp: 4, max: 4 });
    count++;
  }
  count = 0;
  for (let n = 0; n < 8000 && count < 80; n++) { // berry bushes
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .1 || h > .58 || avoid(x, y)) continue;
    const bio = sampleGrid(BG, x, y);
    if (bio < .33 || bio > .6 || rnd() > .5 || !freeAt(x, y, 22)) continue;
    add({ type: 'bush', x, y, c: 1, s: .9 + rnd() * .25 }); count++;
  }
  // guaranteed starter bushes near spawn
  for (let k = 0; k < 3; k++) { const x = SPAWN.x - 120 + k * 120 + (rnd() - .5) * 40, y = SPAWN.y - 170 - rnd() * 40; if (Hh(x, y) > .08 && freeAt(x, y, 22)) add({ type: 'bush', x, y, c: 1, s: 1 }); }
  count = 0;
  for (let n = 0; n < 9000 && count < 340; n++) { // tall grass
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .085 || h > .64 || avoid(x, y) || rnd() > .6 || !freeAt(x, y, 12)) continue;
    add({ type: 'grass', x, y, s: .9 + rnd() * .3 }); count++;
  }
  for (const o of objects.slice()) { // sticks under trees
    if (o.type === 'tree' && rnd() < .28) { const a = rnd() * TAU, r = 30 + rnd() * 18, x = o.x + Math.cos(a) * r, y = o.y + Math.sin(a) * r * .7; if (Hh(x, y) > .06 && freeAt(x, y, 10)) add({ type: 'stick', x, y, rot: rnd() * Math.PI }); }
  }
  count = 0;
  for (let n = 0; n < 3000 && count < 36; n++) { // driftwood on beaches
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .006 || h > .05 || isFresh(x, y) || !freeAt(x, y, 14)) continue;
    add({ type: 'stick', x, y, rot: rnd() * Math.PI, drift: 1 }); count++;
  }
  count = 0;
  for (let n = 0; n < 6000 && count < 80; n++) { // pebbles
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .01 || h > .62 || isFresh(x, y) || rnd() > .5 || !freeAt(x, y, 12)) continue;
    add({ type: 'pebble', x, y }); count++;
  }
  // starter sticks and pebbles near spawn so the first steps are quick
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (rnd() - .5) * 2.2, r = 70 + rnd() * 120; const x = SPAWN.x + Math.cos(a) * r, y = SPAWN.y + Math.sin(a) * r; if (Hh(x, y) > .01 && freeAt(x, y, 10)) add({ type: k % 2 ? 'pebble' : 'stick', x, y, rot: rnd() * 3 }); }
  count = 0;
  const shells = [];
  for (let n = 0; n < 8000 && count < 14; n++) { // collectible shells
    const [x, y] = rp(), h = Hh(x, y);
    if (h < .003 || h > .035 || isFresh(x, y)) continue;
    if (shells.some(s => dist(s.x, s.y, x, y) < 260) || !freeAt(x, y, 12)) continue;
    shells.push(add({ type: 'shell', x, y, rot: rnd() * TAU, hue: rnd() })); count++;
  }
}
const SOLID = { tree: 9, pine: 8, palm: 6, bush: 11, crate: 13, campfire: 14, leanto: 22 };
function solidR(o) {
  if (o.st === 'gone') return 0;
  if (o.solid) return o.solid;
  if (o.type === 'rock') return o.r * .85;
  if ((o.type === 'tree' || o.type === 'pine') && o.st === 'stump') return 7;
  return SOLID[o.type] || 0;
}
