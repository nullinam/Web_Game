import { games, categoryLabels } from "./data/games.js";

const $ = (s, root = document) => root.querySelector(s);
const gameGrid = $("#game-grid");
const dialog = $("#game-dialog");
const devDialog = $("#dev-dialog");
let activeFilter = "all";
let activeCleanup = null;
let launchId = 0;
let slideIndex = 0;
let devClicks = 0;
let breakDisabled = false;
let breakTimer;
let toastTimer;
let carouselTimer;

function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function renderGames() {
  const matches = games.filter(g => activeFilter === "all" || g.category === activeFilter);
  gameGrid.innerHTML = matches.map((game, index) => `<article class="game-card" style="--accent:${game.accent};--card-index:${index}"><button class="game-card-open" data-play="${game.id}" aria-label="Play ${escapeHtml(game.title)}"><div class="game-art art-${game.art}"><div class="art-grid"></div><div class="art-orb"></div><div class="art-shape"></div><span class="art-glyph">${game.icon}</span><span class="art-number">${String(games.indexOf(game)+1).padStart(2,"0")}</span><span class="art-hover-play">PLAY GAME ↗</span></div><div class="game-card-body"><div class="game-card-meta"><span class="game-category">${categoryLabels[game.category]}</span><span class="player-count">${game.format}</span></div><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.description)}</p></div></button></article>`).join("");
}
function renderSlide(index) {
  slideIndex = (index + games.length) % games.length;
  const game = games[slideIndex];
  $("#feature-slide").innerHTML = `<div class="feature-slide" style="--accent:${game.accent}"><div class="feature-art art-${game.art}"><div class="feature-art-grid"></div><div class="feature-orbit"></div><div class="feature-object"><span>${game.icon}</span></div><div class="feature-glow"></div></div><div class="feature-copy"><span class="feature-category">${categoryLabels[game.category].toUpperCase()} · ${game.format}</span><h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><button class="button button-primary feature-play" data-play="${game.id}">Play now <span>↗</span></button></div><div class="feature-index"><strong>${String(slideIndex+1).padStart(2,"0")}</strong><span> / ${String(games.length).padStart(2,"0")}</span></div></div>`;
  $("#carousel-dots").innerHTML = games.map((_, i) => `<button class="carousel-dot ${i===slideIndex?"active":""}" data-slide="${i}" aria-label="Show game ${i+1}"></button>`).join("");
}
function toast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("visible"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("visible"),2600); }
async function launchGame(game) {
  if(!game) return;
  const id=++launchId; activeCleanup?.(); activeCleanup=null;
  dialog.classList.add("game-arcade-dialog"); $("#dialog-content").innerHTML="<div class='arcade-loading'>Preparing your game…</div>"; dialog.showModal();
  try {
    const { mountArcadeGame } = await import("./games/arcade3d/index.js");
    if(!dialog.open || id!==launchId) return;
    activeCleanup=mountArcadeGame($("#dialog-content"), { gameId:game.id });
  } catch (error) {
    if(id!==launchId || !dialog.open) return;
    $("#dialog-content").innerHTML=`<div class="arcade-loading"><strong>${escapeHtml(game.title)} couldn’t start.</strong><p>Close the panel and try again.</p></div>`; console.error(`${game.title} failed to load`,error);
  }
}
function openDevCard() {
  devClicks=0; const trigger=$("#dev-trigger"); trigger.style.setProperty("--dev-scale",1); trigger.classList.remove("dev-growing");
  devDialog.showModal(); devDialog.classList.remove("dev-burst"); void devDialog.offsetWidth; devDialog.classList.add("dev-burst");
  const confetti=$(".dev-confetti"); confetti.innerHTML=Array.from({length:48},(_,i)=>`<i style="--i:${i};--x:${Math.random()*100}%;--r:${Math.random()*360}deg;--c:${["#cf9b66","#93a8b5","#d7d8d4","#a4b88a"][i%4]}"></i>`).join("");
}
function scheduleBreak(ms) { clearTimeout(breakTimer); breakTimer=setTimeout(()=>{if(!breakDisabled)$("#break-dialog").showModal();},ms); }

$(".feature-prev").addEventListener("click",()=>renderSlide(slideIndex-1));
$(".feature-next").addEventListener("click",()=>renderSlide(slideIndex+1));
const carousel=$("#feature-carousel");
function startCarousel(){clearInterval(carouselTimer);carouselTimer=setInterval(()=>{if(!dialog.open&&!devDialog.open)renderSlide(slideIndex+1);},8000);}
carousel.addEventListener("mouseenter",()=>clearInterval(carouselTimer));
carousel.addEventListener("mouseleave",startCarousel);
document.addEventListener("click",event=>{
  const filter=event.target.closest("[data-filter]"); if(filter){activeFilter=filter.dataset.filter;document.querySelectorAll(".filter-chip").forEach(ch=>ch.classList.toggle("active",ch===filter));renderGames();return;}
  const dot=event.target.closest("[data-slide]");if(dot){renderSlide(Number(dot.dataset.slide));return;}
  const play=event.target.closest("[data-play]");if(play){launchGame(games.find(g=>g.id===play.dataset.play));return;}
  const action=event.target.closest("[data-action]")?.dataset.action;
  if(action==="close-dialog")dialog.close();
  if(action==="close-dev")devDialog.close();
  if(action==="snooze-break"){ $("#break-dialog").close(); scheduleBreak(10*60*1000); }
  if(action==="close-break"){breakDisabled=true;clearTimeout(breakTimer);$("#break-dialog").close();}
});
dialog.addEventListener("close",()=>{launchId++;activeCleanup?.();activeCleanup=null;dialog.classList.remove("game-arcade-dialog");});
$("#theme-select").addEventListener("change",event=>document.documentElement.dataset.theme=event.target.value);
$("#dev-trigger").addEventListener("click",event=>{devClicks++;const scale=Math.min(1+devClicks*.22,2.8);event.currentTarget.style.setProperty("--dev-scale",scale);event.currentTarget.classList.add("dev-growing");if(devClicks>=5)openDevCard();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&dialog.open)dialog.close();});
renderGames();renderSlide(0);startCarousel();scheduleBreak(30*60*1000);
