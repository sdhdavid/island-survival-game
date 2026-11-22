"use strict";
// ================= Update =================
let tick1 = 0, saveTimer = 0, gullTimer = 15, chirpTimer = 3, crackTimer = 0;
function update(dt) {
  if (mode === 'title') {
    const a = Tm * .05; cam.x = CX + Math.cos(a) * 520; cam.y = CY + Math.sin(a) * 380 + 120;
    updateAmbient(dt, true); updateParticles(dt); return;
  }
  if (!S) return;
  if (mode === 'sailing') { updateSail(dt); updateAmbient(dt); updateParticles(dt); updateFires(dt); return; }
  if (paused) return;
  const playing = mode === 'play';
  if (playing) S.time += dt * DEBUG.timeScale / DAY_LEN;
  const p = S.p, st = S.st, hr = hour(), night = nightAmt(hr);
  // movement
  let mx = 0, my = 0;
  if (playing) {
    if (keys['w'] || keys['arrowup']) my -= 1; if (keys['s'] || keys['arrowdown']) my += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1; if (keys['d'] || keys['arrowright']) mx += 1;
    if (joy.active) { mx += joy.x; my += joy.y; }
  }
  const ml = Math.hypot(mx, my);
  p.moving = ml > .15;
  if (p.moving) {
    mx /= Math.max(1, ml); my /= Math.max(1, ml);
    const fl = Math.hypot(mx, my); p.dx = mx / fl; p.dy = my / fl;
    const hNow = Hh(p.x, p.y);
    const sp = (hNow < 0 ? 78 : 132) * (st.health < 20 ? .8 : 1);
    const nx = p.x + mx * sp * dt, ny = p.y + my * sp * dt;
    if (walkable(nx, p.y)) p.x = nx; if (walkable(p.x, ny)) p.y = ny;
    for (const o of nearby(p.x, p.y, 60)) {
      const r = solidR(o); if (!r) continue;
      const d = dist(p.x, p.y, o.x, o.y), min = r + 9;
      if (d < min && d > .01) { const push = (min - d); const nx2 = p.x + (p.x - o.x) / d * push, ny2 = p.y + (p.y - o.y) / d * push; if (walkable(nx2, ny2)) { p.x = nx2; p.y = ny2; } }
    }
    p.walk += dt * 13;
    if (hNow > 0 && hNow < .07 && dist(p.x, p.y, lastFoot.x, lastFoot.y) > 15) { footprints.push({ x: p.x + p.dy * 3 * (footprints.length % 2 ? 1 : -1), y: p.y - p.dx * 3 * (footprints.length % 2 ? 1 : -1), a: Math.atan2(p.dy, p.dx), life: 14 }); lastFoot = { x: p.x, y: p.y }; if (footprints.length > 140) footprints.shift(); }
    if (hNow < 0 && Math.random() < dt * 8) particles.push({ x: p.x + (Math.random() - .5) * 14, y: p.y, vx: 0, vy: 0, life: .8, max: .8, kind: 'ripple', size: 4 });
    if (fishing && dist(p.x, p.y, fishing.px, fishing.py) > 6) fishing = null;
  }
  if (p.swing > 0) p.swing -= dt;
  if (actCooldown > 0) actCooldown -= dt;
  if (actHeld && actCooldown <= 0 && playing) doAct();
  // fishing
  if (fishing) {
    fishing.t -= dt; if (fishing.cast > 0) fishing.cast -= dt;
    if (fishing.phase === 'wait' && fishing.t <= 0) { fishing.phase = 'bite'; fishing.t = 1.25; SFX.bite(); burst(fishing.bx, fishing.by, 6, 'splash', '#d6f6f4'); }
    else if (fishing.phase === 'bite' && fishing.t <= 0) { floaters.push({ x: fishing.bx, y: fishing.by - 10, text: 'It got away…', life: 1.2 }); fishing.phase = 'wait'; fishing.t = 2 + Math.random() * 4; }
  }
  // camera
  const lead = 30;
  cam.x = lerp(cam.x, p.x + p.dx * lead, 1 - Math.exp(-dt * 4)); cam.y = lerp(cam.y, p.y + p.dy * lead * .7, 1 - Math.exp(-dt * 4));
  // weather
  const w = S.weather; w.next -= dt;
  if (w.next <= 0) { if (w.target > 0) { w.target = 0; w.next = 160 + Math.random() * 200; } else { w.target = .5 + Math.random() * .5; w.next = 35 + Math.random() * 40; if (S.time > .55) showBanner('Rain rolls in', 'Stay warm by the fire', 2.2); } }
  if (S.time < .55) w.target = 0;
  w.rain = lerp(w.rain, w.target, 1 - Math.exp(-dt * .5));
  // fires / warmth
  updateFires(dt);
  let nearFire = false, nearShelter = false;
  for (const o of nearby(p.x, p.y, 160)) { if (o.type === 'campfire' && o.fuel > 0 && dist(p.x, p.y, o.x, o.y) < 135) nearFire = true; if (o.type === 'leanto' && dist(p.x, p.y, o.x, o.y) < 55) nearShelter = true; }
  if (playing) {
    st.hunger = Math.max(0, st.hunger - dt * 100 / 430);
    st.thirst = Math.max(0, st.thirst - dt * 100 / 330);
    if (nearFire) st.warmth = Math.min(100, st.warmth + dt * 9);
    else {
      const cold = night * (100 / 85) + w.rain * (100 / 220) * (nearShelter ? 0 : 1);
      const drain = cold * (nearShelter ? .5 : 1);
      if (drain > .05) st.warmth = Math.max(0, st.warmth - dt * drain); else st.warmth = Math.min(100, st.warmth + dt * 3);
    }
    if (DEBUG.god) { st.health = st.hunger = st.thirst = st.warmth = 100; }
    let hurt = 0; if (st.hunger <= 0) hurt += 1.1; if (st.thirst <= 0) hurt += 1.4; if (st.warmth <= 0) hurt += 1.5;
    if (hurt) { st.health = Math.max(0, st.health - hurt * dt); if (Math.random() < dt * .4) SFX.hurt(); }
    else if (st.hunger > 35 && st.thirst > 35 && st.warmth > 30) st.health = Math.min(100, st.health + dt * .7);
    if (st.health <= 0) faint();
    // day banner
    const dayNum = Math.floor(S.time) + 1;
    if (dayNum !== S.lastDay && hr > 5.5) { S.lastDay = dayNum; showBanner('Day ' + dayNum, ['The tide brought new driftwood', 'Birds are singing in the palms', 'Another morning on the island', 'The sea looks calm today'][dayNum % 4]); }
  }
  // regrowth
  tick1 -= dt;
  if (tick1 <= 0) { tick1 = 1; regrow(); }
  questTimer -= dt; if (questTimer <= 0 && playing) { questTimer = .25; checkQuests(); }
  saveTimer -= dt; if (saveTimer <= 0) { saveTimer = 15; saveGame(); }
  if (msgTimer > 0) { msgTimer -= dt; if (msgTimer <= 0) $('message').classList.remove('show'); }
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) $('banner').classList.remove('show'); }
  updateCrabs(dt); updateAmbient(dt); updateParticles(dt);
  for (const f of footprints) f.life -= dt; while (footprints.length && footprints[0].life <= 0) footprints.shift();
  for (const o of nearby(p.x, p.y, 400)) if (o.shake > 0) o.shake = Math.max(0, o.shake - dt * 25);
  // audio mix
  if (AU.ctx) {
    const h = Hh(p.x, p.y);
    AU.ocean.gain.setTargetAtTime(AU.muted ? 0 : .05 + .18 * (1 - smooth(0, .45, h)), AU.ctx.currentTime, .5);
    AU.rain.gain.setTargetAtTime(AU.muted ? 0 : w.rain * .09, AU.ctx.currentTime, .5);
    chirpTimer -= dt;
    if (chirpTimer <= 0) { chirpTimer = 2 + Math.random() * 5; if (night < .4 && w.rain < .3) SFX.chirp(); else if (night > .6) { SFX.cricket(); chirpTimer = .6 + Math.random() * 1.5; } }
    if (nearFire) { crackTimer -= dt; if (crackTimer <= 0) { crackTimer = .05 + Math.random() * .35; SFX.crackle(); } }
  }
}
let Tm = 0;
function walkable(x, y) {
  if (x < 40 || y < 40 || x > WORLD - 40 || y > WORLD - 40) return false;
  const h = Hh(x, y);
  if (h < -.05) return false;
  if (h < -.004 && isFresh(x, y)) return false;
  return true;
}
function regrow() {
  for (const o of objects) {
    if (!o.rg || S.time < o.rg) continue;
    if (dist(o.x, o.y, S.p.x, S.p.y) < 40) continue;
    if (objects.some(q => q.placed && dist(q.x, q.y, o.x, o.y) < 45)) { o.rg = 0; continue; }
    switch (o.type) {
      case 'tree': case 'pine': o.st = 'ok'; o.hp = o.max; o.rg = 0; break;
      case 'palm': o.c = Math.min(3, (o.c || 0) + 1); o.rg = o.c < 3 ? S.time + .5 : 0; break;
      case 'bush': o.c = 1; o.rg = 0; break;
      case 'rock': o.st = 'ok'; o.hp = o.max; o.rg = 0; break;
      default: o.st = 'ok'; o.rg = 0;
    }
  }
}
function updateFires(dt) {
  for (const o of objects) {
    if (o.type !== 'campfire' || o.fuel <= 0) continue;
    o.fuel = Math.max(0, o.fuel - dt * 100 / 190);
    if (Math.abs(o.x - cam.x) < W / Z && Math.abs(o.y - cam.y) < Hs / Z) {
      if (Math.random() < dt * 9) particles.push({ x: o.x + (Math.random() - .5) * 10, y: o.y - 12, vx: (Math.random() - .5) * 18, vy: -45 - Math.random() * 40, life: 1 + Math.random(), max: 2, kind: 'ember', size: 1.6 });
      if (Math.random() < dt * 3) particles.push({ x: o.x + (Math.random() - .5) * 6, y: o.y - 24, vx: 6 + Math.random() * 6, vy: -18, life: 2.5, max: 2.5, kind: 'smoke', size: 5 });
    }
  }
}
function faint() {
  mode = 'cutscene'; fadeTo(true, 'You collapse from exhaustion…');
  setTimeout(() => {
    const day = Math.floor(S.time); S.time = day + 1.27;
    S.st = { health: 55, hunger: 55, thirst: 55, warmth: 80 };
    S.p.x = SPAWN.x; S.p.y = SPAWN.y; cam.x = S.p.x; cam.y = S.p.y; fishing = null; placing = null;
    fadeTo(false); mode = 'play';
    showMessage('You wake up on the beach', 'Someone, or the tide, carried you back. Keep eating, drinking and stay near a fire at night.');
    saveGame();
  }, 2600);
}
function updateCrabs(dt) {
  const p = S.p;
  if (crabs.length < 9 && Math.random() < dt * .2) {
    for (let k = 0; k < 20; k++) {
      const x = 300 + Math.random() * 2600, y = 300 + Math.random() * 2600, h = Hh(x, y);
      if (h > .004 && h < .05 && !isFresh(x, y) && dist(x, y, p.x, p.y) > 500) { crabs.push({ x, y, tx: x, ty: y, hp: 2, ph: Math.random() * 6, wait: 0, flee: 0, hurt: 0 }); break; }
    }
  }
  for (const c of crabs) {
    const dp = dist(c.x, c.y, p.x, p.y);
    let sp = 0, ax = 0, ay = 0;
    if (c.hurt > 0) c.hurt -= dt;
    if (dp < 75 || c.flee > 0) { c.flee = Math.max(0, c.flee - dt); ax = (c.x - p.x) / (dp || 1); ay = (c.y - p.y) / (dp || 1); sp = dp < 75 ? 62 : 40; }
    else if (c.wait > 0) c.wait -= dt;
    else { const d = dist(c.x, c.y, c.tx, c.ty); if (d < 4) { c.wait = 1 + Math.random() * 3; const a = Math.random() * TAU, r = 30 + Math.random() * 70; c.tx = c.x + Math.cos(a) * r; c.ty = c.y + Math.sin(a) * r; } else { ax = (c.tx - c.x) / d; ay = (c.ty - c.y) / d; sp = 26; } }
    if (sp) {
      const nx = c.x + ax * sp * dt, ny = c.y + ay * sp * dt, h = Hh(nx, ny);
      if (h > -.02 && h < .075) { c.x = nx; c.y = ny; c.ph += dt * sp * .5; }
      else { c.tx = c.x; c.ty = c.y; c.wait = .2; if (c.flee > 0 || dp < 75) { const a = Math.atan2(ay, ax) + (Math.random() < .5 ? 1.6 : -1.6); const nx2 = c.x + Math.cos(a) * sp * dt, ny2 = c.y + Math.sin(a) * sp * dt, h2 = Hh(nx2, ny2); if (h2 > -.02 && h2 < .075) { c.x = nx2; c.y = ny2; c.ph += dt * sp * .5; } } }
    }
  }
}
function updateAmbient(dt, title) {
  const hr = S ? hour() : 10, night = nightAmt(hr), rain = S ? S.weather.rain : 0;
  // clouds
  if (!clouds.length) for (let i = 0; i < 7; i++) clouds.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, r: 180 + Math.random() * 160, s: .7 + Math.random() * .6 });
  for (const c of clouds) { c.x += dt * 9 * c.s; c.y += dt * 3 * c.s; if (c.x > WORLD + 400) c.x = -400; if (c.y > WORLD + 400) c.y = -400; }
  // butterflies
  const vx = cam.x, vy = cam.y, vw = W / Z / 2 + 80, vh = Hs / Z / 2 + 80;
  if (night < .3 && rain < .4 && butterflies.length < 9 && Math.random() < dt * 2) {
    const x = vx + (Math.random() - .5) * vw * 2, y = vy + (Math.random() - .5) * vh * 2;
    if (Hh(x, y) > .1) butterflies.push({ x, y, a: Math.random() * TAU, t: Math.random() * 9, c: ['#ffd86b', '#f7a8c4', '#fff6e8', '#9fd3ff', '#ffb37a'][Math.random() * 5 | 0], life: 20 + Math.random() * 20 });
  }
  for (let i = butterflies.length - 1; i >= 0; i--) {
    const b = butterflies[i]; b.t += dt; b.life -= dt; b.a += (Math.sin(b.t * 1.3) * 1.5 + (Math.random() - .5) * 2) * dt;
    b.x += Math.cos(b.a) * 26 * dt; b.y += Math.sin(b.a) * 26 * dt;
    if (b.life <= 0 || Math.abs(b.x - vx) > vw * 1.6 || Math.abs(b.y - vy) > vh * 1.6 || night > .5) butterflies.splice(i, 1);
  }
  // fireflies
  if (night > .5 && fireflies.length < 36 && Math.random() < dt * 8) {
    const x = vx + (Math.random() - .5) * vw * 2, y = vy + (Math.random() - .5) * vh * 2;
    if (Hh(x, y) > .1) fireflies.push({ x, y, a: Math.random() * TAU, t: Math.random() * 9, life: 10 + Math.random() * 10 });
  }
  for (let i = fireflies.length - 1; i >= 0; i--) {
    const f = fireflies[i]; f.t += dt; f.life -= dt; f.a += (Math.random() - .5) * 3 * dt; f.x += Math.cos(f.a) * 12 * dt; f.y += Math.sin(f.a) * 12 * dt;
    if (f.life <= 0 || night < .3 || Math.abs(f.x - vx) > vw * 1.6 || Math.abs(f.y - vy) > vh * 1.6) fireflies.splice(i, 1);
  }
  // gulls
  gullTimer -= dt;
  if (gullTimer <= 0 && night < .3) { gullTimer = 14 + Math.random() * 20; const dir = Math.random() < .5 ? 1 : -1; const n = 1 + (Math.random() * 3 | 0); for (let k = 0; k < n; k++) gulls.push({ x: vx - dir * (vw + 120) - dir * k * 40, y: vy + (Math.random() - .5) * vh + k * 26, vx: dir * (70 + Math.random() * 20), vy: (Math.random() - .5) * 14, t: Math.random() * 6 }); }
  for (let i = gulls.length - 1; i >= 0; i--) { const g = gulls[i]; g.x += g.vx * dt; g.y += g.vy * dt; g.t += dt; if (Math.abs(g.x - vx) > vw * 2.5) gulls.splice(i, 1); }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const q = particles[i]; q.life -= dt;
    if (q.life <= 0) { particles.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.kind === 'leaf' || q.kind === 'chip' || q.kind === 'splash') { q.vy += 160 * dt; q.vx *= .97; q.rot += q.vr * dt; }
    else if (q.kind === 'spark' || q.kind === 'dust') { q.vx *= .92; q.vy *= .92; }
    else if (q.kind === 'smoke') { q.size += dt * 6; q.vx *= .99; }
    else if (q.kind === 'ember') { q.vx += (Math.random() - .5) * 60 * dt; }
  }
  if (particles.length > 500) particles.splice(0, particles.length - 500);
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.life -= dt; f.y -= dt * 22; if (f.life <= 0) floaters.splice(i, 1); }
}

