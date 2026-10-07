import type { Run } from "../phaser/run";
import type { GameController } from "../controller";
import { puzzleFactories } from "./puzzles";
import { arcadeFactories } from "./arcade";
import { arenaFactories } from "./arenas";
import "./style.css";

export type State = "playing" | "won" | "lost";
export type Game = {
  render(): void;
  key(key: string): void;
  keyup?(key: string): void;
  click(event: MouseEvent): void;
  tick(ms: number): void;
  lifeline(): void;
  move?(event: MouseEvent): void;
  release?(event: MouseEvent): void;
  score: number;
  state: State;
  message: string;
  progress: string;
  canHelp?: boolean;
  animated?: boolean;
};
export type Context = { host: HTMLElement; run: Run; rng: () => number };
export const diff = (run: Run) => run.difficulty ?? 1;
export function random(seed: number) { let value = seed >>> 0 || 1; return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; }; }
export function shuffle<T>(items: T[], rng: () => number) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
export const clamp = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, value));
export const picked = <T>(items: T[], rng: () => number) => items[Math.floor(rng() * items.length)];
export function eventIndex(event: MouseEvent, name: string): number { const el = (event.target as Element).closest(`[data-${name}]`); const value = el?.getAttribute(`data-${name}`); return value === null || value === undefined ? -1 : Number(value); }
export function canvasPoint(event: MouseEvent, canvas: HTMLCanvasElement) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; }

export function mountExpanded(parent: HTMLElement, initial: Run): GameController {
  const host = document.createElement("section"); host.className = "expanded-game"; parent.appendChild(host);
  const factories: Record<string, (ctx: Context) => Game> = { ...puzzleFactories, ...arcadeFactories, ...arenaFactories };
  let run = initial, game: Game, paused = false, disposed = false, finished = false, frame = 0, last = performance.now(), renderClock = 0;
  function publish() {
    if (disposed) return;
    game.render();
    host.querySelector<HTMLElement>("[data-x-message]")!.textContent = paused ? "Paused" : game.message;
    host.querySelector<HTMLElement>("[data-x-score]")!.textContent = `Score ${game.score.toLocaleString()}`;
    host.querySelector<HTMLElement>("[data-x-progress]")!.textContent = game.progress;
    host.querySelector<HTMLButtonElement>("[data-x-pause]")!.textContent = paused ? "Resume" : "Pause";
    run.onStats?.({ score: game.score, best: 0, lives: 0, remaining: 0, total: 0, powerSeconds: 0, state: paused ? "paused" : game.state, progress: game.progress, message: game.message, canHelp: game.canHelp !== false });
    if (game.state === "won" && !finished) { finished = true; run.onSolved?.(game.score); }
  }
  function build() {
    finished = false; paused = false; last = performance.now(); renderClock = 0;
    host.innerHTML = `<div class="x-hud"><span data-x-score></span><span data-x-progress></span><button type="button" data-x-pause>Pause</button></div><div class="x-play" data-x-play></div><p class="x-message" data-x-message role="status"></p>`;
    const factory = factories[run.gameId]; if (!factory) throw new Error(`Unsupported game ${run.gameId}`);
    game = factory({ host: host.querySelector<HTMLElement>("[data-x-play]")!, run, rng: random(run.seed) });
    publish();
  }
  function onClick(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("[data-x-pause]")) { if (game.state === "playing") { paused = !paused; last = performance.now(); publish(); } return; }
    if (!paused && game.state === "playing") { game.click(event); publish(); }
  }
  function onPointer(event: PointerEvent) { if (event.button === 0) onClick(event); }
  function onKeyboardClick(event: MouseEvent) { if (event.detail === 0) onClick(event); }
  function onKey(event: KeyboardEvent) {
    if (disposed || paused || game.state !== "playing" || event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "SELECT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)) return;
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    if (key === "p") { paused = true; publish(); return; }
    game.key(key); publish();
  }
  function onKeyUp(event: KeyboardEvent) { game.keyup?.(event.key.toLowerCase()); }
  function onMove(event: MouseEvent) { if (!paused && game.state === "playing" && game.move) { game.move(event); if (run.gameId === "link") publish(); } }
  function onRelease(event: MouseEvent) { if (!paused && game.state === "playing") { game.release?.(event); publish(); } }
  function loop(now: number) {
    if (disposed) return;
    const ms = Math.max(0, Math.min(60, now - last)); last = now;
    if (!paused && game.state === "playing" && !document.hidden) { game.tick(ms); if (game.animated) { renderClock += ms; if (renderClock >= 33) { renderClock = 0; publish(); } } else if ((game.state as State) !== "playing") publish(); }
    frame = requestAnimationFrame(loop);
  }
  host.addEventListener("click", onKeyboardClick, true); host.addEventListener("pointerdown", onPointer, true); host.addEventListener("mousemove", onMove); host.addEventListener("mouseup", onRelease); document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKeyUp);
  build(); frame = requestAnimationFrame(loop);
  return { restart(next) { run = next; build(); }, pause() { paused = true; publish(); }, resume() { paused = false; last = performance.now(); publish(); }, hint() {}, lifeline() { if (!paused && game.state === "playing") { game.lifeline(); publish(); } }, getScore: () => game.score, destroy() { disposed = true; cancelAnimationFrame(frame); host.removeEventListener("click", onKeyboardClick, true); host.removeEventListener("pointerdown", onPointer, true); host.removeEventListener("mousemove", onMove); host.removeEventListener("mouseup", onRelease); document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp); host.remove(); } };
}
