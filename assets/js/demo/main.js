// Wires the demo player: scaling, controls, chapters, captions, autoplay when visible, and sound.
import { sound } from '../sound.js';
import { createApp } from './app.js';
import { createTour } from './tour.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICON = {};
document.querySelectorAll('[data-demo]').forEach(init);

function init(host) {
  const $ = s => host.querySelector(s), root = $('.app'), fit = $('.phone-fit'), stage = $('.demo-stage');
  const play = $('#play'), snd = $('#snd'), chap = [...host.querySelectorAll('#chap button')], cap = $('#cap'), dev = $('.phone-dev');
  const ico = b => b.innerHTML; ICON.pause = ico(play); ICON.speakerOff = ico(snd);
  const app = createApp(root, {
    onUser: () => tour.pause(),
    onTheme: n => dev.style.setProperty('--sb', n === 'white' || n === 'goldwhite' ? '#111' : '#fff'),
  });
  const tour = createTour(app, root, {
    state: on => { play.setAttribute('aria-label', on ? 'Pause tour' : 'Play tour'); play.dataset.on = on ? '1' : '0'; play.innerHTML = on ? ICON.pause : ICON.play; },
    chapter: (i, c) => { chap.forEach((b, j) => { if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); cap.innerHTML = `<b>${c.t}</b>${c.d}`; },
  });
  // inline icon markup used when the buttons switch state
  ICON.play = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
  ICON.on = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>';

  function fitPhone() {
    const w = stage.clientWidth || 380, s = Math.max(.5, Math.min(1, w / 380, (innerHeight - 100) / 812));
    fit.style.setProperty('--s', s.toFixed(3));
  }
  new ResizeObserver(fitPhone).observe(stage); addEventListener('resize', fitPhone); fitPhone();

  play.onclick = () => { sound.wake(); tour.playing ? tour.pause() : tour.goto(Math.max(0, chap.findIndex(b => b.getAttribute('aria-current') === 'true'))); };
  $('#replay').onclick = () => { sound.wake(); tour.replay(); };
  chap.forEach((b, i) => b.onclick = () => { sound.wake(); tour.goto(i); });
  function paintSound() { const on = sound.enabled; snd.setAttribute('aria-pressed', on); snd.setAttribute('aria-label', on ? 'Sound effects on' : 'Sound effects off'); snd.innerHTML = on ? ICON.on : ICON.speakerOff; }
  snd.onclick = () => { sound.enable(!sound.enabled); if (sound.enabled) sound.play('success'); };
  addEventListener('ng-sound', paintSound);
  if (sound.remembered()) { sound.enable(true); } paintSound();
  tour.chapters && (cap.innerHTML = `<b>${tour.chapters[0].t}</b>${tour.chapters[0].d}`);
  tour.pause(); chap[0].setAttribute('aria-current', 'true');

  let started = false;
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !started && !reduce) { started = true; tour.goto(0); }
    else if (!e.isIntersecting && tour.playing) { tour.pause(); started = false; }
  }), { threshold: .55 }).observe(fit);
}
