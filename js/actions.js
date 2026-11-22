"use strict";
// ================= Interaction =================
function findTarget() {
  const p = S.p, fx = p.x + p.dx * 16, fy = p.y + p.dy * 16;
  let best = null, bd = 1e9;
  for (const o of nearby(fx, fy, 70)) {
    if (!interactable(o)) continue;
    const ox = o.x, oy = o.y - (o.type === 'crate' ? 6 : 0);
    const d = dist(fx, fy, ox, oy) - (o.type === 'rock' ? o.r * .6 : o.type === 'leanto' ? 18 : o.type === 'raft' ? 22 : 0);
    if (d < 30 && d < bd) { bd = d; best = { kind: 'obj', o }; }
  }
  for (const c of crabs) { const d = dist(fx, fy, c.x, c.y); if (d < 30 && d < bd) { bd = d; best = { kind: 'crab', c }; } }
  if (best) return best;
  for (let r = 18; r <= 48; r += 6) {
    const x = p.x + p.dx * r, y = p.y + p.dy * r, h = Hh(x, y);
    if (h < -.006) return { kind: 'water', fresh: isFresh(x, y), x, y };
  }
  return null;
}
function interactable(o) {
  if (o.st === 'gone') return false;
  switch (o.type) {
    case 'tree': case 'pine': return o.st !== 'stump';
    case 'crate': return o.st !== 'open';
    case 'wreck': case 'wreckpart': return false;
    default: return true;
  }
}
const isNightHour = hr => hr >= 19 || hr < 5;
function actionFor(T) {
  if (!T) return null;
  if (T.kind === 'crab') return { t: t('act.crab'), fn: () => hitCrab(T.c) };
  if (T.kind === 'water') {
    if (T.fresh) return { t: t('act.drink'), fn: drink };
    if (has('rod')) return { t: t('act.cast'), fn: () => castLine(T) };
    return { t: t('act.salty') };
  }
  const o = T.o;
  switch (o.type) {
    case 'tree': case 'pine': return has('axe') ? { t: t('act.chop'), fn: () => chop(o) } : { t: t('act.needAxe') };
    case 'palm': return o.c > 0 ? { t: t('act.shake'), fn: () => shakePalm(o) } : { t: t('act.noCoco') };
    case 'rock': return has('pickaxe') ? { t: t('act.mine'), fn: () => mine(o) } : { t: t('act.needPick') };
    case 'bush': return o.c > 0 ? { t: t('act.berries'), fn: () => pickBush(o) } : { t: t('act.noBerries') };
    case 'grass': return { t: t('act.fiber'), fn: () => pickup(o, 'fiber', 2) };
    case 'stick': return { t: t(o.drift ? 'act.drift' : 'act.stick'), fn: () => pickup(o, 'wood', 1) };
    case 'pebble': return { t: t('act.pebble'), fn: () => pickup(o, 'stone', 1) };
    case 'shell': return { t: t('act.shell'), fn: () => pickShell(o) };
    case 'crate': return { t: t('act.crate'), fn: () => openCrate(o) };
    case 'campfire': {
      const raw = has('fish') ? 'fish' : has('crab') ? 'crab' : null;
      if (o.fuel <= 0) return has('wood') ? { t: t('act.relight'), fn: () => fuelFire(o) } : { t: t('act.fireOut') };
      if (raw) return { t: t('act.cook', { item: itemName(raw) }), fn: () => cook(o, raw) };
      if (o.fuel < 85 && has('wood')) return { t: t('act.addWood'), fn: () => fuelFire(o) };
      return { t: t(o.fuel < 85 ? 'act.fireSoon' : 'act.fireGood') };
    }
    case 'leanto': return isNightHour(hour()) ? { t: t('act.sleep'), fn: () => sleep(o) } : { t: t('act.sleepLater') };
    case 'raft': {
      const meals = cnt('cookedFish') + cnt('cookedCrab');
      return meals >= 3 ? { t: t('act.sail'), fn: () => setSail(o) } : { t: t('act.needMeals', { n: meals }) };
    }
  }
  return null;
}
function doAct() {
  if (mode !== 'play' || paused || actCooldown > 0) return;
  if (placing) { confirmPlace(); actCooldown = .3; return; }
  if (fishing) { reel(); actCooldown = .25; return; }
  const a = actionFor(findTarget());
  if (a && a.fn) { a.fn(); actCooldown = .33; }
}
function swing(tool) { S.p.swing = .28; S.p.tool = tool; }
function give(item, n, x, y) {
  S.inv[item] = cnt(item) + n; hotbarDirty = true; flashSlot = item;
  floaters.push({ x: x ?? S.p.x, y: (y ?? S.p.y) - 30, text: t('float.gain', { n, item: itemName(item) }), life: 1.4, icon: item });
}
function take(item, n) { S.inv[item] = cnt(item) - n; if (S.inv[item] <= 0) delete S.inv[item]; hotbarDirty = true; }
function burst(x, y, n, kind, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = 30 + Math.random() * 80;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .6 - 40, z: 0, life: .6 + Math.random() * .5, max: 1.1, kind, color, rot: Math.random() * TAU, vr: (Math.random() - .5) * 10, size: 2 + Math.random() * 2.5 });
  }
}
function pickup(o, item, n) {
  o.st = 'gone'; o.dirty = true; o.rg = S.time + (item === 'fiber' ? .9 : item === 'wood' ? 1.4 : 2.2);
  give(item, n, o.x, o.y); SFX.pop(); burst(o.x, o.y - 4, 6, 'leaf', item === 'fiber' ? '#7cc062' : item === 'wood' ? '#a77a50' : '#b8bdb4'); swing(null);
}
function pickShell(o) { o.st = 'gone'; o.dirty = true; o.rg = 0; S.flags.shells++; give('shell', 1, o.x, o.y); SFX.pop(); tone(1300, .3, 'sine', .06, 0, .1); burst(o.x, o.y, 8, 'spark', '#fff3c4'); if (S.flags.shells === 14) showMessage(t('msg.shells.t'), t('msg.shells.b')); }
function pickBush(o) { o.c = 0; o.dirty = true; o.rg = S.time + 1; o.shake = 4; give('berries', 3, o.x, o.y); SFX.pop(); burst(o.x, o.y - 10, 8, 'leaf', '#5fae55'); swing(null); }
function shakePalm(o) {
  o.shake = 6; o.c--; o.dirty = true; if (!o.rg) o.rg = S.time + .5;
  give('coconut', 1, o.x, o.y); noise(.25, .2, 1500, 'bandpass'); tone(160, .15, 'sine', .15, -60, .2); burst(o.x + o.lean * 26 * o.s, o.y - 50, 8, 'leaf', '#58ab5c'); swing(null);
}
function chop(o) {
  o.hp--; o.shake = 5; o.dirty = true; SFX.chop(); swing('axe');
  burst(o.x, o.y - 14, 5, 'chip', '#c9925d');
  burst(o.x, o.y - 46 * o.s, 4, 'leaf', TREE_PALS[o.pal || 'deep'][2]);
  if (o.hp <= 0) {
    o.st = 'stump'; o.rg = S.time + 2.2; S.flags.chopped++;
    burst(o.x, o.y - 40, 26, 'leaf', o.type === 'pine' ? '#4d9a6c' : TREE_PALS[o.pal][1]);
    give('wood', o.type === 'pine' ? 3 : 3 + (Math.random() < .5 ? 1 : 0), o.x, o.y - 20);
    noise(.5, .3, 300, 'lowpass', .05);
  }
}
function mine(o) {
  o.hp--; o.shake = 4; o.dirty = true; SFX.mine(); swing('pickaxe'); burst(o.x, o.y - 8, 7, 'chip', '#b8bdb4');
  if (o.hp <= 0) { o.st = 'gone'; o.rg = S.time + 3; S.flags.mined++; give('stone', 3, o.x, o.y); burst(o.x, o.y, 18, 'dust', '#c8c6b8'); }
}
function openCrate(o) {
  o.st = 'open'; o.dirty = true; S.flags.crates++; SFX.crate(); burst(o.x, o.y - 10, 14, 'spark', '#ffe39a'); swing(null);
  let k = 0; for (const [it, n] of Object.entries(o.loot)) { setTimeout(() => { give(it, n, o.x, o.y - k * 2); }, k * 220); k++; }
  if (o.note) setTimeout(() => showMessage(t(o.note + '.t'), t(o.note + '.b'), 9), 500);
}
function fuelFire(o) { take('wood', 1); o.fuel = Math.min(100, o.fuel + 32); SFX.place(); burst(o.x, o.y - 8, 10, 'spark', '#ffb347'); swing(null); }
function cook(o, raw) { take(raw, 1); give(ITEMS[raw].raw, 1, o.x, o.y - 10); S.flags.cooked++; SFX.sizzle(); burst(o.x, o.y - 14, 8, 'smoke', '#ddd'); swing(null); }
function drink() { S.st.thirst = Math.min(100, S.st.thirst + 30); S.flags.drank++; SFX.drink(); const T = findTarget(); burst(T ? T.x : S.p.x, T ? T.y : S.p.y, 8, 'splash', '#bfeff0'); floaters.push({ x: S.p.x, y: S.p.y - 34, text: t('float.drink'), life: 1.2 }); swing(null); }
function hitCrab(c) {
  c.hp--; c.flee = 2; c.hurt = .3; swing(has('axe') ? 'axe' : null); noise(.08, .25, 1800, 'bandpass', 0, 3);
  const a = Math.atan2(c.y - S.p.y, c.x - S.p.x); c.x += Math.cos(a) * 8; c.y += Math.sin(a) * 8;
  burst(c.x, c.y, 5, 'chip', '#f08159');
  if (c.hp <= 0 || has('axe')) { crabs.splice(crabs.indexOf(c), 1); give('crab', 1, c.x, c.y); burst(c.x, c.y, 10, 'dust', '#f3d9b0'); }
}
function castLine(T) {
  let bx = T.x, by = T.y;
  for (let r = 50; r <= 80; r += 5) { const x = S.p.x + S.p.dx * r, y = S.p.y + S.p.dy * r; if (Hh(x, y) < -.02) { bx = x; by = y; } }
  fishing = { phase: 'wait', t: 2 + Math.random() * 4, bx, by, px: S.p.x, py: S.p.y, cast: .3 };
  swing('rod'); noise(.15, .12, 3000, 'highpass'); setTimeout(SFX.splash, 250);
}
function reel() {
  if (!fishing) return;
  if (fishing.phase === 'bite') {
    const r = Math.random();
    if (r < .08) { give('shell', 1, fishing.bx, fishing.by); showMessage(t('msg.surprise.t'), t('msg.surprise.b')); }
    else { give('fish', 1, fishing.bx, fishing.by); S.flags.fish++; }
    SFX.splash(); SFX.pop(); burst(fishing.bx, fishing.by, 12, 'splash', '#d6f6f4');
  } else { floaters.push({ x: fishing.bx, y: fishing.by - 10, text: t('float.reeled'), life: 1 }); }
  fishing = null; swing('rod');
}
function eat(item) {
  const f = ITEMS[item] && ITEMS[item].food; if (!f || !has(item)) return;
  take(item, 1);
  S.st.hunger = clamp(S.st.hunger + (f.hu || 0), 0, 100); S.st.thirst = clamp(S.st.thirst + (f.th || 0), 0, 100);
  S.st.health = clamp(S.st.health + (f.he || 0), 0, 100); S.st.warmth = clamp(S.st.warmth + (f.wa || 0), 0, 100);
  SFX.eat(); burst(S.p.x, S.p.y - 26, 6, 'chip', item === 'berries' ? '#c93f5c' : '#e8c89a');
  floaters.push({ x: S.p.x, y: S.p.y - 34, text: f.he < 0 ? t('float.raw') : t('float.ate', { item: itemName(item) }), life: 1.3 });
}
function eatBest() {
  const st = S.st;
  const order = st.thirst < 55 && has('coconut') ? ['coconut'] : [];
  order.push('cookedFish', 'cookedCrab', 'berries', 'coconut', 'fish', 'crab');
  // keep 3 cooked meals for the voyage once the raft exists
  for (const it of order) {
    if (!has(it)) continue;
    if (S.flags.raft && ITEMS[it].cooked && cnt('cookedFish') + cnt('cookedCrab') <= 3 && (has('berries') || has('coconut'))) continue;
    eat(it); return;
  }
  floaters.push({ x: S.p.x, y: S.p.y - 34, text: t('float.nothing'), life: 1 });
}
function sleep(o) {
  mode = 'cutscene'; fadeTo(true, t('fade.sleep'));
  setTimeout(() => {
    const day = Math.floor(S.time); const hr = hour();
    S.time = (hr >= 19 ? day + 1 : day) + .26;
    S.st.hunger = Math.max(5, S.st.hunger - 18); S.st.thirst = Math.max(5, S.st.thirst - 22);
    S.st.warmth = 100; S.st.health = Math.min(100, S.st.health + 25); S.flags.slept++;
    for (const f of objects) if (f.type === 'campfire') f.fuel = Math.max(0, f.fuel - 60);
    S.p.x = o.x; S.p.y = o.y + 34; S.p.dy = 1; S.p.dx = 0;
    fadeTo(false); mode = 'play'; saveGame();
  }, 1700);
}

