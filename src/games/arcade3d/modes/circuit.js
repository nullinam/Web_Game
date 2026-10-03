import * as THREE from "three";
import { addGroundGrid, addStickman, box, cylinder, material, sphere } from "../world.js";

const DIRS=["N","E","S","W"];
const DELTA={N:[-1,0],E:[0,1],S:[1,0],W:[0,-1]};
const OPP={N:"S",E:"W",S:"N",W:"E"};
const SHAPES=[["N","E"],["E","S"],["S","W"],["W","N"],["N","S"],["E","W"],["N","E","W"],["N","E","S"],["E","S","W"],["N","S","W"],["N","E","S","W"]];
const CONFIG={easy:{size:5,baseObstacles:4,time:72,terminals:[1,1]},medium:{size:7,baseObstacles:14,time:106,terminals:[2,1]},hard:{size:9,baseObstacles:27,time:145,terminals:[2,2]}};
const key=(row,col,size)=>row*size+col;
const ports=(tile)=>tile?tile.ports.map((port)=>DIRS[(DIRS.indexOf(port)+tile.turns)%4]):[];
const neighbor=(index,direction,size)=>{const r=Math.floor(index/size)+DELTA[direction][0],c=index%size+DELTA[direction][1];return r<0||r>=size||c<0||c>=size?-1:key(r,c,size);};
const shuffled=(array)=>{const result=[...array];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};

function allConnected(size, obstacles){
  const start=Array.from({length:size*size},(_,i)=>i).find(i=>!obstacles.has(i));const seen=new Set([start]);const queue=[start];
  for(let h=0;h<queue.length;h++){const current=queue[h];for(const dir of DIRS){const next=neighbor(current,dir,size);if(next>=0&&!obstacles.has(next)&&!seen.has(next)){seen.add(next);queue.push(next);}}}
  return seen.size===size*size-obstacles.size;
}
function spanningTree(size,obstacles){
  const start=Array.from({length:size*size},(_,i)=>i).find(i=>!obstacles.has(i));const seen=new Set([start]);const links=Array.from({length:size*size},()=>[]);const stack=[start];
  while(stack.length){const current=stack.at(-1);const options=shuffled(DIRS.map(dir=>({dir,index:neighbor(current,dir,size)})).filter(item=>item.index>=0&&!obstacles.has(item.index)&&!seen.has(item.index)));if(!options.length){stack.pop();continue;}const {dir,index}=options[0];seen.add(index);links[current].push({index,direction:dir});links[index].push({index:current,direction:OPP[dir]});stack.push(index);}
  return links;
}
function treePath(tree,start,target){const prev=new Map([[start,null]]),queue=[start];for(let h=0;h<queue.length&&!prev.has(target);h++){for(const edge of tree[queue[h]])if(!prev.has(edge.index)){prev.set(edge.index,{index:queue[h],direction:edge.direction});queue.push(edge.index);}}if(!prev.has(target))return[];const path=[];let at=target;while(at!==start){const step=prev.get(at);path.push({from:step.index,to:at,direction:step.direction});at=step.index;}return path.reverse();}

export function poweredPipes(board,size,sources){
  const reached=new Set(),queue=[];
  for(const source of sources){const at=key(source.row,source.col,size);if(ports(board[at]).includes(source.side)&&!reached.has(at)){reached.add(at);queue.push(at);}}
  for(let h=0;h<queue.length;h++){const at=queue[h];for(const dir of ports(board[at])){const next=neighbor(at,dir,size);if(next>=0&&board[next]&&!reached.has(next)&&ports(board[next]).includes(OPP[dir])){reached.add(next);queue.push(next);}}}
  return reached;
}

