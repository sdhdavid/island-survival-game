"use strict";
// ================= State =================
let mode = 'loading', ready = false, paused = false;
let S = null;
const cam = { x: CX, y: CY };
function newState() {
  return {
    v: 1, time: .3, p: { x: SPAWN.x, y: SPAWN.y, dx: 0, dy: -1, walk: 0, moving: false, swing: 0, tool: null },
    st: { health: 100, hunger: 88, thirst: 80, warmth: 100 },
    inv: {}, flags: { crates: 0, chopped: 0, fires: 0, drank: 0, fish: 0, cooked: 0, slept: 0, raft: 0, shells: 0, mined: 0 },
    q: 0, lastDay: 1, weather: { rain: 0, target: 0, next: 120 }
  };
}
const has = k => (S.inv[k] || 0) > 0;
const cnt = k => S.inv[k] || 0;
let crabs = [], particles = [], floaters = [], butterflies = [], fireflies = [], gulls = [], footprints = [], clouds = [];
let fishing = null, placing = null, sail = null, actCooldown = 0, hotbarDirty = true, lastFoot = { x: 0, y: 0 };

function serialize() {
  if (!S) return null;
  return {
    ...S,
    objs: objects.filter(o => o.dirty && !o.placed).map(o => [o.id, o.st, o.hp, o.rg || 0, o.c]),
    placed: objects.filter(o => o.placed).map(o => ({ type: o.type, x: o.x, y: o.y, fuel: o.fuel || 0 }))
  };
}
function saveGame() { if (S && mode === 'play') store.set(SAVE_KEY, serialize()); }
function loadInto(data) {
  genObjects();
  S = newState();
  Object.assign(S, { time: data.time, st: data.st, inv: data.inv, flags: Object.assign(S.flags, data.flags), q: data.q, lastDay: data.lastDay || 1, weather: data.weather || S.weather });
  S.p.x = data.p.x; S.p.y = data.p.y;
  for (const [id, st, hp, rg, c] of (data.objs || [])) { const o = objects[id]; if (!o) continue; o.st = st; o.hp = hp; o.rg = rg; o.c = c; o.dirty = true; }
  for (const pl of (data.placed || [])) addPlaced(pl.type, pl.x, pl.y, pl.fuel);
}
function addPlaced(type, x, y, fuel) {
  const o = { type, x, y, placed: true, st: 'ok', shake: 0, ph: Math.random() * TAU, id: objects.length };
  if (type === 'campfire') o.fuel = fuel != null ? fuel : 70;
  objects.push(o); bucketAdd(o);
  // clear small things under it
  for (const n of nearby(x, y, 40)) if (n !== o && (n.type === 'grass' || n.type === 'stick' || n.type === 'pebble') && dist(n.x, n.y, x, y) < 32) { n.st = 'gone'; n.rg = 0; n.dirty = true; }
  return o;
}
