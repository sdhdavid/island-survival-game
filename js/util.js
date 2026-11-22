"use strict";
// Game version: bump on every change that goes to main, and add a matching entry to CHANGELOG.md
const GAME_VERSION = '0.3.0';

// ================= Utilities =================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { let t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function hashi(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hashi(xi, yi, s), b = hashi(xi + 1, yi, s), c = hashi(xi, yi + 1, s), d = hashi(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o, s) { let t = 0, amp = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += vnoise(x * f, y * f, s + i * 17) * amp; n += amp; amp *= .5; f *= 2.03; } return t / n; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
// Debug mode: open the game with ?debug in the address (or #debug). Debug games use their own save slot.
const DEBUG = {
  on: /[?&]debug\b/.test(location.search) || location.hash === '#debug',
  timeScale: 1, god: false, hitboxes: false, fps: 0
};
const SAVE_KEY = DEBUG.on ? 'driftwood-isle-save-debug' : 'driftwood-isle-save-v1';
