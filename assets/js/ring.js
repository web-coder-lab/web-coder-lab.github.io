// 3D coverflow ring for the screenshots page: drag, swipe, arrows, buttons, or tap a side screen to bring it forward.
document.querySelectorAll('[data-ring]').forEach(w => {
  const host = w.closest('[data-ring-host]') || w, ring = w.querySelector('.ring'), items = [...ring.children], n = items.length, step = 360 / n, cap = host.querySelector('.ring-cap');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rot = 0, R = 300, drag = null, moved = false, idle = 0, active = 0;
  function layout() {
    const mob = innerWidth < 700, iw = mob ? 168 : 224, ih = iw * 760 / 360;
    w.style.height = (ih + 120) + 'px';
    R = Math.round((iw / 2) / Math.tan(Math.PI / n) * 1.14);
    items.forEach((it, i) => { it.style.width = iw + 'px'; it.style.left = (-iw / 2) + 'px'; it.style.top = (-ih / 2 - 24) + 'px'; it.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
    paint();
  }
  function paint() {
    ring.style.transform = `translateZ(${-R}px) rotateY(${-rot}deg)`;
    active = ((Math.round(rot / step) % n) + n) % n;
    items.forEach((it, i) => it.classList.toggle('off', i !== active));
    const f = items[active].querySelector('figcaption'); if (cap && f) cap.innerHTML = f.innerHTML + `<small>${active + 1} / ${n}</small>`;
  }
  const go = i => { const cur = Math.round(rot / step); let d = (i - (((cur % n) + n) % n)); if (d > n / 2) d -= n; if (d < -n / 2) d += n; rot = (cur + d) * step; ring.style.transition = ''; paint(); };
  const next = d => { rot = (Math.round(rot / step) + d) * step; ring.style.transition = ''; paint(); idle = 1; };
  host.querySelector('[data-r=prev]').onclick = () => next(-1); host.querySelector('[data-r=next]').onclick = () => next(1);
  w.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') next(-1); if (e.key === 'ArrowRight') next(1); });
  w.addEventListener('pointerdown', e => { drag = { x: e.clientX, r: rot }; moved = false; ring.style.transition = 'none'; idle = 1; });
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) moved = true; rot = drag.r - dx * .32; paint(); });
  addEventListener('pointerup', () => { if (!drag) return; drag = null; ring.style.transition = ''; rot = Math.round(rot / step) * step; paint(); });
  ring.addEventListener('click', e => { const it = e.target.closest('.shot'); if (!it) return; const i = items.indexOf(it); if (moved || i !== active) { e.stopPropagation(); e.preventDefault(); if (!moved) { go(i); idle = 1; } } }, true);
  new ResizeObserver(layout).observe(w); layout();
  if (!reduce) setInterval(() => { if (!idle && !document.hidden && w.getBoundingClientRect().top < innerHeight && w.getBoundingClientRect().bottom > 0) next(1), idle = 0; }, 3800);
});
