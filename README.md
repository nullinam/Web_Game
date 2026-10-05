# Playground

A static, single-player browser game hub built with HTML, CSS, TypeScript, Phaser, and Vite. All games use a 2D presentation and run locally in the browser. GitHub Pages hosts the static production build; there is no account, database, server, leaderboard, or saved score.

## Run locally

```sh
npm install
npm run dev
```

Build for GitHub Pages with `npm run build`; Vite writes the site to `dist/`. The workflow in `.github/workflows/pages.yml` publishes that directory. `vite.config.js` uses `/Web_Game/` as the repository Pages base.

## The collection

All games open in a modal and offer Easy, Medium, and Hard. Twenty new games use per-game shuffled pattern decks with 256 distinct pattern seeds before a seed repeats during a session.

### Original collection, rebuilt in 2D

- Circuit Break, Tic Tac Toe, Toon Toss, Long Snake, Nuts & Bolts, Hangman, Maze Chase, Math Test, Microsoft Trivia, Archery Range, and Stickman Survival.

### New games

- Pixel Platformer, Bubble Pop, Brick Breaker, Space Shooter, Tower Defense, Memory Match, Minesweeper, 2048, Whack-a-Mole, and Fishing Frenzy.
- Ghost Maze, Treasure Escape, Infinite Maze, Robot Hunt, Rising Lava, Shadow Chase, Bomb Maze, Color Hunter, Snake Arena, and Escape the Maze.

Maze layouts and game setups are generated from each pattern seed. Use a new pattern after a round to get a different layout. Game progress and scores are session-only.

## Hub features

- A 31-game carousel and filterable catalog.
- Ten appearance themes.
- A break reminder after 30 minutes of page time.
- A developer card in the catalog.

Everything runs in the browser. Do not put credentials or server secrets in this repository.

## Development references

- [Phaser examples](https://phaser.io/examples/v3/) for the framework's scene, input, and rendering APIs.
- [Bubble Shooter by kakorcal](https://github.com/kakorcal/bubble-shooter) as an open-source reference for a Phaser bubble-popping game.
- [Labyrinth by luckyr13](https://github.com/luckyr13/labyrinth-game) as an open-source TypeScript and Phaser maze reference; its README describes depth-first maze generation.

These projects were consulted as design and API references; their code and art assets were not copied into Playground.
