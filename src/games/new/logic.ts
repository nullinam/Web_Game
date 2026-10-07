import type { Run } from "../phaser/run";
import type { GameController } from "../controller";
import "./style.css";

type Game = { render(): void; key(key: string): void; click(event: MouseEvent): void; tick(ms: number): void; lifeline(): void; score: number; state: "playing" | "won" | "lost"; message: string; progress: string; canHelp?: boolean };
type Context = { host: HTMLElement; run: Run; rng: () => number; win: () => void };

function random(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
function shuffle<T>(items: T[], rng: () => number) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
const difficulty = (run: Run) => run.difficulty ?? 1;

export function mountNewGame(parent: HTMLElement, initial: Run): GameController {
  const host = document.createElement("section"); host.className = "studio-game"; parent.appendChild(host);
  let run = initial, game: Game, paused = false, disposed = false, finished = false, frame = 0, last = performance.now(), elapsed = 0;
  const factories: Record<string, (ctx: Context) => Game> = { tetris: makeTetris, snake: makeSnake, "fruit-merge": makeFruit, "stack-tower": makeStack, "connect-four": makeConnect, sudoku: makeSudoku };
  function publish() {
    if (disposed) return;
    game.render();
    host.querySelector<HTMLElement>("[data-studio-message]")!.textContent = paused ? "Paused" : game.message;
    host.querySelector<HTMLElement>("[data-studio-score]")!.textContent = `Score ${game.score.toLocaleString()}`;
    host.querySelector<HTMLElement>("[data-studio-progress]")!.textContent = game.progress;
    host.querySelector<HTMLButtonElement>("[data-studio-pause]")!.textContent = paused ? "Resume" : "Pause";
    run.onStats?.({ score: game.score, best: 0, lives: 0, remaining: 0, total: 0, powerSeconds: 0, state: paused ? "paused" : game.state, progress: game.progress, message: game.message, canHelp: game.canHelp !== false });
    if (game.state === "won" && !finished) { finished = true; run.onSolved?.(game.score); }
  }
  function build() {
    finished = false; paused = false; elapsed = 0; last = performance.now();
    host.innerHTML = `<div class="studio-hud"><span data-studio-score></span><span data-studio-progress></span><button type="button" data-studio-pause>Pause</button></div><div class="studio-play" data-studio-play></div><p class="studio-message" data-studio-message role="status"></p>`;
    const factory = factories[run.gameId]; if (!factory) throw new Error(`Unsupported game ${run.gameId}`);
    game = factory({ host: host.querySelector<HTMLElement>("[data-studio-play]")!, run, rng: random(run.seed), win: () => { game.state = "won"; } });
    publish();
  }
  function onClick(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("[data-studio-pause]")) { if (game.state === "playing") { paused = !paused; last = performance.now(); publish(); } return; }
    if (!paused && game.state === "playing") { game.click(event); publish(); }
  }
  function onKey(event: KeyboardEvent) {
    if (disposed || paused || game.state !== "playing" || event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "SELECT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)) return;
    const k = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) event.preventDefault();
    if (k === "p") { paused = true; publish(); return; }
    game.key(k); publish();
  }
  function loop(now: number) {
    if (disposed) return;
    const ms = Math.max(0, Math.min(60, now - last)); last = now;
    if (!paused && game.state === "playing" && !document.hidden) { const before = `${game.state}|${game.message}|${game.progress}`; elapsed += ms; game.tick(ms); if (["connect-four", "sudoku"].includes(run.gameId)) { if (`${game.state}|${game.message}|${game.progress}` !== before) publish(); } else if (elapsed > 40) { elapsed = 0; publish(); } }
    frame = requestAnimationFrame(loop);
  }
  host.addEventListener("click", onClick); document.addEventListener("keydown", onKey);
  build(); frame = requestAnimationFrame(loop);
  return { restart(next) { run = next; build(); }, pause() { paused = true; publish(); }, resume() { paused = false; last = performance.now(); publish(); }, hint() {}, lifeline() { if (!paused && game.state === "playing") { game.lifeline(); publish(); } }, getScore: () => game.score, destroy() { disposed = true; cancelAnimationFrame(frame); host.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); host.remove(); } };
}

