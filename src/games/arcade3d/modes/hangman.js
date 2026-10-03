import { addStickman, between, box } from "../world.js";

const pools={
  easy:[{word:"PLANET",hint:"A world orbiting a star"},{word:"GARDEN",hint:"A place where plants grow"},{word:"BRIDGE",hint:"A way across a river or road"},{word:"COFFEE",hint:"A warm drink made from roasted beans"},{word:"POCKET",hint:"A small fabric pouch in clothing"},{word:"LANTERN",hint:"A portable light"}],
  medium:[{word:"COMPASS",hint:"Helps you find a direction"},{word:"MOUNTAIN",hint:"A very high natural landform"},{word:"NOTEBOOK",hint:"Blank pages bound together"},{word:"TROMBONE",hint:"A brass musical instrument"},{word:"KEYBOARD",hint:"A set of keys for typing or music"}],
  hard:[{word:"WINDMILL",hint:"A structure turned by moving air"},{word:"BLUEPRINT",hint:"A detailed plan for a building or machine"},{word:"TURQUOISE",hint:"A blue-green stone and color"},{word:"SCULPTURE",hint:"A three-dimensional work of art"},{word:"QUICKSAND",hint:"A loose wet ground that can trap objects"}]
};
const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function startHangman({world,ui,difficulty}){
  world.camera.position.set(0,7,15);world.camera.lookAt(0,2,0);world.camera.updateProjectionMatrix();
  box(world.scene,-.5,0,-1,.28,7,.35,"#725e49");box(world.scene,1.3,3.45,-1,3.7,.28,.35,"#725e49");
  between(world.scene,[1.8,3.3,-1],[1.8,2.9,-1],.06,"#8a785f");
  const figure=addStickman(world.scene,1.8,0,"#89949a",{trousers:"#586065"});figure.position.set(1.8,0,-1);
  const parts=figure.userData.parts;const segments=[parts.head,parts.torso,parts.armL,parts.armR,parts.legL,parts.legR,parts.footL,parts.footR];segments.forEach(part=>part.visible=false);parts.hips.visible=false;
  ui.innerHTML=`<section class="arcade-panel hangman-panel"><div class="mode-heading"><span class="mode-eyebrow">WORD GAME · ${difficulty.toUpperCase()}</span><h3>Find the hidden word.</h3></div><div class="hangman-clue" data-hangman-hint></div><div class="hangman-word" data-hangman-word></div><div class="hangman-errors"><span>LETTERS TRIED</span><b data-hangman-errors>0</b><span>STRIKES</span></div><div class="hangman-keyboard" data-hangman-keys></div><div class="hangman-result" data-hangman-result hidden></div><div class="mode-controls-note">Choose a letter. A wrong guess adds a piece to the faceless figure.</div></section>`;
  const hintEl=ui.querySelector("[data-hangman-hint]"),wordEl=ui.querySelector("[data-hangman-word]"),keysEl=ui.querySelector("[data-hangman-keys]"),errorsEl=ui.querySelector("[data-hangman-errors]"),resultEl=ui.querySelector("[data-hangman-result]");
  const maxMisses={easy:8,medium:6,hard:5}[difficulty];let chosen=null,guessed=new Set(),misses=0,done=false;
  function startRound(){chosen=pools[difficulty][Math.floor(Math.random()*pools[difficulty].length)];guessed=new Set();misses=0;done=false;parts.hips.visible=false;segments.forEach(part=>part.visible=false);resultEl.hidden=true;hintEl.textContent=difficulty==="hard"?"Hint sealed on Hard mode.":`HINT · ${chosen.hint}`;draw();}
  function draw(){wordEl.innerHTML=[...chosen.word].map(letter=>`<span class="hangman-letter">${guessed.has(letter)||done&&chosen.word.includes(letter)?letter:""}</span>`).join("");keysEl.innerHTML=[...alphabet].map(letter=>`<button data-letter="${letter}" class="hangman-key ${guessed.has(letter)?chosen.word.includes(letter)?"correct":"wrong":""}" ${guessed.has(letter)||done?"disabled":""}>${letter}</button>`).join("");errorsEl.textContent=`${guessed.size} used · ${misses} / ${maxMisses} mistakes`;}
  function finish(won){if(done)return;done=true;segments.forEach(part=>part.visible=true);parts.hips.visible=true;draw();resultEl.hidden=false;resultEl.innerHTML=`<span>${won?"WORD SOLVED":"ROUND OVER"}</span><b>${won?"Solved":chosen.word}</b><small>${won?chosen.word:misses+" wrong guesses"}</small><button data-hangman-next>Next word ↗</button>`;resultEl.querySelector("button").addEventListener("click",startRound);}
  function guess(letter){if(done||guessed.has(letter))return;guessed.add(letter);if(!chosen.word.includes(letter)){misses++;const visibleCount=Math.min(6,misses);segments.slice(0,visibleCount).forEach(part=>part.visible=true);if(misses>=maxMisses){finish(false);return;}}if([...chosen.word].every(c=>guessed.has(c))){finish(true);return;}draw();}
  const onClick=event=>{const letter=event.target.closest("[data-letter]")?.dataset.letter;if(letter)guess(letter);};const onKey=event=>{if(/^[a-z]$/i.test(event.key))guess(event.key.toUpperCase());};
  keysEl.addEventListener("click",onClick);window.addEventListener("keydown",onKey);startRound();
  return()=>{keysEl.removeEventListener("click",onClick);window.removeEventListener("keydown",onKey);};
}
