import { createGameController, type GameController } from "../controller";
import { games } from "../../data/games";

import type { ArcadeStats, Run } from "./run";

const levelKey = (id: string) => `little-puzzles:${id}:level`;
const sizeKey = (id: string) => `little-puzzles:${id}:size`;
const mixKey = (id: string) => `little-puzzles:${id}:mix`;
const difficultyKey = (id: string) => `little-puzzles:${id}:difficulty`;
const lockKey = "little-puzzles:play-lock-until";
const sessionTimeKey = "little-puzzles:play-minutes";
const breakDueKey = "little-puzzles:break-due";

function seedFor(id: string, level: number, size: number, difficulty = 1) {
  let hash = 2166136261;
  for (const char of `${id}:${level}:${size}:${difficulty}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0 || 1;
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function mountGame(root: HTMLElement, gameId: string) {
  const gameInfo = games.find((item) => item.id === gameId);
  if (!gameInfo) throw new Error(`Unknown game: ${gameId}`);
  const pacman = gameId === "pacman";
  const sizeText = (value: number) => {
    if (["connect-four", "tic-tac-toe", "snake-ladder", "ludo", "chess"].includes(gameId)) return ["Casual", "Smart", "Expert"][value - 1];
    if (["pacman", "2048", "slide-puzzle", "link"].includes(gameId)) return `${value} × ${value}`;
    if (gameId === "memory") return value === 5 ? "4 × 5 cards" : `${value} × ${value} cards`;
    const labels: Record<string, string> = { "cosmic-strike": "waves + boss", "trench-defence": "waves", "color-match": "colors", "typing-speed": "words", "words-of-wonder": "words", tetris: "lines", snake: "fruit", "fruit-merge": "points", "stack-tower": "blocks", sudoku: "clues", "whack-a-bug": "bugs", "two-cars": "pickups", "tee-shooter": "targets", "tap-target": "targets", "air-hockey": "goals", survivor: "seconds", "sky-high": "height", "math-quiz": "questions", flappy: "pipes", "chrome-dino": "distance" };
    return `${value} ${labels[gameId] ?? gameInfo.sizeLabel.toLowerCase()}`;
  };
  const stageName = pacman ? "Maze" : "Stage";
  let level = Math.max(1, Number(localStorage.getItem(levelKey(gameId)) || 1));
  let size = Number(localStorage.getItem(sizeKey(gameId)) || (gameId === "2048" ? 4 : 25));
  if (!gameInfo.sizes.includes(size)) size = gameInfo.sizes[0];
  let mixer = localStorage.getItem(mixKey(gameId)) === "true";
  let difficulty = Math.max(0, Math.min(2, Number(localStorage.getItem(difficultyKey(gameId)) || 1)));
  const sizeForDifficulty = (d: number) => gameId === "2048" ? gameInfo.sizes[2 - d] : gameInfo.sizes[d];
  size = sizeForDifficulty(difficulty);
  let instance: GameController | null = null;
  let disposed = false;
  let solved = false;
  let lifelineUsed = false;
  let activePlayedMs = Number(localStorage.getItem(sessionTimeKey) || 0);
  let lastClockTick = 0;
  let sessionSolved = Number(sessionStorage.getItem("little-puzzles:solved") || 0);
  let sessionScore = Number(sessionStorage.getItem("little-puzzles:score") || 0);
  let breakVisible = false;
  let lockVisible = false;
  let lockTimerId = 0;
  let playTimerId = 0;

  root.innerHTML = `
    <section class="puzzle-shell" style="--puzzle-accent:${gameInfo.accent}">
      <header class="puzzle-header">
        <div class="puzzle-title"><span class="puzzle-brand">LITTLE PUZZLES <i>✳</i></span><h2>${escape(gameInfo.title)}</h2></div>
        <div class="puzzle-tools"><span class="puzzle-level" data-level></span><span class="puzzle-clock" data-clock>30:00 break</span><button class="puzzle-tool" data-lifeline title="One lifeline per challenge: ${escape(gameInfo.lifeline)}">✦ <span>${escape(gameInfo.lifeline)}</span></button><button class="puzzle-tool" data-restart title="Restart this game">↻ <span>Restart</span></button><button class="puzzle-tool" data-fullscreen title="Full screen">⛶ <span>Full screen</span></button><a class="puzzle-tool" data-new-tab href="?game=${encodeURIComponent(gameId)}" target="_blank" rel="noopener" title="Open this game in another tab">↗ <span>New tab</span></a><button class="puzzle-tool" data-close title="Close game">× <span>Close</span></button></div>
      </header>
      <div class="puzzle-config">
        <label>${gameInfo.sizeLabel} <select data-size>${gameInfo.sizes.map((value) => `<option value="${value}"${value === size ? " selected" : ""}>${sizeText(value)}</option>`).join("")}</select></label>
        <label class="setup-mix" ${gameInfo.sizes.length === 1 ? "hidden" : ""}><input type="checkbox" data-mix${mixer ? " checked" : ""}> Mix sizes after completion</label>
        <span class="combo-note">Fresh challenge every stage</span>
      </div>
      <div class="puzzle-instruction"><span class="instruction-mark">i</span><span>${escape(gameInfo.instructions)}</span><span class="puzzle-status" data-status>Choose settings to start</span></div>
      <div class="puzzle-controls">${escape(gameInfo.controls)}</div>
      <div class="puzzle-stage" aria-label="${escape(gameInfo.title)} play area">
        <div class="desktop-gate" data-desktop-gate hidden>For mouse and keyboard play, open this game on a desktop or laptop.</div>
      </div>
      <footer class="puzzle-footer"><span data-score>SESSION SCORE ${sessionScore.toLocaleString()}</span><span data-progress>Ready to play</span><span data-streak>${sessionSolved} STAGES COMPLETED</span></footer>
      <div class="puzzle-setup" data-setup role="dialog" aria-modal="true" aria-label="${escape(gameInfo.title)} instructions"><div class="puzzle-start-card"><span class="notice-kicker">BEFORE YOU PLAY</span><h3>${escape(gameInfo.title)}</h3><p>${escape(gameInfo.instructions)}</p><p class="setup-controls">${escape(gameInfo.controls)}</p><label class="difficulty-picker">Difficulty <strong data-difficulty-name>Medium</strong><input type="range" data-difficulty min="0" max="2" step="1" value="${difficulty}" aria-label="Difficulty"><span><small>Easy</small><small>Medium</small><small>Hard</small></span></label><p class="setup-lifeline">One lifeline: ${escape(gameInfo.lifeline)}</p><button class="puzzle-next" data-start>${pacman ? "Start the chase" : "Start playing"} <b>→</b></button></div></div>
      <div class="puzzle-notice" data-break hidden role="dialog" aria-modal="true"><div class="notice-card"><span class="notice-kicker">TIME TO RESET</span><h3>Take a short break</h3><p>You’ve played for 30 minutes. Step away and get back to your day.</p><div class="notice-actions"><button data-return>Back to work</button><button data-snooze>Snooze 15 minutes</button></div></div></div>
      <div class="puzzle-notice" data-lock hidden role="alertdialog" aria-modal="true"><div class="notice-card"><span class="notice-kicker">BREAK WINDOW</span><h3>Play time is paused</h3><p>You’ve reached 90 minutes in this play session. This browser will unlock after the two-hour break.</p><strong data-unlock-time></strong></div></div>
      <div class="puzzle-notice" data-win hidden role="dialog" aria-modal="true"><div class="notice-card"><span class="notice-kicker">${stageName.toUpperCase()} COMPLETE</span><h3 data-win-title>${pacman ? "Maze cleared!" : "Well played!"}</h3><p data-win-copy>Your score has been added to this session.</p><button class="share-score" data-copy-score>Copy session score</button><label class="win-setting">Next ${escape(gameInfo.sizeLabel.toLowerCase())} <select data-next-size>${gameInfo.sizes.map((value) => `<option value="${value}"${value === size ? " selected" : ""}>${sizeText(value)}</option>`).join("")}</select></label><label class="win-setting" ${gameInfo.sizes.length === 1 ? "hidden" : ""}><input type="checkbox" data-next-mix${mixer ? " checked" : ""}> Mix sizes after completion</label><button data-win-continue>Continue to the next ${stageName.toLowerCase()}</button></div></div>
    </section>`;

  const stage = root.querySelector<HTMLElement>(".puzzle-stage")!;
  const label = root.querySelector<HTMLElement>("[data-level]")!;
  const status = root.querySelector<HTMLElement>("[data-status]")!;
  const progress = root.querySelector<HTMLElement>("[data-progress]")!;
  const sizeSelect = root.querySelector<HTMLSelectElement>("[data-size]")!;
  const mixInput = root.querySelector<HTMLInputElement>("[data-mix]")!;
  const setup = root.querySelector<HTMLElement>("[data-setup]")!;
  const difficultySlider = root.querySelector<HTMLInputElement>("[data-difficulty]")!;
  const winNotice = root.querySelector<HTMLElement>("[data-win]")!;
  const noticeScore = root.querySelector<HTMLElement>("[data-score]")!;
  const unlockText = root.querySelector<HTMLElement>("[data-unlock-time]")!;
  const nextSizeSelect = root.querySelector<HTMLSelectElement>("[data-next-size]")!;
  const nextMixInput = root.querySelector<HTMLInputElement>("[data-next-mix]")!;
  const restartButton = root.querySelector<HTMLButtonElement>("[data-restart]")!;
  const lifelineButton = root.querySelector<HTMLButtonElement>("[data-lifeline]")!;

  const updateHeader = () => {
    label.textContent = `${stageName.toUpperCase()} ${String(level).padStart(3, "0")} · ${["EASY", "MEDIUM", "HARD"][difficulty]} · ${sizeText(size)}`;
  };
  const setSolved = (arcadeScore?: number) => {
    if (solved) return;
    solved = true;
    sizeSelect.disabled = false;
    mixInput.disabled = false;
    status.textContent = "Completed · score added";
    const roundScore = arcadeScore ?? instance?.getScore() ?? 0;
    const creditKey = `little-puzzles:credited:${gameId}:${level}:${size}`;
    const alreadyCredited = sessionStorage.getItem(creditKey) === "true";
    if (!alreadyCredited) { sessionSolved += 1; sessionScore += roundScore; sessionStorage.setItem(creditKey, "true"); }
    sessionStorage.setItem("little-puzzles:solved", String(sessionSolved));
    sessionStorage.setItem("little-puzzles:score", String(sessionScore));
    noticeScore.textContent = `SESSION SCORE ${sessionScore.toLocaleString()}`;
    root.querySelector<HTMLElement>("[data-streak]")!.textContent = `${sessionSolved} STAGES COMPLETED`;
    root.querySelector<HTMLElement>("[data-win-copy]")!.textContent = alreadyCredited ? "This stage's score has already been added to the session." : `+${roundScore.toLocaleString()} points · ${sessionSolved} stages completed this session`;
    nextSizeSelect.value = String(size);
    nextMixInput.checked = mixer;
    winNotice.hidden = false;
    updateHeader();
  };
  const onStats = (stats: ArcadeStats) => {
    progress.textContent = stats.progress ?? (stats.lives + " lives · " + stats.remaining + " dots left");
    status.textContent = stats.state === "paused" ? "Paused · resume in the game" : stats.message ?? (stats.state === "lost" ? "Game over · restart this maze" : stats.state === "won" ? "Maze cleared" : stats.state === "dying" ? "Caught · ready to retry" : stats.powerSeconds > 0 ? "Power active · " + stats.powerSeconds + "s" : "Score " + stats.score.toLocaleString() + " · best " + stats.best.toLocaleString());
    lifelineButton.disabled = lifelineUsed || ["lost", "won", "paused"].includes(stats.state) || stats.canHelp === false;
  };
  const onLevel = (nextLevel: number, nextSize = size) => {
    if (!solved && instance) return;
    level = nextLevel;
    size = nextSize;
    solved = false;
    lifelineUsed = false;
    localStorage.setItem(levelKey(gameId), String(level));
    localStorage.setItem(sizeKey(gameId), String(size));
    localStorage.setItem(mixKey(gameId), String(mixer));
    status.textContent = "Complete the current challenge";
    progress.textContent = "Ready to play";
    sizeSelect.value = String(size);
    sizeSelect.disabled = true;
    mixInput.disabled = true;
    setup.hidden = true;
    winNotice.hidden = true;
    root.querySelector<HTMLButtonElement>("[data-lifeline]")!.disabled = false;
    updateHeader();
    const run: Run = {
      gameId,
      level,
      size,
      seed: seedFor(gameId, level, size, difficulty),
      difficulty,
      onStats,
      onSolved: setSolved,
      onRestart: restart,
    };
    if (instance) instance.restart(run);
    else instance = createGameController(stage, run);
    restartButton.disabled = false;
  };
  const startFirst = () => {
    if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) { status.textContent = "This game uses mouse and keyboard on a desktop or laptop."; return; }
    if (Date.now() < Number(localStorage.getItem(lockKey) || 0)) return showLock();
    localStorage.setItem(sizeKey(gameId), String(size));
    localStorage.setItem(mixKey(gameId), String(mixer));
    localStorage.setItem(difficultyKey(gameId), String(difficulty));
    if (!localStorage.getItem(breakDueKey)) localStorage.setItem(breakDueKey, String(30 * 60 * 1000));
    setup.hidden = true;
    sizeSelect.disabled = true;
    mixInput.disabled = true;
    restartButton.disabled = false;
    lifelineButton.disabled = false;
    runClock();
    onLevel(level, size);
  };
  const continueLevel = () => {
    if (!solved) return;
    level += 1;
    let nextSize = Number(nextSizeSelect.value);
    mixer = nextMixInput.checked;
    mixInput.checked = mixer;
    if (mixer && gameInfo.sizes.length > 1) {
      const options = gameInfo.sizes.filter((value) => value !== size);
      nextSize = options[seedFor(gameId, level, size) % options.length];
    }
    onLevel(level, nextSize);
  };
  function restart() {
    if (!instance || breakVisible || lockVisible) return;
    solved = false;
    lifelineUsed = false;
    winNotice.hidden = true;
    sizeSelect.value = String(size);
    sizeSelect.disabled = true;
    mixInput.checked = mixer;
    mixInput.disabled = true;
    lifelineButton.disabled = false;
    status.textContent = "Restarted · same challenge";
    instance.restart({ gameId, level, size, seed: seedFor(gameId, level, size, difficulty), difficulty, onStats, onSolved: setSolved, onRestart: restart });
  }
  const showLock = () => {
    const lockUntil = Number(localStorage.getItem(lockKey) || 0);
    if (lockUntil > Date.now() && !lockVisible) {
      lockVisible = true;
      if (playTimerId) { window.clearInterval(playTimerId); playTimerId = 0; }
      lastClockTick = 0;
      instance?.pause();
      const lockPanel = root.querySelector<HTMLElement>("[data-lock]")!;
      lockPanel.hidden = false;
      const updateLock = () => {
        const remaining = Math.max(0, lockUntil - Date.now());
        unlockText.textContent = `Unlocks at ${new Date(lockUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${Math.ceil(remaining / 60000)} min remaining`;
      };
      updateLock();
      lockTimerId = window.setInterval(() => {
        updateLock();
        if (Date.now() >= lockUntil) {
          window.clearInterval(lockTimerId); lockTimerId = 0; lockPanel.hidden = true; lockVisible = false; localStorage.removeItem(lockKey);
          root.querySelector<HTMLElement>("[data-break]")!.hidden = true; breakVisible = false;
          activePlayedMs = 0; lastClockTick = 0; localStorage.setItem(sessionTimeKey, "0"); localStorage.setItem(breakDueKey, String(30 * 60 * 1000));
          if (instance) { instance.resume(); runClock(); } else { setup.hidden = false; }
        }
      }, 1000);
    }
  };
  function runClock() {
    if (playTimerId || lockVisible || !instance && setup.hidden === false) return;
    lastClockTick = Date.now();
    const clock = root.querySelector<HTMLElement>("[data-clock]")!;
    const breakPanel = root.querySelector<HTMLElement>("[data-break]")!;
    playTimerId = window.setInterval(() => {
      if (disposed || lockVisible) { window.clearInterval(playTimerId); playTimerId = 0; return; }
      const now = Date.now();
      if (document.visibilityState === "visible") activePlayedMs += Math.max(0, Math.min(now - lastClockTick, 2000));
      lastClockTick = now;
      localStorage.setItem(sessionTimeKey, String(activePlayedMs));
      if (activePlayedMs >= 90 * 60 * 1000) {
        const until = Date.now() + 2 * 60 * 60 * 1000;
        localStorage.setItem(lockKey, String(until));
        showLock();
        return;
      }
      const remaining = Math.max(0, Number(localStorage.getItem(breakDueKey) || 30 * 60 * 1000) - activePlayedMs);
      clock.textContent = `${String(Math.floor(remaining / 60000)).padStart(2, "0")}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")} break`;
      if (remaining <= 0 && !breakVisible && !lockVisible) { breakVisible = true; instance?.pause(); breakPanel.hidden = false; root.querySelector<HTMLButtonElement>("[data-snooze]")!.focus(); }
    }, 1000);
  }

  const callHelp = () => {
    const scene = instance;
    if (!scene || solved || breakVisible || lockVisible || lifelineButton.disabled) return;
    if (lifelineUsed) return;
    lifelineUsed = true;
    scene.lifeline?.();
    root.querySelector<HTMLButtonElement>("[data-lifeline]")!.disabled = true;
  };

  const handleStorage = (event: StorageEvent) => { if (event.key === lockKey && Number(event.newValue || 0) > Date.now()) showLock(); };
  window.addEventListener("storage", handleStorage);

  sizeSelect.addEventListener("change", () => { size = Number(sizeSelect.value); });
  difficultySlider.addEventListener("input", () => { difficulty = Number(difficultySlider.value); size = sizeForDifficulty(difficulty); sizeSelect.value = String(size); root.querySelector<HTMLElement>("[data-difficulty-name]")!.textContent = ["Easy", "Medium", "Hard"][difficulty]; updateHeader(); });
  root.querySelector<HTMLElement>("[data-difficulty-name]")!.textContent = ["Easy", "Medium", "Hard"][difficulty];
  mixInput.addEventListener("change", () => { mixer = mixInput.checked; });
  root.querySelector("[data-start]")!.addEventListener("click", startFirst);
  root.querySelector("[data-win-continue]")!.addEventListener("click", continueLevel);
  root.querySelector<HTMLButtonElement>("[data-copy-score]")!.addEventListener("click", async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(`Little Puzzles · ${sessionSolved} stages completed · ${sessionScore.toLocaleString()} points`);
      button.textContent = "Score copied";
    } catch {
      button.textContent = `Session score: ${sessionScore.toLocaleString()}`;
    }
  });
  restartButton.disabled = true;
  lifelineButton.disabled = true;
  restartButton.addEventListener("click", restart);
  lifelineButton.addEventListener("click", callHelp);
  root.querySelector("[data-close]")!.addEventListener("click", () => window.dispatchEvent(new CustomEvent("game:return-to-work")));
  root.querySelector("[data-fullscreen]")!.addEventListener("click", async () => { const panel = root.closest<HTMLElement>("#game-dialog") || root; if (document.fullscreenElement) await document.exitFullscreen(); else await panel.requestFullscreen(); });
  root.querySelector("[data-snooze]")!.addEventListener("click", () => {
    localStorage.setItem(breakDueKey, String(activePlayedMs + 15 * 60 * 1000));
    root.querySelector<HTMLElement>("[data-break]")!.hidden = true;
    breakVisible = false;
    instance?.resume();
  });
  root.querySelector("[data-return]")!.addEventListener("click", () => window.dispatchEvent(new CustomEvent("game:return-to-work")));
  root.querySelector<HTMLElement>("[data-desktop-gate]")!.hidden = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  updateHeader();
  showLock();
  if (lockVisible) setup.hidden = true;

  return () => {
    if (disposed) return;
    disposed = true;
    if (lockTimerId) window.clearInterval(lockTimerId);
    if (playTimerId) window.clearInterval(playTimerId);
    window.removeEventListener("storage", handleStorage);
    instance?.destroy();
    instance = null;
    root.replaceChildren();
  };
}
