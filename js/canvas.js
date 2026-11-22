"use strict";
// ================= Canvas setup =================
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
let W = 0, Hs = 0, DPR = 1, Z = 1, vignette = null;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; Hs = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(Hs * DPR);
  lightCv.width = Math.ceil(W / 2); lightCv.height = Math.ceil(Hs / 2);
  Z = clamp(Math.min(W, Hs) / 560, .74, 1.7);
  vignette = null;
}
window.addEventListener('resize', resize); resize();
const toS = (x, y) => [(x - cam.x) * Z + W / 2, (y - cam.y) * Z + Hs / 2];
