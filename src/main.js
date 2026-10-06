import { games, categories } from "./data/games.ts";

const gameGrid = document.querySelector("#game-grid");
const dialog = document.querySelector("#game-dialog");
const dialogContent = document.querySelector("#dialog-content");
let disposeGame = null;
let launchToken = 0;
const search = document.querySelector("#game-search");
const category = document.querySelector("#game-category");
const results = document.querySelector("#game-results");
const categoryOf = game => game.category || (game.kind === "puzzle" ? "puzzle" : game.kind === "reaction" ? "casual" : "arcade");
category.innerHTML = '<option value="all">All categories</option>' + categories.map(item => `<option value="${item.id}">${item.label}</option>`).join("");
document.querySelectorAll("[data-game-count]").forEach(node => { node.textContent = String(games.length); });

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderGames() {
  const query = search.value.trim().toLowerCase();
  const filtered = games.filter(game => (category.value === "all" || categoryOf(game) === category.value) && `${game.title} ${game.description} ${categoryOf(game)} ${(game.tags || []).join(" ")}`.toLowerCase().includes(query));
  results.textContent = `${filtered.length} of ${games.length} games`;
  gameGrid.classList.toggle("single-game", filtered.length === 1);
  gameGrid.innerHTML = filtered.map((game, index) => `
    <article class="game-card game-card-${game.material}" style="--accent:${game.accent};--card-index:${index}">
      <button class="game-card-open" data-play="${game.id}" aria-label="Play ${escapeHtml(game.title)}">
        <span class="card-number">${escapeHtml(categoryOf(game).toUpperCase())} ${String(index + 1).padStart(2, "0")}</span>
        <span class="game-art art-${game.material}" aria-hidden="true"><span class="art-floor"></span><span class="art-piece art-piece-a">${game.icon}</span><span class="art-piece art-piece-b"></span><span class="art-piece art-piece-c"></span><span class="art-light"></span></span>
        <span class="game-card-copy"><span class="game-subtitle">${escapeHtml(game.subtitle)}</span><strong>${escapeHtml(game.title)}</strong><span class="game-description">${escapeHtml(game.description)}</span><span class="play-link">Play game <b>↗</b></span></span>
      </button>
    </article>`).join("") || '<p class="game-empty">No games match. Try another name or category.</p>';
}

async function launchGame(game) {
  if (!game) return;
  const token = ++launchToken;
  disposeGame?.();
  disposeGame = null;
  dialogContent.innerHTML = "<div class='game-loading'><span class='loading-orbit'></span><p>Setting the board…</p></div>";
  if (!dialog.open) dialog.showModal();
  try {
    const module = game.sourcePath ? await import("./games/imported/mount.ts") : await import("./games/phaser/mount.ts");
    if (!dialog.open || token !== launchToken) return;
    disposeGame = game.sourcePath ? module.mountImportedGame(dialogContent, game) : module.mountGame(dialogContent, game.id);
  } catch (error) {
    if (token !== launchToken) return;
    dialogContent.innerHTML = `<div class="game-error"><strong>${escapeHtml(game.title)} couldn’t open.</strong><p>Close the panel and try again.</p></div>`;
    console.error(`${game.title} failed to load`, error);
  }
}

gameGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-play]");
  if (button) launchGame(games.find((game) => game.id === button.dataset.play));
});

dialog.addEventListener("close", () => {
  launchToken += 1;
  disposeGame?.();
  disposeGame = null;
  dialogContent.replaceChildren();
});

window.addEventListener("game:return-to-work", () => {
  if (dialog.open) dialog.close();
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-action='close-dialog']")) dialog.close();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && dialog.open) dialog.close();
});

search.addEventListener("input", renderGames);
category.addEventListener("change", renderGames);
document.addEventListener("keydown", event => {
  if (event.key === "/" && !dialog.open && !["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) { event.preventDefault(); search.focus(); }
});
renderGames();
