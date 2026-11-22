"use strict";
// ================= Items & recipes =================
const ITEMS = {
  axe: { n: 'Stone Axe', tool: 1 }, pickaxe: { n: 'Stone Pickaxe', tool: 1 }, rod: { n: 'Fishing Rod', tool: 1 },
  wood: { n: 'Wood' }, stone: { n: 'Stone' }, fiber: { n: 'Fiber' }, rope: { n: 'Rope' }, cloth: { n: 'Sailcloth' }, sail: { n: 'Sail' },
  berries: { n: 'Berries', food: { hu: 9, th: 4 } }, coconut: { n: 'Coconut', food: { hu: 10, th: 30 } },
  fish: { n: 'Raw Fish', food: { hu: 10, he: -6 }, raw: 'cookedFish' }, crab: { n: 'Crab Meat', food: { hu: 8, he: -6 }, raw: 'cookedCrab' },
  cookedFish: { n: 'Grilled Fish', food: { hu: 36, he: 6, wa: 5 }, cooked: 1 }, cookedCrab: { n: 'Roast Crab', food: { hu: 30, he: 6, wa: 5 }, cooked: 1 },
  shell: { n: 'Seashell' }
};
const ORDER = ['axe', 'pickaxe', 'rod', 'wood', 'stone', 'fiber', 'rope', 'cloth', 'sail', 'berries', 'coconut', 'fish', 'crab', 'cookedFish', 'cookedCrab', 'shell'];
const RECIPES = [
  { id: 'axe', n: 'Stone Axe', d: 'Chop trees for logs.', cost: { wood: 3, stone: 2, fiber: 2 }, tool: 1 },
  { id: 'campfire', n: 'Campfire', d: 'Warmth, light and a place to cook.', cost: { wood: 5, stone: 4 }, place: 1 },
  { id: 'rod', n: 'Fishing Rod', d: 'Cast from any sea shore.', cost: { wood: 2, fiber: 3 }, tool: 1 },
  { id: 'pickaxe', n: 'Stone Pickaxe', d: 'Break boulders for stone.', cost: { wood: 3, stone: 3, fiber: 2 }, tool: 1 },
  { id: 'rope', n: 'Rope', d: 'Twisted fiber. Holds things together.', cost: { fiber: 3 } },
  { id: 'leanto', n: 'Lean-to', d: 'A dry bed. Sleep through the night.', cost: { wood: 8, fiber: 4, rope: 1 }, place: 1 },
  { id: 'sail', n: 'Sail', d: 'Stitched from salvaged sailcloth.', cost: { cloth: 2, rope: 2 } },
  { id: 'raft', n: 'Raft', d: 'Your way home. Build it in the shallows.', cost: { wood: 16, rope: 4, sail: 1 }, place: 1 }
];

