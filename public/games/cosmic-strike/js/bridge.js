/* Adaptation layer for the supplied Cosmic Strike engine. No menu / mobile controls. */
const Main = (() => {
  const keys = new Set();
  let mouse = false, boost = false, special = false;
  function clear() { keys.clear(); mouse = false; boost = false; special = false; }
  window.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
    if (e.repeat && ['p','P','r','R','Shift'].includes(e.key)) return;
    keys.add(e.key.toLowerCase());
    if (e.key === 'Shift') boost = true;
    if (e.key.toLowerCase() === 'e' && !e.repeat) special = true;
    if (e.key.toLowerCase() === 'p') Bridge.togglePause();
    if (e.key.toLowerCase() === 'r') Bridge.send('restart');
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clear(); if (Game.getState() === 'playing') Bridge.manualPause(); } });
  document.getElementById('game-canvas').addEventListener('mousedown', e => { if (e.button === 0) { mouse = true; Audio2.resume(); } });
  window.addEventListener('mouseup', () => { mouse = false; });
  return {
    clear,
    getInput() {
      const input = { moveX: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')), moveY: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')), firing: mouse || keys.has(' '), boostPressed: boost, specialPressed: special };
      boost = false; special = false; return input;
    },
  };
})();

const Bridge = (() => {
  let run = null, externalPaused = false, sound = false, lastPublish = 0, hintUntil = 0;
  let best = Storage.load().highScore || 0;
  const send = (action, extra = {}) => parent.postMessage({ channel: 'little-cosmic', action, seed: run?.seed, ...extra }, location.origin);
  function publish(message, force = false) {
    if (!run || (!force && performance.now() - lastPublish < 200)) return;
    lastPublish = performance.now();
    const p = Game.currentPlayer(), state = Game.getState();
    best = Math.max(best, Game.score);
    document.getElementById('hud-best').textContent = `BEST ${best.toLocaleString()}`;
    send('stats', { stats: { score: Game.score, best, lives: p?.alive ? 1 : 0, remaining: 0, total: run.size, powerSeconds: p?.invuln || 0, state: state === 'gameover' ? (p?.alive ? 'won' : 'lost') : state, canHelp: state === 'playing' && !externalPaused, progress: `${document.getElementById('wave-label').textContent} · Hull ${Math.ceil(p?.hp || 0)}`, message: message || (state === 'paused' ? 'Paused' : 'Clear the waves, then defeat the boss') } });
  }
  function manualPause() { Main.clear(); Game.pause(); publish('Paused', true); }
  function togglePause() {
    if (externalPaused) return;
    Main.clear();
    if (Game.getState() === 'paused') Game.resume(); else Game.pause();
    publish('', true);
  }
  document.getElementById('pause-btn').onclick = togglePause;
  document.getElementById('resume-btn').onclick = togglePause;
  document.getElementById('mute').onclick = () => {
    sound = !sound; Audio2.resume(); Audio2.setMusicVolume(sound ? 25 : 0); Audio2.setSfxVolume(sound ? 50 : 0);
    document.getElementById('mute').textContent = sound ? 'Sound on' : 'Sound off';
  };
  window.addEventListener('message', e => {
    if (e.source !== parent || e.origin !== location.origin || e.data?.channel !== 'little-cosmic') return;
    const data = e.data;
    if (data.action === 'start') {
      if (!Number.isInteger(data.seed) || ![3,5,7].includes(data.size) || !Number.isInteger(data.level)) return;
      run = { seed: data.seed, size: data.size, level: Math.max(1, data.level) };
      Main.clear(); hintUntil = 0;
      const save = Storage.defaultSave();
      save.highScore = best; save.unlockedLevel = 1 + (run.level - 1) % 6;
      // Rotate the original weapons between missions, with repeatable starting equipment.
      save.selectedWeapon = ['laser','double','triple','spread','plasma','missile','beam','energy'][Math.floor((run.level - 1) / 6) % 8];
      save.selectedShip = ['scout','fighter','tank','interceptor'][Math.floor((run.level - 1) / 6) % 4];
      save.weaponLevels[save.selectedWeapon] = 1;
      Levels.SECTORS.forEach(sec => { sec.waves = run.size; });
      Game.setSave(save); Game.setMission(run.seed, run.level); Game.startRun('story');
      Audio2.setMusicVolume(sound ? 25 : 0); Audio2.setSfxVolume(sound ? 50 : 0);
      if (externalPaused) Game.pause();
      publish('', true); document.getElementById('game-canvas').focus();
    }
    if (data.action === 'pause') { externalPaused = true; manualPause(); document.getElementById('resume-btn').disabled = true; document.getElementById('pause-copy').textContent = 'Use the break controls above to continue.'; }
    if (data.action === 'resume') { externalPaused = false; Main.clear(); document.getElementById('resume-btn').disabled = false; document.getElementById('pause-copy').textContent = 'Catch your breath.'; Game.resume(); publish('', true); }
    if (!externalPaused && Game.getState() === 'playing') {
      if (data.action === 'shield') { Game.currentPlayer().invuln = Math.max(Game.currentPlayer().invuln, 4); publish('Shield active for 4 seconds', true); }
      if (data.action === 'hint') { hintUntil = performance.now() + 5000; document.getElementById('guidance').textContent = Bosses.boss ? 'BOSS: fire from below, move sideways through gaps, and boost away from missiles.' : 'Lead your shots into approaching ships. Move sideways against aimed fire; collect blue shield pickups.'; }
    }
    if (data.action === 'destroy') { Main.clear(); Game.quitToMenu(); }
  });
  return { send, publish, manualPause, togglePause, get hintUntil() { return hintUntil; } };
})();

