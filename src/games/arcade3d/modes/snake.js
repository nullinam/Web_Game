import * as THREE from "three";
import { addGroundGrid, box, makeToken, material, sphere } from "../world.js";

const N=25;
const V={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const opposite={up:"down",down:"up",left:"right",right:"left"};
const rates={easy:7,medium:10,hard:14};

export function startSnake({world,ui,difficulty}){
  world.camera.position.set(0,31,27);world.camera.lookAt(0,0,0);world.camera.updateProjectionMatrix();
  const boardGroup=new THREE.Group();world.scene.add(boardGroup);const floor=box(world.scene,0,-.28,0,N+.8,.45,N+.8,"#44433f",{parent:boardGroup});floor.material.roughness=.95;addGroundGrid(world.scene,N,N,"#77736b");
  const wallMat=material("#70685c",.87);for(let i=0;i<N;i++){for(const edge of [0,N-1]){const x=i-N/2+.5,z=edge-N/2+.5;box(world.scene,x,.04,z,.92,.62,.92,wallMat,{parent:boardGroup});box(world.scene,edge-N/2+.5,.04,x,.92,.62,.92,wallMat,{parent:boardGroup});}}
  let snake=[],direction="right",queued="right",food=null,foodMesh=null,elapsed=0,period=1/rates[difficulty],over=false,eaten=0,growthPending=0;
  const bodyMat=material("#171716",.31,.03);const headMat=material("#0c0c0c",.3,.03);let meshes=[];
  ui.innerHTML=`<section class="arcade-panel snake-panel"><div class="mode-heading"><span class="mode-eyebrow">THE ORIGINAL RULES</span><h3>Make it loooooong.</h3></div><div class="snake-score-row"><div><small>SNAKE LENGTH</small><b data-snake-length>5</b></div><div><small>APPLES</small><b data-snake-apples>0</b></div><div><small>PACE</small><b>${rates[difficulty]} steps / sec</b></div></div><p class="snake-message" data-snake-message>Eat the amber fruit. Don’t hit the walls or your own tail.</p><div class="snake-gameover" data-snake-result hidden></div><div class="mode-controls-note">W A S D or arrow keys to steer · the snake grows by 3 segments per apple</div></section>`;
  const refresh=()=>{ui.querySelector("[data-snake-length]").textContent=snake.length;ui.querySelector("[data-snake-apples]").textContent=eaten;};
  const position=(cell)=>[(cell.x-N/2+.5),.35,(cell.z-N/2+.5)];
  function addSegment(isHead){const mesh=sphere(world.scene,0,.4,0,isHead?0.42:0.37,"#171716",12,{parent:boardGroup});mesh.scale.set(1,.7,1);mesh.material=isHead?headMat:bodyMat;return mesh;}
  function placeFood(){const occupied=new Set(snake.map(c=>`${c.x},${c.z}`));const free=[];for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++)if(!occupied.has(`${x},${z}`))free.push({x,z});if(!free.length){finish(true);return;}food=free[Math.floor(Math.random()*free.length)];if(foodMesh){boardGroup.remove(foodMesh);foodMesh.geometry.dispose();foodMesh.material.dispose();}foodMesh=sphere(world.scene,food.x-N/2+.5,.52,food.z-N/2+.5,.31,"#b98656",14,{parent:boardGroup});foodMesh.material.emissive.set("#5b2b13");foodMesh.material.emissiveIntensity=.13;}
  function reset(){over=false;direction="right";queued="right";elapsed=0;period=1/rates[difficulty];eaten=0;growthPending=0;snake=Array.from({length:5},(_,i)=>({x:Math.floor(N/2)-i,z:Math.floor(N/2)}));for(const mesh of meshes){boardGroup.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}meshes=snake.map((_,i)=>addSegment(i===0));ui.querySelector("[data-snake-result]").hidden=true;ui.querySelector("[data-snake-message]").textContent="Eat the amber fruit. Don’t hit the walls or your own tail.";placeFood();refresh();}
  function finish(won){if(over)return;over=true;const result=ui.querySelector("[data-snake-result]");result.hidden=false;result.innerHTML=`<span>${won?"ARENA CLEARED":"SNAKE DOWN"}</span><b>${snake.length} segments · ${eaten} apples</b><small>${won?"Every tile filled":"Run ended"}</small><button data-snake-retry>Grow again ↗</button>`;result.querySelector("button").addEventListener("click",reset);ui.querySelector("[data-snake-message]").textContent=won?"Every open tile is filled!":"One more run?";}
  function step(){if(over)return;direction=queued;const [dx,dz]=V[direction],head=snake[0],next={x:head.x+dx,z:head.z+dz};const eating=food&&next.x===food.x&&next.z===food.z;const occupied=eating?snake:snake.slice(0,-1);if(next.x<=0||next.x>=N-1||next.z<=0||next.z>=N-1||occupied.some(c=>c.x===next.x&&c.z===next.z)){finish(false);return;}
    snake.unshift(next);if(eating){eaten++;growthPending+=3;period=Math.max(1/25,period*.985);ui.querySelector("[data-snake-message]").textContent=`Apple collected. Three more segments growing.`;placeFood();}if(growthPending>0)growthPending--;else snake.pop();
    while(meshes.length<snake.length)meshes.push(addSegment(meshes.length===0));while(meshes.length>snake.length){const mesh=meshes.pop();boardGroup.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}
    snake.forEach((cell,i)=>{meshes[i].position.set(...position(cell));meshes[i].scale.set(1-i/(snake.length*1.9),.7,1-i/(snake.length*1.9));});refresh();
  }
  function keydown(e){const key=({ArrowUp:"up",w:"up",ArrowDown:"down",s:"down",ArrowLeft:"left",a:"left",ArrowRight:"right",d:"right"})[e.key];if(!key||over)return;if(e.key.startsWith("Arrow"))e.preventDefault();if(key!==opposite[direction])queued=key;}
  window.addEventListener("keydown",keydown);world.onFrame(dt=>{if(over)return;elapsed+=dt;if(elapsed>=period){elapsed-=period;step();}});reset();
  return()=>window.removeEventListener("keydown",keydown);
}
