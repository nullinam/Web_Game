import Phaser from "phaser";
import { games } from "../../data/games";
import { mountPuzzleScene } from "./index";

const progressKey = (id: string) => `little-puzzles:${id}:level`;
function seedFor(id: string, level: number) {
  let hash = 2166136261;
  for (const char of `${id}:${level}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0 || 1;
}

export function mountGame(root: HTMLElement, gameId: string) {
  const gameInfo = games.find((item) => item.id === gameId);
  if (!gameInfo) throw new Error(`Unknown puzzle: ${gameId}`);
  let level = Math.max(1, Number(localStorage.getItem(progressKey(gameId)) || 1));
  let seed = seedFor(gameId, level);
  let instance: Phaser.Game | null = null;
  let disposed = false;

  root.innerHTML = `
    <section class="puzzle-shell" style="--puzzle-accent:${gameInfo.accent}">
      <header class="puzzle-header">
        <div class="puzzle-title"><span class="puzzle-brand">LITTLE PUZZLES <i>✳</i></span><h2>${gameInfo.title}</h2></div>
        <div class="puzzle-tools"><span class="puzzle-level" data-level>Puzzle ${String(level).padStart(3, "0")}</span><button class="puzzle-tool" data-undo title="Undo last move">↶ <span>Undo</span></button><button class="puzzle-tool" data-restart title="Restart this puzzle">↻ <span>Restart</span></button><button class="puzzle-next" data-next>New puzzle <b>→</b></button></div>
      </header>
      <div class="puzzle-instruction"><span class="instruction-mark">i</span><span>${gameInfo.instructions}</span><span class="puzzle-status" data-status>Take your time</span></div>
      <div class="puzzle-stage" aria-label="${gameInfo.title} board"></div>
      <footer class="puzzle-footer"><span>NO CLOCK · NO PRESSURE</span><span data-moves>0 moves</span><span>PROGRESS SAVES ON THIS DEVICE</span></footer>
    </section>`;

  const stage = root.querySelector<HTMLElement>(".puzzle-stage")!;
  const label = root.querySelector<HTMLElement>("[data-level]")!;
  const status = root.querySelector<HTMLElement>("[data-status]")!;
  const moves = root.querySelector<HTMLElement>("[data-moves]")!;

  const onLevel = (value: number) => {
    level = value;
    seed = seedFor(gameId, level);
    localStorage.setItem(progressKey(gameId), String(level));
    label.textContent = `Puzzle ${String(level).padStart(3, "0")}`;
    status.textContent = "Take your time";
    moves.textContent = "0 moves";
    instance?.scene.start("puzzle", { game: gameInfo, level, seed, onMoves: (count: number) => { moves.textContent = `${count} move${count === 1 ? "" : "s"}`; }, onSolved: () => { status.textContent = "Solved · ready for another?"; } });
  };

  const launch = () => {
    instance?.destroy(true);
    instance = mountPuzzleScene(stage, { game: gameInfo, level, seed, onMoves: (count) => { moves.textContent = `${count} move${count === 1 ? "" : "s"}`; }, onSolved: () => { status.textContent = "Solved · ready for another?"; } });
  };
  const startNext = () => onLevel(level + 1);
  const restart = () => onLevel(level);

  root.querySelector("[data-next]")!.addEventListener("click", startNext);
  root.querySelector("[data-restart]")!.addEventListener("click", restart);
  root.querySelector("[data-undo]")!.addEventListener("click", () => {
    const scene = instance?.scene.getScene("puzzle") as Phaser.Scene & { undo?: () => void };
    scene?.undo?.();
  });

  launch();
  return () => {
    if (disposed) return;
    disposed = true;
    instance?.destroy(true);
    instance = null;
    root.replaceChildren();
  };
}
