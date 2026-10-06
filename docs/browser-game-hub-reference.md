# Retained Browser Game Hub adaptations

The earlier user-supplied Browser Game Hub reference provided the mechanics and shared data used by Memory Card Match, Color Match and Typing Speed. 2048 has separate [reference notes](2048-reference.md).

These games use independent TypeScript engines and scoped HTML/CSS controls. Memory has exact pairs, move budgets, seeded layouts and a brief peek. Color Match answers by ink, with timeouts, three lives and streak bonuses. Typing Speed clears exact falling words, prioritizes the lowest duplicate and reports five-character-unit WPM.

Restart preserves the native challenge; completing it enables the next stage. Each game has a shared hint and one additional lifeline. Shared word/symbol data are retained because these games use them.

No license was found in that earlier reference folder. Its licensing status is not changed by the separate MIT-licensed Games Hub collection described in [the collection notes](games-hub-collection.md).
