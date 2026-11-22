"use strict";
// ================= Boot =================
let last = performance.now(), hudTimer = 0, mapTimer = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; Tm += dt;
  if (ready) {
    update(dt);
    render();
    if (S && (mode === 'play' || mode === 'cutscene')) {
      hudTimer -= dt; if (hudTimer <= 0) { hudTimer = .1; updateHUD(); drawDial(); }
      mapTimer -= dt; if (mapTimer <= 0) { mapTimer = .25; drawMinimap(); }
    }
    if (DEBUG.on) debugTick(dt);
  }
  requestAnimationFrame(frame);
}
function boot(hotData) {
  setTimeout(() => {
    genHeights(); genTerrainImage(); genObjects(); makeIcons();
    ready = true; mode = 'title';
    const sb = $('startBtn'); sb.disabled = false; sb.textContent = 'Begin';
    $('ver').textContent = 'v' + GAME_VERSION + (DEBUG.on ? ' · debug' : '');
    const saved = hotData && hotData.save ? hotData.save : store.get(SAVE_KEY);
    if (saved && !saved.flags?.won) { $('contBtn').hidden = false; sb.textContent = 'New game'; }
    if (store.get('driftwood-muted')) { AU.muted = true; $('muteWave').style.display = 'none'; }
    setupTouch();
    if (DEBUG.on) setupDebug();
    if (hotData && hotData.save && hotData.playing) startFrom(hotData.save);
  }, 40);
  requestAnimationFrame(frame);
}
boot({});
window.addEventListener('beforeunload', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
