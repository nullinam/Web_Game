# Little Puzzles

A desktop browser game site built with TypeScript, Phaser, HTML, CSS, and Vite. **Pacman is currently the only game.**

## Project structure

- src/data/games.ts — game catalog.
- src/main.js — home page and game dialog launcher.
- src/games/phaser/ — Pacman engine, rendering, session controls, and game styles.
- index.html and styles.css — website layout and artwork.
- tests/ — Pacman engine checks used by GitHub Actions.
- docs/ — shared game rules and the reference evaluation.
- .github/workflows/pages.yml — GitHub Pages deployment.

Installed dependencies (node_modules/) and generated builds (dist/) are ignored by Git. Install dependencies with npm.cmd install; create a fresh build with npm.cmd run build.

## Pacman

Clear every dot while four ghosts pursue, ambush, flank, and roam. Choose a 19 × 19, 25 × 25, or 31 × 31 maze, or mix sizes between completed stages. More than 500 distinct seeded layouts provide variety.

Arrow keys / WASD steer, P or Space pauses, and R restarts the current maze. Each attempt has three lives, four power pellets, wraparound tunnels, timed cherries, ghost combos, and a personal best.

There is no undo, skip, or new-game button. Clear the maze to advance. Challenging stages offer the shared hint pool (three per page session), and each attempt has one four-second ghost freeze.

See [the general game rules](docs/game-rules.md) for progression, scoring, controls, and break behavior. The supplied reference was evaluated and rebuilt with original code and vector artwork; see [the Pacman reference evaluation](docs/pacman-reference.md).

## Session features

- A break reminder at 30 accumulated minutes, with a 15-minute snooze.
- A two-hour browser lock at 90 accumulated minutes.
- A session score, cleared-maze count, and copyable score recap.

Time accumulates while the game panel is open and the page is visible. Browser storage preserves the timer and lock across refreshes. As agreed for static GitHub Pages hosting, clearing site data can remove the lock.

## Run locally

In Windows PowerShell / the VS Code terminal:

~~~powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Open http://127.0.0.1:4173/Web_Game/ and leave the terminal running.

~~~powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Stop the dev server with Ctrl+C before starting the preview on the same port. Tests require Node.js 22.6+ and cover generated maze reachability and variety, movement, scoring, lives, pause, helpers, and completion.

Vite writes the production build to dist/. GitHub Pages deployment is configured in .github/workflows/pages.yml; vite.config.js sets the repository base path to /Web_Game/.
