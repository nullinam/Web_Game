# Little Puzzles

A browser puzzle collection built with TypeScript, Phaser, HTML, CSS, and Vite. The games use clear 2D rules with layered, tactile visuals: raised pieces, soft shadows, highlights, and responsive motion. Everything runs client-side; progress is saved in the browser.

## Games

- **Circuit Break** — rotate wire pieces to connect the battery to the lamp.
- **Nuts & Bolts** — sort colored nuts into matching bolt stacks.
- **Flow Free** — connect matching colors without crossing paths and fill the board.
- **Unblock Me** — slide the blocking pieces to clear a path for the red piece.
- **Two Dots** — connect neighboring dots; closed loops clear every dot of that color.

There is no difficulty-selection screen. Start a game directly, then use **Undo**, **Restart**, or **New puzzle**. New puzzles use a level-specific seed, and your level is stored locally in your browser.

## Run locally

```sh
npm install
npm run dev
```

Create the production build with `npm run build`; Vite writes it to `dist/`. To preview that build locally, run `npm run preview`. GitHub Pages deployment is configured in `.github/workflows/pages.yml`, and `vite.config.js` sets the repository base path to `/Web_Game/`.

## Development references

- [Phaser documentation](https://docs.phaser.io/) for scenes, input, graphics, and animation.
- [Flow Free on Google Play](https://play.google.com/store/apps/details?id=com.bigduckgames.flow)
- [Unblock Me on Google Play](https://play.google.com/store/apps/details?id=com.kiragames.unblockmefree)
- [Two Dots on Google Play](https://play.google.com/store/apps/details?id=com.weplaydots.twodotsandroid)
- [Nuts & Bolts puzzle on Google Play](https://play.google.com/store/apps/details?id=com.rollingpanda.nuts.bolts.screw.puzzle)

Those pages were used to understand the puzzle concepts; this project has its own implementation and original presentation.
