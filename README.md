# lowkey.exe

A quiet, offline-first collection of 13 browser games. The home page uses a monochrome terminal style with ten locally saved themes that advance from one glowing button, small game previews, a random game launcher, recent games, and a command bar. `void.exe` is the white theme with drifting black stars; the Uchiha, One Piece, and Bleach palettes have their own home-page backdrops or animation, while space palettes feature moving asteroids, ships, and comets.

Games run from the `games/` folder. The shared game toolbar provides pause, restart, focus mode, minimize, full screen, new tab, and close controls. Starfall keeps its own controls; the other games use the shared toolbar. Flappy is centered and scaled to the available window height.

## Run locally

Open a terminal in this folder and run:

```powershell
py -m http.server 4173
```

Then open `http://localhost:4173/`. Python's built-in server is used only to serve the local files; game play does not need a network connection.

## Credits

Third-party source and license details are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
