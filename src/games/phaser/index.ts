import Phaser from "phaser";
import type { GameInfo } from "../../data/games";

const W = 1000, H = 680;
const PALETTE = [0xf06f63, 0x5fa7ed, 0x72c88a, 0xf1bd61, 0xb28be9, 0x4cc7bd];
const hex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function randomFrom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s += 0x6d2b79f5; let t=s; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}

type Run = { game: GameInfo; level: number; seed: number; onMoves?: (moves:number)=>void; onSolved?: ()=>void };
type Block = { x:number; y:number; len:number; dir:"h"|"v"; target?:boolean };

class PuzzleScene extends Phaser.Scene {
  static firstRun: Run;
  private run!: Run;
  private random = randomFrom(1);
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private state:any = {};
  private history:string[] = [];
  private cursor=0;
  private metrics={x:0,y:0,size:50,cols:0,rows:0};
  private flowDrag:number|null=null;
  private dotDrag:number[]=[];
  private blockDrag:{index:number;startX:number;startY:number;last:number;snapshot:string}|null=null;
  private completedNotified=false;
  constructor(){super({key:"puzzle"});}
  init(data?:Run){this.run=data?.game?data:PuzzleScene.firstRun;this.random=randomFrom(this.run.seed);this.history=[];this.flowDrag=null;this.dotDrag=[];this.blockDrag=null;this.completedNotified=false;this.state={moves:0,done:false,score:0};}
  create(){
    this.g=this.add.graphics();
    this.makePuzzle();
    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>this.pointerDown(p.worldX,p.worldY));
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>{if(p.isDown)this.pointerMove(p.worldX,p.worldY);});
    this.input.on("pointerup",()=>this.pointerUp());
    this.input.keyboard?.on("keydown-Z",()=>this.undo());
    this.draw();
  }
  private makePuzzle(){
    const id=this.run.game.id,r=this.random;
    if(id==="flow-free")this.makeFlow();
    if(id==="two-dots")this.makeTwoDots();
    if(id==="nuts-and-bolts")this.makeNuts();
    if(id==="circuit-break")this.makeCircuit();
    if(id==="unblock-me")this.makeUnblock();
  }
  private makeFlow(){
    const size=5+Math.min(3,Math.floor((this.run.level-1)/35)),total=size*size,pairs=Math.min(6,Math.max(3,Math.floor(total/9)));
    const snake:number[]=[];
    for(let y=0;y<size;y++){const xs=Array.from({length:size},(_,x)=>x);if(y%2)xs.reverse();for(const x of xs)snake.push(y*size+x);}
    const endpoints:number[][]=[],paths:number[][]=[];
    for(let color=0;color<pairs;color++){const a=Math.floor(color*total/pairs),b=Math.floor((color+1)*total/pairs)-1;paths.push([]);endpoints.push([snake[a],snake[b]]);}
    this.state={...this.state,cols:size,rows:size,endpoints,paths};
    this.metrics=this.gridMetrics(size,size,520,440);
  }
  private makeTwoDots(){
    const size=6+Math.min(2,Math.floor((this.run.level-1)/40));
    let cells:number[]=[];
    for(let tries=0;tries<12;tries++){cells=Array.from({length:size*size},()=>Math.floor(this.random()*5));if(cells.some((v,i)=>i%size<size-1&&cells[i+1]===v||i+size<cells.length&&cells[i+size]===v))break;}
    const counts=Array(5).fill(0);for(const v of cells)counts[v]++;
    const targetColors=Array.from({length:2},(_,i)=>(i*2+Math.floor(this.random()*2))%5);
    const goals=targetColors.map((c)=>Math.max(3,Math.floor(counts[c]*.45)));
    this.state={...this.state,cells,cols:size,rows:size,goals,targetColors,movesLeft:24+Math.floor(this.run.level/12)};
    this.metrics=this.gridMetrics(size,size,470,470);
  }
  private makeNuts(){
    const stacks:number[][]=[];for(let color=0;color<4;color++)stacks.push(Array(4).fill(color));stacks.push([],[]);
    let validMoves=0;
    for(let i=0;i<95;i++){
      const from=Math.floor(this.random()*stacks.length),to=Math.floor(this.random()*stacks.length);
      if(from===to||!stacks[from].length||stacks[to].length>=4)continue;
      const nut=stacks[from].pop()!;stacks[to].push(nut);
      if(this.nutsSolved(stacks)){stacks[to].pop();stacks[from].push(nut);continue;}
      validMoves++;
    }
    if(validMoves<12){stacks.splice(0,stacks.length, [0,1,0,2],[1,2,1,3],[2,3,2,0],[3,0,3,1],[],[]);}
    this.state={...this.state,stacks,selected:-1};
    this.metrics={x:0,y:0,size:76,cols:6,rows:4};
  }
  private makeCircuit(){
    const size=5+Math.min(2,Math.floor((this.run.level-1)/28)),path:number[]=[];
    for(let y=0;y<size;y++){const xs=Array.from({length:size},(_,x)=>x);if(y%2)xs.reverse();for(const x of xs)path.push(y*size+x);}
    const ports:number[][]=Array.from({length:size*size},()=>[]);
    for(let i=0;i<path.length;i++){
      const here=path[i],x=here%size,y=Math.floor(here/size),wanted:number[]=[];
      if(i>0){const before=path[i-1],bx=before%size,by=Math.floor(before/size);wanted.push(bx<x?3:bx>x?1:by<y?0:2);}
      if(i<path.length-1){const after=path[i+1],ax=after%size,ay=Math.floor(after/size);wanted.push(ax<x?3:ax>x?1:ay<y?0:2);}
      ports[here]=wanted;
    }
    const rotations=ports.map((p,i)=>i===path[0]||i===path.at(-1)?0:Math.floor(this.random()*4));
    if(rotations.slice(1,-1).every((v)=>v===0))rotations[1]=1;
    this.state={...this.state,cols:size,rows:size,path,ports,rotations,source:path[0],goal:path.at(-1)};
    this.metrics=this.gridMetrics(size,size,490,470);
  }
  private makeUnblock(){
    const base:Block[]=[
      {x:0,y:2,len:2,dir:"h",target:true},{x:2,y:0,len:3,dir:"v"},
      {x:0,y:0,len:2,dir:"h"},{x:3,y:0,len:2,dir:"h"},{x:3,y:1,len:2,dir:"v"},
      {x:0,y:3,len:2,dir:"h"},{x:5,y:1,len:2,dir:"v"},{x:2,y:4,len:2,dir:"h"},{x:4,y:3,len:3,dir:"v"},
    ];
    const blocks=copy(base);
    for(let i=0;i<34;i++){
      const index=1+Math.floor(this.random()*(blocks.length-1)),b=blocks[index],dir=b.dir==="h"?1:0;
      const amount=this.random()<.5?-1:1,nx=b.x+(dir?amount:0),ny=b.y+(dir?0:amount);
      if(this.canPlace(blocks,index,nx,ny)) { b.x=nx;b.y=ny; }
    }
    this.state={...this.state,blocks,selected:-1};
    this.metrics=this.gridMetrics(6,6,520,480);
  }
  private gridMetrics(cols:number,rows:number,maxW:number,maxH:number){const size=Math.min(maxW/cols,maxH/rows,78);return{x:(W-cols*size)/2,y:150+(470-rows*size)/2,size,cols,rows};}
  private save(){this.history.push(JSON.stringify(this.state));if(this.history.length>120)this.history.shift();}
  undo(){if(!this.history.length)return;this.state=JSON.parse(this.history.pop()!);this.flowDrag=null;this.dotDrag=[];this.blockDrag=null;this.draw();this.pulse(false);this.run.onMoves?.(this.state.moves||0);}
  private pulse(good=true){if(good)this.cameras.main.flash(90,245,231,188,false);else this.cameras.main.shake(90,.0015);}
  private markMove(){this.state.moves++;this.run.onMoves?.(this.state.moves);}
  private markSolved(){if(this.completedNotified)return;this.state.done=true;this.completedNotified=true;this.run.onSolved?.();this.pulse(true);this.draw();}
  private cellAt(x:number,y:number){const {x:ox,y:oy,size,cols,rows}=this.metrics;if(x<ox||y<oy||x>=ox+cols*size||y>=oy+rows*size)return-1;return Math.floor((y-oy)/size)*cols+Math.floor((x-ox)/size);}
  private center(index:number){const {x,y,size,cols}=this.metrics;return{x:x+(index%cols+.5)*size,y:y+(Math.floor(index/cols)+.5)*size};}
  private pointerDown(x:number,y:number){if(this.state.done)return;const id=this.run.game.id,index=this.cellAt(x,y);if(id==="flow-free"){this.flowStart(index);return;}if(id==="two-dots"){this.dotStart(index);return;}if(id==="circuit-break"){this.circuitTap(index);return;}if(id==="nuts-and-bolts"){this.nutTap(x,y);return;}if(id==="unblock-me")this.blockStart(x,y);}
  private pointerMove(x:number,y:number){if(this.flowDrag!==null){this.flowExtend(this.cellAt(x,y));return;}if(this.dotDrag.length){this.dotExtend(this.cellAt(x,y));return;}if(this.blockDrag)this.blockMove(x,y);}
  private pointerUp(){if(this.flowDrag!==null){this.flowFinish();return;}if(this.dotDrag.length){this.dotFinish();return;}if(this.blockDrag)this.blockFinish();}

  private flowStart(cell:number){
    if(cell<0)return;const color=this.state.endpoints.findIndex((ends:number[])=>ends.includes(cell));if(color<0)return;
    this.save();const existing=this.state.paths[color]||[];const start=existing.includes(cell)?cell:cell;
    this.flowDrag=color;this.state.flowFrom=start;this.state.paths[color]=[start];this.draw();
  }
  private flowExtend(cell:number){
    if(cell<0)return;const color=this.flowDrag!,path=this.state.paths[color];if(path.at(-1)===cell)return;
    if(path.length>1&&path[path.length-2]===cell){path.pop();this.draw();return;}
    const cols=this.state.cols,last=path.at(-1)!;if(Math.abs(last%cols-cell%cols)+Math.abs(Math.floor(last/cols)-Math.floor(cell/cols))!==1)return;
    const occupied=this.state.paths.some((p:number[],i:number)=>i!==color&&p.includes(cell));if(occupied)return;
    if(path.includes(cell)&&!this.state.endpoints[color].includes(cell))return;
    const other=this.state.endpoints[color].find((v:number)=>v!==this.state.flowFrom);
    if(this.state.endpoints.some((ends:number[],i:number)=>i!==color&&ends.includes(cell)))return;
    path.push(cell);this.draw();if(cell===other){this.state.paths[color]=path;this.flowDrag=null;this.state.flowFrom=null;this.markMove();this.draw();if(this.flowSolved())this.markSolved();}
  }
  private flowFinish(){if(this.flowDrag===null)return;const color=this.flowDrag;this.flowDrag=null;this.state.flowFrom=null;if(this.state.paths[color]?.length<2){this.history.pop();this.state.paths[color]=[];}this.draw();}
  private flowSolved(){const all=this.state.paths.flat();return this.state.paths.every((p:number[],i:number)=>p.length>=2&&p.at(-1)===this.state.endpoints[i].find((v:number)=>v!==p[0]))&&new Set(all).size===this.state.cols*this.state.rows;}

  private dotStart(cell:number){if(cell<0)return;this.dotDrag=[cell];this.draw();}
  private dotExtend(cell:number){const path=this.dotDrag;if(cell<0||path.at(-1)===cell)return;if(path.length>1&&path[path.length-2]===cell){path.pop();this.draw();return;}const cols=this.state.cols,last=path.at(-1)!;if(Math.abs(last%cols-cell%cols)+Math.abs(Math.floor(last/cols)-Math.floor(cell/cols))!==1)return;if(this.state.cells[cell]!==this.state.cells[path[0]]||path.includes(cell))return;path.push(cell);this.draw();}
  private dotFinish(){const path=this.dotDrag;this.dotDrag=[];if(path.length<2){this.draw();return;}const color=this.state.cells[path[0]],cols=this.state.cols,closed=path.length>=4&&Math.abs(path.at(-1)!%cols-path[0]%cols)+Math.abs(Math.floor(path.at(-1)!/cols)-Math.floor(path[0]/cols))===1;this.save();this.markMove();this.state.movesLeft--;
    const cleared=closed?this.state.cells.map((v:number,i:number)=>v===color?i:-1).filter((i:number)=>i>=0):path;
    const unique=[...new Set(cleared)];this.state.cells=this.state.cells.map((v:number,i:number)=>unique.includes(i)?-1:v);
    const goalIndex=this.state.targetColors.indexOf(color);if(goalIndex>=0)this.state.goals[goalIndex]=Math.max(0,this.state.goals[goalIndex]-unique.length);
    for(let x=0;x<cols;x++){const values:number[]=[];for(let y=cols-1;y>=0;y--){const v=this.state.cells[y*cols+x];if(v>=0)values.push(v);}while(values.length<cols)values.push(Math.floor(this.random()*5));for(let y=cols-1;y>=0;y--)this.state.cells[y*cols+x]=values[cols-1-y];}
    this.draw();if(this.state.goals.every((n:number)=>n===0))this.markSolved();else if(this.state.movesLeft<=0)this.state.movesLeft=24+Math.floor(this.run.level/12);
  }

  private circuitTap(cell:number){if(cell<0||cell===this.state.source||cell===this.state.goal)return;this.save();this.state.rotations[cell]=(this.state.rotations[cell]+1)%4;this.markMove();this.draw();if(this.circuitConnected())this.markSolved();else this.pulse(false);}
  private rotatedPorts(cell:number){return this.state.ports[cell].map((p:number)=>(p+this.state.rotations[cell])%4);}
  private circuitConnected(){const cols=this.state.cols,seen=new Set<number>([this.state.source]),queue=[this.state.source],dirs=[[0,-1],[1,0],[0,1],[-1,0]];while(queue.length){const here=queue.shift()!,x=here%cols,y=Math.floor(here/cols);for(const port of this.rotatedPorts(here)){const nx=x+dirs[port][0],ny=y+dirs[port][1],next=ny*cols+nx;if(nx<0||ny<0||nx>=cols||ny>=this.state.rows)continue;if(this.rotatedPorts(next).includes((port+2)%4)&&!seen.has(next)){seen.add(next);queue.push(next);}}}return seen.has(this.state.goal);}

  private nutTap(x:number,y:number){const stacks=this.state.stacks,spacing=92,ox=(W-spacing*stacks.length+spacing)/2,idx=Math.floor((x-(ox-spacing/2))/spacing);if(idx<0||idx>=stacks.length||y<210||y>550)return;const source=this.state.selected;if(source<0){if(stacks[idx].length){this.state.selected=idx;this.draw();}return;}if(source===idx){this.state.selected=-1;this.draw();return;}if(!stacks[source].length||stacks[idx].length>=4)return;this.save();const nut=stacks[source].pop();stacks[idx].push(nut);this.state.selected=-1;this.markMove();this.draw();if(this.nutsSolved(stacks))this.markSolved();else this.pulse(true);}
  private nutsSolved(stacks:number[][]){return stacks.every((s)=>!s.length||s.length===4&&s.every((v:number)=>v===s[0]));}

  private occupied(blocks:Block[],x:number,y:number,ignore:number){return blocks.some((b,i)=>{if(i===ignore)return false;for(let k=0;k<b.len;k++)if((b.dir==="h"?b.x+k:b.x)===x&&(b.dir==="v"?b.y+k:b.y)===y)return true;return false;});}
  private canPlace(blocks:Block[],index:number,x:number,y:number){const b=blocks[index];if(x<0||y<0||x+(b.dir==="h"?b.len:1)>6||y+(b.dir==="v"?b.len:1)>6)return false;for(let k=0;k<b.len;k++)if(this.occupied(blocks,x+(b.dir==="h"?k:0),y+(b.dir==="v"?k:0),index))return false;return true;}
  private blockAt(x:number,y:number){const {x:ox,y:oy,size}=this.metrics,c=Math.floor((x-ox)/size),r=Math.floor((y-oy)/size);return this.state.blocks.findIndex((b:Block)=>b.dir==="h"?b.y===r&&c>=b.x&&c<b.x+b.len:b.x===c&&r>=b.y&&r<b.y+b.len);}
  private blockStart(x:number,y:number){const index=this.blockAt(x,y);if(index<0)return;this.blockDrag={index,startX:x,startY:y,last:0,snapshot:JSON.stringify(this.state)};this.state.selected=index;this.draw();}
  private blockMove(x:number,y:number){const drag=this.blockDrag;if(!drag)return;const block=this.state.blocks[drag.index],size=this.metrics.size,raw=block.dir==="h"?(x-drag.startX)/size:(y-drag.startY)/size,target=Math.trunc(raw);let delta=target-drag.last;if(!delta)return;const sign=Math.sign(delta);while(delta){const nx=block.x+(block.dir==="h"?sign:0),ny=block.y+(block.dir==="v"?sign:0);if(!this.canPlace(this.state.blocks,drag.index,nx,ny))break;if(drag.last===0)this.save();block.x=nx;block.y=ny;drag.last+=sign;delta-=sign;this.markMove();}this.draw();}
  private blockFinish(){this.blockDrag=null;this.state.selected=-1;this.draw();const target=this.state.blocks.find((b:Block)=>b.target);if(target&&target.x+target.len===6){this.markSolved();}}

  private draw(){
    if(!this.g||!this.state)return;this.g.clear();for(const label of this.labels)label.destroy();this.labels=[];
    const g=this.g;
    g.fillStyle(0x182322,1).fillRect(0,0,W,H);g.fillStyle(0x24302e,.54).fillEllipse(W/2,380,760,510);g.fillStyle(0xffffff,.018).fillRect(0,0,W,98);
    this.text(42,29,`${this.run.game.title.toUpperCase()}  ·  PUZZLE ${String(this.run.level).padStart(3,"0")}`,{fontFamily:"Arial",fontSize:"12px",color:"#c7d0c5",fontStyle:"bold",letterSpacing:2});
    const id=this.run.game.id;if(id==="flow-free")this.drawFlow();else if(id==="two-dots")this.drawTwoDots();else if(id==="nuts-and-bolts")this.drawNuts();else if(id==="circuit-break")this.drawCircuit();else this.drawUnblock();
    if(this.state.done){g.fillStyle(0x101816,.78).fillRoundedRect(255,275,490,130,20);this.text(W/2,314,"BEAUTIFULLY SOLVED",{fontFamily:"Arial",fontSize:"25px",color:"#f0d59a",fontStyle:"bold"}).setOrigin(.5);this.text(W/2,355,"Take the win. A fresh puzzle is ready when you are.",{fontFamily:"Arial",fontSize:"13px",color:"#d8ddd3"}).setOrigin(.5);}
  }
  private text(x:number,y:number,value:string,style:Phaser.Types.GameObjects.Text.TextStyle){const t=this.add.text(x,y,value,style);this.labels.push(t);return t;}
  private raised(x:number,y:number,w:number,h:number,face:number,radius=9){this.g.fillStyle(0x09100f,.45).fillRoundedRect(x+1,y+7,w,h,radius);this.g.fillStyle(0x53625b,.75).fillRoundedRect(x,y+3,w,h,radius);this.g.fillStyle(face,1).fillRoundedRect(x,y,w,h,radius);this.g.fillStyle(0xffffff,.075).fillRoundedRect(x+2,y+1,w-4,Math.max(5,h*.22),radius);}
  private gridBase(){const {x,y,size,cols,rows}=this.metrics,w=size*cols,h=size*rows;this.g.fillStyle(0x111a19,.55).fillRoundedRect(x-14,y-12,w+28,h+28,18);this.g.fillStyle(0x46544d,1).fillRoundedRect(x-10,y-10,w+20,h+20,16);this.g.fillStyle(0x273330,1).fillRoundedRect(x-7,y-7,w+14,h+14,13);for(let i=0;i<cols*rows;i++){const cx=x+(i%cols)*size,cy=y+Math.floor(i/cols)*size;this.g.fillStyle(0xffffff,.025).fillRoundedRect(cx+2,cy+2,size-4,size-4,4);}}

  private drawFlow(){
    const {x,y,size,cols,rows}=this.metrics;this.gridBase();
    for(let i=0;i<cols*rows;i++){const cx=x+(i%cols)*size,cy=y+Math.floor(i/cols)*size;this.g.lineStyle(1,0xc9e4e0,.1).strokeRoundedRect(cx+2,cy+2,size-4,size-4,3);}
    const occupied=new Set<number>();
    this.state.paths.forEach((path:number[],color:number)=>{if(path.length<2)return;path.forEach((cell,i)=>occupied.add(cell));const first=this.center(path[0]),c=PALETTE[color%PALETTE.length];this.g.lineStyle(size*.34,c,1).beginPath().moveTo(first.x,first.y);for(let i=1;i<path.length;i++){const p=this.center(path[i]);this.g.lineTo(p.x,p.y);}this.g.strokePath();this.g.lineStyle(size*.035,0xffffff,.38).beginPath().moveTo(first.x,first.y);for(let i=1;i<path.length;i++){const p=this.center(path[i]);this.g.lineTo(p.x,p.y);}this.g.strokePath();});
    this.state.endpoints.forEach((ends:number[],color:number)=>ends.forEach((cell:number)=>{const p=this.center(cell),c=PALETTE[color%PALETTE.length];this.g.fillStyle(0x07100f,.4).fillCircle(p.x,p.y+5,size*.31);this.g.fillStyle(c,1).fillCircle(p.x,p.y,size*.26);this.g.fillStyle(0xffffff,.45).fillCircle(p.x-size*.08,p.y-size*.09,size*.075);}));
    this.text(W/2,604,"DRAG FROM A DOT  ·  NO CROSSING  ·  FILL EVERY CELL",{fontFamily:"Arial",fontSize:"12px",color:"#afbbb2",fontStyle:"bold",letterSpacing:1}).setOrigin(.5);
  }
  private drawTwoDots(){
    const {x,y,size,cols}=this.metrics;this.gridBase();
    const cellSize=size*.67;
    for(let i=0;i<this.state.cells.length;i++){
      const col=i%cols,row=Math.floor(i/cols),cx=x+(col+.5)*size,cy=y+(row+.5)*size,c=this.state.cells[i];if(c<0)continue;
      const selected=this.dotDrag.includes(i);this.g.fillStyle(PALETTE[c],selected?1:.88).fillCircle(cx,cy,cellSize*(selected?.5:.38));this.g.fillStyle(0xffffff,selected?.28:.18).fillCircle(cx-cellSize*.12,cy-cellSize*.15,cellSize*.105);
      if(selected)this.g.fillStyle(0xffffff,.18).fillCircle(cx,cy,cellSize*.57);
    }
    const goalText=this.state.targetColors.map((c:number,i:number)=>`${this.state.goals[i]} ${["coral","blue","mint","sun","lilac"][c]}`).join("     ·     ");
    this.text(W/2,118,`MOVES LEFT  ${this.state.movesLeft}`,{fontFamily:"Arial",fontSize:"14px",color:"#e4e1d5",fontStyle:"bold",letterSpacing:1}).setOrigin(.5);
    this.text(W/2,610,`CLEAR  ${goalText}`,{fontFamily:"Arial",fontSize:"12px",color:"#f3c5d2",fontStyle:"bold",letterSpacing:1}).setOrigin(.5);
  }
  private drawNuts(){
    const stacks=this.state.stacks,spacing=104,ox=(W-spacing*stacks.length)/2+spacing/2,base=500,slotH=52;
    this.text(W/2,111,"MOVE A TOP NUT TO ANY OPEN SLOT · SORT BY COLOR",{fontFamily:"Arial",fontSize:"12px",color:"#b5c0b5",fontStyle:"bold",letterSpacing:1}).setOrigin(.5);
    this.text(W/2,148,"One empty bolt gives you room to plan.",{fontFamily:"Arial",fontSize:"13px",color:"#86958d"}).setOrigin(.5);
    stacks.forEach((stack:number[],i:number)=>{
      const cx=ox+i*spacing,selected=this.state.selected===i;
      this.g.fillStyle(0x070c0c,.48).fillRoundedRect(cx-36,base-4,72,34,16);this.g.fillStyle(0x53615e,1).fillRoundedRect(cx-33,base-9,66,29,14);this.g.fillStyle(0x242e2d,1).fillRoundedRect(cx-25,base-14,50,19,10);
      this.g.fillStyle(selected?0xe5cf9c:0x394642,1).fillRoundedRect(cx-39,base-4-slotH*4,78,slotH*4+6,14);this.g.fillStyle(selected?0xf0d9a9:0x7c8a80,1).fillRoundedRect(cx-34,base-slotH*4,68,slotH*4,11);this.g.fillStyle(0x252f2d,1).fillRoundedRect(cx-28,base-slotH*4+5,56,slotH*4-6,8);
      stack.forEach((color:number,j:number)=>{const yy=base-(j+1)*slotH+5;this.g.fillStyle(0x060b0b,.4).fillRoundedRect(cx-30,yy+5,60,slotH-8,17);this.g.fillStyle(PALETTE[color],1).fillRoundedRect(cx-30,yy,60,slotH-11,17);this.g.fillStyle(0xffffff,.23).fillRoundedRect(cx-27,yy+2,54,8,6);this.g.fillStyle(0x17201f,.68).fillCircle(cx,yy+22,9);this.g.fillStyle(0xe7ddc8,.9).fillCircle(cx,yy+22,4);});
      this.g.lineStyle(2,0xe7dfca,.22).strokeRoundedRect(cx-39,base-slotH*4,78,slotH*4,13);
      this.text(cx,base+24,stack.length?`${stack.length} / 4`:"OPEN",{fontFamily:"Arial",fontSize:"10px",color:stack.length?"#9faea5":"#dbca9e",fontStyle:"bold"}).setOrigin(.5);
    });
    if(this.nutsSolved(stacks))this.markSolved();
  }
  private drawCircuit(){
    const {x,y,size,cols}=this.metrics,ports=this.state.ports,rots=this.state.rotations,source=this.state.source,goal=this.state.goal,dirs=[[0,-1],[1,0],[0,1],[-1,0]],connected=new Set<number>([source]),queue=[source];
    while(queue.length){const cell=queue.shift()!,cx=cell%cols,cy=Math.floor(cell/cols);for(const p of this.rotatedPorts(cell)){const nx=cx+dirs[p][0],ny=cy+dirs[p][1],n=ny*cols+nx;if(nx>=0&&ny>=0&&nx<cols&&ny<this.state.rows&&this.rotatedPorts(n).includes((p+2)%4)&&!connected.has(n)){connected.add(n);queue.push(n);}}}
    this.state.connected=[...connected];
    this.gridBase();
    for(let i=0;i<cols*cols;i++){
      const cx=x+(i%cols)*size,cy=y+Math.floor(i/cols)*size,centerX=cx+size/2,centerY=cy+size/2,active=connected.has(i),c=active?0x61ddc4:0xc78b59;
      this.g.fillStyle(0x080f0e,.55).fillRoundedRect(cx+4,cy+8,size-8,size-8,10);this.g.fillStyle(0x64716a,1).fillRoundedRect(cx+3,cy+4,size-6,size-6,10);this.g.fillStyle(i===source?0x33493f:i===goal?0x524139:0x303a37,1).fillRoundedRect(cx+4,cy+2,size-8,size-8,9);this.g.fillStyle(0xffffff,.08).fillRoundedRect(cx+6,cy+3,size-12,8,5);
      const ends=this.rotatedPorts(i);this.g.lineStyle(size*.15,0x090f0e,.7).beginPath();ends.forEach((p:number)=>{this.g.moveTo(centerX+dirs[p][0]*size*.42,centerY+dirs[p][1]*size*.42);this.g.lineTo(centerX,centerY);});this.g.strokePath();
      this.g.lineStyle(size*.085,c,1).beginPath();ends.forEach((p:number)=>{this.g.moveTo(centerX+dirs[p][0]*size*.42,centerY+dirs[p][1]*size*.42);this.g.lineTo(centerX,centerY);});this.g.strokePath();
      this.g.fillStyle(active?0xa3ffea:0xe3b97e,1).fillCircle(centerX,centerY,size*.075);
      if(i===source){this.g.fillStyle(0xd5e8c1,1).fillCircle(centerX,centerY,size*.27);this.text(centerX,centerY,"+",{fontFamily:"Arial",fontSize:"27px",color:"#314739",fontStyle:"bold"}).setOrigin(.5);}
      if(i===goal){this.g.fillStyle(connected.has(i)?0xf2d982:0xb87d52,1).fillCircle(centerX,centerY,size*.27);this.text(centerX,centerY,"✦",{fontFamily:"Arial",fontSize:"23px",color:"#fff2c8"}).setOrigin(.5);}
    }
    this.text(W/2,610,"ROTATE EACH WIRE UNTIL POWER REACHES THE LAMP",{fontFamily:"Arial",fontSize:"12px",color:"#b5c4bb",fontStyle:"bold",letterSpacing:1}).setOrigin(.5);
    if(connected.has(goal))this.markSolved();
  }
  private drawUnblock(){
    const {x,y,size}=this.metrics;this.gridBase();
    for(let row=0;row<6;row++)for(let col=0;col<6;col++){const cx=x+col*size,cy=y+row*size;this.g.lineStyle(1,0xefe5d0,.08).strokeRoundedRect(cx+2,cy+2,size-4,size-4,4);}
    const target=this.state.blocks.find((b:Block)=>b.target)!;
    if(target.y===2){const laneY=y+2*size;this.g.fillStyle(0x93cd9c,.17).fillRoundedRect(x+6,laneY+size*.23,size*5.75,size*.54,12);this.g.fillStyle(0xaee1ac,.52).fillRoundedRect(x+size*5.55,laneY+size*.26,size*.43,size*.48,10);}
    this.state.blocks.forEach((b:Block,i:number)=>{
      const bx=x+b.x*size+(b.dir==="v"?size*.09:0),by=y+b.y*size+(b.dir==="h"?size*.09:0),bw=size*(b.dir==="h"?b.len:.82),bh=size*(b.dir==="v"?b.len:.82),selected=this.state.selected===i;
      const wood=b.target?0xc65d52:[0xb88551,0xd0a36b,0x96704c,0xc4935f,0x9d7956,0xd0ae7a][i%6];
      this.g.fillStyle(0x080c0b,.48).fillRoundedRect(bx+3,by+8,bw-2,bh-2,9);this.g.fillStyle(selected?0xf3d6a4:0x5d4834,1).fillRoundedRect(bx,by+4,bw,bh,9);this.g.fillStyle(wood,1).fillRoundedRect(bx+2,by,bw-4,bh-6,8);this.g.fillStyle(0xffffff,.19).fillRoundedRect(bx+5,by+3,bw-10,7,5);this.g.lineStyle(selected?3:1,selected?0xf5e1b8:0x412e22,.55).strokeRoundedRect(bx+2,by+2,bw-4,bh-8,7);
      const grain=b.dir==="h"?bw:bh;for(let k=0;k<3;k++){const off=(k+1)*grain/4;if(b.dir==="h")this.g.lineStyle(1,0x593e2a,.16).lineBetween(bx+off,by+11,bx+off+6,by+bh-15);else this.g.lineStyle(1,0x593e2a,.16).lineBetween(bx+11,by+off,bx+bw-15,by+off+6);}
      if(b.target){this.g.fillStyle(0xffe0c0,.85).fillCircle(bx+bw*.52,by+bh*.5,6);this.text(bx+bw*.52,by+bh*.5,"↗",{fontFamily:"Arial",fontSize:"13px",color:"#6e3933",fontStyle:"bold"}).setOrigin(.5);}
    });
    this.text(W/2,610,"DRAG EACH BLOCK ALONG ITS GRAIN · GUIDE RED OUT →",{fontFamily:"Arial",fontSize:"12px",color:"#d6c8a8",fontStyle:"bold",letterSpacing:1}).setOrigin(.5);
  }
}

export function mountPuzzleScene(parent:HTMLElement,run:Run){
  PuzzleScene.firstRun=run;
  return new Phaser.Game({type:Phaser.AUTO,parent,width:W,height:H,backgroundColor:"#182322",antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[PuzzleScene],render:{antialias:true,roundPixels:true}});
}
