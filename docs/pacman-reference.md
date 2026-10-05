# Pacman reference evaluation

The supplied phaser-pacman-master folder was inspected as the gameplay reference. Its index.html loads Phaser 3.12 from a CDN and imports three JavaScript files; its Tiled map is 25×18 cells.

## What the reference implements

- Maze movement with buffered turns, arcade collisions, and a side tunnel.
- Four coloured ghosts that choose random turns.
- Dots worth 10 points, three lives, respawning, and score display.
- Resetting the same dots after a maze clear; automatic score/life reset after the last life.

## Issues found in the source

- The createStaticLayer API and old Tiled format need work to fit the website's current Phaser version.
- Power-pill, cherry, frightened-ghost, and message artwork exists, but the main scene loads regular pills and does not implement these mechanics.
- Player and ghost updates refer to an animation named faceRight that the scene never creates.
- Most state lives in module globals, and the game constructs a full-page Phaser instance immediately; it needs a contained lifecycle for a website dialog.
- There is no license file in the supplied folder. The integration uses original code, generated mazes, and vector artwork, rather than copying that project's JavaScript or raster assets.

## Website implementation

The pacman-engine.ts file contains deterministic maze generation and a tile simulation. The pacman.ts file renders an original blue maze, yellow player, coloured ghosts, scoreboard, lives, and status overlays in Phaser. The shared game launcher provides size selection, the maze mixer, common hints, the freeze lifeline, restart, completion-only progression, and the existing break reminders and browser lock.

The gameplay includes buffered turns and immediate reversals; three lives; four ghost behaviours; chase/scatter phases; power pellets; returning ghost eyes; timed cherries; wrap tunnels; pause; personal bests; and explicit maze-clear and game-over states. Sizes are 19×19, 25×25, and 31×31. The chase becomes faster with progression.

The rule checks use Node's test runner against the independent engine, including 1,500 generated mazes and more than 500 unique layouts. These checks verify game logic; they do not replace a browser visual review.
