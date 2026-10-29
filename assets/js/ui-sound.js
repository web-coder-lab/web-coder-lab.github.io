// Site-wide sound toggle (header button) and soft click sounds on links and buttons. Off by default.
import { sound } from './sound.js';
const btn = document.getElementById('gsnd');
const ON = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>';
const OFF = btn ? btn.innerHTML : '';
function paint() { if (!btn) return; const on = sound.enabled; btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Turn sound effects off' : 'Turn sound effects on'); btn.innerHTML = on ? ON : OFF; }
if (sound.remembered()) sound.enable(true);
paint(); addEventListener('ng-sound', paint);
if (btn) btn.onclick = () => { sound.enable(!sound.enabled); if (sound.enabled) sound.play('success'); };
document.addEventListener('click', e => { if (!sound.enabled || e.target.closest('.app') || e.target.closest('#gsnd')) return; if (e.target.closest('a,button')) { sound.wake(); sound.play('tap'); } }, true);
document.addEventListener('pointerdown', () => sound.wake(), { once: true });
