// Headline reveal: words rise in one by one. Keeps inline spans (like the gradient word).
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('[data-kinetic]').forEach(h => {
  h.setAttribute('aria-label', h.textContent.trim().replace(/\s+/g, ' ')); let i = 0;
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) { f.append(w); return; } const s = document.createElement('span'); s.className = 'wd'; s.setAttribute('aria-hidden', 'true'); s.style.animationDelay = (i++ * 90) + 'ms'; s.textContent = w; f.append(s); });
      c.replaceWith(f);
    } else if (c.nodeType === 1) walk(c);
  });
  walk(h);
});
