// Pinned scroll story: one live app replica whose screen, 3D pose and finger taps follow the chapter in view.
import { createApp } from './demo/app.js';
import { createPilot } from './demo/pilot.js';

const host = document.querySelector('[data-stage]');
if (host) {
  const stage = host.querySelector('.stage'), root = host.querySelector('.app'), fit = host.querySelector('.phone-fit'), rot = host.querySelector('.phone-rot'), dev = host.querySelector('.phone-dev');
  const chs = [...host.querySelectorAll('.ch')], reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const app = createApp(root, { onUser: () => pilot.cancel(), onTheme: n => dev.style.setProperty('--sb', n === 'white' || n === 'goldwhite' ? '#111' : '#fff') });
  const pilot = createPilot(app, root);
  const ALL = { grant: true }, SET = { stack: ['home', 'settings'], ...ALL };
  const D = [[-20, 8], [-12, 4], [-7, 2], [-15, 4], [-9, 5], [-18, 6], [-6, 3], [-22, 8]];   // pose per chapter: rotateY, rotateX
  const scenes = [
    { start: { stack: ['home'], ...ALL }, run: async h => { await h.wait(1400); await h.tap('#shield'); } },
    { start: { stack: ['home'], ...ALL }, run: async h => { await h.wait(700); await h.tap('#s-home [data-act=stop]'); await h.wait(1400); await h.tap('#s-home [data-act=start]'); } },
    { start: { stack: ['home'], ...ALL }, run: async h => { await h.wait(600); await h.tap('#s-home [data-act=diag]'); } },
    { start: SET, run: async h => { await h.wait(500); await h.scrollTo('#st-scroll', '#st-batt', 70); } },
    { start: SET, run: async h => { await h.wait(500); await h.scrollTo('#st-scroll', '#st-mon', 70); } },
    { start: SET, run: async h => { await h.wait(700); for (let i = 0; i < 2; i++) { await h.tap('#s-settings [data-act=theme]'); await h.wait(1100); } } },
    { start: { stack: ['home', 'settings', 'apps'], ...ALL }, run: async h => { await h.wait(900); await h.tap('#s-apps .ap'); await h.wait(800); await h.tap('#s-apps [data-v=user]'); } },
    { start: { stack: ['home'], ...ALL }, run: async h => { await h.wait(1200); await h.tap('#shield'); } },
  ];
  let cur = -1, mx = 0, my = 0;
  const mobile = () => innerWidth < 900;
  function pose() {
    const k = mobile() ? .45 : 1, [ry, rx] = D[Math.max(0, cur)];
    rot.style.transform = `rotateY(${ry * k + mx * 5 * k}deg) rotateX(${rx * k - my * 4 * k}deg)`;
  }
  function fitPhone() {
    const s = mobile() ? Math.min(.62, (innerHeight * .5) / 812) : Math.min(1, (innerHeight - 130) / 812);
    fit.style.setProperty('--s', Math.max(.45, s).toFixed(3));
  }
  function go(i) {
    if (i === cur) return; cur = i; stage.dataset.ch = i; chs.forEach((c, j) => c.classList.toggle('on', j === i)); pose();
    pilot.cancel(); app.setup(scenes[i].start); pilot.resetFinger();
    if (!reduce) pilot.run(async h => { await h.wait(450); await scenes[i].run(h); });
  }
  addEventListener('resize', fitPhone); fitPhone();
  if (!reduce) addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || mobile()) return; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; pose(); }, { passive: true });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) go(chs.indexOf(e.target)); }), { rootMargin: '-46% 0px -46% 0px' });
  chs.forEach(c => io.observe(c)); go(0);
}