// ================= Crafting & placing =================
const craftEl = document.getElementById('craft'), helpEl = document.getElementById('help');
function canAfford(r) { return Object.entries(r.cost).every(([k, n]) => cnt(k) >= n); }
function toggleCraft(force) {
  const open = force != null ? force : craftEl.hidden;
  if (open && (mode !== 'play' || !helpEl.hidden)) return;
  craftEl.hidden = !open; paused = open || !helpEl.hidden; if (!open) focusGame();
  if (open) { if (placing) cancelPlacing(); fishing = null; renderRecipes(); }
}
function toggleHelp(force) { const open = force != null ? force : helpEl.hidden; if (open && mode !== 'play') return; helpEl.hidden = !open; if (open) craftEl.hidden = true; paused = open; if (!open) focusGame(); }
function renderRecipes() {
  const box = document.getElementById('recipes'); box.innerHTML = '';
  for (const r of RECIPES) {
    const owned = r.tool && has(r.id);
    const built = r.id === 'raft' && S.flags.raft;
    const div = document.createElement('div'); div.className = 'rc' + (owned || built ? ' owned' : '');
    const costs = Object.entries(r.cost).map(([k, n]) => `<span class="cost${cnt(k) < n ? ' short' : ''}"><img src="${ICON[k]}" alt="">${Math.min(cnt(k), n)}/${n} ${itemName(k)}</span>`).join('');
    const ok = canAfford(r) && !owned && !built;
    div.innerHTML = `<img src="${ICON[r.id]}" alt=""><div class="nm">${t('recipe.' + r.id)}</div><div class="ds">${t('recipe.' + r.id + '.d')}</div><div class="costs">${costs}</div><button class="mk" id="mk-${r.id}" ${ok ? '' : 'disabled'}>${t(owned ? 'craft.owned' : built ? 'craft.built' : r.place ? 'craft.makePlace' : 'craft.make')}</button>`;
    div.querySelector('button').addEventListener('click', () => craft(r));
    box.appendChild(div);
  }
}
function craft(r) {
  if (!canAfford(r)) return;
  if (r.place) { toggleCraft(false); placing = r; return; }
  for (const [k, n] of Object.entries(r.cost)) take(k, n);
  give(r.id, 1); SFX.craft(); burst(S.p.x, S.p.y - 20, 12, 'spark', '#ffe39a'); renderRecipes();
}
function placePos() { return { x: S.p.x + S.p.dx * 46, y: S.p.y + S.p.dy * 46 + (placing && placing.id === 'leanto' ? 6 : 0) }; }
function placeValid() {
  const { x, y } = placePos(), h = Hh(x, y), id = placing.id;
  const rad = id === 'leanto' ? 26 : id === 'raft' ? 26 : 16;
  if (id === 'raft') {
    if (h > -.008 || h < -.2 || isFresh(x, y)) return false;
    let land = false; for (let a = 0; a < TAU; a += TAU / 12) if (Hh(x + Math.cos(a) * 60, y + Math.sin(a) * 60) > .005) land = true;
    if (!land) return false;
  } else {
    if (h < .015 || isFresh(x, y) && h < .05) return false;
    for (let a = 0; a < TAU; a += TAU / 8) if (Hh(x + Math.cos(a) * rad, y + Math.sin(a) * rad) < 0) return false;
  }
  for (const o of nearby(x, y, 80)) { const sr = solidR(o); if (sr && dist(x, y, o.x, o.y) < sr + rad) return false; if (o.type === 'raft' && dist(x, y, o.x, o.y) < 60) return false; }
  if (id !== 'raft' && dist(x, y, S.p.x, S.p.y) < rad + 8) return false;
  return true;
}
function confirmPlace() {
  if (!placing) return;
  if (!placeValid()) { floaters.push({ x: S.p.x, y: S.p.y - 34, text: t(placing.id === 'raft' ? 'float.raftFace' : 'float.noRoom'), life: 1 }); SFX.hurt(); return; }
  if (!canAfford(placing)) { cancelPlacing(); return; }
  for (const [k, n] of Object.entries(placing.cost)) take(k, n);
  const { x, y } = placePos();
  addPlaced(placing.id, x, y);
  if (placing.id === 'campfire') S.flags.fires++;
  if (placing.id === 'raft') S.flags.raft = 1;
  SFX.place(); SFX.craft(); burst(x, y, 16, 'dust', '#e8d6a8');
  placing = null; saveGame();
}
function cancelPlacing() { placing = null; }