export function createCircuitLevel(difficulty,level=1){
  const config=CONFIG[difficulty];if(!config||!Number.isInteger(level)||level<1)throw new RangeError("Choose Easy, Medium, or Hard and a positive level.");
  const size=config.size;const sourceRows=config.terminals[0]===1?[Math.floor(size/2)]:[1,size-2];const outputRows=config.terminals[1]===1?[Math.floor(size/2)]:[Math.floor(size/3),Math.ceil((size*2)/3)];
  const sources=sourceRows.map(row=>({row,col:0,side:"W"}));const outputs=outputRows.map(row=>({row,col:size-1,side:"E"}));const terminalCells=new Set([...sources,...outputs].map(item=>key(item.row,item.col,size)));
  const maxObstacles=Math.floor(size*size*.39);const obstaclesCount=Math.min(config.baseObstacles+Math.min(level-1,6),maxObstacles);
  let board=null;let obstacles=null;let solvedTemplate=null;
  for(let attempt=0;attempt<800;attempt++){
    const candidates=shuffled(Array.from({length:size*size},(_,i)=>i).filter(i=>!terminalCells.has(i)));
    obstacles=new Set(candidates.slice(0,obstaclesCount));if(!allConnected(size,obstacles))continue;
    const tree=spanningTree(size,obstacles);const network=new Map();
    const addPort=(cell,dir)=>{if(!network.has(cell))network.set(cell,new Set());network.get(cell).add(dir);};
    const terminals=[...sources,...outputs];const root=key(terminals[0].row,terminals[0].col,size);
    for(const terminal of terminals){const cell=key(terminal.row,terminal.col,size);for(const edge of treePath(tree,root,cell)){addPort(edge.from,edge.direction);addPort(edge.to,OPP[edge.direction]);}addPort(cell,terminal.side);}
    solvedTemplate=Array.from({length:size*size},(_,cell)=>obstacles.has(cell)?null:{ports:network.has(cell)?[...network.get(cell)]:SHAPES[Math.floor(Math.random()*SHAPES.length)],isNetwork:network.has(cell)});
    const scrambleTurns=()=>Math.floor(Math.random()*4);
    board=solvedTemplate.map(tile=>tile?{ports:tile.ports,turns:scrambleTurns(),isNetwork:tile.isNetwork}:null);
    break;
  }
  if(!board||!solvedTemplate)throw new Error(`Could not build a valid ${size}×${size} circuit. Please retry.`);
  const playable=board.filter(Boolean).length;
  const requiredMoves=board.reduce((total,tile)=>total+(tile?(4-tile.turns)%4:0),0);
  const maxMoves=requiredMoves+Math.max(5,Math.ceil(playable*.2));
  return{size,level,board,sources,outputs,obstacles,obstacleCount:obstacles.size,maxMoves,timeLimit:Math.max(58,config.time-Math.min(level-1,7)*3),requiredMoves,routeTileCount:board.filter(tile=>tile?.isNetwork).length};
}

function tilePorts(group,tile,color){
  const pipeMaterial=material(color,.48,.38);sphere(group,0,.47,0,.13,color,10);
  const vectors={N:[0,-.42],E:[.42,0],S:[0,.42],W:[-.42,0]};
  for(const dir of tile.ports){const [x,z]=vectors[dir];const rod=cylinder(group,x*.52,.47,z*.52,.075,.09,.58,color,9);rod.rotation.z=x?Math.PI/2:0;rod.rotation.x=z?Math.PI/2:0;rod.rotation.y=x||z?0:0;rod.userData.pipe=true;rod.material=pipeMaterial;}
}

