// Scroll-linked zoom: blocks grow in as they arrive and soften as they leave. Plus soft 3D tilt on cards. Off with reduced motion.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  const SEL = '.phero, .sec h2, .sec > .lead, .bx, .rel, .stats, .tile, .facts, .cta, .fcard, .steps li, .big a, .cols3 > *, .ds li, .vlist li, .tw, .tabs, .md, .tree, .clone, .gal figure, .ring-wrap, details, .rows li, .prose > h2, .prose > p, .prose > ul, .prose > ol, .doc';
  const items = [];
  document.querySelectorAll(SEL).forEach(el => {
    if (el.closest('.stage, .chs, .app, .phone-dev, dialog, .ring, .hd, .ft')) return;
    if (el.parentElement && el.parentElement.closest('.zm')) return;
    el.classList.add('zm'); items.push(el);
  });
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), ease = t => 1 - Math.pow(1 - t, 3);
  let queued = false;
  function update() {
    queued = false; const H = innerHeight;
    for (const el of items) {
      const r = el.getBoundingClientRect(); if (r.bottom < -300 || r.top > H + 300) continue;
      const e = ease(clamp((H - r.top) / (H * .5))), x = clamp((r.bottom - H * .04) / (H * .38));
      el.style.setProperty('--zs', ((.9 + .1 * e) * (.94 + .06 * x)).toFixed(4));
      el.style.setProperty('--zy', ((1 - e) * 38).toFixed(1) + 'px');
      el.style.setProperty('--zo', (Math.min(1, .04 + e * 1.15) * (.18 + .82 * x)).toFixed(3));
    }
  }
  const q = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); update(); setTimeout(update, 400);
  // tilt: a gentle 3D lean toward the pointer on cards (desktop mouse only)
  document.querySelectorAll('.tile, .fcard, .rel').forEach(c => {
    c.classList.add('tilt3d');
    c.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg'); c.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg'); });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
}
