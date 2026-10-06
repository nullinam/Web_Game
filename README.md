# Little Puzzles

A desktop game site containing only **Pacman, Memory Card Match, Color Match, Typing Speed, 2048 and Cosmic Strike**. Built with TypeScript, Phaser, HTML/CSS and Vite for static GitHub Pages hosting.

## Play

Choose one of the six game cards. Each game displays its goals and mouse/keyboard controls before starting. Select its board or mission size, or mix sizes between completed stages.

Restart retries the current seeded challenge. Completing it unlocks the next stage. Challenging stages share three hints per page session; each game also has one additional lifeline. Session scoring does not credit the same stage twice.

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

- src/data/games.ts — six-game catalog.
- src/main.js — game room and dialog launcher.
- src/games/phaser/ — Pacman, shared session controls and styles.
- src/games/casual/ — Memory, Color Match, Typing and 2048.
- src/games/shooters/ and public/games/cosmic-strike/ — Cosmic Strike.
- docs/ — rules and reference notes for the retained games.
- .github/workflows/pages.yml — build and deploy on pushes to main.

The imported Games Hub collection and its runtime, metadata, artwork, styles and documentation have been removed. Reference folders outside this repository are unaffected. Retained games keep their separate reference/licensing notes.
