import { games } from "../../data/games";
import type { Difficulty } from "./types";
import { mountPhaserGame } from "./index";

const choices: { id: Difficulty; label: string; copy: string; number: string }[] = [
  { id:"easy", label:"Easy", copy:"A relaxed round with more room to learn.", number:"01" },
  { id:"medium", label:"Medium", copy:"A balanced run with a sharper challenge.", number:"02" },
  { id:"hard", label:"Hard", copy:"A tougher round with less room for mistakes.", number:"03" },
];
export function mountGame(root: HTMLElement, gameId: string) {
  const game=games.find(item=>item.id===gameId); if(!game)throw new Error(`Unknown game: ${gameId}`);
  let cleanup:(()=>void)|null=null, disposed=false;
  const chooseDifficulty=()=>{cleanup?.();cleanup=null;root.innerHTML=`<section class="arcade-select phaser-select"><div class="arcade-select-art art-${game.art}"><div class="select-landscape"></div><span>${game.icon}</span></div><div class="arcade-select-copy"><span class="arcade-overline">PLAYGROUND ORIGINAL · 2D SINGLE PLAYER</span><h2>${game.title}</h2><p>${game.description}</p><div class="difficulty-title">Choose your challenge <small>DIFFICULTY AFFECTS THE GAMEPLAY</small></div><div class="difficulty-options">${choices.map(item=>`<button class="difficulty-option" data-difficulty="${item.id}"><span class="difficulty-number">${item.number}</span><span class="difficulty-option-copy"><b>${item.label}</b><small>${item.copy}</small></span><span class="difficulty-arrow">↗</span></button>`).join("")}</div><div class="arcade-select-foot"><span>NO ACCOUNTS · NO SCORE SAVES</span><span>ARROWS · SPACE · POINTER</span></div></div></section>`;root.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach(button=>button.addEventListener("click",()=>{cleanup?.();cleanup=mountPhaserGame(root,{game,difficulty:button.dataset.difficulty as Difficulty,replay:chooseDifficulty,chooseDifficulty});}));};
  chooseDifficulty();
  return ()=>{if(disposed)return;disposed=true;cleanup?.();cleanup=null;root.innerHTML="";};
}