const TETROMINOES = [
  [[0,1],[1,1],[2,1],[3,1]], [[0,0],[0,1],[1,1],[2,1]], [[2,0],[0,1],[1,1],[2,1]],
  [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[0,1],[1,1]], [[1,0],[0,1],[1,1],[2,1]], [[0,0],[1,0],[1,1],[2,1]],
];
const TETRIS_COLORS = ["#86cedb", "#9caeef", "#edb083", "#edd188", "#9fd8a2", "#bfa6dc", "#e59a9e"];
function makeTetris({ host, run, rng }: Context): Game {
  const W = 10, H = 20, grid = Array.from({length:H}, () => Array(W).fill(-1));
  let bag: number[] = [], next = -1, piece = { type: 0, cells: TETROMINOES[0], x: 3, y: 0 }, fall = 0, lines = 0, score = 0;
  let state: Game["state"] = "playing", message = "Clear full rows. Space drops immediately.";
  const draw = (type: number) => TETRIS_COLORS[type];
  const pull = () => { if (!bag.length) bag = shuffle([0,1,2,3,4,5,6], rng); return bag.pop()!; };
  const valid = (cells: number[][], x: number, y: number) => cells.every(([cx,cy]) => x + cx >= 0 && x + cx < W && y + cy < H && (y + cy < 0 || grid[y+cy][x+cx] < 0));
  const spawn = () => { piece = {type:next, cells:TETROMINOES[next].map(p=>[...p]), x:3,y:0}; next=pull(); if (!valid(piece.cells,piece.x,piece.y)) { state="lost"; message="The stack reached the top. Restart this board."; } };
  next=pull(); spawn();
  const settle = () => { for (const [cx,cy] of piece.cells) if (piece.y+cy >= 0) grid[piece.y+cy][piece.x+cx]=piece.type; let cleared=0; for (let y=H-1;y>=0;y--) if (grid[y].every(v=>v>=0)) {grid.splice(y,1);grid.unshift(Array(W).fill(-1));cleared++;y++;} if (cleared) { lines+=cleared; score += [0,100,300,500,800][cleared] * (1+difficulty(run)); message=`${cleared} line${cleared>1?"s":""} cleared.`; } else score+=10; if (lines>=run.size) {state="won";message="Line target cleared!";} else spawn(); };
  const step = () => { if (valid(piece.cells,piece.x,piece.y+1)) piece.y++; else settle(); };
  const rotate = () => { const rotated=piece.cells.map(([x,y])=>[3-y,x]); for (const dx of [0,-1,1,-2,2]) if (valid(rotated,piece.x+dx,piece.y)) {piece.cells=rotated;piece.x+=dx;break;} };
  const game: Game = {
    get score(){return score}, get state(){return state}, set state(v){state=v}, get message(){return message}, get progress(){return `${lines}/${run.size} lines · Next ${["I","J","L","O","S","T","Z"][next]}`}, get canHelp(){return grid.some(row=>row.some(v=>v>=0))},
    render(){ const display=grid.map(row=>[...row]); let gy=piece.y; while(valid(piece.cells,piece.x,gy+1)) gy++; for(const [cx,cy] of piece.cells) if(gy+cy>=0) display[gy+cy][piece.x+cx]=-2; for(const [cx,cy] of piece.cells) if(piece.y+cy>=0) display[piece.y+cy][piece.x+cx]=piece.type; host.innerHTML=`<div class="tetris-frame"><div class="tetris-grid">${display.flat().map(v=>`<i class="tetris-cell ${v===-2?"ghost":v>=0?"filled":""}" style="--cell-color:${v<0?"transparent":draw(v)}"></i>`).join("")}</div><div class="tetris-side"><strong>NEXT</strong><div class="tetris-next">${TETROMINOES[next].map(()=>`<i style="background:${draw(next)}"></i>`).join("")}</div><span>↑ rotate<br>← → move<br>↓ down<br>Space drop</span></div></div>`; },
    key(k){ if(k==="arrowleft"||k==="a") {if(valid(piece.cells,piece.x-1,piece.y))piece.x--;} else if(k==="arrowright"||k==="d") {if(valid(piece.cells,piece.x+1,piece.y))piece.x++;} else if(k==="arrowup"||k==="w")rotate(); else if(k==="arrowdown"||k==="s")step(); else if(k===" ") {let dropped=0;while(valid(piece.cells,piece.x,piece.y+1)){piece.y++;dropped++;}score+=dropped*2;settle();} },
    click(){}, tick(ms){fall+=ms; if(fall>Math.max(95,700-difficulty(run)*170-run.level*5)){fall=0;step();}},
    lifeline(){let row=-1;for(let i=0;i<grid.length;i++)if(grid[i].some(v=>v>=0))row=i;if(row>=0){grid.splice(row,1);grid.unshift(Array(W).fill(-1));message="The lowest occupied row was cleared.";}else message="The board is already clear.";}
  }; return game;
}