// ================= Sailing / winning =================
function setSail(o) {
  let need = 3; for (const k of ['cookedFish', 'cookedCrab']) { const n = Math.min(need, cnt(k)); if (n) take(k, n); need -= n; }
  mode = 'sailing'; fishing = null;
  const [gx, gy] = grad(o.x, o.y);
  sail = { o, t: 0, dx: -gx, dy: -gy };
  S.flags.won = 1; store.del(SAVE_KEY);
  SFX.quest();
  showBanner('Set sail!', 'Goodbye, Driftwood Isle', 4);
}
function updateSail(dt) {
  const s = sail; s.t += dt;
  const sp = Math.min(70, s.t * 18);
  s.o.x += s.dx * sp * dt; s.o.y += s.dy * sp * dt;
  bucketRemove(s.o); bucketAdd(s.o);
  S.p.x = s.o.x; S.p.y = s.o.y - 4; S.p.dx = s.dx; S.p.dy = s.dy;
  cam.x = lerp(cam.x, s.o.x, 1 - Math.exp(-dt * 2)); cam.y = lerp(cam.y, s.o.y, 1 - Math.exp(-dt * 2));
  S.time += dt / DAY_LEN;
  if (Math.random() < dt * 10) particles.push({ x: s.o.x - s.dx * 30 + (Math.random() - .5) * 30, y: s.o.y - s.dy * 30, vx: 0, vy: 0, life: 1.2, max: 1.2, kind: 'ripple', size: 6 });
  if (s.t > 7 && !s.ended) { s.ended = true; fadeTo(true); setTimeout(showEnd, 1300); }
}
function showEnd() {
  mode = 'won';
  const days = Math.floor(S.time) + 1;
  $('endText').textContent = `You sailed away from Driftwood Isle on day ${days}. The smoke from your last campfire curled up behind you as the island shrank to a green dot on the horizon.`;
  $('endStats').innerHTML = `<div><b>${days}</b><span>days survived</span></div><div><b>${S.flags.fish}</b><span>fish caught</span></div><div><b>${S.flags.shells}/14</b><span>shells found</span></div><div><b>${S.flags.chopped}</b><span>trees felled</span></div>`;
  $('hud').hidden = true; $('end').hidden = false; fadeTo(false);
}
