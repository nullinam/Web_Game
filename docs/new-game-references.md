# Gameplay references for the initial expansion

These public projects informed the rules and interaction design of the new games. The implementations in `src/games/new/` were written for Little Puzzles; their code and artwork were not copied.

| Game | Gameplay reference | Reference license noted at review |
| --- | --- | --- |
| Tetris | https://github.com/chvin/react-tetris | Verify before any source reuse |
| Snake | https://github.com/patorjk/JavaScript-Snake | MIT |
| Fruit Merge | https://github.com/takempf/subak-game | CC BY-NC 4.0; no code or assets reused |
| Stack Tower | https://github.com/saadamirpk/stack-tower-3d | Verify before any source reuse |
| Connect Four | https://github.com/benjaminrall/connect-four-ai | MIT; solver not incorporated |
| Sudoku | https://github.com/grantm/sudoku-web-app | AGPL-3.0-or-later; no code or assets reused |

The existing Pacman and 2048 reference notes remain in their respective documents.

## Further expansion

The 18 games in `src/games/expanded/` use the same launcher and theme. The following public repositories were reviewed for rules or interaction patterns. Their assets and source files were not imported.

| Game | Gameplay reference |
| --- | --- |
| Tic Tac Toe | https://github.com/VoxDroid/Ultimate-Tic-Tac-Toe |
| Slide Puzzle | https://github.com/erinlynndownes/react-slide-puzzle |
| Math Quiz | https://github.com/martinw500/Math-Quiz-Generator |
| Ludo | https://github.com/Halkhoori2000/LUDO-Board-Game |
| Chess interaction | https://github.com/lichess-org/lila |
| Tap Target and Tee Shooter | https://github.com/darrenstrydom85/aim-trainer |
| Air Hockey | https://github.com/wybiral/air-hockey |
| Flappy mechanics | https://github.com/nebez/floppybird (its artwork was not used) |
| Dinosaur Run | https://github.com/wayou/t-rex-runner |
| Words of Wonder word wheel | https://github.com/marvinody/crossword |
| Whack a Bug | https://github.com/kubowania/whac-a-mole |
| Sky High platform jumping | https://gist.github.com/straker/b96a4a68bd6d79cf75a833d98a2b654f |

Trench Defence, Two Cars, Survivor, Snake & Ladder and Link are original first-pass implementations of their described mechanics. They are not ports of the earlier supplied game collection. Chess legal moves, castling, en passant, promotion and game-over detection use [`chess.js`](https://github.com/jhlywa/chess.js), a BSD-2-Clause package listed in `package.json`.
