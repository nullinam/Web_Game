# lowkey.exe

A browser arcade with 15 games, a searchable and filterable library, featured picks, game guides, and original remix prompts. The home page has six locally saved themes: Dark, Void, Neon, Asteroid, Sakura, and Copper. Game details include controls, availability, and a copyable starting brief. Atmosphere effects stay on the home page and respect reduced-motion preferences.

The local games are served from `games/`; Balloon Pop links to its hosted version. Selecting Play opens the game in the arcade player, with an option to open it in a separate tab. The original game controls remain inside each game. No audio is added by the arcade interface.

## Run locally

Open a terminal in this folder and run:

```powershell
py -m http.server 4173
```

Then open `http://localhost:4173/`. Python's built-in server is used only to serve the local files; game play does not need a network connection.

## Credits

Third-party source and license details are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
