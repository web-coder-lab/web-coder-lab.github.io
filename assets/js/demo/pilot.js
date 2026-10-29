// The "pilot": a visible finger that taps the real buttons of the replica. Cancel-safe via a token.
const CANCEL = Symbol('cancel');

export function createPilot(app, root) {
  const finger = root.querySelector('#finger'), q = s => root.querySelector(s);
  let tok = 0, fx = 180, fy = 720;
  const scaleOf = () => root.getBoundingClientRect().width / 360;

  function helpers(my) {
    const alive = () => { if (my !== tok) throw CANCEL; };
    const wait = ms => new Promise(r => setTimeout(r, ms)).then(alive);
    async function scrollTo(scrollSel, targetSel, offset = 150) {
      const sc = q(scrollSel), el = q(targetSel); if (!sc || !el) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - offset;
      sc.scrollTo({ top: Math.max(0, top), behavior: app.motion ? 'smooth' : 'auto' }); await wait(app.motion ? 900 : 100);
    }
    async function tap(sel) {
      const el = q(sel); if (!el) return; alive();
      const sc = el.closest('.a-scroll');
      if (sc) { const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect(); if (r.bottom > s.bottom - 10 || r.top < s.top + 10) await scrollTo('#' + sc.id, sel); }
      const a = root.getBoundingClientRect(), r = el.getBoundingClientRect(), k = scaleOf();
      const x = (r.left - a.left + r.width / 2) / k, y = (r.top - a.top + r.height / 2) / k;
      finger.classList.add('show');
      const anim = finger.animate([{ transform: `translate(${fx}px,${fy}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: app.motion ? 560 : 1, easing: 'cubic-bezier(.2,0,0,1)', fill: 'forwards' });
      await anim.finished.catch(() => {}); alive(); fx = x; fy = y;
      finger.classList.add('down'); await wait(110); el.click(); await wait(130); finger.classList.remove('down');
    }
    return { wait, tap, scrollTo, alive };
  }
  return {
    async run(fn) { const my = ++tok; try { await fn(helpers(my)); } catch (e) { if (e !== CANCEL) throw e; } },
    cancel() { tok++; finger.classList.remove('show', 'down'); finger.getAnimations().forEach(a => a.cancel()); },
    resetFinger() { fx = 180; fy = 720; },
  };
}
