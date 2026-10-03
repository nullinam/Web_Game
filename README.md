# Playground

A static, single-player game hub designed for GitHub Pages. Built with vanilla JavaScript, Vite, and Three.js. No account, database, server, leaderboard, search, or score storage is used.

## Run locally

```sh
npm install
npm run dev
```

Create the GitHub Pages build with `npm run build`; Vite writes the site to `dist/`. The workflow in `.github/workflows/pages.yml` publishes that folder. `vite.config.js` uses `/Web_Game/` as the repository Pages base.

## The collection

All eleven games open in a modal over the softened catalog and ask for Easy, Medium, or Hard before play. Game state exists for the current session only.

- **Circuit Break** — 5×5, 7×7, or 9×9 pipe-routing boards; obstacles, one or two power sources that start dark, one or two outputs, turn limits, and a countdown. Timer and move limits tighten by difficulty.
- **Tic Tac Toe** — 3×3, 5×5, or 9×9 against the computer.
- **Toon Toss** — choose the cat or dog side, set power and angle, and account for wind against a computer opponent.
- **Long Snake** — classic continuous-growth snake with Easy, Medium, and Hard speed settings.
- **Nuts & Bolts** — sort color stacks; later rounds add colors and pieces.
- **Hangman** — word rounds against the scaffold, with difficulty-based word banks and mistake limits.
- **Maze Chase** — collect every token while avoiding the chasers in an original 3D maze.
- **Math Test** — 20 mixed arithmetic questions.
- **Microsoft Trivia** — a short quiz about Microsoft products and history.
- **Archery Range** — aim at targets while adjusting for wind.
- **Stickman Survival** — move and attack through an arena with escalating enemy waves.

3D scenes use simple, faceless stick-figure characters where characters fit the game. Circuit and other board-based modes use 3D game pieces.

## Hub features

- Eleven-game feature carousel and filterable game grid, without a search field.
- Ten appearance themes: Midnight, Snow, Slate, Forest, Ocean, Sand, Plum, Ember, Mono, and Moss.
- A break reminder after 30 minutes of page time; Snooze repeats it in 10 minutes, while Close disables reminders until the page is reloaded.
- A DEV control that grows on repeated clicks, then opens a confetti card featuring the generated 3D portrait artwork labeled LOB.

Everything is static frontend code. Do not put credentials or server secrets in this repository.
