# Little Puzzles

A desktop game site with **30 playable games**, from Pacman and 2048 to Chess, Flappy, Ludo and Words of Wonder. Built with TypeScript, Phaser, HTML/CSS and Vite for static GitHub Pages hosting.

## Play

Choose a game card. A start popup explains the rules and controls and lets you choose Easy, Medium or Hard. The game window has Full screen, New tab and Close controls. Each game has one lifeline per challenge and no hints. Board sizes and goals can also be chosen in the game window; the size mixer changes sizes between completed stages.

Restart retries the current seeded challenge. Completing it unlocks the next stage. Stage number, size and difficulty feed the generation seed, providing a large library of challenge sequences. Session scoring does not credit the same stage twice.

A break reminder appears at 30 accumulated minutes, with a 15-minute snooze. At 90 minutes, a two-hour browser lock applies. Clearing site data can remove the lock, as agreed for GitHub Pages hosting.

## Run locally

In the VS Code PowerShell terminal, from this repository:

~~~powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Open http://127.0.0.1:4173/Web_Game/ and leave the terminal running.

~~~powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Stop the dev server before starting preview on the same port. Existing engine tests are available with npm.cmd test.

## Structure

- src/data/games.ts — 30-game catalog.
- src/main.js — game room and dialog launcher.
- src/games/phaser/ — Pacman, shared session controls and styles.
- src/games/casual/ — Memory, Color Match, Typing and 2048.
- src/games/shooters/ and public/games/cosmic-strike/ — Cosmic Strike.
- src/games/new/ — Tetris, Snake, Fruit Merge, Stack Tower, Connect Four and Sudoku.
- src/games/expanded/ — the 18 additional word, board, arcade and arena games.
- docs/ — rules and reference notes for the retained games.
- .github/workflows/pages.yml — build and deploy on pushes to main.

The new games use original layouts and artwork informed by the public gameplay references in docs/new-game-references.md. Chess uses `chess.js` (BSD-2-Clause) for legal move validation. No code or artwork from the other references was copied.