function makeSnake({host,run,rng}:Context):Game {
  const N=18, cell=(x:number,y:number)=>y*N+x;
  let body=[cell(8,9),cell(7,9),cell(6,9)], direction=[1,0], queued=[1,0], food=-1, score=0, eaten=0, clock=0, slow=0;
  let state:Game["state"]="playing", message="Eat the fruit and avoid your trail.";
  const obstacles=new Set<number>(); if(difficulty(run)>=2) {for(let i=0;i<Math.min(22,run.level+8);i++){const pos=Math.floor(rng()*N*N);if(Math.abs(pos%N-8)>3&&Math.abs(Math.floor(pos/N)-9)>3)obstacles.add(pos);}}
  const addFood=()=>{const open=Array.from({length:N*N},(_,i)=>i).filter(i=>!body.includes(i)&&!obstacles.has(i)); food=open[Math.floor(rng()*open.length)]??-1;}; addFood();
  const move=()=>{direction=queued;const head=body[0],nx=head%N+direction[0],ny=Math.floor(head/N)+direction[1], p=cell(nx,ny),grow=p===food;if(nx<0||ny<0||nx>=N||ny>=N||obstacles.has(p)||body.slice(0,grow?undefined:-1).includes(p)){state="lost";message="The snake crashed. Restart to retry.";return;}body.unshift(p);if(grow){eaten++;score+=100;message="Fruit collected.";if(eaten>=run.size){state="won";message="Food target reached!";}else addFood();}else body.pop();};
  return {get score(){return score},get state(){return state},set state(v){state=v},get message(){return message},get progress(){return `${eaten}/${run.size} fruit · Length ${body.length}`},
    render(){const b=new Set(body);host.innerHTML=`<div class="snake-grid">${Array.from({length:N*N},(_,i)=>`<i class="snake-cell ${i===body[0]?"head":b.has(i)?"body":i===food?"food":obstacles.has(i)?"rock":""}"></i>`).join("")}</div>`;},
    key(k){const dirs:Record<string,number[]>={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};const d=dirs[k];if(d&&d[0]!==-direction[0]&&d[1]!==-direction[1])queued=d;},click(){},tick(ms){clock+=ms;if(slow>0)slow-=ms;const speed=(Math.max(75,205-difficulty(run)*35-run.level*2))*(slow>0?1.8:1);if(clock>=speed){clock=0;move();}},lifeline(){slow=12000;message="Snake slowed for 12 seconds.";}};
}

