# Games Hub collection integration

## Reference

Source: the user-supplied games-main/games-main folder from Downloads. Its README identifies upstream as sausi-7/games, authored by Saurabh Singh. The local source was inspected directly; no claim is made about the current upstream version.

The registry contains 142 titles across ten categories. All 141 except Wordlee are integrated. Six custom games remain, giving 147 selectable entries. Source versions of Pacman, Memory and 2048 are clearly suffixed “Collection”.

## Implementation

Original game folders deploy under public/collection/games/. Relative resource paths work under /Web_Game/ on GitHub Pages. The searchable catalog comes from the supplied registry. The separate lazy launcher does not load the site's own Phaser bundle when opening these games.

An iframe isolates each game's globals, styles, input and lifetime. Messages are accepted only from the current frame and site origin. The parent adds instructions, desktop launch gating, pause, restart, fullscreen and shared break controls. The bridge freezes scheduled callbacks and game clocks while paused and resumes without advancing through the pause.

Original mechanics, menus and artwork are retained except for resource repairs. No common seeded level library, universal keyboard scheme, hints, lifelines or completion scoring is invented for these titles.

## Repairs and cleanup

- Corrected Fruit Merge's inex.html to index.html.
- Corrected missing, misplaced and case-mismatched paths for Linux Pages hosting.
- Provided the shared font requested by starter pages.
- Used same-game assets first, otherwise existing collection assets with origins recorded.
- Generated geometric artwork or UI symbols for images absent from the supplied source. These replacements are not exact reproductions of missing originals.
- Removed unreachable duplicate HTML/JavaScript/configuration artifacts, including an unused empty config. Dynamic game assets are preserved rather than deleted by guessing from filenames.
- Removed the old Wordle implementation, dictionary, controls, styles and tests, and old Invaders/Breakout scenes, exclusive assets and documentation. Shared utilities used by retained games remain.

The resource repairs and removed imported artifacts are recorded in collection-asset-repairs.json.

## License

MIT License, copyright 2026 Saurabh Singh. The full license is retained in public/collection/LICENSE.txt and docs/licenses/games-hub-MIT.txt and linked from the launcher. Other games retain separate licensing notes.

## Validation limits

TypeScript compilation, production build, registry checks and literal local resource checks validate integration structure. Static resource checks cover 141 entry pages. They cannot prove every dynamic URL, source-engine behavior, animation, sound or level is correct.

Some original games load Phaser/Three.js from external CDNs and require network access. Live browser walkthroughs of all titles remain outstanding. Replacement artwork differs from missing originals.