const UI = {
  hideGameOver() { document.getElementById('result').classList.remove('active'); },
  showGameOver(stats, won) {
    document.getElementById('result-title').textContent = won ? 'SECTOR CLEARED' : 'MISSION FAILED';
    document.getElementById('result-copy').textContent = `Score ${stats.score.toLocaleString()} · Accuracy ${stats.accuracy}% · Time ${stats.timeStr}`;
    document.getElementById('result').classList.add('active');
    Bridge.publish(won ? 'Sector cleared' : 'Hull destroyed — restart to retry', true);
    if (won) Bridge.send('solved');
  },
  checkAchievements() {},
  showLevelToast(text) { document.getElementById('wave-label').textContent = text; },
  // Spawn immediately so a timeout cannot advance the fight during a shared break.
  showBossWarning(callback) { callback(); },
  updateHud(p, score, combo, wave, active, name, percent) {
    document.getElementById('hp-fill').style.width = `${100 * p.hp / p.maxHp}%`;
    document.getElementById('hp-label').textContent = Math.ceil(p.hp);
    document.getElementById('shield-fill').style.width = `${100 * p.shield / p.maxShield}%`;
    document.getElementById('energy-fill').style.width = `${100 * p.energy / p.energyMax}%`;
    document.getElementById('loadout').textContent = `${p.def.name} · ${p.weaponId.toUpperCase()} · ${p.energy >= p.energyMax ? 'E: SPECIAL READY' : 'SPECIAL CHARGING'}`;
    document.getElementById('hud-score').textContent = score.toLocaleString();
    document.getElementById('hud-combo').textContent = `×${combo}`;
    document.getElementById('wave-label').textContent = wave;
    document.getElementById('boss-bar-wrap').hidden = !active;
    document.getElementById('boss-name').textContent = name;
    document.getElementById('boss-fill').style.width = `${Math.max(0, percent) * 100}%`;
    if (performance.now() > Bridge.hintUntil) document.getElementById('guidance').textContent = p.invuln > 1 ? 'SHIELD ACTIVE — keep firing' : 'WASD / arrows move · Space or click fires · Shift boosts · E uses charged special';
    Bridge.publish();
  },
};
document.addEventListener('DOMContentLoaded', () => { Game.init(document.getElementById('game-canvas')); Audio2.setMusicVolume(0); Audio2.setSfxVolume(0); Bridge.send('ready'); });
