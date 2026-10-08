(() => {
  if (window.HTMLMediaElement) {
    document.querySelectorAll('audio,video').forEach(media => { media.muted = true; media.pause(); });
    window.HTMLMediaElement.prototype.play = function () { this.pause(); return Promise.resolve(); };
  }
  const siteRoot = new URL('../../', location.href).href;
  const style = document.createElement('style');
  style.textContent = `
    body{padding-top:48px!important}
    body button:not(.quickplay-bar button){border-radius:8px}
    .quickplay-bar{position:fixed;z-index:2147483000;inset:0 0 auto;height:44px;display:flex;align-items:center;gap:7px;padding:5px 10px;background:#101112f2;color:#dededb;font:12px/1.2 ui-monospace,Consolas,monospace;box-shadow:0 2px 12px #0008;border-bottom:1px solid #292d2e}
    .quickplay-bar .q-brand{font-weight:700;letter-spacing:-.03em;margin-right:auto;color:#aeb9bb;text-decoration:none}
    .quickplay-bar button,.quickplay-bar a{height:32px;padding:0 11px;border:1px solid #ffffff20;border-radius:2px;background:#ffffff06;color:#d7dbd9;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font:inherit;cursor:pointer}
    .quickplay-bar button:hover,.quickplay-bar a:hover{background:#ffffff24}
    .quickplay-bar .q-timer{color:#d9e3df;padding:0 4px;white-space:nowrap}.quickplay-bar .q-timer b{color:#ffd99a}
    .q-break,.q-pause{position:fixed;z-index:2147483001;inset:44px 0 0;background:#080909ed;color:#dededb;display:none;place-items:center;padding:20px;font:14px ui-monospace,Consolas,monospace}
    .q-break.on,.q-pause.on{display:grid}.q-break-card,.q-pause-card{width:min(420px,100%);padding:24px;background:#111314;color:#dededb;border:1px solid #373c3d;box-shadow:0 25px 70px #0008}.q-break-card h2,.q-pause-card h2{margin:0 0 7px}.q-break-card p,.q-pause-card p{color:#929899;margin:0 0 16px}.q-break-card button,.q-pause-card button{padding:10px 13px;border-radius:2px;border:1px solid #414748;background:#171a1b;color:#dededb;margin-right:7px;cursor:pointer}.q-break-card .q-primary{background:#333a3b;color:#fff;border-color:#646b6d}
    body.q-minimized>*:not(.quickplay-bar):not(.q-mini-notice){display:none!important}body.q-minimized{background:#0a0a0a!important}.q-mini-notice{position:fixed;z-index:2147482999;inset:44px 0 0;display:grid;place-items:center;background:#0a0a0a;color:#dededb;font:14px ui-monospace,Consolas,monospace}.q-mini-notice[hidden]{display:none!important}.q-mini-notice button{margin-left:8px;padding:9px 14px;border:1px solid #414748;border-radius:2px;background:#171a1b;color:#dededb;cursor:pointer}
    body.q-focused{padding-top:0!important}body.q-focused .quickplay-bar{inset:8px 8px auto auto;width:auto;border:0;background:transparent;box-shadow:none}body.q-focused .quickplay-bar>:not(#qFocus){display:none}body.q-focused .quickplay-bar #qFocus{background:#101112e8}
    @media(max-width:580px){.quickplay-bar{gap:4px;padding:5px}.quickplay-bar .q-brand{font-size:10px}.quickplay-bar button,.quickplay-bar a{padding:0 7px;font-size:11px}.quickplay-bar .q-timer{font-size:10px}}
  `;
  document.head.appendChild(style);
  const bar = document.createElement('nav');
  bar.className = 'quickplay-bar';
  bar.setAttribute('aria-label', 'Game controls');
  bar.innerHTML = '<a class="q-brand" href="' + siteRoot + '">lowkey.exe</a><span class="q-timer">break in <b id="qTimer">30:00</b></span><button id="qPause" type="button" aria-pressed="false">Pause</button><button id="qRestart" type="button">Restart</button><button id="qFocus" type="button" aria-pressed="false">Focus</button><button id="qMin" type="button" aria-expanded="false">Minimize</button><button id="qFull" type="button" aria-label="Toggle full screen">⛶</button><button id="qNew" type="button" aria-label="Open this game in a new tab">↗</button><a href="' + siteRoot + '" aria-label="Close game and return to games">Close</a>';
  document.body.appendChild(bar);
  const pauseScreen = document.createElement('div');
  pauseScreen.className = 'q-pause';
  pauseScreen.setAttribute('role', 'dialog');
  pauseScreen.setAttribute('aria-modal', 'true');
  pauseScreen.innerHTML = '<div class="q-pause-card"><h2>paused.exe</h2><p>take a breath. the break timer is still running.</p><button type="button">Resume</button></div>';
  document.body.appendChild(pauseScreen);
  const miniNotice = document.createElement('div');
  miniNotice.className = 'q-mini-notice';
  miniNotice.innerHTML = '<div>Game minimized <button type="button">Restore game</button></div>';
  miniNotice.hidden = true;
  document.body.appendChild(miniNotice);
  const breakScreen = document.createElement('div');
  breakScreen.className = 'q-break';
  breakScreen.setAttribute('role', 'alertdialog');
  breakScreen.setAttribute('aria-modal', 'true');
  breakScreen.innerHTML = '<div class="q-break-card"><h2>Time for a short break</h2><p>You have been playing for 30 minutes. Rest your eyes and stretch.</p><button class="q-primary" data-action="reset">Restart timer</button><button data-action="snooze">Snooze 15 minutes</button></div>';
  document.body.appendChild(breakScreen);
  document.getElementById('qRestart').addEventListener('click', () => {
    const selector = location.pathname.includes('/memory/') ? '#restart' : location.pathname.includes('/snake/') ? '#start' : location.pathname.includes('/tic/') ? '#restart' : location.pathname.includes('/2048/') ? '#restart-button' : null;
    const control = selector && document.querySelector(selector);
    if (control) control.click(); else location.reload();
  });
  const minButton = document.getElementById('qMin');
  function minimize(value) { document.body.classList.toggle('q-minimized', value); miniNotice.hidden = !value; minButton.textContent = value ? 'Restore' : 'Minimize'; minButton.setAttribute('aria-expanded', String(!value)); }
  minButton.addEventListener('click', () => minimize(!document.body.classList.contains('q-minimized')));
  miniNotice.querySelector('button').addEventListener('click', () => minimize(false));
  document.getElementById('qFull').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.());
  document.getElementById('qNew').addEventListener('click', () => window.open(location.href, '_blank', 'noopener,noreferrer'));
  const pauseButton = document.getElementById('qPause');
  function setPaused(value) {
    pauseScreen.classList.toggle('on', value);
    pauseButton.textContent = value ? 'Resume' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(value));
    if (location.pathname.includes('/memory/')) document.getElementById(value ? 'pause-btn' : 'resume-btn')?.click();
    if (location.pathname.includes('/tetris/')) document.getElementById('pause')?.click();
    if (location.pathname.includes('/emberfall/')) document.getElementById('btnPause')?.click();
    if (location.pathname.includes('/pacman/')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', code: 'End', keyCode: 35, which: 35, bubbles: true }));
    document.dispatchEvent(new CustomEvent('gamehub:pause', { detail: { paused: value } }));
  }
  pauseButton.addEventListener('click', () => setPaused(!pauseScreen.classList.contains('on')));
  pauseScreen.querySelector('button').addEventListener('click', () => setPaused(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && pauseScreen.classList.contains('on')) setPaused(false); });
  const focusButton = document.getElementById('qFocus');
  focusButton.addEventListener('click', () => {
    const focused = document.body.classList.toggle('q-focused');
    focusButton.textContent = focused ? 'Exit focus' : 'Focus';
    focusButton.setAttribute('aria-pressed', String(focused));
  });

  if (!localStorage.getItem('quickplayStart')) localStorage.setItem('quickplayStart', String(Date.now()));
  if (!localStorage.getItem('quickplayNext')) localStorage.setItem('quickplayNext', String(Date.now() + 30 * 60 * 1000));
  let remaining = 0;
  function updateTimer() {
    const start = Number(localStorage.getItem('quickplayStart') || Date.now());
    const next = Number(localStorage.getItem('quickplayNext') || start + 30 * 60 * 1000);
    remaining = Math.max(0, next - Date.now());
    document.getElementById('qTimer').textContent = Math.floor(remaining / 60000) + ':' + String(Math.floor(remaining % 60000 / 1000)).padStart(2, '0');
    if (!remaining) breakScreen.classList.add('on');
  }
  breakScreen.querySelector('[data-action="snooze"]').addEventListener('click', () => { localStorage.setItem('quickplayNext', String(Date.now() + 15 * 60 * 1000)); breakScreen.classList.remove('on'); updateTimer(); });
  breakScreen.querySelector('[data-action="reset"]').addEventListener('click', () => { localStorage.setItem('quickplayStart', String(Date.now())); localStorage.setItem('quickplayNext', String(Date.now() + 30 * 60 * 1000)); breakScreen.classList.remove('on'); updateTimer(); });
  addEventListener('storage', updateTimer);
  updateTimer();
  setInterval(updateTimer, 1000);
})();
