import { games, categoryLabels } from "./data/games.js";
import { weeklyLeaderboard } from "./data/leaderboard.js";
import { getProfile, updateProfile } from "./services/profile.js";
import { listRooms, joinRoom } from "./services/rooms.js";

const $ = (selector, root = document) => root.querySelector(selector);
const gameGrid = $("#game-grid");
const roomList = $("#rooms-list");
const dialog = $("#game-dialog");
const toast = $("#toast");
let activeFilter = "all";
let searchTerm = "";
let toastTimer;
let activeGameCleanup = null;
let gameLaunch = 0;

function renderGames() {
  const matches = games.filter((game) => (activeFilter === "all" || game.category === activeFilter) && `${game.title} ${categoryLabels[game.category]}`.toLowerCase().includes(searchTerm));
  gameGrid.innerHTML = matches.length ? matches.map((game, index) => `<article class="game-card" style="--accent:${game.accent};--card-index:${index}">
    <div class="game-art art-${game.art}"><div class="art-grid"></div><div class="art-orb"></div><div class="art-shape"></div><span class="art-glyph">${game.icon}</span><span class="art-status">${game.status}</span><span class="art-number">0${games.indexOf(game) + 1}</span></div>
    <div class="game-card-body"><div class="game-card-meta"><span class="game-category">${categoryLabels[game.category]}</span><span class="player-count">${game.players}</span></div><h3>${game.title}</h3><p>${game.description}</p><button class="game-card-cta" data-play="${game.id}">${game.category === "multiplayer" ? "Find a room" : "Play game"}<span>↗</span></button></div>
  </article>`).join("") : `<div class="empty-state">No games match that search. Try another title or category.</div>`;
}

function renderRooms() {
  const rooms = listRooms();
  const summaries = ["apex-relay", "orbit-siege"].map((gameId) => {
    const game = games.find((item) => item.id === gameId);
    const gameRooms = rooms.filter((room) => !room.gameId || room.gameId === gameId);
    const playerTotal = gameRooms.filter((room) => room.gameId === gameId).reduce((total, room) => total + room.players, 0);
    const open = gameRooms.filter((room) => room.state === "open").length;
    const roomButtons = gameRooms.map((room) => `<button class="room-seat ${room.state === "full" ? "full" : ""}" data-join="${gameId}" data-room="${room.id}" aria-label="${game.title}, room ${room.number}, ${room.players} of 5 players" title="Room ${room.number}: ${room.players}/5 players"><span class="room-dot"></span><span>${room.number}</span></button>`).join("");
    return `<div class="room-game-row"><div class="room-game-icon ${game.art}">${game.icon}</div><div class="room-game-info"><strong>${game.title}</strong><span>${open} rooms open <i>·</i> ${playerTotal} players here</span></div><div class="room-seats">${roomButtons}</div><button class="room-join" data-join="${gameId}" aria-label="Join ${game.title}">→</button></div>`;
  });
  roomList.innerHTML = summaries.join("");
}

function renderLeaderboard() {
  $("#leaderboard-list").innerHTML = weeklyLeaderboard.map((player, index) => `<div class="leader-row"><span class="leader-position">0${index + 1}</span><span class="leader-avatar ${player.color}">${player.initials}</span><strong>${player.name}</strong><span class="leader-score">${player.score}<small> pts</small></span></div>`).join("") + `<div class="leader-row your-row"><span class="leader-position">08</span><span class="leader-avatar you">${getProfile().name.trim().charAt(0).toUpperCase() || "P"}</span><strong>${escapeHtml(getProfile().name)} <small>YOU</small></strong><span class="leader-score">${getProfile().points.toLocaleString()}<small> pts</small></span></div>`;
}

function renderProfile() {
  const profile = getProfile();
  $("#player-name").textContent = profile.name;
  $(".profile-chip-name").textContent = profile.name;
  $(".profile-chip .avatar").textContent = profile.name.trim().charAt(0).toUpperCase() || "P";
  $(".stat-profile .avatar").textContent = profile.name.trim().charAt(0).toUpperCase() || "P";
  $("#points-total").textContent = profile.points.toLocaleString();
}

function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