// ================= Icons =================
const ICON = {};
function makeIcons() {
  const draw = {
    wood(c) { c.fillStyle = '#9a6a43'; rr(c, 6, 16, 34, 14, 7); c.fill(); c.fillStyle = '#c9925d'; c.beginPath(); c.ellipse(38, 23, 6, 7, 0, 0, TAU); c.fill(); c.strokeStyle = '#9a6a43'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(38, 23, 3, 3.6, 0, 0, TAU); c.stroke(); c.fillStyle = '#7d5435'; c.fillRect(12, 20, 16, 2); c.fillStyle = '#5f9e4c'; c.beginPath(); c.ellipse(18, 15, 5, 2.5, -.4, 0, TAU); c.fill(); },
    stone(c) { c.fillStyle = '#7f8580'; c.beginPath(); c.ellipse(24, 28, 15, 11, 0, 0, TAU); c.fill(); c.fillStyle = '#a7ada6'; c.beginPath(); c.ellipse(21, 25, 11, 7.5, -.2, 0, TAU); c.fill(); c.fillStyle = '#d0d4cc'; c.beginPath(); c.ellipse(18, 22, 4, 2.5, -.3, 0, TAU); c.fill(); },
    fiber(c) { c.strokeStyle = '#6fb158'; c.lineWidth = 2.6; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(16 + i * 3, 40); c.quadraticCurveTo(10 + i * 5, 22, 18 + i * 4, 6 + (i % 2) * 4); c.stroke(); } c.fillStyle = '#c9a56a'; rr(c, 13, 26, 22, 5, 2); c.fill(); },
    rope(c) { c.strokeStyle = '#c79b5f'; c.lineWidth = 5; c.beginPath(); c.ellipse(24, 25, 14, 11, 0, 0, TAU); c.stroke(); c.strokeStyle = '#e7c48a'; c.lineWidth = 2; c.beginPath(); c.ellipse(24, 25, 14, 11, 0, 0, TAU); c.stroke(); c.strokeStyle = '#c79b5f'; c.lineWidth = 4; c.beginPath(); c.ellipse(24, 25, 7, 5, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(34, 32); c.quadraticCurveTo(40, 40, 44, 38); c.stroke(); },
    cloth(c) { c.fillStyle = '#efe2c4'; rr(c, 8, 12, 32, 24, 4); c.fill(); c.fillStyle = '#d8c7a2'; c.fillRect(8, 22, 32, 4); c.fillStyle = '#d9735a'; c.fillRect(8, 30, 32, 3); c.strokeStyle = 'rgba(0,0,0,.15)'; c.setLineDash([2, 2]); c.strokeRect(10, 14, 28, 20); c.setLineDash([]); },
    sail(c) { c.strokeStyle = '#8a5d3b'; c.lineWidth = 3; c.beginPath(); c.moveTo(14, 4); c.lineTo(14, 44); c.stroke(); c.fillStyle = '#f5ead2'; c.beginPath(); c.moveTo(16, 6); c.quadraticCurveTo(40, 20, 40, 38); c.lineTo(16, 38); c.closePath(); c.fill(); c.fillStyle = '#e0775c'; c.beginPath(); c.moveTo(16, 26); c.lineTo(38, 26); c.lineTo(39, 31); c.lineTo(16, 31); c.fill(); },
    berries(c) { c.fillStyle = '#4f9a4f'; c.beginPath(); c.ellipse(30, 12, 8, 4, -.5, 0, TAU); c.fill(); const p = [[18, 24], [28, 22], [23, 32], [33, 31], [14, 33]]; for (const [x, y] of p) { c.fillStyle = '#c93f5c'; c.beginPath(); c.arc(x, y, 6.5, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(x - 2, y - 2, 1.8, 0, TAU); c.fill(); } },
    coconut(c) { c.fillStyle = '#7a5032'; c.beginPath(); c.arc(24, 26, 15, 0, TAU); c.fill(); c.fillStyle = '#93653f'; c.beginPath(); c.arc(20, 22, 9, 0, TAU); c.fill(); c.fillStyle = '#4a2f1e'; for (const [x, y] of [[20, 18], [27, 18], [23.5, 24]]) { c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); } },
    fish(c, cooked) { c.fillStyle = cooked ? '#d08a45' : '#69a8cf'; c.beginPath(); c.ellipse(22, 24, 15, 9, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(34, 24); c.lineTo(45, 15); c.lineTo(45, 33); c.closePath(); c.fill(); c.fillStyle = cooked ? '#f0b46a' : '#a9d6ee'; c.beginPath(); c.ellipse(20, 27, 10, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#233'; c.beginPath(); c.arc(13, 21, 2, 0, TAU); c.fill(); if (cooked) { c.strokeStyle = '#8a4f24'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(17 + i * 6, 17); c.lineTo(13 + i * 6, 31); c.stroke(); } } },
    crab(c, cooked) { c.fillStyle = cooked ? '#c9542f' : '#ee7a58'; c.beginPath(); c.ellipse(24, 28, 13, 9, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(9, 16, 6, 0, TAU); c.arc(39, 16, 6, 0, TAU); c.fill(); c.fillStyle = cooked ? '#e98a4f' : '#ffb092'; c.beginPath(); c.ellipse(22, 25, 7, 4, 0, 0, TAU); c.fill(); if (cooked) { c.fillStyle = '#7cbf5a'; c.beginPath(); c.ellipse(24, 38, 9, 3, 0, 0, TAU); c.fill(); } },
    shell(c) { c.fillStyle = '#f3b7ae'; c.beginPath(); c.moveTo(24, 40); c.lineTo(8, 18); c.quadraticCurveTo(24, 2, 40, 18); c.closePath(); c.fill(); c.strokeStyle = '#d98a80'; c.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(24, 39); c.lineTo(24 + i * 7, 10 + Math.abs(i) * 3); c.stroke(); } c.fillStyle = '#e59b90'; rr(c, 19, 37, 10, 6, 2); c.fill(); },
    axe(c) { c.strokeStyle = '#8a5d3b'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, 42); c.lineTo(34, 8); c.stroke(); c.fillStyle = '#9ba39b'; c.beginPath(); c.moveTo(28, 10); c.quadraticCurveTo(44, 8, 44, 24); c.lineTo(32, 18); c.closePath(); c.fill(); c.fillStyle = '#c8cec5'; c.beginPath(); c.moveTo(40, 12); c.quadraticCurveTo(44, 16, 44, 23); c.lineTo(41, 21); c.fill(); c.strokeStyle = '#d9c08e'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(27, 14); c.lineTo(33, 18); c.stroke(); },
    pickaxe(c) { c.strokeStyle = '#8a5d3b'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, 42); c.lineTo(32, 12); c.stroke(); c.strokeStyle = '#9ba39b'; c.lineWidth = 6; c.beginPath(); c.moveTo(14, 10); c.quadraticCurveTo(32, 2, 44, 20); c.stroke(); c.strokeStyle = '#d9c08e'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(28, 12); c.lineTo(34, 15); c.stroke(); },
    rod(c) { c.strokeStyle = '#a7774c'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(8, 42); c.quadraticCurveTo(26, 22, 40, 6); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(40, 6); c.lineTo(40, 34); c.stroke(); c.fillStyle = '#e8574f'; c.beginPath(); c.arc(40, 36, 4, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillRect(36, 36, 8, 4); c.fillStyle = '#c9a56a'; c.beginPath(); c.arc(13, 37, 4, 0, TAU); c.fill(); },
    campfire(c) { c.fillStyle = '#8f938c'; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; c.beginPath(); c.ellipse(24 + Math.cos(a) * 15, 32 + Math.sin(a) * 7, 5, 4, 0, 0, TAU); c.fill(); } c.fillStyle = '#8a5d3b'; rr(c, 12, 28, 24, 5, 2); c.fill(); c.fillStyle = '#ff8a3d'; c.beginPath(); c.moveTo(24, 6); c.quadraticCurveTo(36, 22, 30, 31); c.lineTo(18, 31); c.quadraticCurveTo(12, 22, 24, 6); c.fill(); c.fillStyle = '#ffe27a'; c.beginPath(); c.moveTo(24, 16); c.quadraticCurveTo(30, 25, 27, 31); c.lineTo(21, 31); c.quadraticCurveTo(18, 25, 24, 16); c.fill(); },
    leanto(c) { c.fillStyle = '#c8644a'; rr(c, 10, 32, 28, 8, 3); c.fill(); c.fillStyle = '#7da04d'; c.beginPath(); c.moveTo(4, 36); c.lineTo(24, 6); c.lineTo(44, 36); c.lineTo(36, 36); c.lineTo(24, 16); c.lineTo(12, 36); c.closePath(); c.fill(); c.strokeStyle = '#8a5d3b'; c.lineWidth = 3; c.beginPath(); c.moveTo(4, 40); c.lineTo(26, 4); c.moveTo(44, 40); c.lineTo(22, 4); c.stroke(); },
    raft(c) { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#9a6a43' : '#b07a4c'; rr(c, 6 + i * 7.5, 22, 7, 22, 3); c.fill(); } c.fillStyle = '#d8b67a'; c.fillRect(6, 27, 37, 2); c.fillRect(6, 38, 37, 2); c.strokeStyle = '#7a5032'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(24, 30); c.lineTo(24, 4); c.stroke(); c.fillStyle = '#f5ead2'; c.beginPath(); c.moveTo(25, 5); c.quadraticCurveTo(40, 12, 40, 26); c.lineTo(25, 26); c.fill(); }
  };
  const all = Object.keys(ITEMS).concat(['campfire', 'leanto', 'raft']);
  for (const id of all) {
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 96; const c = cvs.getContext('2d'); c.scale(2, 2);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(24, 42, 15, 3.5, 0, 0, TAU); c.fill();
    if (id === 'cookedFish') draw.fish(c, true); else if (id === 'cookedCrab') draw.crab(c, true); else draw[id](c, false);
    ICON[id] = cvs.toDataURL();
  }
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
