# Shared game rules

The collection contains 30 games. Their names, instructions, board sizes, controls and lifelines are defined in `src/data/games.ts`.

## Controls and progression

- A popup shows instructions and desktop mouse/keyboard controls before play. Its slider chooses Easy, Medium or Hard.
- Each game has its own sizes, goals, scoring and limits.
- Restart retries the same seeded challenge. There are no common Undo, Skip or New Game buttons.
- Complete the current challenge to unlock the next stage. Size changes and the size mixer apply to the next stage.
- Each game has one named lifeline per challenge. There are no hints.
- The game window offers Full screen, New tab and Close.
- Session score and completed-stage count are tracked. Replaying an already credited stage does not add its score twice.

## Break reminders

A reminder appears after 30 accumulated minutes, with a 15-minute snooze. At 90 minutes, this browser is locked for two hours. The timer and lock survive refresh through browser storage; clearing site data can remove them, as agreed for static GitHub Pages hosting.
