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
    .quickplay-bar{position:fixed;z-index:2147483000;inset:0 0 auto;height:44px;display:flex;align-items:center;gap:7px;padding:5px 10px;background:#18262bef;color:#f8f7f1;font:12px/1.2 system-ui,sans-serif;box-shadow:0 2px 9px #0002}
    .quickplay-bar .q-brand{font-weight:800;letter-spacing:.02em;margin-right:auto;color:#f0b768;text-decoration:none}
    .quickplay-bar button,.quickplay-bar a{height:32px;padding:0 11px;border:1px solid #ffffff30;border-radius:7px;background:#ffffff0e;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font:inherit;cursor:pointer}
    .quickplay-bar button:hover,.quickplay-bar a:hover{background:#ffffff24}
    .quickplay-bar .q-timer{color:#d9e3df;padding:0 4px;white-space:nowrap}.quickplay-bar .q-timer b{color:#ffd99a}
    .q-break{position:fixed;z-index:2147483001;inset:44px 0 0;background:#101a1dd9;color:#fff;display:none;place-items:center;padding:20px;font:16px system-ui,sans-serif}
    .q-break.on{display:grid}.q-break-card{width:min(420px,100%);padding:24px;background:#fff;color:#17242a;border-radius:15px;box-shadow:0 25px 70px #0005}.q-break-card h2{margin:0 0 7px}.q-break-card p{color:#66757b;margin:0 0 16px}.q-break-card button{padding:10px 13px;border-radius:8px;border:1px solid #cbd3d0;background:#fff;color:#17242a;margin-right:7px;cursor:pointer}.q-break-card .q-primary{background:#337c68;color:#fff;border-color:#337c68}
    body.q-minimized>*:not(.quickplay-bar):not(.q-mini-notice){display:none!important}body.q-minimized{background:#f1f3f1!important}.q-mini-notice{position:fixed;z-index:2147482999;inset:44px 0 0;display:grid;place-items:center;background:#f1f3f1;color:#17242a;font:15px system-ui,sans-serif}.q-mini-notice[hidden]{display:none!important}.q-mini-notice button{margin-left:8px;padding:9px 14px;border:0;border-radius:8px;background:#337c68;color:#fff;cursor:pointer}
    @media(max-width:580px){.quickplay-bar{gap:4px;padding:5px}.quickplay-bar .q-brand{font-size:10px}.quickplay-bar button,.quickplay-bar a{padding:0 7px;font-size:11px}.quickplay-bar .q-timer{font-size:10px}}
  `;
  document.head.appendChild(style);
  const bar = document.createElement('nav');
  bar.className = 'quickplay-bar';
  bar.setAttribute('aria-label', 'Game controls');
  bar.innerHTML = '<a class="q-brand" href="' + siteRoot + '">bored. rn !!</a><span class="q-timer">Break in <b id="qTimer">30:00</b></span><button id="qRestart" type="button">Restart</button><button id="qMin" type="button" aria-expanded="false">Minimize</button><button id="qFull" type="button" aria-label="Toggle full screen">⛶</button><button id="qNew" type="button" aria-label="Open this game in a new tab">↗</button><a href="' + siteRoot + '" aria-label="Close game and return to games">Close</a>';
  document.body.appendChild(bar);
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
