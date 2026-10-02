# Playground

A modern, dark browser game hub built with plain HTML, CSS, and JavaScript modules. It is designed to deploy as a static site on GitHub Pages, with no build step, package install, API key, or server credential required.

## Run locally

Serve the repository root with any static file server. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## What is included

- A responsive home screen with navigation, profile, points, leaderboard, and game filters.
- Five reusable game cards: one arcade game, one competitive game, one puzzle, and two multiplayer games.
- A shared preview pool of five rooms. Each room can hold up to five players and is assigned to a multiplayer game when a player joins.
- Small modules for the game catalog, local profile storage, leaderboard preview, and room allocation.
- A GitHub Actions workflow that publishes the static repository to GitHub Pages on pushes to `main`.

**Circuit Break** is the first playable game. Choose a 5×5, 6×6, 7×7, or 8×8 board. Rotate elbow, straight, T, and cross pipes to connect the power sources to every core. Obstacles block connections, each level has a countdown and a move limit, and later levels add obstacles. The board generator creates a connected solution and scrambles it so every level starts with the grid dark. Faster solves with more moves left earn more preview points. Your profile total and best score for each board size stay in local browser storage. The other four cards are still game and room previews, not playable games. Leaderboard entries and room occupancy do not represent online players or shared accounts. Replace the local adapters in `src/services/` with Supabase and an authenticated WebSocket service before treating scores or rooms as live. Never put a Supabase service-role key or other secret in the browser app.

## GitHub Pages setup

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` then deploys the repository root. GitHub Pages hosts the frontend only; real-time multiplayer still needs a separate WebSocket backend.