type Fruit = {x:number;y:number;vx:number;vy:number;r:number;tier:number;id:number};
function makeFruit({host,run,rng}:Context):Game {
  const W=540,H=500, radii=[17,23,29,36,44,53,63,74,86,99,114], colors=["#93b8e0","#b69bdd","#efd189","#eda77c","#d7a575","#d69fc4","#c1d489","#e0b185","#eed576","#b9d797","#9bd2b6"];
  let fruits:Fruit[]=[], nextId=0,nextTier=Math.floor(rng()*3),lastDrop=0,aim=W/2,score=0, danger=0;
  let state:Game["state"]="playing",message="Aim with the mouse, then drop a fruit.";
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;canvas.className="fruit-canvas";host.appendChild(canvas);const ctx=canvas.getContext("2d")!;
  function merge(a:Fruit,b:Fruit){const tier=a.tier+1;fruits=fruits.filter(f=>f!==a&&f!==b);if(tier<radii.length){fruits.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:0,vy:-3,r:radii[tier],tier,id:nextId++});score+=(tier+1)*50;message=`Merged fruit · +${(tier+1)*50}`;} if(score>=run.size){state="won";message="Harvest goal reached!";}}
  const drop=()=>{if(lastDrop>0)return;const r=radii[nextTier];fruits.push({x:Math.max(r,Math.min(W-r,aim)),y:44,vx:0,vy:0,r,tier:nextTier,id:nextId++});nextTier=Math.floor(rng()*Math.min(4,3+Math.floor(score/800)));lastDrop=450;};
  return {get score(){return score},get state(){return state},set state(v){state=v},get message(){return message},get progress(){return `Goal ${score}/${run.size} · Next ${nextTier+1}`},get canHelp(){return fruits.length>0},
    render(){ctx.clearRect(0,0,W,H);ctx.fillStyle="#efe8d9";ctx.fillRect(0,0,W,H);ctx.fillStyle="#e7b9a2";ctx.fillRect(0,85,W,3);ctx.fillStyle="#cabaa6";ctx.fillRect(0,H-6,W,6);ctx.fillRect(0,0,6,H);ctx.fillRect(W-6,0,6,H);for(const f of fruits){ctx.beginPath();ctx.fillStyle=colors[f.tier];ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="#594b3b55";ctx.stroke();ctx.fillStyle="#352f29";ctx.font=`700 ${Math.max(11,f.r*.37)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(["berry","grape","lime","orange","apple","peach","pear","melon","pine","honey","giant"][f.tier],f.x,f.y);}ctx.beginPath();ctx.strokeStyle="#645e58";ctx.arc(aim,38,radii[nextTier],0,Math.PI*2);ctx.stroke();},
    key(k){if(k===" ")drop();else if(k==="arrowleft"||k==="a")aim=Math.max(20,aim-24);else if(k==="arrowright"||k==="d")aim=Math.min(W-20,aim+24);},
    click(e){const rect=canvas.getBoundingClientRect();aim=(e.clientX-rect.left)*W/rect.width;drop();},
    tick(ms){lastDrop=Math.max(0,lastDrop-ms);const dt=Math.min(ms/16.67,2);for(const f of fruits){f.vy+=.28*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.993;f.vy*=.992;if(f.x<f.r+6){f.x=f.r+6;f.vx=Math.abs(f.vx)*.35;}if(f.x>W-f.r-6){f.x=W-f.r-6;f.vx=-Math.abs(f.vx)*.35;}if(f.y>H-f.r-6){f.y=H-f.r-6;f.vy=-Math.abs(f.vy)*.18;}}
      let pair:[Fruit,Fruit]|null=null;for(let i=0;i<fruits.length;i++)for(let j=i+1;j<fruits.length;j++){const a=fruits[i],b=fruits[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1,min=a.r+b.r;if(dist<min){if(a.tier===b.tier&&a.tier<10&&!pair){pair=[a,b];continue;}const overlap=(min-dist)/2,nx=dx/dist,ny=dy/dist;a.x-=nx*overlap;b.x+=nx*overlap;a.y-=ny*overlap;b.y+=ny*overlap;a.vx-=nx*.1;b.vx+=nx*.1;a.vy-=ny*.1;b.vy+=ny*.1;}}if(pair)merge(...pair);
      if(fruits.some(f=>f.y-f.r<83&&f.y>105)){danger+=ms;if(danger>3500){state="lost";message="Fruit crossed the danger line. Restart the challenge.";}}else danger=0;},
    lifeline(){if(fruits.length){const largest=[...fruits].sort((a,b)=>b.r-a.r)[0];fruits=fruits.filter(f=>f!==largest);message="Largest fruit removed to make space.";}else message="Drop a fruit before using this lifeline.";}
  };
}

function makeStack({host,run,rng}:Context):Game {
  const canvas=document.createElement("canvas");canvas.width=620;canvas.height=470;canvas.className="stack-canvas";host.appendChild(canvas);const ctx=canvas.getContext("2d")!;
  let width=245,x=40,direction=1,speed=2.2+difficulty(run)*.7,height=0,score=0, blocks:{x:number;w:number}[]=[{x:188,w:245}];
  let state:Game["state"]="playing",message="Place each block over the tower.";
  const place=()=>{const base=blocks.at(-1)!,left=Math.max(x,base.x),right=Math.min(x+width,base.x+base.w),overlap=right-left;if(overlap<14){state="lost";message="No overlap. Restart and time the placement.";return;}width=overlap;x=left;blocks.push({x,w:width});height++;score+=Math.round(width)+height*10;if(height>=run.size){state="won";message="Tower height reached!";}else{direction=rng()>.5?1:-1;x=direction>0?8:620-width-8;speed+=.12;} };
  const drawBlock=(bx:number,by:number,w:number,color:string)=>{const depth=11;ctx.fillStyle=color;ctx.fillRect(bx,by,w,22);ctx.fillStyle="#ffffff55";ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+depth,by-depth);ctx.lineTo(bx+w+depth,by-depth);ctx.lineTo(bx+w,by);ctx.fill();ctx.fillStyle="#0003";ctx.beginPath();ctx.moveTo(bx+w,by);ctx.lineTo(bx+w+depth,by-depth);ctx.lineTo(bx+w+depth,by+22-depth);ctx.lineTo(bx+w,by+22);ctx.fill();};
  return {get score(){return score},get state(){return state},set state(v){state=v},get message(){return message},get progress(){return `${height}/${run.size} blocks · Width ${Math.round(width)}`},
    render(){ctx.clearRect(0,0,620,470);ctx.fillStyle="#dcd7ca";ctx.fillRect(0,0,620,470);ctx.fillStyle="#b6afa1";ctx.fillRect(80,435,470,8);const visible=blocks.slice(-14),offset=blocks.length-visible.length;visible.forEach((b,i)=>drawBlock(b.x,405-(i+1)*25,b.w,`hsl(${30+(i+offset)*13%140} 48% 62%)`));if(state==="playing")drawBlock(x,405-(visible.length+1)*25,width,"#acc4be");},
    key(k){if(k===" "||k==="enter")place();},click(e){if((e.target as HTMLElement)===canvas)place();},tick(ms){x+=direction*speed*ms/16.67;if(x<8){x=8;direction=1;}if(x+width>612){x=612-width;direction=-1;}},lifeline(){width=Math.min(245,width+30);message="Block widened by 30 units.";}
  };
}

function makeConnect({host,run,rng}:Context):Game {
  const ROWS=6,COLS=7;let board=Array.from({length:ROWS},()=>Array(COLS).fill(0)),selected=3,score=0,thinking=0;
  let state:Game["state"]="playing",message="Drop a disc. Connect four before the computer.";
  const open=(b:number[][])=>Array.from({length:COLS},(_,i)=>i).filter(c=>b[0][c]===0);
  const drop=(b:number[][],c:number,p:number)=>{for(let r=ROWS-1;r>=0;r--)if(b[r][c]===0){b[r][c]=p;return r;}return -1;};
  const wins=(b:number[][],p:number)=>{for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(b[r][c]===p)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])if(Array.from({length:4},(_,n)=>b[r+dr*n]?.[c+dc*n]===p).every(Boolean))return true;return false;};
  const evaluate=(b:number[][])=>{let total=0;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const cells=Array.from({length:4},(_,n)=>b[r+dr*n]?.[c+dc*n]);if(cells.some(v=>v===undefined))continue;const ai=cells.filter(v=>v===2).length,human=cells.filter(v=>v===1).length;if(ai&&human)continue;if(ai)total += [0,1,7,35,100000][ai];if(human)total -= [0,1,9,45,100000][human];}return total;};
  const search=(b:number[][],depth:number,turn:number,alpha:number,beta:number):number=>{if(wins(b,2))return 100000+depth;if(wins(b,1))return -100000-depth;const opts=open(b);if(!depth||!opts.length)return evaluate(b);let best=turn===2?-Infinity:Infinity;for(const c of opts){const next=b.map(row=>[...row]);drop(next,c,turn);const value=search(next,depth-1,turn===2?1:2,alpha,beta);if(turn===2){best=Math.max(best,value);alpha=Math.max(alpha,best);}else{best=Math.min(best,value);beta=Math.min(beta,best);}if(beta<=alpha)break;}return best;};
  const choose=()=>{const opts=open(board);for(const p of [2,1])for(const c of opts){const copy=board.map(row=>[...row]);drop(copy,c,p);if(wins(copy,p))return c;}let best=-Infinity,pick=opts[0];const depth=[1,3,5][difficulty(run)];for(const c of shuffle(opts,rng)){const b=board.map(row=>[...row]);drop(b,c,2);const value=search(b,depth-1,1,-Infinity,Infinity)+(3-Math.abs(c-3))*.1;if(value>best){best=value;pick=c;}}return pick;};
  const player=(c:number)=>{if(thinking||!open(board).includes(c))return;drop(board,c,1);score+=10;selected=c;if(wins(board,1)){score+=500;state="won";message="Four connected!";}else if(!open(board).length){state="lost";message="Draw. Restart to try again.";}else{thinking=350;message="Computer is choosing a column…";}};
  return {get score(){return score},get state(){return state},set state(v){state=v},get message(){return message},get progress(){return `Your turn · ${open(board).length} open columns`},
    render(){host.innerHTML=`<div class="connect-wrap"><div class="connect-column-head">${Array.from({length:COLS},(_,c)=>`<button type="button" data-connect="${c}" ${thinking||board[0][c]?"disabled":""} class="${selected===c?"selected":""}" aria-label="Drop in column ${c+1}">↓</button>`).join("")}</div><div class="connect-board">${board.flat().map(v=>`<i class="connect-slot ${v===1?"player":v===2?"computer":""}"></i>`).join("")}</div><p>You: coral · Computer: slate</p></div>`;},
    key(k){if(k==="arrowleft"||k==="a")selected=Math.max(0,selected-1);else if(k==="arrowright"||k==="d")selected=Math.min(6,selected+1);else if(k==="enter"||k===" ")player(selected);else if(/^[1-7]$/.test(k))player(Number(k)-1);},
    click(e){const btn=(e.target as HTMLElement).closest<HTMLButtonElement>("[data-connect]");if(btn)player(Number(btn.dataset.connect));},
    tick(ms){if(thinking>0){thinking-=ms;if(thinking<=0){const c=choose();drop(board,c,2);if(wins(board,2)){state="lost";message="Computer connected four. Restart to retry.";}else if(!open(board).length){state="lost";message="Draw. Restart to try again.";}else message="Your turn.";}}},
    lifeline(){if(thinking)return;const c=choose();player(c);message=`Defensive disc placed in column ${c+1}.`;}
  };
}

function solveSudoku(board:number[],limit=2):number {const empty=board.indexOf(0);if(empty<0)return 1;const row=Math.floor(empty/9),col=empty%9,used=new Set<number>();for(let i=0;i<9;i++){used.add(board[row*9+i]);used.add(board[i*9+col]);used.add(board[(Math.floor(row/3)*3+Math.floor(i/3))*9+Math.floor(col/3)*3+i%3]);}let count=0;for(let v=1;v<=9;v++)if(!used.has(v)){board[empty]=v;count+=solveSudoku(board,limit-count);if(count>=limit)break;}board[empty]=0;return count;}
function makeSudoku({host,run,rng}:Context):Game {
  const band=shuffle([0,1,2],rng), stacks=shuffle([0,1,2],rng), rows=band.flatMap(b=>shuffle([0,1,2],rng).map(x=>b*3+x)),cols=stacks.flatMap(b=>shuffle([0,1,2],rng).map(x=>b*3+x)),digits=shuffle([1,2,3,4,5,6,7,8,9],rng);
  const solution=Array.from({length:81},(_,i)=>digits[(rows[Math.floor(i/9)]*3+Math.floor(rows[Math.floor(i/9)]/3)+cols[i%9])%9]);
  const clues=[...solution];let left=81;for(const i of shuffle(Array.from({length:81},(_,i)=>i),rng)){if(left<=run.size)break;const keep=clues[i];clues[i]=0;if(solveSudoku([...clues],2)!==1)clues[i]=keep;else left--;}
  const values=[...clues],fixed=clues.map(v=>v!==0);let selected=values.findIndex(v=>v===0),score=0,mistakes=0;
  let state:Game["state"]="playing",message="Every row, column and box needs 1–9.";
  const filled=()=>values.filter(Boolean).length;
  const input=(n:number)=>{if(selected<0||fixed[selected])return;if(n===0){values[selected]=0;message="Cell cleared.";return;}values[selected]=n;if(n!==solution[selected]){mistakes++;message="That number conflicts with the puzzle.";if(mistakes>=Math.max(5,9-difficulty(run)*2)){state="lost";message="Too many mistakes. Restart this puzzle.";}}else{score+=20;message="Correct number.";if(filled()===81){state="won";score+=500;message="Sudoku solved!";}}};
  return {get score(){return score},get state(){return state},set state(v){state=v},get message(){return message},get progress(){return `${filled()}/81 filled · ${mistakes} mistakes`},
    render(){host.innerHTML=`<div class="sudoku-wrap"><div class="sudoku-grid">${values.map((v,i)=>`<button type="button" data-sudoku="${i}" class="sudoku-cell ${fixed[i]?"fixed":""} ${i===selected?"selected":""} ${v&&v!==solution[i]?"wrong":""}" aria-label="Row ${Math.floor(i/9)+1}, column ${i%9+1}, ${v||"empty"}">${v||""}</button>`).join("")}</div><div class="sudoku-numbers">${Array.from({length:9},(_,i)=>`<button type="button" data-sudoku-number="${i+1}">${i+1}</button>`).join("")}<button type="button" data-sudoku-number="0">Clear</button></div></div>`;},
    key(k){if(/^[1-9]$/.test(k))input(Number(k));else if(k==="delete"||k==="backspace"||k==="0")input(0);else{const delta:Record<string,number>={arrowup:-9,w:-9,arrowdown:9,s:9,arrowleft:-1,a:-1,arrowright:1,d:1};if(delta[k])selected=Math.max(0,Math.min(80,selected+delta[k]));}},
    click(e){const target=e.target as HTMLElement;const cell=target.closest<HTMLElement>("[data-sudoku]");if(cell)selected=Number(cell.dataset.sudoku);const number=target.closest<HTMLElement>("[data-sudoku-number]");if(number)input(Number(number.dataset.sudokuNumber));},tick(){},
    lifeline(){const empty=values.findIndex((v,i)=>v!==solution[i]);if(empty>=0){values[empty]=solution[empty];selected=empty;score+=10;message="One cell revealed.";if(filled()===81){state="won";message="Sudoku solved!";}}}
  };
}
