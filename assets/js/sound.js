// Click and effect sounds, synthesized with the Web Audio API (no audio files). Off by default; needs a user gesture.
const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null, enabled = false;
const ensure = () => { if (!AC) return false; if (!ctx) ctx = new AC(); if (ctx.state === 'suspended') ctx.resume(); return true; };
function tone(f1, f2, dur, gain = .07, type = 'sine', delay = 0) {
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + .006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
}
function whoosh() {
  const t = ctx.currentTime, n = Math.floor(ctx.sampleRate * .28), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + .26);
  g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .28);
  s.connect(f).connect(g).connect(ctx.destination); s.start(t);
}
const FX = {
  tap: () => tone(1100, 720, .035, .07, 'triangle'),
  pop: () => tone(520, 940, .08, .07),
  on: () => tone(520, 820, .1, .08),
  off: () => tone(820, 500, .1, .07),
  success: () => { tone(660, 660, .09, .07); tone(990, 990, .16, .07, 'sine', .09); },
  whoosh,
};
export const sound = {
  get enabled() { return enabled; },
  enable(v) { enabled = !!v; if (enabled) ensure(); try { localStorage.setItem('ng-sound', enabled ? '1' : '0'); } catch (e) {} dispatchEvent(new Event('ng-sound')); },
  wake() { if (enabled) ensure(); },
  play(name) { if (enabled && ctx && FX[name]) FX[name](); },
  remembered() { try { return localStorage.getItem('ng-sound') === '1'; } catch (e) { return false; } },
};