export function startCircuit({world,root,ui,difficulty,replay}){
  const cfg=CONFIG[difficulty];let levelNum=1,level=createCircuitLevel(difficulty,levelNum),moves=0,timeLeft=level.timeLimit,finished=false,timer=0;
  const size=level.size,spacing=1.28,offset=(size-1)*spacing/2;let powerEnabled=false;
  world.camera.position.set(0,size*1.55,size*1.75);world.camera.lookAt(0,.2,0);world.camera.updateProjectionMatrix();
  const plinth=box(world.scene,0,-.55,0,size*spacing+1.1,.7,size*spacing+1.1,"#655f55");plinth.material.roughness=.94;
  addGroundGrid(world.scene,size*spacing+2,size+2,"#867c6e");
  addStickman(world.scene,-size*spacing/2-1.1,0,"#88745e");
  addStickman(world.scene,size*spacing/2+1.1,0,"#71818a");
  const tiles=[];const rayTargets=[];
  const boardMat=material("#d5c7ad",.82);
  const obstacleMat=material("#383632",.91);
  const muted="#849197";const poweredColor="#c8a97e";
  function drawBoard(){
    for(const old of tiles){world.scene.remove(old.group);}tiles.length=0;rayTargets.length=0;
    level.board.forEach((tile,index)=>{
      const row=Math.floor(index/size),col=index%size;const x=col*spacing-offset,z=row*spacing-offset;
      const group=new THREE.Group();group.position.set(x,0,z);group.userData.index=index;world.scene.add(group);
      const plate=box(world.scene,0,.05,0,spacing*.91,.2,spacing*.91,tile?"#918778":"#383632",{parent:group});plate.material=tile?boardMat:obstacleMat;plate.userData.index=index;group.userData.plate=plate;rayTargets.push(plate);
      if(tile){
        const isSource=level.sources.some(t=>key(t.row,t.col,size)===index);const isOutput=level.outputs.some(t=>key(t.row,t.col,size)===index);
        const tint=isSource?"#a98054":isOutput?"#708f9c":muted;tilePorts(group,tile,tint);group.rotation.y=-tile.turns*Math.PI/2;
        const marker=sphere(world.scene,0,.61,0,.17,isSource?"#d3ad79":isOutput?"#96b3bf":"#939d99",10,{parent:group});marker.scale.set(.72,.72,.72);marker.visible=false;group.userData.powerMarker=marker;
        if(isSource){const post=cylinder(world.scene,-.5,.55,0,.07,.09,.92,"#a98054",9,{parent:group});post.rotation.z=Math.PI/2;}
        if(isOutput){const post=cylinder(world.scene,.5,.55,0,.07,.09,.92,"#718f9c",9,{parent:group});post.rotation.z=Math.PI/2;}
      }else{
        const block=box(world.scene,0,.28,0,.62,.48,.62,"#504d48",{parent:group});block.rotation.y=Math.PI/4;
        box(world.scene,0,.54,0,.52,.055,.055,"#777169",{parent:group}).rotation.y=Math.PI/4;
        box(world.scene,0,.54,0,.52,.055,.055,"#777169",{parent:group}).rotation.y=-Math.PI/4;
      }
      tiles.push({group,plate,index,tile});
    });
    updatePower();
  }
  function updatePower(){
    const powered=powerEnabled?poweredPipes(level.board,size,level.sources):new Set();
    for(const {group,index,tile,plate} of tiles){if(!tile)continue;const live=powered.has(index);group.userData.powerMarker.visible=live;plate.material.color.set(live?"#b9a17d":"#918778");for(const child of group.children){if(child.userData.pipe)child.material.color.set(live?poweredColor:muted);if(child.geometry?.type==="SphereGeometry"&&child!==group.userData.powerMarker)child.material.color.set(live?poweredColor:muted);}}
    const online=level.outputs.filter(output=>powered.has(key(output.row,output.col,size))&&ports(level.board[key(output.row,output.col,size)]).includes(output.side)).length;
    ui.querySelector("[data-circuit-flow]").textContent=online===level.outputs.length?"All cores powered":`${online} of ${level.outputs.length} cores powered`;
    ui.querySelector("[data-circuit-flow]").classList.toggle("success",online===level.outputs.length);
    if(online===level.outputs.length&&!finished)finish(true);
  }
  function renderHud(){
    ui.innerHTML=`<section class="circuit3d-hud"><div class="circuit3d-hud-top"><div><span class="mode-eyebrow">${difficulty.toUpperCase()} · ${size} × ${size} GRID</span><h3>Level ${String(levelNum).padStart(2,"0")}</h3></div></div><div class="circuit3d-stats"><div><small>POWER</small><b data-circuit-flow>Grid offline</b></div><div><small>MOVES</small><b><span data-circuit-moves>${level.maxMoves}</span> / ${level.maxMoves}</b></div><div><small>TIME</small><b data-circuit-time>${clock(timeLeft)}</b></div><div><small>OBSTACLES</small><b>${level.obstacleCount}</b></div></div><p class="circuit3d-help">Click any 3D pipe to rotate it clockwise. Every power source starts dark.</p><div class="circuit3d-result" data-circuit-result hidden></div></section>`;
  }
  function finish(won,reason=""){
    if(finished)return;finished=true;clearInterval(timer);
    const result=ui.querySelector("[data-circuit-result]");result.hidden=false;
    if(won){result.innerHTML=`<div><span>NETWORK COMPLETE</span><b>Board solved.</b><small>${moves} moves · ${clock(timeLeft)} left · ${level.routeTileCount} route pipes · ${level.obstacleCount} obstacles</small></div><button data-circuit-next>Next level ↗</button>`;}
    else result.innerHTML=`<div><span>GRID OFFLINE</span><b>${reason}</b><small>Level ${String(levelNum).padStart(2,"0")} · ${moves} moves used</small></div><button data-circuit-retry>Retry level ↻</button>`;
    result.querySelector("[data-circuit-next]")?.addEventListener("click",()=>startLevel(levelNum+1));result.querySelector("[data-circuit-retry]")?.addEventListener("click",()=>startLevel(levelNum));
  }
  function startLevel(next){clearInterval(timer);powerEnabled=false;levelNum=next;level=createCircuitLevel(difficulty,levelNum);moves=0;timeLeft=level.timeLimit;finished=false;renderHud();drawBoard();timer=window.setInterval(()=>{if(finished)return;timeLeft-=1;ui.querySelector("[data-circuit-time]").textContent=clock(timeLeft);if(timeLeft<=0)finish(false,"Time expired");},1000);}
  const onPointer=(event)=>{if(finished||event.button!==0)return;const hit=world.pick(event,rayTargets)[0];if(!hit)return;const tileIndex=hit.object.userData.index;const tile=level.board[tileIndex];if(!tile)return;tile.turns=(tile.turns+1)%4;moves+=1;powerEnabled=true;ui.querySelector("[data-circuit-moves]").textContent=Math.max(0,level.maxMoves-moves);const target=tiles.find(t=>t.index===tileIndex);target.group.rotation.y-=Math.PI/2;updatePower();if(!finished&&moves>=level.maxMoves)finish(false,"Move limit reached");};
  world.renderer.domElement.addEventListener("pointerup",onPointer);startLevel(1);
  return()=>{clearInterval(timer);world.renderer.domElement.removeEventListener("pointerup",onPointer);};
}

function clock(seconds){return`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;}
