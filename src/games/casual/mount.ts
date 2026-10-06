import { MemoryEngine, ColorEngine, TypingEngine, COLORS } from "./engine";
import { Game2048Engine, type SlideDirection } from "./2048-engine";
import type { Run } from "../phaser/run";
import type { GameController } from "../controller";
import "./style.css";

type Engine = MemoryEngine | ColorEngine | TypingEngine | Game2048Engine;

export function mountCasualGame(parent: HTMLElement, initial: Run): GameController {
  const host = document.createElement("section"); host.className = "casual-game"; parent.appendChild(host);
  let run = initial, engine: Engine, disposed = false, manualPaused = false, externalPaused = false, notified = false;
  let best = 0, buffer = "", lastFrame = performance.now(), lastPaint = 0, frameId = 0, lastStatus = "", boardMarkup = "";
  const bestKey = () => `little-puzzles:${run.gameId}:${run.size}:best`;
  const paused = () => manualPaused || externalPaused;
  const active = () => !disposed && !paused() && engine.state === "playing";
  function build() {
    best = Number(localStorage.getItem(bestKey()) || 0); buffer = ""; manualPaused = false; externalPaused = false; notified = false; lastStatus = ""; boardMarkup = "";
    engine = run.gameId === "2048" ? new Game2048Engine(run.size, run.seed) : run.gameId === "memory" ? new MemoryEngine(run.size, run.seed) : run.gameId === "color-match" ? new ColorEngine(run.size, run.seed, run.level) : new TypingEngine(run.size, run.seed, run.level);
    host.dataset.game = run.gameId;
    host.innerHTML = `<div class="casual-hud"><span data-round-score></span><span data-round-metric></span><button type="button" data-pause>Pause</button></div><div class="casual-board" data-board></div><div data-entry></div><p class="casual-feedback" data-feedback role="status"></p><div class="casual-paused" data-paused hidden><strong>Paused</strong><button type="button" data-resume>Resume play</button></div>`;
    if (engine instanceof Game2048Engine) {
      host.querySelector("[data-entry]")!.innerHTML = '<div class="number-controls" aria-label="Slide direction"><button type="button" data-slide="up" aria-label="Slide up">↑</button><button type="button" data-slide="left" aria-label="Slide left">←</button><button type="button" data-slide="down" aria-label="Slide down">↓</button><button type="button" data-slide="right" aria-label="Slide right">→</button></div>';
    } else if (engine instanceof TypingEngine) {
      host.querySelector("[data-entry]")!.innerHTML = `<form class="typing-entry"><label>Type a falling word <input data-word-input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type a falling word"></label><button type="submit">Submit</button></form>`;
    }
    const input = host.querySelector<HTMLInputElement>("[data-word-input]");
    input?.addEventListener("input", () => {
      if (!active()) return;
      buffer = input.value.toLowerCase().replace(/[^a-z]/g, "");
      input.value = buffer;
      if (engine instanceof TypingEngine && engine.submit(buffer)) { buffer = ""; input.value = ""; }
      render();
    });
    host.querySelector("form")?.addEventListener("submit", e => { e.preventDefault(); submit(); });
    render(); input?.focus();
  }
  function submit() {
    if (!active()) return;
    if (engine instanceof TypingEngine) { if (engine.submit(buffer, true)) buffer = ""; }
    const input = host.querySelector<HTMLInputElement>("[data-word-input]"); if (input) input.value = buffer;
    render();
  }
  function click(event: MouseEvent) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button"); if (!button) return;
    if (button.hasAttribute("data-pause") || button.hasAttribute("data-resume")) { if (externalPaused || engine.state !== "playing") return; manualPaused = !manualPaused; render(); if (!manualPaused) host.querySelector<HTMLInputElement>("[data-word-input]")?.focus(); return; }
    if (!active()) return;
    if (button.dataset.slide && engine instanceof Game2048Engine) { engine.move(button.dataset.slide as SlideDirection); render(); }
    if (button.dataset.card !== undefined && engine instanceof MemoryEngine) { engine.select(Number(button.dataset.card)); render(); }
    if (button.dataset.color !== undefined && engine instanceof ColorEngine) { engine.answer(Number(button.dataset.color)); render(); }
  }
  function key(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key === "Escape") return;
    const target = event.target as HTMLElement, editing = ["INPUT", "SELECT", "TEXTAREA"].includes(target?.tagName);
    if (editing) return;
    if (event.key.toLowerCase() === "p" && !(engine instanceof TypingEngine)) { if (!externalPaused && engine.state === "playing") { event.preventDefault(); manualPaused = !manualPaused; render(); } return; }
    if (engine instanceof Game2048Engine && event.key.toLowerCase() === "r" && !externalPaused && !manualPaused) { event.preventDefault(); run.onRestart?.(); return; }
    if (!active()) return;
    if (engine instanceof Game2048Engine) {
      const directions: Record<string, SlideDirection> = { arrowup: "up", w: "up", arrowright: "right", d: "right", arrowdown: "down", s: "down", arrowleft: "left", a: "left" };
      const direction = directions[event.key.toLowerCase()];
      if (direction) { event.preventDefault(); engine.move(direction); render(); }
      return;
    }
    if (engine instanceof ColorEngine && /^[1-8]$/.test(event.key)) { event.preventDefault(); engine.answer(Number(event.key) - 1); render(); }
    else if (engine instanceof MemoryEngine && event.key.startsWith("Arrow")) {
      const current = Number(target?.dataset.card ?? 0), cols = run.size === 5 ? 5 : run.size;
      const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "ArrowDown" ? cols : -cols;
      let index = current + delta;
      while (index >= 0 && index < engine.cards.length && engine.cards[index].matched) index += delta;
      host.querySelector<HTMLButtonElement>(`[data-card="${index}"]`)?.focus(); event.preventDefault();
    }
  }
  function visibility() { if (document.hidden && engine.state === "playing") { manualPaused = true; render(); } }
  function render() {
    if (disposed) return;
    const board = host.querySelector<HTMLElement>("[data-board]")!, metric = host.querySelector<HTMLElement>("[data-round-metric]")!;
    const setBoard = (markup: string) => { if (markup !== boardMarkup) { board.innerHTML = markup; boardMarkup = markup; } };
    const focusedCard = (document.activeElement as HTMLElement)?.dataset?.card;
    if (engine instanceof Game2048Engine) {
      const e = engine; board.className = "casual-board number-board"; board.style.setProperty("--number-size", String(e.size));
      board.setAttribute("role", "img"); board.setAttribute("aria-label", `${e.size} by ${e.size} 2048 board. ${e.tiles.map(tile => `Row ${Math.floor(tile.index / e.size) + 1}, column ${tile.index % e.size + 1}: ${tile.value}`).join('. ')}`);
      setBoard(`<div class="number-grid">${Array.from({ length: e.size * e.size }, () => '<span></span>').join("")}</div>`);
      board.querySelectorAll<HTMLElement>("[data-number-id]").forEach(chip => { if (!e.tiles.some(tile => tile.id === Number(chip.dataset.numberId))) chip.remove(); });
      for (const tile of e.tiles) {
        let chip = board.querySelector<HTMLElement>(`[data-number-id="${tile.id}"]`);
        if (!chip) { chip = document.createElement("span"); chip.dataset.numberId = String(tile.id); board.appendChild(chip); }
        chip.className = `number-tile ${tile.isNew ? "number-new" : ""} ${tile.merged ? "number-merged" : ""}`;
        chip.textContent = String(tile.value); chip.dataset.value = String(tile.value);
        chip.style.setProperty("--tile-x", String(tile.index % e.size)); chip.style.setProperty("--tile-y", String(Math.floor(tile.index / e.size)));
      }
      host.querySelectorAll<HTMLButtonElement>("[data-slide]").forEach(button => { button.disabled = !active() || e.animationMs > 0; button.classList.toggle("hinted", e.hintMs > 0 && button.dataset.slide === e.hintDirection); });
      metric.textContent = `${e.moves} moves · ${Math.floor(e.elapsed / 1000)}s · Highest ${e.highest} · Goal 2048`;
    } else if (engine instanceof MemoryEngine) {
      const e = engine; board.className = "casual-board memory-board"; board.style.setProperty("--columns", String(run.size));
      setBoard(e.cards.map((_, i) => `<button type="button" class="memory-tile" data-card="${i}"><span></span></button>`).join(""));
      e.cards.forEach((card, i) => {
        const face = card.matched || e.selected.includes(i) || e.peekMs > 0;
        const button = board.querySelector<HTMLButtonElement>(`[data-card="${i}"]`)!;
        button.classList.toggle("face-up", face); button.classList.toggle("matched", card.matched); button.classList.toggle("hinted", e.hintMs > 0 && e.hintCards.includes(i));
        button.querySelector("span")!.textContent = face ? card.symbol : "✳";
        button.disabled = !active() || card.matched || e.pending > 0 || e.peekMs > 0;
        button.setAttribute("aria-label", `Card ${i + 1}, ${face ? card.symbol : "face down"}${card.matched ? ', matched' : ''}`);
      });
      if (focusedCard !== undefined) host.querySelector<HTMLButtonElement>(`[data-card="${focusedCard}"]`)?.focus();
      metric.textContent = `${e.matches}/${e.pairs} pairs · ${e.moves}/${e.maxMoves} moves · ${Math.floor(e.elapsed / 1000)}s`;
    } else if (engine instanceof ColorEngine) {
      const e = engine; board.className = "casual-board color-board";
      setBoard(`<p class="color-instruction">CHOOSE THE INK COLOR</p><strong class="color-prompt"></strong><div class="question-track" role="progressbar" aria-label="Time to answer" aria-valuemin="0" aria-valuemax="100"><span></span></div><div class="color-options">${COLORS.slice(0, e.size).map((color, i) => `<button type="button" data-color="${i}"><i style="background:${color.color}"></i><span>${i + 1} · ${color.label}</span></button>`).join("")}</div>`);
      const prompt = board.querySelector<HTMLElement>(".color-prompt")!; prompt.textContent = COLORS[e.word].label; prompt.style.color = COLORS[e.ink].color;
      const track = board.querySelector<HTMLElement>(".question-track")!; track.setAttribute("aria-valuenow", String(Math.round(e.questionMs / e.limit * 100))); track.querySelector<HTMLElement>("span")!.style.width = `${Math.max(0, e.questionMs / e.limit * 100)}%`;
      board.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(button => { button.disabled = !active(); button.classList.toggle("hinted", e.hintMs > 0 && Number(button.dataset.color) === e.ink); });
      metric.textContent = `${Math.ceil(e.remaining / 1000)}s · ${e.lives} lives · ${e.accuracy}% accuracy · streak ${e.streak}`;
    } else {
      const e = engine; board.className = "casual-board typing-arena";
      setBoard('<span class="typing-danger">TYPE BEFORE WORDS REACH THIS LINE</span>');
      board.querySelectorAll<HTMLElement>("[data-word-id]").forEach(chip => { if (!e.words.some(word => word.id === Number(chip.dataset.wordId))) chip.remove(); });
      for (const word of e.words) {
        let chip = board.querySelector<HTMLElement>(`[data-word-id="${word.id}"]`);
        if (!chip) { chip = document.createElement("span"); chip.dataset.wordId = String(word.id); chip.textContent = word.text; board.appendChild(chip); }
        chip.className = `falling-word ${word.boss ? "boss-word" : ""} ${e.hintMs > 0 && e.hintId === word.id ? "hinted" : ""}`;
        chip.style.left = `${word.x * 100}%`; chip.style.top = `${word.y * 88}%`;
      }
      metric.textContent = `${e.correct}/${e.goal} words · ${e.lives} lives · ${e.wpm} WPM · ${e.accuracy}% accuracy`;
    }
    if (engine.score > best) { best = engine.score; localStorage.setItem(bestKey(), String(best)); }
    host.querySelector<HTMLElement>("[data-round-score]")!.textContent = `Score ${engine.score} · Best ${best}`;
    host.querySelector<HTMLElement>("[data-feedback]")!.textContent = engine.state === "lost" ? `${engine.message} Use Restart to retry.` : engine.message;
    host.querySelector<HTMLElement>("[data-paused]")!.hidden = !paused();
    host.querySelector<HTMLButtonElement>("[data-pause]")!.textContent = manualPaused ? "Resume" : "Pause";
    host.querySelector<HTMLButtonElement>("[data-pause]")!.disabled = externalPaused || engine.state !== "playing";
    const input = host.querySelector<HTMLInputElement>("[data-word-input]"); if (input) input.disabled = !active();
    host.querySelectorAll<HTMLButtonElement>("form button").forEach(button => button.disabled = !active());
    const stats = { score: engine.score, best, lives: engine instanceof ColorEngine || engine instanceof TypingEngine ? engine.lives : 0, remaining: 0, total: 0, powerSeconds: 0, state: paused() ? "paused" : engine.state, progress: metric.textContent!, message: engine.message, canHelp: !(engine instanceof Game2048Engine) || engine.animationMs === 0 };
    const statusKey = JSON.stringify(stats); if (statusKey !== lastStatus) { lastStatus = statusKey; run.onStats?.(stats); }
    if (engine.state === "won" && !notified) { notified = true; run.onSolved?.(engine.score); }
  }
  function loop(now: number) {
    if (disposed) return;
    const ms = Math.max(0, Math.min(100, now - lastFrame)); lastFrame = now;
    if (active() && !document.hidden) engine.tick(ms);
    if (now - lastPaint >= (engine instanceof TypingEngine ? 16 : 100)) { lastPaint = now; render(); }
    frameId = requestAnimationFrame(loop);
  }
  host.addEventListener("click", click); document.addEventListener("keydown", key); document.addEventListener("visibilitychange", visibility);
  build(); frameId = requestAnimationFrame(loop);
  return {
    restart(next) { run = next; lastFrame = performance.now(); build(); },
    pause() { externalPaused = true; render(); }, resume() { externalPaused = false; lastFrame = performance.now(); render(); },
    hint() { if (active()) { engine.hint(); render(); } }, lifeline() { if (active()) { engine.lifeline(); render(); } },
    getScore: () => engine.score,
    destroy() { disposed = true; cancelAnimationFrame(frameId); document.removeEventListener("keydown", key); document.removeEventListener("visibilitychange", visibility); host.removeEventListener("click", click); host.remove(); },
  };
}
