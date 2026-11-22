"use strict";
// ================= Touch controls =================
function setupTouch() {
  if (!isTouch) return;
  document.body.classList.add('touch');
  $('touch').hidden = false;
  const stick = $('stick'), knob = $('knob'); let pid = null;
  const move = e => { const r = stick.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const l = Math.hypot(dx, dy), m = r.width / 2 - 10; if (l > m) { dx = dx / l * m; dy = dy / l * m; } knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / m; joy.y = dy / m; joy.active = true; };
  stick.addEventListener('pointerdown', e => { pid = e.pointerId; stick.setPointerCapture(pid); move(e); e.preventDefault(); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === pid) move(e); });
  const end = e => { if (e.pointerId !== pid) return; pid = null; joy.active = false; joy.x = joy.y = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  const act = $('tAct');
  act.addEventListener('pointerdown', e => { e.preventDefault(); actHeld = true; doAct(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => act.addEventListener(ev, () => actHeld = false));
  $('tEat').addEventListener('click', () => { if (mode === 'play' && !paused) eatBest(); });
  $('tCraft').addEventListener('click', () => toggleCraft());
}

// ================= Buttons =================
cv.addEventListener('pointerdown', focusGame);
$('craftBtn').addEventListener('click', () => toggleCraft());
$('craftClose').addEventListener('click', () => toggleCraft(false));
$('helpBtn').addEventListener('click', () => toggleHelp());
$('helpClose').addEventListener('click', () => toggleHelp(false));
craftEl.addEventListener('pointerdown', e => { if (e.target === craftEl) toggleCraft(false); });
helpEl.addEventListener('pointerdown', e => { if (e.target === helpEl) toggleHelp(false); });
function toggleMute() { AU.muted = !AU.muted; if (AU.master) AU.master.gain.value = AU.muted ? 0 : .8; $('muteWave').style.display = AU.muted ? 'none' : ''; store.set('driftwood-muted', AU.muted); }
$('muteBtn').addEventListener('click', toggleMute);
$('startBtn').addEventListener('click', () => startNew());
$('contBtn').addEventListener('click', () => { const d = store.get(SAVE_KEY); if (d) startFrom(d); else startNew(); });
$('againBtn').addEventListener('click', () => { $('end').hidden = true; sail = null; startNew(); });
for (const b of document.querySelectorAll('.langBtn')) b.addEventListener('click', () => { setLang(LANG === 'he' ? 'en' : 'he'); focusGame(); });
// Re-render text built in code after the language changes
function refreshLangDynamic() {
  setStartLabel();
  hotbarDirty = true; lastPrompt = null;
  if (!craftEl.hidden) renderRecipes();
  if (!$('end').hidden && S) fillEndScreen();
  if (S && mode === 'play') updateHUD();
}

function beginPlay(intro) {
  auInit();
  $('title').hidden = true; $('hud').hidden = false; mode = 'play'; paused = false; focusGame();
  cam.x = S.p.x; cam.y = S.p.y;
  crabs = []; particles = []; floaters = []; footprints = []; fishing = null; placing = null; sail = null;
  for (let i = 0; i < 7; i++) updateCrabs(5);
  hotbarDirty = true; checkQuests(); updateHUD(); buildMinimap();
  if (intro) setTimeout(() => showMessage(t('msg.intro.t'), t('msg.intro.b'), 9), 600);
  else showMessage(t('msg.back.t'), t('msg.back.b'), 4);
}
function startNew() { if (!ready) return; store.del(SAVE_KEY); genObjects(); S = newState(); S.p.dy = -1; beginPlay(true); }
function startFrom(d) { try { loadInto(d); beginPlay(false); } catch (e) { startNew(); } }
