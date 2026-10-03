import * as THREE from "three";
import { addStickman, box, cylinder, material } from "../world.js";

const colors=["#a66f59","#768b99","#ab915f","#777f69","#977d93","#567b78","#bd8264","#817d9c","#967f67","#6b8791","#ad9a72","#8c7065"];
const settings={easy:{colors:4,nuts:3},medium:{colors:6,nuts:4},hard:{colors:8,nuts:5}};

export function startNutsBolts({world,ui,difficulty}){
  const base=settings[difficulty];let level=1,moves=0,selected=-1,stacks=[],finished=false,boltRoot=new THREE.Group(),bolts=[];
  world.scene.add(boltRoot);world.camera.position.set(0,14,25);world.camera.lookAt(0,0,0);world.camera.updateProjectionMatrix();
  addStickman(world.scene,-9,-.3,"#87765f");
  ui.innerHTML=`<section class="arcade-panel nuts-panel"><div class="mode-heading"><span class="mode-eyebrow">SORTING · LEVEL <b data-nuts-level>01</b></span><h3>One nut at a time.</h3></div><div class="nuts-stats"><span>COLORS <b data-nuts-colors></b></span><span>NUTS EACH <b data-nuts-count></b></span><span>MOVES <b data-nuts-moves>0</b></span><span>EMPTY BOLTS <b>02</b></span></div><p class="nuts-message" data-nuts-message>Select a bolt, then move its top nut to an empty bolt or a matching color.</p><div class="nuts-result" data-nuts-result hidden></div><div class="mode-controls-note">Only matching colors can stack together. Sort one color onto each bolt.</div></section>`;
  const makeData=(n,perTube)=>{const result=Array.from({length:n+2},(_,i)=>i<n?Array(perTube).fill(i):[]);let last="";for(let k=0;k<Math.max(22,n*perTube*4);k++){const sources=result.map((tube,i)=>tube.length?i:-1).filter(i=>i>=0);if(!sources.length)break;const a=sources[Math.floor(Math.random()*sources.length)],top=result[a].at(-1);const targets=result.map((tube,i)=>i!==a&&tube.length<perTube&&(tube.length===0||tube.at(-1)===top)&&`${i}:${a}`!==last?i:-1).filter(i=>i>=0);if(!targets.length)continue;const b=targets[Math.floor(Math.random()*targets.length)];result[b].push(result[a].pop());last=`${a}:${b}`;}if(result.filter(t=>t.length).every(t=>t.every(v=>v===t[0])&&t.length===perTube))return makeData(n,perTube);return result;};
  function clearBolts(){boltRoot.traverse(obj=>{obj.geometry?.dispose();if(obj.material)for(const m of Array.isArray(obj.material)?obj.material:[obj.material])m.dispose();});world.scene.remove(boltRoot);boltRoot=new THREE.Group();world.scene.add(boltRoot);bolts=[];}
  function makeNut(tube,index,colorIndex,boltIndex){const ring=new THREE.Mesh(new THREE.TorusGeometry(.37,.145,10,24),material(colors[colorIndex],.4,.16));ring.rotation.x=Math.PI/2;ring.position.set(0,.58+index*.39,0);ring.castShadow=true;ring.userData.bolt=boltIndex;tube.add(ring);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.08,16),material(colors[colorIndex],.48,.12));cap.position.set(0,.58+index*.39,0);cap.userData.bolt=boltIndex;tube.add(cap);}
  function draw(){clearBolts();const total=stacks.length;const spacing=1.55;const start=-(total-1)*spacing/2;
    stacks.forEach((stack,i)=>{const x=start+i*spacing,g=new THREE.Group();g.position.x=x;g.userData.index=i;boltRoot.add(g);
      const foot=box(world.scene,0,0,0,1.12,.32,1.12,"#594e41",{parent:g});foot.userData.bolt=i;
      const post=cylinder(world.scene,0,1.55,0,.39,.46,2.75,"#8c8375",16,{parent:g});post.material=material("#8f897e",.38,.62);post.userData.bolt=i;
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.41,.09,9,24),material("#b4a78f",.32,.45));rim.rotation.x=Math.PI/2;rim.position.y=2.85;rim.userData.bolt=i;g.add(rim);
      stack.forEach((colorIndex,n)=>makeNut(g,n,colorIndex,i));
      const sel=box(world.scene,0,-.07,0,1.18,.07,1.18,"#c6a577",{parent:g});sel.material.transparent=true;sel.material.opacity=.72;sel.visible=i===selected;sel.userData.bolt=i;
      bolts.push({group:g,index:i});
    });
    world.camera.position.set(0,Math.max(12,4+base.nuts+Math.floor((level-1)/3)),Math.max(23,total*1.13));world.camera.lookAt(0,1.4,0);world.camera.updateProjectionMatrix();
  }
  function isSorted(){return stacks.every(t=>!t.length||(t.length===capacity&&t.every(n=>n===t[0])));}
  let capacity=base.nuts;
  function updateHud(){ui.querySelector("[data-nuts-level]").textContent=String(level).padStart(2,"0");ui.querySelector("[data-nuts-colors]").textContent=String(capacityColors);ui.querySelector("[data-nuts-count]").textContent=String(capacity);ui.querySelector("[data-nuts-moves]").textContent=moves;}
  let capacityColors=base.colors;
  function newLevel(){finished=false;selected=-1;capacityColors=Math.min(difficulty==="easy"?5:difficulty==="medium"?8:12,base.colors+Math.floor((level-1)/2));capacity=Math.min(difficulty==="easy"?5:difficulty==="medium"?6:7,base.nuts+Math.floor((level-1)/3));moves=0;stacks=makeData(capacityColors,capacity);ui.querySelector("[data-nuts-result]").hidden=true;updateHud();draw();}
  function finish(){if(finished)return;finished=true;const result=ui.querySelector("[data-nuts-result]");result.hidden=false;result.innerHTML=`<span>ALL COLORS SORTED</span><b>Combination complete.</b><small>${capacityColors} colors · ${capacity} nuts each · ${moves} moves</small><button data-nuts-next>Next combination ↗</button>`;result.querySelector("button").addEventListener("click",()=>{level++;newLevel();});}
  function choose(index){if(finished)return;if(selected<0){if(stacks[index].length){selected=index;draw();ui.querySelector("[data-nuts-message]").textContent="Choose an empty bolt or a bolt with the same top color.";}return;}if(index===selected){selected=-1;draw();return;}const source=stacks[selected],target=stacks[index];if(source.length&&target.length<capacity&&(target.length===0||target.at(-1)===source.at(-1))){target.push(source.pop());moves++;selected=-1;updateHud();draw();if(isSorted())finish();}else{selected=stacks[index].length?index:-1;draw();}}
  const onPointer=event=>{if(event.button!==0||finished)return;const hit=world.pick(event,boltRoot.children.flatMap(g=>g.children))[0];if(hit){const g=hit.object;const idx=g.userData.bolt??g.parent?.userData.index;if(Number.isInteger(idx))choose(idx);}};
  world.renderer.domElement.addEventListener("pointerup",onPointer);newLevel();
  return()=>world.renderer.domElement.removeEventListener("pointerup",onPointer);
}
