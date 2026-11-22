// Regenerates the link-preview image (og-image.jpg, 1200x630) and the tab/home-screen icon (icon.png, 512x512).
// Run from the repo root:  node tools/make-preview-images.js
// Needs Node and Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');

(async () => {
  const browser = await chromium.launch();

  // ---- Link preview: the beach at the start of the game, with the Hebrew title on top
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => { try { localStorage.setItem('driftwood-lang', '"he"'); } catch (e) { } });
  await page.goto(URL);
  await page.waitForFunction(() => !document.getElementById('startBtn').disabled, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    mode = 'preview';                       // freezes the title-screen camera drift
    cam.x = SPAWN.x + 30; cam.y = SPAWN.y - 185;
    for (const sel of ['.tbtnrow', '.keys', '.titleLang', '#ver']) document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
    // Big, readable title: link previews are often shown as small thumbnails
    document.getElementById('title').style.background = 'radial-gradient(ellipse 52% 48% at 50% 50%, rgba(24,36,40,.5), rgba(24,36,40,.18) 65%, rgba(24,36,40,.3))';
    document.querySelector('.tcard').style.maxWidth = 'none';
    document.querySelector('.logo').style.fontSize = '150px';
    document.querySelector('.logo').style.whiteSpace = 'nowrap';
    document.querySelector('.tag').style.display = 'none';   // the description text appears under the image in WhatsApp anyway
  });
  await page.waitForTimeout(1500);            // let waves, foam and particles settle into a nice frame
  await page.screenshot({ path: path.join(ROOT, 'og-image.jpg'), type: 'jpeg', quality: 84 });

  // ---- Icon: a palm island in a rounded square
  const icon = await browser.newPage({ viewport: { width: 512, height: 512 } });
  await icon.setContent('<canvas id="c" width="512" height="512"></canvas>');
  const dataUrl = await icon.evaluate(() => {
    const c = document.getElementById('c').getContext('2d'), TAU = Math.PI * 2;
    const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    rr(0, 0, 512, 512, 112); c.save(); c.clip();
    const sky = c.createLinearGradient(0, 0, 0, 512); sky.addColorStop(0, '#7fd3e6'); sky.addColorStop(.55, '#3fb0c9'); sky.addColorStop(1, '#2b86b2');
    c.fillStyle = sky; c.fillRect(0, 0, 512, 512);
    c.fillStyle = '#ffd25e'; c.beginPath(); c.arc(392, 120, 54, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(90 + i * 85, 430 + (i % 2) * 22, 30, 5, 0, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(256, 372, 196, 62, 0, 0, TAU); c.fill();
    c.fillStyle = '#f3dfa6'; c.beginPath(); c.ellipse(256, 364, 180, 52, 0, 0, TAU); c.fill();
    c.fillStyle = '#8fcf6a'; c.beginPath(); c.ellipse(236, 350, 104, 26, 0, 0, TAU); c.fill();
    // trunk
    for (let i = 0; i <= 12; i++) { const k = i / 12, x = 236 + Math.sin(k * 1.6) * 46, y = 352 - k * 210; c.fillStyle = i % 2 ? '#a77a4e' : '#8f6541'; c.beginPath(); c.ellipse(x, y, 17 - k * 5, 12, 0, 0, TAU); c.fill(); }
    const tx = 236 + Math.sin(1.6) * 46, ty = 142;
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * TAU + .3, len = 120, ca = Math.cos(a), sa = Math.sin(a);
      const ex = tx + ca * len, ey = ty + sa * len * .6 + 36, mx = tx + ca * len * .55, my = ty + sa * len * .3 - 26, px = -sa * 22, py = ca * 13;
      c.fillStyle = k % 2 ? '#4e9f55' : '#62b664'; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx + px, my + py, ex, ey); c.quadraticCurveTo(mx - px, my - py + 12, tx, ty); c.fill();
    }
    for (const [dx, dy] of [[-12, 12], [12, 14], [0, 24]]) { c.fillStyle = '#73492d'; c.beginPath(); c.arc(tx + dx, ty + dy, 14, 0, TAU); c.fill(); }
    c.restore();
    return document.getElementById('c').toDataURL('image/png');
  });
  fs.writeFileSync(path.join(ROOT, 'icon.png'), Buffer.from(dataUrl.split(',')[1], 'base64'));

  await browser.close();
  for (const f of ['og-image.jpg', 'icon.png']) console.log(f, Math.round(fs.statSync(path.join(ROOT, f)).size / 1024) + ' KB');
})();
