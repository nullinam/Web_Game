# Shooter reference integration

## Cosmic Strike

Source: the user-supplied `Cosmic-Strike-main/Cosmic-Strike-main` folder. The README identifies the engine as VOID RUNNER and links to the `barath-codes-007/Cosmic-Strike` project. The supplied folder has no LICENSE file; no open-source license is asserted for it. The engine is integrated as user-supplied code with its source comments retained. Confirm upstream permission before distributing it under an open-source license.

The integration uses the original Canvas combat modules: procedural ships, parallax stars, particles, pooled bullets, all ten enemy behaviors, eight weapons, four ship types, nine pickups, three four-phase bosses, and synthesized audio. A small local iframe isolates its globals, CSS, keyboard listeners, and audio from the other games. The adapter checks message source and origin, bridges score/completion and shared pauses, and destroys the embedded runtime when the panel closes. All resources are local and use the site's Vite base path.

The standalone menus, shop, achievements, touch controls, and selectable endless modes are replaced with the site's common setup and progression. A mission is one sector with 3, 5, or 7 waves and its boss. Completing it advances the common stage; later six-sector cycles rotate equipment and increase enemy/boss durability. Restart repeats the seeded spawn plan and resets equipment. Combat drops and effects are not a replay of player actions.

Changes to the reference include: fix the undefined `swarm` roster entry (the `drone` supplies swarm behavior); direct boss fan shots downward; prevent consumed bullets hitting both an enemy and a boss; guard completion against duplicate delivery; clear score popups on restart; and run temporary power-up expiry on gameplay time, so it pauses and cannot affect a restarted mission.

## Space Invaders

Source: the user-supplied `space-invaders-main/space-invaders-main` project. Its MIT license is retained in `docs/licenses/space-invaders-MIT.txt` and alongside the deployed atlas as `public/games/space-invaders/LICENSE.txt` (copyright 2017 Richard Davey).

The supplied atlas and pixel aesthetic are reused in a Phaser scene. The reference's arrow movement, Space shooting, five alien rows, two-frame alien animation, and 10-point kills are preserved. The scene replaces per-frame/event-dependent movement and collision with delta-time movement, swept bullet checks, and explicit removal of defeated enemies. This prevents duplicate scores and empty-formation firing.

The adaptation adds 8 / 10 / 12-column options, seeded row arrangements, bunker wear, random bottom-column attacks, accelerating marches, descending at edges, a bonus saucer, three lives, a firing-lane hint, and a four-second emergency shield. There is no alternate menu or stage skip. Shared controls manage restart, progression, hints, session score, and break lockout.

## Verification scope

TypeScript checking, JavaScript syntax checking, and the production build are used for this integration. These are not a browser playthrough. The reference GIF and sprite atlas were inspected; live visual review remains to be done in a local browser.
