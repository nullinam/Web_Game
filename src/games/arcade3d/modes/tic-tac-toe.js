import * as THREE from "three";
import { addStickman, box, between, material } from "../world.js";

const sizeOptions=[3,5,9];

export function startTicTacToe({world,ui,difficulty,replay}){
  let size=3,board=Array(size*size).fill(0),turn=1,done=false,thinking=false,aiTimer=0,moveCount=0;
  const figure=addStickman(world.scene,-4.7,-1.2,"#9a805f");figure.scale.setScalar(.82);
  const gridRoot=new THREE.Group();world.scene.add(gridRoot);let cells=[];let cellMeshes=[];
  ui.innerHTML=`<section class="arcade-panel ttt-panel"><div class="mode-heading"><span class="mode-eyebrow">STRATEGY · PLAY FIRST</span><h3>Think a move ahead.</h3></div><div class="mode-options-row"><label>BOARD SIZE<select data-ttt-size><option value="3">3 × 3 · 3 in a row</option><option value="5">5 × 5 · 4 in a row</option><option value="9">9 × 9 · 5 in a row</option></select></label><button data-ttt-reset>New round</button></div><div class="ttt-status" data-ttt-status>Your turn · You are ×</div><div class="ttt-result" data-ttt-result hidden></div><div class="mode-controls-note">Click a raised tile to place ×. The computer plays as ◯.</div></section>`;
  const status=ui.querySelector("[data-ttt-status]"),result=ui.querySelector("[data-ttt-result]");
  function render(){
    clearGroup(gridRoot);cells=[];cellMeshes=[];board=Array(size*size).fill(0);turn=1;done=false;thinking=false;moveCount=0;result.hidden=true;
    const spacing=1.25;const half=(size-1)*spacing/2;const targetY=size*1.45;world.camera.position.set(0,targetY,targetY*1.28);world.camera.lookAt(0,0,0);world.camera.updateProjectionMatrix();
    box(world.scene,0,-.3,0,size*spacing+.58,.45,size*spacing+.58,"#635444",{parent:gridRoot});
    const top=material("#c9b99e",.69),frame=material("#7c6c56",.78),xMat=material("#a27657",.46,.14),oMat=material("#7b8e95",.44,.13);
    for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      const idx=r*size+c,x=c*spacing-half,z=r*spacing-half;
      const tile=box(world.scene,x,0,z,spacing*.9,.22,spacing*.9,"#c9b99e",{parent:gridRoot});tile.material=top;tile.userData.cell=idx;tile.userData.base=tile.position.y;cells.push(tile);cellMeshes.push(tile);
    }
    status.textContent="Your turn · You are ×";
    status.classList.remove("won","lost");
    function drawMark(index,player){
      const row=Math.floor(index/size),col=index%size,x=col*spacing-half,z=row*spacing-half;const tint=player===1?"#a27657":"#718792";
      if(player===1){const a=between(world.scene,[x-.31,.25,z-.31],[x+.31,.25,z+.31],.09,tint,{parent:gridRoot});const b=between(world.scene,[x-.31,.25,z+.31],[x+.31,.25,z-.31],.09,tint,{parent:gridRoot});a.material=xMat;b.material=xMat;}
      else{for(const r of [.3,.18]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.072,8,24),oMat);ring.position.set(x,.31,z);ring.rotation.x=Math.PI/2;gridRoot.add(ring);}}
      const cell=cells[index];cell.material=material(player===1?"#b7a58a":"#9ba7a8",.58);
    }
    drawMark.current=drawMark;
  }
  function checkWinner(player){
    const run=size===3?3:size===5?4:5;
    for(let i=0;i<board.length;i++){if(board[i]!==player)continue;const row=Math.floor(i/size),col=i%size;
      for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){let count=1;for(let step=1;step<run;step++){const r=row+dr*step,c=col+dc*step;if(r<0||r>=size||c<0||c>=size||board[r*size+c]!==player)break;count++;}if(count===run)return true;}
    }return false;
  }
  function finish(winner){done=true;thinking=false;status.textContent=winner===1?"You win this round.":winner===2?"The computer wins.":"A draw.";status.classList.toggle("won",winner===1);status.classList.toggle("lost",winner===2);result.hidden=false;
    if(winner===1){result.innerHTML=`<span>ROUND WON</span><b>Well played.</b><button data-ttt-again>Play again ↗</button>`;}
    else result.innerHTML=`<span>${winner===2?"ROUND LOST":"ROUND DRAWN"}</span><b>${winner===2?"Try another strategy.":"Well played."}</b><button data-ttt-again>Play again ↗</button>`;
    result.querySelector("[data-ttt-again]").addEventListener("click",render);
  }
  function immediateMove(player){for(let i=0;i<board.length;i++)if(!board[i]){board[i]=player;const won=checkWinner(player);board[i]=0;if(won)return i;}return -1;}
  function scoreMove(index,player){
    const need=size===3?3:size===5?4:5;let value=0;const row=Math.floor(index/size),col=index%size;
    for(const[dr,dc]of [[1,0],[0,1],[1,1],[1,-1]])for(let offset=0;offset<need;offset++){
      const sr=row-dr*offset,sc=col-dc*offset,coords=[];for(let n=0;n<need;n++){const r=sr+dr*n,c=sc+dc*n;if(r<0||r>=size||c<0||c>=size){coords.length=0;break;}coords.push(r*size+c);}if(!coords.includes(index))continue;
      const own=coords.filter(i=>board[i]===player).length,opp=coords.filter(i=>board[i]&&board[i]!==player).length,empty=coords.filter(i=>!board[i]).length;if(!opp)value+=Math.pow(4,own)*Math.max(1,empty);else if(opp===1&&own===0)value+=2;
    }return value;
  }
  function hardMove3(){
    const empties=board.map((v,i)=>v?-1:i).filter(i=>i>=0);let best=-Infinity,bestIndex=empties[0];
    function minimax(player,depth,alpha,beta){if(checkWinner(2))return 10-depth;if(checkWinner(1))return depth-10;const free=board.reduce((n,v)=>n+(!v),0);if(!free||depth>8)return 0;let value=player===2?-Infinity:Infinity;
      for(const i of board.map((v,n)=>v?-1:n).filter(n=>n>=0)){board[i]=player;const result=minimax(player===2?1:2,depth+1,alpha,beta);board[i]=0;if(player===2){value=Math.max(value,result);alpha=Math.max(alpha,value);}else{value=Math.min(value,result);beta=Math.min(beta,value);}if(beta<=alpha)break;}return value;}
    for(const i of empties){board[i]=2;const value=minimax(1,0,-Infinity,Infinity);board[i]=0;if(value>best){best=value;bestIndex=i;}}return bestIndex;
  }
  function chooseAi(){
    if(difficulty==="easy")return board.map((v,i)=>v?-1:i).filter(i=>i>=0).sort(()=>Math.random()-.5)[0];
    const win=immediateMove(2);if(win>=0)return win;const block=immediateMove(1);if(block>=0)return block;
    if(size===3&&difficulty==="hard")return hardMove3();
    const open=board.map((v,i)=>v?-1:i).filter(i=>i>=0);let best=-Infinity,choice=open[0];
    for(const i of open){const tactical=scoreMove(i,2)*1.04+scoreMove(i,1);const center=1/(1+Math.abs(Math.floor(i/size)-(size-1)/2)+Math.abs(i%size-(size-1)/2));const val=tactical+center*(difficulty==="hard"?3:1)+Math.random()*.15;if(val>best){best=val;choice=i;}}return choice;
  }
  function computerTurn(){if(done)return;const index=chooseAi();if(index===undefined)return;board[index]=2;moveCount++;drawMark.current(index,2);if(checkWinner(2))finish(2);else if(board.every(Boolean))finish(0);else{thinking=false;status.textContent="Your turn · You are ×";}}
  const onCanvas=(event)=>{if(done||thinking||event.button!==0)return;const hit=world.pick(event,cellMeshes)[0];if(!hit)return;const index=hit.object.userData.cell;if(board[index])return;board[index]=1;moveCount++;drawMark.current(index,1);if(checkWinner(1))finish(1);else if(board.every(Boolean))finish(0);else{thinking=true;status.textContent="Computer is thinking…";aiTimer=window.setTimeout(computerTurn,difficulty==="hard"?420:280);}};
  const onUiClick=(event)=>{if(event.target.matches("[data-ttt-reset]"))render();};
  const onSize=()=>{size=Number(ui.querySelector("[data-ttt-size]").value);render();};
  ui.querySelector("[data-ttt-size]").addEventListener("change",onSize);ui.addEventListener("click",onUiClick);world.renderer.domElement.addEventListener("pointerup",onCanvas);render();
  return()=>{clearTimeout(aiTimer);ui.removeEventListener("click",onUiClick);world.renderer.domElement.removeEventListener("pointerup",onCanvas);};
}

function clearGroup(group){for(const child of [...group.children]){child.traverse?.(obj=>{obj.geometry?.dispose();if(obj.material)for(const m of Array.isArray(obj.material)?obj.material:[obj.material])m.dispose();});child.geometry?.dispose();if(child.material)for(const m of Array.isArray(child.material)?child.material:[child.material])m.dispose();group.remove(child);}}
