import { games } from "../../data/games.js";
import { createWorld } from "./world.js";
import { startCircuit } from "./modes/circuit.js";
import { startTicTacToe } from "./modes/tic-tac-toe.js";
import { startToonToss } from "./modes/toon-toss.js";
import { startSnake } from "./modes/snake.js";
import { startNutsBolts } from "./modes/nuts-bolts.js";
import { startHangman } from "./modes/hangman.js";
import { startMazeChase } from "./modes/maze-chase.js";
import { startMathTest } from "./modes/math-test.js";
import { startTrivia } from "./modes/trivia.js";
import { startArchery } from "./modes/archery.js";
import { startActionArena } from "./modes/action-arena.js";

const launchers = {
  "circuit-break": startCircuit,
  "tic-tac-toe": startTicTacToe,
  "toon-toss": startToonToss,
  snake: startSnake,
  "nuts-and-bolts": startNutsBolts,
  hangman: startHangman,
  "maze-chase": startMazeChase,
  "math-test": startMathTest,
  "microsoft-trivia": startTrivia,
  archery: startArchery,
  "action-arena": startActionArena,
};

const difficultyInfo = {
  easy: { label: "Easy", number: "01", copy: "A relaxed start. More time to learn the game." },
  medium: { label: "Medium", number: "02", copy: "A balanced round with a sharper challenge." },
  hard: { label: "Hard", number: "03", copy: "A tougher run with less room for mistakes." },
};

export function mountArcadeGame(root, { gameId }) {
  const game = games.find((entry) => entry.id === gameId);
  if (!game || !launchers[gameId]) throw new Error(`Unknown game: ${gameId}`);
  let world = null; let modeCleanup = null; let disposed = false;
  function clear() { modeCleanup?.(); modeCleanup = null; world?.dispose(); world = null; }
  function chooseDifficulty() {
    clear();
    root.innerHTML = `<section class="arcade-select"><div class="arcade-select-art art-${game.art}"><div class="select-landscape"></div><span>${game.icon}</span></div><div class="arcade-select-copy"><span class="arcade-overline">PLAYGROUND ORIGINAL · 3D SINGLE PLAYER</span><h2>${game.title}</h2><p>${game.description}</p><div class="difficulty-title">Choose your challenge <small>DIFFICULTY AFFECTS THE GAMEPLAY</small></div><div class="difficulty-options">${Object.entries(difficultyInfo).map(([id,item])=>`<button class="difficulty-option" data-difficulty="${id}"><span class="difficulty-number">${item.number}</span><span class="difficulty-option-copy"><b>${item.label}</b><small>${item.copy}</small></span><span class="difficulty-arrow">↗</span></button>`).join("")}</div><div class="arcade-select-foot"><span>NO ACCOUNTS · NO SCORE SAVES</span><span>WASD / ARROWS · MOUSE</span></div></div></section>`;
    root.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => start(button.dataset.difficulty)));
  }
  function start(difficulty) {
    clear();
    root.innerHTML = `<section class="arcade-game"><div class="arcade-world"></div><header class="arcade-game-header"><div><span class="arcade-overline">${game.format} · ${difficulty.toUpperCase()}</span><h2>${game.title}</h2></div><button class="arcade-menu-button" data-arcade-menu>Change difficulty</button></header><div class="arcade-ui"></div><footer class="arcade-game-footer"><span>${difficultyInfo[difficulty].label.toUpperCase()} CHALLENGE</span><span>PLAY SESSION · NO SCORE SAVING</span></footer></section>`;
    const worldHost = root.querySelector(".arcade-world"); const ui = root.querySelector(".arcade-ui");
    world = createWorld(worldHost, {});
    world.scene.userData.clock = world;
    modeCleanup = launchers[gameId]({ world, root, ui, game, difficulty, replay: () => start(difficulty), chooseDifficulty });
    root.querySelector("[data-arcade-menu]").addEventListener("click", chooseDifficulty);
  }
  chooseDifficulty();
  return () => { if (disposed) return; disposed = true; clear(); root.innerHTML = ""; };
}
