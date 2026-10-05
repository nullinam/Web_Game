# Elemental Breakout reference

Evaluated the user-supplied `breakout-main/breakout-main` project: its README, Phaser setup, BaseScene collision rules, ball and paddle objects, elemental projectiles, leaf barrier, ship types, map parsing, powers, and Tiled properties.

## Integration

The game's mechanics are rebuilt in `src/games/phaser/breakout.ts`, using the existing Phaser installation and common controller. The supplied sprite sheet, ship sheet, and three backgrounds are copied to `public/games/breakout/`. The supplied sheet uses 16-pixel frames, a one-pixel margin, and two-pixel spacing; these settings are preserved.

Preserved concepts: angle-sensitive paddle rebounds, attached ball launching, three starting lives, multiple balls, leaf barriers, armored/rock/glass/wood bricks, elemental falling projectiles, ship immunities, and grow/shrink/slow/fast drops. Mountain, ice, and lava themes cycle between stages. The layout and drop sequence are seeded for repeatable restarts, with substantially more than 500 possible fields.

Adaptations: desktop keyboard controls alongside the reference's pointer controls; landscape board for the website panel; 8/10/12-column fields; generated boards instead of the finite Tiled scene menu; speed capped for readability; at most three simultaneous balls and five lives; damaging laser drops instead of an automatic entire-scene reset; bounded power durations; shrink cancels widening; and the shared scoring, hint, lifeline, and break controls. Blue bricks add balls, green creates a full temporary floor, and pink adds a life. The helper widens the paddle for twelve seconds; the hint estimates a landing point, with an explicit caveat that brick collisions change trajectories.

The ball uses substeps no longer than four pixels to avoid skipping bricks or the paddle. Lives are lost only after the last ball falls; destroyed bricks are removed immediately so scores and completion cannot be repeated. Pausing stops physics, drops, and power durations; restart clears all attempt state. No separate Capacitor/mobile build, dependency tree, editor sources, video loops, font bundles, or development maps are added.

## Asset attribution

The supplied folder has no LICENSE file, so no blanket open-source license is asserted. The copied runtime art comes from the user-supplied reference. Its README credits the mountain image to Pixabay (mountain-peak-summit-alpine-alps-425134), the iceberg image to Unsplash (photo 7S21XSxKxVk), and the volcano image to Pixabay (volcano-lava-volcanic-eruption-7104380). Original sprites and ship art have no additional attribution identified in the supplied README. The relevant README credits are preserved alongside the deployed assets in `CREDITS.md`.

TypeScript checking and the production build cover this integration. A live browser gameplay and visual review remains outstanding.
