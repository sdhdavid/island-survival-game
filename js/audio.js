"use strict";
// ================= Audio =================
const AU = { ctx: null, muted: false };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)(); AU.ctx = C;
    AU.master = C.createGain(); AU.master.gain.value = AU.muted ? 0 : .8; AU.master.connect(C.destination);
    const len = C.sampleRate * 4;
    const brown = C.createBuffer(1, len, C.sampleRate), bd = brown.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; bd[i] = last * 3.2; }
    const white = C.createBuffer(1, len, C.sampleRate), wd = white.getChannelData(0); for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;
    AU.white = white;
    const src = C.createBufferSource(); src.buffer = brown; src.loop = true;
    const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const waveG = C.createGain(); waveG.gain.value = .55;
    const lfo = C.createOscillator(); lfo.frequency.value = .11; const lfoG = C.createGain(); lfoG.gain.value = .4; lfo.connect(lfoG); lfoG.connect(waveG.gain); lfo.start();
    AU.ocean = C.createGain(); AU.ocean.gain.value = .1;
    src.connect(lp); lp.connect(waveG); waveG.connect(AU.ocean); AU.ocean.connect(AU.master); src.start();
    const rs = C.createBufferSource(); rs.buffer = white; rs.loop = true;
    const hp = C.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
    const lp2 = C.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 7000;
    AU.rain = C.createGain(); AU.rain.gain.value = 0;
    rs.connect(hp); hp.connect(lp2); lp2.connect(AU.rain); AU.rain.connect(AU.master); rs.start();
  } catch (e) { AU.ctx = null; }
}
function tone(f, dur, type = 'sine', vol = .15, slide = 0, delay = 0) {
  const C = AU.ctx; if (!C || AU.muted) return;
  const t = C.currentTime + delay, o = C.createOscillator(), g = C.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + .05);
}
function noise(dur, vol, freq, type = 'lowpass', delay = 0, q = 1) {
  const C = AU.ctx; if (!C || AU.muted) return;
  const t = C.currentTime + delay, s = C.createBufferSource(); s.buffer = AU.white;
  const f = C.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = C.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random() * 3); s.stop(t + dur + .05);
}
const SFX = {
  pop() { tone(520, .12, 'sine', .14, 380); },
  chop() { noise(.12, .35, 900, 'bandpass', 0, 2); tone(140, .1, 'triangle', .14, -50); },
  mine() { noise(.08, .3, 2600, 'bandpass', 0, 4); tone(900, .07, 'square', .04, -300); },
  craft() { [523, 659, 784].forEach((f, i) => tone(f, .22, 'triangle', .12, 0, i * .08)); },
  quest() { [587, 740, 880, 1175].forEach((f, i) => tone(f, .4, 'sine', .11, 0, i * .11)); },
  eat() { tone(260, .08, 'square', .05, -60); tone(220, .09, 'square', .05, -60, .1); },
  drink() { [0, .12, .24].forEach(d => tone(380 + Math.random() * 80, .1, 'sine', .1, 260, d)); },
  splash() { noise(.35, .25, 1200, 'lowpass'); },
  bite() { tone(880, .08, 'square', .06); tone(1100, .1, 'square', .06, 0, .09); },
  crate() { noise(.2, .3, 500, 'lowpass'); [392, 523, 659, 784].forEach((f, i) => tone(f, .3, 'triangle', .09, 0, .1 + i * .07)); },
  sizzle() { noise(.6, .12, 4000, 'highpass'); },
  crackle() { noise(.03, .12 + Math.random() * .1, 2500 + Math.random() * 2000, 'bandpass', 0, 3); },
  chirp() { const b = 2200 + Math.random() * 1200; for (let i = 0; i < 2 + (Math.random() * 3 | 0); i++) tone(b, .09, 'sine', .035, 700, i * .12); },
  cricket() { for (let i = 0; i < 3; i++) tone(4300, .03, 'square', .012, 0, i * .05); },
  hurt() { tone(200, .2, 'sawtooth', .05, -90); },
  place() { noise(.15, .3, 400); tone(196, .2, 'triangle', .12, 0, .05); }
};
