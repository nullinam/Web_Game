# Shared game rules

These are the standards for Pacman and games added next. Only Pacman is currently available.

## Design and controls

- Use TypeScript and Phaser for game logic and animation, with HTML and CSS for the surrounding interface. Keep deployment compatible with static GitHub Pages hosting.
- Keep gameplay readable in 2D. Use depth, material shading, lighting, and animation where they make pieces and actions clearer.
- Support desktop mouse and keyboard. Display the goal and controls before play, and show useful feedback during play. No mobile control scheme.
- Evaluate a supplied reference before implementation. Preserve its core mechanics, check reuse permissions, and create original code or artwork where reuse is not licensed.

## Layouts and progression

- Provide at least 500 distinct, playable layouts where procedural generation fits the game. Vary actual arrangements, not just colors.
- Offer appropriate board or maze sizes and an optional size mixer. Choose settings before starting; change them for the next completed stage.
- Make later stages challenging through layout, obstacles, speed, or opponent behavior. There is no Easy / Medium / Hard selector.
- Match limits to the genre: lives and ghost behavior for Pacman; move budgets for suitable puzzles.
- No Undo, Skip, or New Game controls. Restart retries the current layout. Completing its goal unlocks the next stage.

## Helpers

- Exactly two helper types: a common Hint and one helper specific to the game.
- Three hints shared across the current page session. Refreshing the page restores them.
- Hints appear only for challenging stages. Currently this means stage 4 onward, or the largest board size.
- The game-specific helper is usable once per attempt. Restart or the next stage restores it.
- Pacman hints reveal a route toward a power pellet for six seconds. Its helper freezes ghosts for four seconds; frozen ghosts are still dangerous without power.

## Breaks and scores

- Start a 30-minute break reminder when play begins. Snooze adds 15 minutes.
- Time accumulates while the game panel is open and the page is visible, including manual pauses. Closing the game or hiding the page stops this counter.
- At 90 accumulated minutes, lock play in this browser for two hours. The timer and lock survive refreshes through browser storage.
- As agreed for GitHub Pages, clearing site data can remove this lock. It is a browser reminder, not server-enforced access control.
- Show game-appropriate scores, progress, win/loss states, and a personal best. Credit completed stages to a session score and allow copying a score recap.

## Pacman rules

- Maze sizes: 19 × 19, 25 × 25, or 31 × 31.
- Clear every dot to complete the maze. Start each attempt with three lives.
- Arrow keys or WASD steer; P / Space pauses; R restarts the same maze.
- Four ghosts use different chase behaviors. Power pellets temporarily allow ghost catches; tunnels wrap across the maze.
- Dots score 10, power pellets 50, and successive ghost catches 200 / 400 / 800 / 1600.
- Timed cherries score 100 / 300 / 500 depending on the stage. Clearing a maze adds 500 plus 100 per remaining life.
- Restart resets the attempt's score and lives. Losing all lives keeps the score visible and requires Restart; it does not unlock a new maze.

## Release checks

Check generated layout validity, controls, scoring, helpers, restart, loss, and completion. Run the TypeScript check and production build before shipping changes. Visual review should confirm readable goals and feedback.
