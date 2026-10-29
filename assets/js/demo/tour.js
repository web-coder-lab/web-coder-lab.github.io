// Scripted tour for the /demo/ page: seven chapters played by the pilot.
import { createPilot } from './pilot.js';
const ALL = { grant: true };

export function createTour(app, root, ui) {
  const pilot = createPilot(app, root);
  let playing = false, idx = 0;
  const chapters = [
    { t: 'Choose your language', d: 'On first launch you pick a language. You can change it later in Settings.', start: { stack: ['language'] },
      run: async h => { await h.wait(900); await h.tap('#s-language li:nth-child(2)'); await h.wait(450); await h.tap('#s-language li:nth-child(1)'); await h.wait(450); await h.tap('[data-act=lang-next]'); } },
    { t: 'Grant what it needs', d: 'Notification access is required, because Android only lets an app see notifications if you allow it. In the real app, Grant opens Android\'s own settings.', start: { stack: ['language', 'perm'] },
      run: async h => { await h.wait(800); await h.tap('#pm-notif .a-btn'); await h.wait(450); await h.tap('#pm-alerts .a-btn'); await h.wait(450); await h.tap('#pm-batt .a-btn'); await h.wait(700); await h.tap('#finish'); await h.wait(500); } },
    { t: 'See the status', d: 'Notification access, monitoring state and battery policy, as Android reports them.', start: { stack: ['home'], ...ALL },
      run: async h => { await h.wait(700); await h.tap('#shield'); await h.wait(2000); } },
    { t: 'Pause and resume', d: 'Stop and start monitoring with one tap. The shield and the status change with it.', start: { stack: ['home'], ...ALL },
      run: async h => { await h.wait(400); await h.tap('#s-home [data-act=stop]'); await h.wait(1700); await h.tap('#s-home [data-act=start]'); await h.wait(1200); } },
    { t: 'Run diagnostics', d: 'Checks what the app is able to check. For battery rules it shows guidance for your phone brand, here an OPPO example.', start: { stack: ['home'], ...ALL },
      run: async h => { await h.wait(400); await h.tap('#s-home [data-act=diag]'); await h.wait(3800); await h.tap('#dlg [data-act=diag-close]'); await h.wait(600); } },
    { t: 'Make it yours', d: 'Four themes, plus reduced motion and haptic feedback.', start: { stack: ['home', 'settings'], ...ALL },
      run: async h => { if (app.top() === 'home') { await h.tap('#s-home [data-act=open-settings]'); } await h.wait(800); for (let i = 0; i < 4; i++) { await h.tap('#s-settings [data-act=theme]'); await h.wait(1150); } } },
    { t: 'Pick which apps', d: 'Switch monitoring on or off per app, and filter by user or system apps. These sample apps are not real.', start: { stack: ['home', 'settings'], ...ALL },
      run: async h => { if (app.top() === 'home') await h.tap('#s-home [data-act=open-settings]'); await h.wait(500); await h.scrollTo('#st-scroll', '#st-apps'); await h.tap('#st-apps'); await h.wait(800);
        await h.tap('#s-apps .ap'); await h.wait(700); await h.tap('#s-apps [data-v=user]'); await h.wait(1000); await h.tap('#s-apps [data-v=all]'); await h.wait(700); await h.tap('#s-apps [data-act=back]'); await h.wait(600); } },
  ];

  async function runFrom(i, jump) {
    playing = true; ui.state(true);
    await pilot.run(async h => {
      for (let k = i, first = true; ; k = (k + 1) % chapters.length, first = false) {
        idx = k; ui.chapter(k, chapters[k]);
        if ((first && jump) || k === 0) { app.setup(chapters[k].start); pilot.resetFinger(); await h.wait(350); }
        await chapters[k].run(h); await h.wait(700);
        if (k === chapters.length - 1) await h.wait(1600);
      }
    });
  }
  function pause() { pilot.cancel(); playing = false; ui.state(false); }
  return {
    chapters, get playing() { return playing; },
    goto(i) { pause(); runFrom(i, true); },
    pause, replay() { this.goto(0); },
  };
}
