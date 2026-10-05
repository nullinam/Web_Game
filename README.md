# Little Puzzles

A desktop browser game site built with TypeScript, Phaser, HTML, CSS, and Vite. The collection contains **Pacman, Wordle Clone, Memory Card Match, Color Match, Typing Speed, 2048, Cosmic Strike, Space Invaders, and Elemental Breakout**.

## Project structure

- src/data/games.ts — game catalog.
- src/main.js — home page and game dialog launcher.
- src/games/phaser/ — Pacman engine, rendering, session controls, and game styles.
- src/games/casual/ — Wordle, Memory, Color Match, Typing, and 2048 engines, controls, styles, and reference data.
- src/games/controller.ts — common game lifecycle for both rendering approaches.
- src/games/shooters/ — Space Invaders scene and Cosmic Strike lifecycle adapter.
- public/games/ — Cosmic Strike's supplied Canvas engine and the licensed Invaders sprite atlas.
- index.html and styles.css — website layout and artwork.
- tests/ — Pacman engine checks used by GitHub Actions.
- docs/ — shared game rules and the reference evaluation.
- .github/workflows/pages.yml — GitHub Pages deployment.

Installed dependencies (node_modules/) and generated builds (dist/) are ignored by Git. Install dependencies with npm.cmd install; create a fresh build with npm.cmd run build.

## Games

- **Wordle Clone:** six guesses and 500+ distinct five-letter answers, exact duplicate-letter feedback, an offline dictionary, and a seventh-guess lifeline.
- **Memory Card Match:** 4 × 4, 4 × 5, or 6 × 6 cards, a move budget, fresh seeded arrangements, and a brief peek lifeline.
- **Color Match:** choose the ink color in a 60-second round, with 4 / 6 / 8 colors, three lives, streak bonuses, and a clock freeze.
- **Typing Speed:** falling words, 20 / 30 / 40-word targets, three lives, long-word bonuses, WPM, word-attempt accuracy, and a falling-word freeze.
- **2048:** 3 × 3, 4 × 4, or 5 × 5 boards, animated equal-tile merging, seeded restarts, a suggested-move hint, and a one-use lowest-tile removal. [Reference notes](docs/2048-reference.md).
- **Cosmic Strike:** 3 / 5 / 7 seeded waves and a four-phase boss; six sector rosters, ten enemy types, rotating ships/weapons, pickups, synthesized sound, and an emergency shield.
- **Space Invaders:** five rows of 8 / 10 / 12 aliens, the supplied pixel sprites, erodible bunkers, accelerating formation, bonus saucers, three lives, and an emergency shield. [Shooter reference notes](docs/shooter-references.md).
- **Elemental Breakout:** 8 / 10 / 12-column seeded brick fields, mountain / ice / lava themes, paddle-directed bounce angles, armored bricks, multiball, hazards, power drops, rotating elemental ships, a landing-estimate hint, and a twelve-second wide-paddle lifeline. [Reference notes](docs/breakout-reference.md).

The new games adapt the supplied Browser Game Hub reference. See [the evaluation and integration notes](docs/browser-game-hub-reference.md).

### Pacman

Clear every dot while four ghosts pursue, ambush, flank, and roam. Choose a 19 × 19, 25 × 25, or 31 × 31 maze, or mix sizes between completed stages. More than 500 distinct seeded layouts provide variety.

Arrow keys / WASD steer, P or Space pauses, and R restarts the current maze. Each attempt has three lives, four power pellets, wraparound tunnels, timed cherries, ghost combos, and a personal best.

There is no undo, skip, or new-game button in any game. Complete the current stage to advance; Restart retries the same challenge. Challenging stages offer the shared hint pool (three across all games per page session). Each game has one additional lifeline per attempt; Pacman's is a four-second ghost freeze.

See [the general game rules](docs/game-rules.md) for progression, scoring, controls, and break behavior. The supplied reference was evaluated and rebuilt with original code and vector artwork; see [the Pacman reference evaluation](docs/pacman-reference.md).

## Session features

- A break reminder at 30 accumulated minutes, with a 15-minute snooze.
- A two-hour browser lock at 90 accumulated minutes.
- A session score, completed-stage count, and copyable score recap.

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

Stop the dev server with Ctrl+C before starting the preview on the same port. Existing engine tests require Node.js 22.6+ and cover Pacman, Wordle, Memory, Color Match, and Typing Speed. TypeScript and the production build cover integration of all six games.

Vite writes the production build to dist/. GitHub Pages deployment is configured in .github/workflows/pages.yml; vite.config.js sets the repository base path to /Web_Game/.
