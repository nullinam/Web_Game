# Little Puzzles

A desktop browser game room with **147 games**, compatible with static GitHub Pages hosting.

## Collection

Six retained games: Pacman, Memory Card Match, Color Match, Typing Speed, 2048 and Cosmic Strike. Another 141 games are imported from the user-supplied Games Hub collection, preserving their original code, menus and artwork.

Wordle Clone, Space Invaders and Elemental Breakout are removed. The imported Wordlee title is excluded as part of the Wordle removal. Source variants of Pacman, Memory and 2048 have a “Collection” suffix. Search by name or keyword, or filter by ten categories.

Imported games retain their own rules, scoring, original levels and replay behavior. They do not inherit the custom games' 500-layout guarantee, hints, lifelines or session score totals. Use mouse clicks for on-screen buttons and follow each game's keyboard instructions. The launcher requires a desktop mouse/keyboard setup.

## Break reminders

Both groups share browser storage keys for a 30-minute reminder, 15-minute snooze and two-hour lock after 90 minutes. Collection games suspend scheduled animation callbacks, game timers and active audio during parent pauses. Closing their panel removes the embedded runtime. Hidden collection tabs pause until explicitly resumed.

This is a browser-only feature: clearing site data can remove the lock, as agreed for GitHub Pages hosting.

## Run locally

From this repository in the VS Code PowerShell terminal:

~~~powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Open http://127.0.0.1:4173/Web_Game/ and leave the terminal running.

~~~powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Stop the dev server with Ctrl+C before starting preview on the same port. Existing engine tests remain available with npm.cmd test; Wordle-only tests are removed with that game.

## Structure

- src/data/games.ts and collection.json — combined catalog and imported metadata.
- src/main.js — search, filters and dialog launcher.
- src/games/imported/ — iframe launcher and collection break controls.
- public/collection/games/ — original imported game folders.
- public/collection/bridge.js — imported lifecycle bridge.
- src/games/phaser/ and src/games/casual/ — retained custom games.
- src/games/shooters/ and public/games/cosmic-strike/ — Cosmic Strike.
- docs/ — rules, source notes, licenses and repair ledger.
- .github/workflows/pages.yml — build and deploy on pushes to main.

## Source and limitations

The Games Hub MIT copyright and license are preserved in the deployed collection and docs/licenses/games-hub-MIT.txt. See [collection integration notes](docs/games-hub-collection.md).

Some original engines load from external CDNs and require internet access. Missing assets are repaired with existing bundled artwork or explicitly documented geometric fallbacks. See [the repair ledger](docs/collection-asset-repairs.json); these fallbacks are not exact copies of absent artwork.

Compilation and static resource checks do not prove that all 147 games play correctly. Individual browser walkthroughs remain necessary. Original reference notes for retained games are preserved; no new license is asserted for unrelated user-supplied references.
