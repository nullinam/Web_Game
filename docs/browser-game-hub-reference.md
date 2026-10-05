# Browser Game Hub reference evaluation

Inspected the supplied browser-game-hub-main folder, including its hub files and the Wordle, Memory, Color Match, and Typing Battle scripts and instructions. Blackjack was excluded. 2048 was subsequently added; see [its reference notes](2048-reference.md).

## Findings

- The hub is a standalone HTML/CSS/JavaScript collection. Each game uses document-wide selectors, global listeners, and its own storage and timers. Directly loading these scripts into our dialog would cause lifecycle and styling conflicts.
- Wordle evaluates repeated letters correctly with two passes. Dictionary validation is disabled in the supplied script, so arbitrary five-letter strings are accepted. Both Restart and New Game choose a new random answer. Give Up and the difficulty toggle conflict with our progression rules.
- Memory creates two cards per symbol and uses a Fisher–Yates shuffle. Its Restart reshuffles the board and its automatic preview exposes cards before play. It uses 4 × 4, 4 × 5, and 6 × 6 layouts, with no move budget.
- Color Match is an ink-color reaction game with 60-second rounds, question deadlines, three starting lives in its initial preset, and streak bonuses. Its Restart randomizes the question sequence. Difficulty presets and Space-to-restart would bypass the intended progression.
- Typing Battle clears exact falling words, prioritizes the lowest duplicate, and uses long words, lives, streak bonuses, and increasing speed. It has three separate power-ups. Its WPM calculation counts completed words per minute rather than five-character units; its accuracy is based on successful versus failed word submissions and misses.
- No LICENSE file was found in the supplied folder. This project adapts the user-supplied word/symbol data and mechanics with new TypeScript engines, dialog controls, and CSS rather than importing the standalone applications wholesale. This document does not assert a license for the reference.

## Integration

- Kept Pacman. Added only Wordle Clone, Memory Card Match, Color Match, and Typing Speed.
- Rebuilt the supplied mechanics as independently testable TypeScript engines and accessible HTML controls. Phaser continues to render Pacman. CSS supplies card depth, physical key styling, and material shading for the new games.
- Restart retains the same word, cards, or seeded sequence. Completion alone enables the next stage. There are no difficulty presets, Give Up, Undo, or New Game controls.
- Expanded Wordle beyond 500 unique five-letter answers and enabled an offline dictionary. A valid English word absent from this finite dictionary is rejected with an explicit message. Answers do not repeat until the answer library cycles.
- Memory offers the reference's three card layouts, a budget of three times the pair count, no automatic opening preview, and a one-use peek.
- Color Match offers four, six, or eight colors. It keeps 60-second rounds and source-style bonuses (10 points per answer; bonuses of 10 / 25 / 50 at streaks of 5 / 10 / 15). Surviving a round with at least one correct answer completes the stage. Timeouts always count as wrong answers.
- Typing Speed offers targets of 20, 30, or 40 cleared words. It keeps falling words, lowest-duplicate matching, long-word penalties, and source-style scoring. WPM uses correctly cleared characters divided by five and active minutes; accuracy remains a word-attempt measure and is labelled in the rules. Pausing stops active elapsed time.
- Exactly two helper types per game: the shared hint pool and one game-specific lifeline. Wordle adds one guess; Memory peeks for 2.5 seconds; Color Match freezes both clocks for five seconds; Typing freezes falling and spawning for three seconds.
- All games share personal scores, session completion scoring, desktop controls, the 30-minute reminder, 15-minute snooze, and the agreed browser-only two-hour lock.

## Validation

Engine checks cover dictionary size and nonrepeating progression, duplicate letters, invalid guesses, failure/win states, helper effects, exact pairs, mismatch locking, move limits, ink-color answers, timeout penalties, clocks, typing metrics, duplicate targets, missed words, and seeded restart behavior. Generation checks verify more than 500 Memory layouts for each size, more than 500 Color Match sequences for each palette, and more than 500 Typing sequences. Existing Pacman checks remain in the same test command.

TypeScript and the production build validate integration. These checks do not replace a browser visual review.
