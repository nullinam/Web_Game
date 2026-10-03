import {box,addStickman} from "../world.js";
const bank=[
 ["Which company developed the Windows operating system?",["Microsoft","Apple","IBM","Adobe"],0],
 ["What is Microsoft's cloud computing platform called?",["Azure","Orbit","OneDrive","Visual Cloud"],0],
 ["Which Microsoft app is mainly used for spreadsheets?",["Excel","Word","Teams","Paint"],0],
 ["Which programming editor is made by Microsoft?",["Visual Studio Code","Notepad++","Sublime Text","Eclipse"],0],
 ["What is the name of Microsoft's game console family?",["Xbox","PlayStation","Switch","Atari"],0],
 ["Which app is Microsoft's word processor?",["Word","Access","PowerPoint","Outlook"],0],
 ["What does Teams mainly help people do?",["Chat and meet","Edit photos","Browse maps","Make spreadsheets"],0],
 ["Which service stores files online for Microsoft accounts?",["OneDrive","iCloud","Dropbox","Box"],0],
 ["Which Microsoft tool helps developers track code with Git?",["GitHub","Bing Maps","Clipchamp","OneNote"],0],
 ["Which search engine is operated by Microsoft?",["Bing","Yahoo","DuckDuckGo","Ask"],0],
 ["What is the name of Microsoft's web browser?",["Edge","Safari","Firefox","Opera"],0],
 ["Which app is commonly used to create slide presentations?",["PowerPoint","Excel","Access","Forms"],0]
];
export function startTrivia({world,ui,difficulty}){world.camera.position.set(0,11,17);world.camera.lookAt(0,1,0);box(world.scene,0,0,0,18,.2,15,"#a19582");box(world.scene,0,3,-7,10,4,.4,"#53636b");addStickman(world.scene,-5,2,"#748b98");const total=difficulty==="easy"?8:10,limit=difficulty==="hard"?45:0;let idx=0,correct=0,timer;function render(){clearInterval(timer);if(idx>=total){ui.innerHTML=`<section class="arcade-panel"><div class="mode-heading"><span class="mode-eyebrow">MICROSOFT TRIVIA</span><h3>Quiz complete.</h3></div><p class="mode-status">You got ${correct} of ${total} correct.</p></section>`;return;}const q=bank[(idx+(difficulty==="hard"?2:0))%bank.length],options=q[1].slice().sort(()=>Math.random()-.5),answer=options.indexOf(q[1][q[2]]);let remain=limit;ui.innerHTML=`<section class="arcade-panel"><div class="mode-heading"><span class="mode-eyebrow">MICROSOFT TRIVIA · ${difficulty.toUpperCase()}</span><h3>Question ${idx+1} of ${total}</h3></div><div class="trivia-question">${q[0]}</div><div class="answer-grid">${options.map((v,i)=>`<button class="answer-button" data-option="${i}">${v}</button>`).join("")}</div><p class="mode-status" data-status>${limit?`Time: ${remain}s`:"Choose the best answer."}</p></section>`;let locked=false;ui.querySelectorAll("[data-option]").forEach(b=>b.onclick=()=>{if(locked)return;locked=true;clearInterval(timer);const right=Number(b.dataset.option)===answer;if(right)correct++;b.classList.add(right?"correct":"incorrect");ui.querySelector("[data-status]").textContent=right?"Correct.":`Answer: ${q[1][q[2]]}`;setTimeout(()=>{idx++;render();},750);});if(limit)timer=setInterval(()=>{remain--;const p=ui.querySelector("[data-status]");if(p)p.textContent=`Time: ${remain}s`;if(remain<=0){clearInterval(timer);if(!locked){locked=true;setTimeout(()=>{idx++;render();},600);}}},1000);}render();return()=>clearInterval(timer);}
