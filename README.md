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

The game cards are playable UI stubs, not completed games. Profile, points, leaderboard entries, and room occupancy are preview data stored or managed in the current browser. They do not represent online players, verified scores, or shared accounts. Replace the local adapters in `src/services/` with Supabase and an authenticated WebSocket service before treating scores or rooms as live. Never put a Supabase service-role key or other secret in the browser app.

## GitHub Pages setup

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` then deploys the repository root. GitHub Pages hosts the frontend only; real-time multiplayer still needs a separate WebSocket backend.
