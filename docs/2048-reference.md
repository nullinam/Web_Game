# 2048 reference and integration

Reviewed the supplied Browser Game Hub 2048 README and script, including traversal order, merging, spawning, score updates, input, win/loss checks, and restart/undo behavior.

The reference uses 3 × 3, 4 × 4, and 5 × 5 boards, starts with two tiles, spawns a 2 or 4 after each valid move (10% chance of 4), merges each result tile once per move, adds each merged tile's value to the score, wins at 2048, and loses when no slide or merge remains.

The integration keeps those mechanics and defaults to 4 × 4. Tiles retain IDs for slide transitions and merge/spawn animations. Score, personal best per board size, move count, elapsed play time, highest tile, and the goal are visible.

Arrow keys / WASD and mouse direction buttons are supported. P pauses and R restarts. Touch controls, Undo, and New Game are omitted under the shared desktop and progression rules. Restart retries the same initial tiles and seeded random sequence; different choices can still produce different placements because available cells differ. Only reaching 2048 unlocks the next stage.

The shared hint suggests a legal direction using available space, merge score, and keeping a high tile in a corner. It is a heuristic, not a guaranteed solution. The one-use lifeline removes one lowest-valued tile without awarding points. Helpers are disabled while a slide animation resolves, so clicks during animation do not consume them.

Hints are available from stage 4 onward or on the smaller 3 × 3 board. The common three-hint limit, size mixer, session scoring, break reminders, and browser lock apply.

Variation comes from seeded tile sequences across stages and board sizes. Small boards have a finite set of two-tile opening arrangements; the 500+ variation rule refers to full play sequences, not 500 unique openings on every size.

The reference has document-wide state, listeners, styling, and an Undo snapshot system. It was adapted into a contained TypeScript engine and the existing game controller rather than importing the standalone page. The source folder has no supplied license file; no separate licensing claim is made here.
