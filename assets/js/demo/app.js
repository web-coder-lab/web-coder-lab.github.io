// The NEXGUARD app replica: screens, state and interactions. One code path for real taps and the scripted tour.
import { sound } from '../sound.js';
const THEMES = [['black', 'Black'], ['white', 'White'], ['goldblack', 'Golden & Black'], ['goldwhite', 'Golden & White']];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createApp(root, hooks = {}) {
  const q = (s, r = root) => r.querySelector(s), qa = (s, r = root) => [...r.querySelectorAll(s)];
  const S = { stack: ['language'], monitor: true, grant: { notif: false, alerts: false, batt: false }, theme: 0, motion: !reduce, haptic: true, timers: [] };
  const later = (fn, ms) => S.timers.push(setTimeout(fn, ms));
  const clear = () => { S.timers.forEach(clearTimeout); S.timers = []; };
  const setBadge = (el, kind, text) => { el.className = 'a-badge ' + kind; el.textContent = text; };
  const pop = el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

  function layout() {
    qa('.scr').forEach(el => {
      const i = S.stack.indexOf(el.id.slice(2)), top = i === S.stack.length - 1;
      el.classList.toggle('on', top); el.classList.toggle('left', i >= 0 && !top && i === S.stack.length - 2);
    });
  }
  function renderHome() {
    const on = S.monitor, sh = q('#shield');
    sh.dataset.st = on ? 'active' : 'paused'; q('svg', sh).style.setProperty('--c', on ? 'var(--good)' : '#71717a');
    q('#h-t').textContent = on ? 'Monitoring Active' : 'Monitoring Paused';
    q('#h-d').textContent = on ? 'Monitoring notification delivery in background' : 'Notification monitoring is paused by user';
    setBadge(q('#b-mon'), on ? 'good' : 'warn', on ? 'Monitoring active' : 'Monitoring unavailable');
    setBadge(q('#b-acc'), S.grant.notif ? 'good' : 'alert', S.grant.notif ? 'Active' : 'Action Needed');
    setBadge(q('#b-bat'), S.grant.batt ? 'good' : 'warn', S.grant.batt ? 'Unrestricted' : 'Restricted');
    qa('[data-sw=monitor]').forEach(s => s.setAttribute('aria-checked', on));
  }
  function renderPerm() {
    for (const [k, id, off] of [['notif', 'pm-notif', 'alert'], ['alerts', 'pm-alerts', 'warn'], ['batt', 'pm-batt', 'warn']]) {
      const card = q('#' + id), b = q('.a-badge', card), g = S.grant[k];
      card.classList.toggle('done', g); setBadge(b, g ? 'good' : off, g ? 'Active' : 'Action Needed');
    }
    q('#finish').classList.toggle('dis', !S.grant.notif);
  }
  function applyTheme() {
    root.dataset.themeApp = THEMES[S.theme][0]; q('#th-n').textContent = THEMES[S.theme][1]; hooks.onTheme && hooks.onTheme(THEMES[S.theme][0]);
  }
  function applyMotion() { root.dataset.motion = S.motion ? 'on' : 'off'; qa('[data-sw=motion]').forEach(s => s.setAttribute('aria-checked', !S.motion)); }
  function openDiag() { q('#scrim').classList.add('on'); q('#dlg').classList.add('on'); runDiag(); }
  function closeDiag() { clear(); q('#scrim').classList.remove('on'); q('#dlg').classList.remove('on'); }
  function runDiag() {
    clear(); const rows = qa('.dg'), hb = q('#dg-state'), sp = q('#dg-spin');
    rows.forEach(r => r.classList.remove('on')); hb.style.visibility = 'hidden'; sp.hidden = false;
    later(() => { sp.hidden = true; }, 850);
    rows.forEach((r, i) => later(() => { r.classList.add('on'); sound.play('tap'); }, 950 + i * 420));
    later(() => { hb.style.visibility = 'visible'; pop(hb); sound.play('success'); }, 950 + rows.length * 420);
  }
  function setup({ stack = ['language'], grant = false, monitor = true, theme = 0 } = {}) {
    clear(); closeDiag(); root.classList.add('no-t');
    S.stack = stack; S.monitor = monitor; S.theme = theme; S.grant = { notif: grant, alerts: grant, batt: grant };
    qa('.a-langs li').forEach((l, i) => l.classList.toggle('sel', i === 0));
    qa('.ap').forEach(a => q('.a-sw', a).setAttribute('aria-checked', 'true')); filter('all');
    qa('.a-scroll').forEach(s => { s.scrollTop = 0; });
    layout(); renderHome(); renderPerm(); applyTheme();
    void root.offsetWidth; requestAnimationFrame(() => root.classList.remove('no-t'));
  }
  function filter(v) { qa('.ap-f button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); qa('.ap').forEach(a => { a.hidden = v !== 'all' && a.dataset.t !== v; }); }
  const push = n => { S.stack.push(n); layout(); sound.play('whoosh'); };
  const back = () => { if (S.stack.length > 1) { S.stack.pop(); layout(); sound.play('whoosh'); } };

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t || !root.contains(t)) return;
    if (e.isTrusted) { hooks.onUser && hooks.onUser(e); sound.wake(); if (S.haptic && navigator.vibrate) navigator.vibrate(8); }
    const a = t.dataset.act;
    if (a === 'lang') { qa('.a-langs li').forEach(l => l.classList.toggle('sel', l === t)); sound.play('tap'); }
    else if (a === 'lang-next') { push('perm'); }
    else if (a === 'back') back();
    else if (a === 'grant') { S.grant[t.dataset.k] = true; renderPerm(); renderHome(); pop(q('.a-badge', t.closest('.a-card'))); sound.play('success'); }
    else if (a === 'finish') { if (!S.grant.notif) return; S.stack = ['home']; layout(); renderHome(); sound.play('whoosh'); }
    else if (a === 'open-settings') push('settings');
    else if (a === 'open-apps') push('apps');
    else if (a === 'shield') { pop(q('#shield')); sound.play('pop'); }
    else if (a === 'start') { S.monitor = true; renderHome(); pop(q('#h-t')); sound.play('on'); }
    else if (a === 'stop') { S.monitor = false; renderHome(); pop(q('#h-t')); sound.play('off'); }
    else if (a === 'diag') { openDiag(); sound.play('tap'); }
    else if (a === 'diag-close') { closeDiag(); sound.play('tap'); }
    else if (a === 'theme') { S.theme = (S.theme + 1) % THEMES.length; applyTheme(); sound.play('pop'); }
    else if (a === 'sw') {
      const k = t.dataset.k;
      if (k === 'motion') { S.motion = !S.motion; applyMotion(); sound.play(S.motion ? 'off' : 'on'); }
      else if (k === 'haptic') { S.haptic = !S.haptic; qa('[data-sw=haptic]').forEach(s => s.setAttribute('aria-checked', S.haptic)); sound.play(S.haptic ? 'on' : 'off'); }
      else if (k === 'monitor') { S.monitor = !S.monitor; renderHome(); sound.play(S.monitor ? 'on' : 'off'); }
    }
    else if (a === 'filter') { filter(t.dataset.v); sound.play('tap'); }
    else if (a === 'app-sw') { const sw = q('.a-sw', t), v = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', v); sound.play(v ? 'on' : 'off'); }
  });
  applyMotion(); setup();
  return { setup, top: () => S.stack[S.stack.length - 1], get motion() { return S.motion; }, setMotion(v) { S.motion = v; applyMotion(); } };
}
