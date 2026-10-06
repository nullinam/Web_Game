import { mountPacmanScene } from "./phaser/pacman";
import type { Run } from "./phaser/run";
import { mountCasualGame } from "./casual/mount";
import { mountCosmic } from "./shooters/cosmic";

export type GameController = {
  restart(run: Run): void; pause(): void; resume(): void;
  hint(): void; lifeline(): void; getScore(): number; destroy(): void;
};

export function createGameController(parent: HTMLElement, run: Run): GameController {
  if (run.gameId === "cosmic-strike") return mountCosmic(parent, run);
  if (run.gameId !== "pacman") return mountCasualGame(parent, run);
  const game = mountPacmanScene(parent, run);
  const scene = () => game.scene.getScene("pacman") as import("phaser").Scene & { hint(): void; lifeline(): void; getScore(): number };
  return {
    restart: next => { game.scene.start("pacman", next); },
    pause: () => { scene()?.scene.pause(); }, resume: () => { scene()?.scene.resume(); },
    hint: () => scene()?.hint(), lifeline: () => scene()?.lifeline(),
    getScore: () => scene()?.getScore() ?? 0, destroy: () => game.destroy(true),
  };
}
