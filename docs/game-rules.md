# Shared game rules

These are the standards for all games. The current collection contains Pacman, Wordle Clone, Memory Card Match, Color Match, Typing Speed, 2048, Cosmic Strike, Space Invaders, and Elemental Breakout.

## Design and controls

- Use TypeScript for game logic, Phaser for arcade rendering, and HTML/CSS for text and card games and the surrounding interface. Keep deployment compatible with static GitHub Pages hosting.
- Keep gameplay readable in 2D. Use depth, material shading, lighting, and animation where they make pieces and actions clearer.
- Support desktop mouse and keyboard. Display the goal and controls before play, and show useful feedback during play. No mobile control scheme.
- Evaluate a supplied reference before implementation. Preserve its core mechanics, check reuse permissions, and create original code or artwork where reuse is not licensed.

## Layouts and progression

- Provide at least 500 distinct answers, playable layouts, or sequences according to the game. Vary actual arrangements, not just colors. Finite libraries eventually repeat; procedural generation does not promise that every possible player run is unique.
- Offer appropriate board or maze sizes and an optional size mixer. Choose settings before starting; change them for the next completed stage.
- Make later stages challenging through layout, obstacles, speed, or opponent behavior. There is no Easy / Medium / Hard selector.
- Match limits to the genre: lives and ghost behavior for Pacman; move budgets for suitable puzzles.
- No Undo, Skip, or New Game controls. Restart retries the current layout. Completing its goal unlocks the next stage.

## Helpers

- Exactly two helper types: a common Hint and one helper specific to the game.
- Three hints shared across the current page session. Refreshing the page restores them.
- Hints appear only for challenging stages. Currently this means stage 4 onward, or the largest option for games with multiple sizes, except 2048 where the smaller 3 × 3 board qualifies. Wordle's single five-letter option is not automatically classified as challenging.
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

## Rules for the additional games

| Game | Goal and limits | Sizes | Hint | One-use lifeline |
| --- | --- | --- | --- | --- |
| Wordle Clone | Find the word in six dictionary-checked guesses. Feedback counts repeated letters correctly. | Five letters; 500+ answers | Reveal a new letter position | Add a seventh guess |
| Memory Card Match | Match every pair in at most three times the pair count. A move is two flips. | 4 × 4, 4 × 5, 6 × 6 | Outline one matching pair for 1.5 seconds | Peek at every card for 2.5 seconds |
| Color Match | Choose ink color, not word meaning. Survive 60 seconds with at least one correct answer. Wrong or expired questions cost a life; start with three. | 4, 6, 8 colors | Mark the current correct ink button | Freeze both clocks for five seconds |
| Typing Speed | Clear the word target before losing three lives. A missed long word costs two lives. | 20, 30, 40 words | Mark the word closest to the bottom | Freeze falling and spawning for three seconds |
| 2048 | Merge equal neighbors to reach 2048. A result tile merges only once per move. A new 2 or 4 appears after each valid move; lose when no move remains. | 3 × 3, 4 × 4, 5 × 5 | Suggest a legal direction | Remove one lowest-valued tile without scoring |
| Cosmic Strike | Clear the waves and defeat the sector boss before hull health runs out. Six sectors cycle with increasing durability. | 3, 5, 7 waves + boss | Wave or boss combat guidance | Four seconds of invulnerability |
| Space Invaders | Clear the formation with three lives before aliens reach the ship. One player shot at a time. | 5 rows × 8, 10, 12 columns | Mark a lowest alien and its firing lane for five seconds | Four seconds of invulnerability |
| Elemental Breakout | Clear all bricks. Start with three lives; lose one when all balls fall or an unprotected elemental hazard hits. Armored bricks require five hits; rock needs two. | 8, 10, 12 columns; 5–7 rows as stages increase | Five-second estimate of a ball's landing point; later collisions can change it | Widen the paddle for twelve seconds |

Memory scores reward pairs and fewer moves / less time. Color Match uses 10 points per correct answer plus streak bonuses. Typing rewards word length, long-word clears, and streaks. Wordle rewards fewer guesses, with deductions for hints and the extra guess.

Typing WPM counts correctly cleared characters divided by five and active minutes. Accuracy measures correct word clears against incorrect manual submissions and missed words; it is not keystroke accuracy. Invalid Wordle words do not consume a guess. Wordle uses a finite offline dictionary, not every English word.

## Release checks

Breakout uses mouse movement or A/D and arrows to steer, Click/Space to launch, P to pause, and R to retry the same field. Blue bricks add a ball (up to three); green bricks create a five-second floor; pink adds a life (up to five). Red bricks drop fire or ice hazards, yellow stuns, and purple drops a laser hazard. Fire, ice, lightning, and Vanu ship types resist their respective hazards. The displayed ship type rotates each stage. Random arrow pickups widen the paddle, cancel widening, slow the ball, or speed it up. These are ordinary board mechanics alongside the two shared helper types. Each brick impact scores 5; destruction adds 20, or 30 for rock and 50 for armor. Completion adds 100 per remaining life and up to 300 for finishing quickly. Speed and brick row count increase with stage; restart resets the seed and attempt.

Cosmic Strike retains the reference's enemy scores, kill combo (up to ×50), and sector-boss bonus of 2000 × sector number. Weapons and ships rotate after each six-sector cycle; power-ups, boosting, and charged specials are ordinary combat mechanics. Its restart repeats the planned enemy types, spawn times, and positions; reactions, drops, and cosmetic effects can differ with gameplay. Space Invaders scores 10 per alien, 50–200 for a saucer, and 100 per remaining life at completion. Its seed controls initial formation variation, bunker wear, and the attack random sequence.

Check generated layout validity, controls, scoring, helpers, restart, loss, and completion. Run the TypeScript check and production build before shipping changes. Visual review should confirm readable goals and feedback.