async function showGame(game) {
  const launch = ++gameLaunch;
  activeGameCleanup?.();
  activeGameCleanup = null;
  if (game.id === "circuit-break") {
    $("#dialog-content").innerHTML = `<div class="circuit-loading">Preparing a fresh circuit…</div>`;
    dialog.showModal();
    try {
      const { mountCircuitBreak } = await import("./games/circuit-break/game.js");
      if (!dialog.open || launch !== gameLaunch) return;
      activeGameCleanup = mountCircuitBreak($("#dialog-content"), {
        onComplete(points) {
          const profile = getProfile();
          updateProfile({ points: profile.points + points });
          renderProfile();
          renderLeaderboard();
          showToast(`Circuit Break complete: +${points} preview points.`);
        },
      });
    } catch (error) {
      if (launch !== gameLaunch || !dialog.open) return;
      $("#dialog-content").innerHTML = `<p class="circuit-loading">Couldn’t load Circuit Break. Close this panel and try again.</p>`;
      console.error("Circuit Break failed to load", error);
    }
    return;
  }
  const multiplayer = game.category === "multiplayer";
  $("#dialog-content").innerHTML = `<div class="dialog-art art-${game.art}" style="--accent:${game.accent}"><span>${game.icon}</span></div><div class="eyebrow">${categoryLabels[game.category]} · ${game.format}</div><h2>${game.title}</h2><p>${game.description}</p><div class="dialog-note"><span class="status-dot"></span>${multiplayer ? "Room preview is running locally. Live multiplayer arrives when the room server is connected." : "Game slot is ready. This game is next in the build queue."}</div><button class="button button-primary dialog-action" ${multiplayer ? `data-join="${game.id}"` : "data-action=\"demo-score\""}>${multiplayer ? "Join an open room" : "Add 25 demo points"}<span>↗</span></button>`;
  dialog.showModal();
}

dialog.addEventListener("close", () => {
  gameLaunch += 1;
  activeGameCleanup?.();
  activeGameCleanup = null;
});

function navigate(view) {
  const targets = { home: "home", games: "games", rooms: "rooms", leaderboard: "leaderboard" };
  const target = document.getElementById(targets[view] || "home");
  if (target) target.scrollIntoView({ behavior: "smooth", block: view === "home" ? "start" : "center" });
  $("#current-section").textContent = ({ home: "Home", games: "All games", rooms: "Multiplayer", leaderboard: "Leaderboard" })[view] || "Home";
  document.querySelectorAll(".nav-link[data-view]").forEach((link) => link.classList.toggle("active", link.dataset.view === view));
}

document.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === filter));
    renderGames();
    return;
  }
  const navigation = event.target.closest("[data-view], [data-view-link]");
  if (navigation) { event.preventDefault(); navigate(navigation.dataset.view || navigation.dataset.viewLink); return; }
  const play = event.target.closest("[data-play]");
  if (play) { showGame(games.find((game) => game.id === play.dataset.play)); return; }
  const join = event.target.closest("[data-join]");
  if (join) {
    const result = joinRoom(join.dataset.join, join.dataset.room || null);
    if (result.ok) { renderRooms(); showToast(`Joined ${games.find((game) => game.id === result.room.gameId).title} room ${result.room.number}. Preview seat reserved on this device.`); if (dialog.open) dialog.close(); }
    else showToast(result.reason);
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "close-dialog") dialog.close();
  if (action === "profile") {
    const nextName = window.prompt("What should we call you?", getProfile().name);
    if (nextName?.trim()) { updateProfile({ name: nextName.trim().slice(0, 24) }); renderProfile(); renderLeaderboard(); showToast("Profile saved on this device."); }
  }
  if (action === "notifications") showToast("You’re all caught up.");
  if (action === "demo-score") { const profile = getProfile(); updateProfile({ points: profile.points + 25 }); renderProfile(); renderLeaderboard(); dialog.close(); showToast("+25 preview points added on this device."); }
});

$("#game-search").addEventListener("input", (event) => { searchTerm = event.target.value.trim().toLowerCase(); renderGames(); });
document.addEventListener("keydown", (event) => { if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); $("#game-search").focus(); } });
document.querySelectorAll(".leader-tab").forEach((tab) => tab.addEventListener("click", () => { document.querySelectorAll(".leader-tab").forEach((item) => item.classList.toggle("active", item === tab)); showToast(tab.textContent === "All time" ? "All-time rankings will appear when scoring is connected." : "Showing this week’s preview rankings."); }));

renderProfile();
renderGames();
renderRooms();
renderLeaderboard();
