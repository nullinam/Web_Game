const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const historyElement = document.getElementById("history");
const undoBtn = document.getElementById("undoBtn");
const promotionModal = document.getElementById("promotionModal");
const promotionChoices = document.getElementById("promotionChoices");

let board;
let currentTurn;
let selected = null;
let lastMove = null;
let castlingRights;
let enPassantTarget = null;
let pendingPromotion = null;
let moveHistory = [];

const pieces = {
    wp:"♙", wr:"♖", wn:"♘", wb:"♗", wq:"♕", wk:"♔",
    bp:"♟", br:"♜", bn:"♞", bb:"♝", bq:"♛", bk:"♚"
};

function initGame(){
    board = [
        ["br","bn","bb","bq","bk","bb","bn","br"],
        ["bp","bp","bp","bp","bp","bp","bp","bp"],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["","","","","","","",""],
        ["wp","wp","wp","wp","wp","wp","wp","wp"],
        ["wr","wn","wb","wq","wk","wb","wn","wr"]
    ];

    currentTurn = "w";

    castlingRights = {
        w:{kingSide:true,queenSide:true},
        b:{kingSide:true,queenSide:true}
    };

    lastMove = null; enPassantTarget = null; pendingPromotion = null; selected = null;
    moveHistory = [];
    historyElement.innerHTML = "";
    render();
}

function render(){
    boardElement.innerHTML = "";

    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
            const sq = document.createElement("div");
            sq.className = "square " + ((r+c)%2===0?"light":"dark");
            sq.dataset.row = r;
            sq.dataset.col = c;

            if(board[r][c]) {
               const piece = board[r][c];
               const glyph = document.createElement("span");
               glyph.className = `piece-glyph${piece[1] === "p" ? " pawn-glyph" : ""}`;
               glyph.textContent = pieces[piece];
               sq.appendChild(glyph);
               if(piece[0] === "w")
                   sq.classList.add("white-piece");
               else
                  sq.classList.add("black-piece");
            }


            if(lastMove &&
               (lastMove.from[0]===r && lastMove.from[1]===c ||
                lastMove.to[0]===r && lastMove.to[1]===c)){
                sq.classList.add("last-move");
            }

            sq.onclick = handleClick;
            boardElement.appendChild(sq);
        }
    }

    if(isKingInCheck(currentTurn)){
        const [kr,kc] = findKing(currentTurn);
        document.querySelector(`[data-row="${kr}"][data-col="${kc}"]`)
            .classList.add("check");
    }

    statusElement.textContent = currentTurn==="w"?"White to move":"Black to move";
}

function handleClick(e){
    if(pendingPromotion) return;

    const r = +e.target.dataset.row;
    const c = +e.target.dataset.col;

    if(selected){
        if(isValidMove(selected[0],selected[1],r,c)){
            makeMove(selected[0],selected[1],r,c);
            selected = null;
            render();
            checkGameEnd();
        } else {
            selected = null;
            render();
        }
    } else {
        if(board[r][c] && board[r][c][0]===currentTurn){
            selected = [r,c];
            showMoves(r,c);
        }
    }
}

function showMoves(r,c){
    render();
    for(let tr=0;tr<8;tr++){
        for(let tc=0;tc<8;tc++){
            if(isValidMove(r,c,tr,tc)){
                document.querySelector(`[data-row="${tr}"][data-col="${tc}"]`)
                    .classList.add("highlight");
            }
        }
    }
}

function makeMove(fr,fc,tr,tc){

    moveHistory.push(JSON.stringify({
        board: structuredClone(board),
        currentTurn,
        castlingRights: structuredClone(castlingRights),
        enPassantTarget,
        lastMove
    }));

    const piece = board[fr][fc];

    // CASTLING
    if(piece[1]==="k" && Math.abs(tc-fc)===2){
        const rookFrom = tc>fc ? 7 : 0;
        const rookTo = tc>fc ? tc-1 : tc+1;
        board[fr][rookTo] = board[fr][rookFrom];
        board[fr][rookFrom] = "";
    }

    // EN PASSANT CAPTURE
    if(piece[1]==="p" && enPassantTarget &&
       tr===enPassantTarget[0] && tc===enPassantTarget[1]){
        const dir = currentTurn==="w"?1:-1;
        board[tr+dir][tc] = "";
    }

    board[tr][tc] = piece;
    board[fr][fc] = "";

    // PAWN PROMOTION
    if(piece[1]==="p" && (tr===0 || tr===7)){
        pendingPromotion = {r:tr,c:tc,color:piece[0],from:[fr,fc]};
        showPromotion();
        return;
    }

    finalizeMove(piece,fr,fc,tr,tc);
}

function finalizeMove(piece,fr,fc,tr,tc){

    updateCastlingRights(piece,fr,fc);

    // EN PASSANT TARGET
    if(piece[1]==="p" && Math.abs(tr-fr)===2){
        enPassantTarget = [(fr+tr)/2, fc];
    } else {
        enPassantTarget = null;
    }

    lastMove = {from:[fr,fc],to:[tr,tc]};
    addMoveToHistory(piece,fr,fc,tr,tc);

    currentTurn = currentTurn==="w"?"b":"w";
}

function updateCastlingRights(piece,fr,fc){
    if(piece[1]==="k"){
        castlingRights[piece[0]].kingSide = false;
        castlingRights[piece[0]].queenSide = false;
    }
    if(piece[1]==="r"){
        if(fc===0) castlingRights[piece[0]].queenSide = false;
        if(fc===7) castlingRights[piece[0]].kingSide = false;
    }
}

function showPromotion(){
    promotionModal.classList.remove("hidden");
    promotionChoices.innerHTML = "";

    ["q","r","b","n"].forEach(type=>{
        const span = document.createElement("span");
        span.textContent = pieces[pendingPromotion.color+type];
        span.onclick = ()=>{
            board[pendingPromotion.r][pendingPromotion.c] =
                pendingPromotion.color+type;

            promotionModal.classList.add("hidden");
            const piece = board[pendingPromotion.r][pendingPromotion.c];

            finalizeMove(piece,
                pendingPromotion.from?.[0] ?? 0,
                pendingPromotion.from?.[1] ?? 0,
                pendingPromotion.r,
                pendingPromotion.c
            );

            pendingPromotion = null;
            render();
            checkGameEnd();
        };
        promotionChoices.appendChild(span);
    });
}

function undoMove(){
    if(moveHistory.length===0) return;
    const prev = JSON.parse(moveHistory.pop());
    board = prev.board;
    currentTurn = prev.currentTurn;
    castlingRights = prev.castlingRights;
    enPassantTarget = prev.enPassantTarget;
    lastMove = prev.lastMove;
    render();
}

undoBtn.onclick = undoMove;

function addMoveToHistory(piece,fr,fc,tr,tc){
    const moveText =
        `${pieces[piece]} ${String.fromCharCode(97+fc)}${8-fr} → ${String.fromCharCode(97+tc)}${8-tr}`;
    historyElement.innerHTML += moveText + "<br>";
}

function isValidMove(fr,fc,tr,tc){
    const piece = board[fr][fc];
    if(!piece) return false;
    if(board[tr][tc] && board[tr][tc][0]===currentTurn) return false;
    if(!basicMove(piece,fr,fc,tr,tc)) return false;
    if(causesSelfCheck(fr,fc,tr,tc)) return false;
    return true;
}

function basicMove(piece,fr,fc,tr,tc){
    const type = piece[1];
    const dr = tr-fr;
    const dc = tc-fc;

    switch(type){

        case "p":{
            const dir = piece[0]==="w"?-1:1;

            if(dc===0 && dr===dir && !board[tr][tc]) return true;

            if(dc===0 && dr===2*dir &&
               !board[tr][tc] &&
               !board[fr+dir][fc] &&
               fr === (piece[0]==="w"?6:1)) return true;

            if(Math.abs(dc)===1 && dr===dir){
                if(board[tr][tc] &&
                   board[tr][tc][0]!==piece[0]) return true;

                if(enPassantTarget &&
                   tr===enPassantTarget[0] &&
                   tc===enPassantTarget[1]) return true;
            }
            return false;
        }

        case "r":
            if(fr!==tr && fc!==tc) return false;
            return pathClear(fr,fc,tr,tc);

        case "b":
            if(Math.abs(dr)!==Math.abs(dc)) return false;
            return pathClear(fr,fc,tr,tc);

        case "q":
            if(fr===tr||fc===tc||Math.abs(dr)===Math.abs(dc))
                return pathClear(fr,fc,tr,tc);
            return false;

        case "n":
            return (Math.abs(dr)===2 && Math.abs(dc)===1) ||
                   (Math.abs(dr)===1 && Math.abs(dc)===2);

        case "k":
            if(Math.abs(dr)<=1 && Math.abs(dc)<=1) return true;

            if(dr===0 && Math.abs(dc)===2){
                return validateCastling(fr,fc,tr,tc,piece[0]);
            }
            return false;
    }
}

function validateCastling(fr,fc,tr,tc,color){
    if(isKingInCheck(color)) return false;

    const side = tc>fc ? "kingSide":"queenSide";
    if(!castlingRights[color][side]) return false;

    const rookCol = side==="kingSide"?7:0;
    const step = side==="kingSide"?1:-1;

    for(let c=fc+step;c!==rookCol;c+=step){
        if(board[fr][c]) return false;
    }

    for(let c=fc;c!==tc+step;c+=step){
        if(squareAttacked(fr,c,color)) return false;
    }

    return true;
}

function squareAttacked(r,c,color){
    const opponent = color==="w"?"b":"w";
    for(let i=0;i<8;i++){
        for(let j=0;j<8;j++){
            if(board[i][j] && board[i][j][0]===opponent){
                if(basicMove(board[i][j],i,j,r,c)) return true;
            }
        }
    }
    return false;
}

function pathClear(fr,fc,tr,tc){
    const dr = Math.sign(tr-fr);
    const dc = Math.sign(tc-fc);
    let r=fr+dr,c=fc+dc;
    while(r!==tr || c!==tc){
        if(board[r][c]) return false;
        r+=dr; c+=dc;
    }
    return true;
}

function causesSelfCheck(fr,fc,tr,tc){
    const temp = board[tr][tc];
    board[tr][tc]=board[fr][fc];
    board[fr][fc]="";
    const check = isKingInCheck(currentTurn);
    board[fr][fc]=board[tr][tc];
    board[tr][tc]=temp;
    return check;
}

function findKing(color){
    for(let r=0;r<8;r++)
        for(let c=0;c<8;c++)
            if(board[r][c]===color+"k") return [r,c];
}

function isKingInCheck(color){
    const [kr,kc]=findKing(color);
    return squareAttacked(kr,kc,color);
}

function hasAnyLegalMove(color){
    for(let r=0;r<8;r++)
        for(let c=0;c<8;c++)
            if(board[r][c] && board[r][c][0]===color)
                for(let tr=0;tr<8;tr++)
                    for(let tc=0;tc<8;tc++)
                        if(isValidMove(r,c,tr,tc)) return true;
    return false;
}

function checkGameEnd(){
    if(isKingInCheck(currentTurn) && !hasAnyLegalMove(currentTurn)){
        alert("Checkmate!");
    } else if(!isKingInCheck(currentTurn) && !hasAnyLegalMove(currentTurn)){
        alert("Stalemate!");
    }
}

initGame();


// AI opponent and match controls added for the arcade build.
let aiThinking = false;
let aiTimer = 0;
let matchFinished = false;
const humanHandleClick = handleClick;
const sourceFinalizeMove = finalizeMove;
const sourceRender = render;

function chessSnapshot() {
  return {
    board: board.map(row => [...row]),
    currentTurn,
    castlingRights: JSON.parse(JSON.stringify(castlingRights)),
    enPassantTarget: enPassantTarget ? [...enPassantTarget] : null,
    lastMove: lastMove ? JSON.parse(JSON.stringify(lastMove)) : null
  };
}
const moveTextLog=[];
addMoveToHistory=function(piece,fr,fc,tr,tc){
  const text=`${pieces[piece]} ${String.fromCharCode(97+fc)}${8-fr} → ${String.fromCharCode(97+tc)}${8-tr}`;
  moveTextLog.push(text);
  historyElement.innerHTML=moveTextLog.map((move,index)=>`${index%2===0?Math.floor(index/2)+1+'. ':''}${move}`).join('<br>');
};
function restoreChessSnapshot(state) {
  board = state.board.map(row => [...row]);
  currentTurn = state.currentTurn;
  castlingRights = JSON.parse(JSON.stringify(state.castlingRights));
  enPassantTarget = state.enPassantTarget ? [...state.enPassantTarget] : null;
  lastMove = state.lastMove ? JSON.parse(JSON.stringify(state.lastMove)) : null;
}
function chessCandidates(piece, r, c) {
  const type = piece[1], out = [];
  const add = (tr, tc) => { if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) out.push([tr, tc]); };
  if (type === "p") {
    const dir = piece[0] === "w" ? -1 : 1;
    add(r + dir, c); add(r + 2 * dir, c); add(r + dir, c - 1); add(r + dir, c + 1);
  } else if (type === "n") {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc));
  } else if (type === "k") {
    for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) if (dr || dc) add(r+dr,c+dc);
    add(r,c-2); add(r,c+2);
  } else {
    const dirs = type === "b" ? [[-1,-1],[-1,1],[1,-1],[1,1]]
      : type === "r" ? [[-1,0],[1,0],[0,-1],[0,1]]
      : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
    dirs.forEach(([dr,dc])=>{let tr=r+dr,tc=c+dc;while(tr>=0&&tr<8&&tc>=0&&tc<8){out.push([tr,tc]);if(board[tr][tc])break;tr+=dr;tc+=dc}});
  }
  return out;
}
function legalChessMoves(color = currentTurn) {
  const oldTurn = currentTurn;
  currentTurn = color;
  const moves = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const piece = board[r][c];
    if (!piece || piece[0] !== color) continue;
    for (const [tr,tc] of chessCandidates(piece,r,c)) {
      if (isValidMove(r,c,tr,tc)) moves.push({fr:r,fc:c,tr,tc,capture:!!board[tr][tc]||!!(piece[1]==="p"&&enPassantTarget&&tr===enPassantTarget[0]&&tc===enPassantTarget[1])});
    }
  }
  currentTurn = oldTurn;
  return moves;
}
function applySearchMove(move) {
  const piece=board[move.fr][move.fc], oldEnPassant=enPassantTarget;
  if (piece[1]==="k" && Math.abs(move.tc-move.fc)===2) {
    const rookFrom=move.tc>move.fc?7:0, rookTo=move.tc>move.fc?move.tc-1:move.tc+1;
    board[move.fr][rookTo]=board[move.fr][rookFrom];board[move.fr][rookFrom]="";
  }
  if (piece[1]==="p"&&oldEnPassant&&move.tr===oldEnPassant[0]&&move.tc===oldEnPassant[1]) board[move.tr+(piece[0]==="w"?1:-1)][move.tc]="";
  board[move.tr][move.tc]=(piece[1]==="p"&&(move.tr===0||move.tr===7))?piece[0]+"q":piece;
  board[move.fr][move.fc]="";
  updateCastlingRights(piece,move.fr,move.fc);
  enPassantTarget=piece[1]==="p"&&Math.abs(move.tr-move.fr)===2?[(move.fr+move.tr)/2,move.fc]:null;
  currentTurn=currentTurn==="w"?"b":"w";
}
const pieceValues={p:100,n:320,b:330,r:500,q:900,k:20000};
function evaluateChess() {
  let value=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const piece=board[r][c];if(!piece)continue;
    const sign=piece[0]==="b"?1:-1,center=(3.5-Math.abs(3.5-r))+(3.5-Math.abs(3.5-c));
    let positional=piece[1]==="p"?(piece[0]==="w"?6-r:r-1)*5:piece[1]==="n"||piece[1]==="b"?center*5:piece[1]==="q"?center*2:0;
    value+=sign*(pieceValues[piece[1]]+positional);
  }
  return value;
}
let searchNodes=0, searchLimit=900;
function minimaxChess(depth,alpha,beta,maximizing) {
  if (++searchNodes>=searchLimit || depth===0) return evaluateChess();
  const moves=legalChessMoves(currentTurn);
  if(!moves.length)return isKingInCheck(currentTurn)?(currentTurn==="b"?-100000:100000):0;
  moves.sort((a,b)=>Number(b.capture)-Number(a.capture));
  if(maximizing){let best=-Infinity;for(const move of moves){const state=chessSnapshot();applySearchMove(move);best=Math.max(best,minimaxChess(depth-1,alpha,beta,false));restoreChessSnapshot(state);alpha=Math.max(alpha,best);if(beta<=alpha||searchNodes>=searchLimit)break}return best}
  let best=Infinity;for(const move of moves){const state=chessSnapshot();applySearchMove(move);best=Math.min(best,minimaxChess(depth-1,alpha,beta,true));restoreChessSnapshot(state);beta=Math.min(beta,best);if(beta<=alpha||searchNodes>=searchLimit)break}return best;
}
function chooseComputerMove() {
  const settings={easy:[1,100],medium:[2,450],hard:[3,1100],expert:[4,2200]}[document.getElementById("difficulty").value]||[2,450];
  searchNodes=0;searchLimit=settings[1];
  const moves=legalChessMoves("b");if(!moves.length)return null;
  moves.sort((a,b)=>Number(b.capture)-Number(a.capture));
  let best=-Infinity,bestMoves=[];
  for(const move of moves){const state=chessSnapshot();applySearchMove(move);const score=minimaxChess(settings[0]-1,-Infinity,Infinity,false);restoreChessSnapshot(state);if(score>best){best=score;bestMoves=[move]}else if(score===best)bestMoves.push(move);if(searchNodes>=searchLimit)break}
  if(document.getElementById("difficulty").value==="easy"&&bestMoves.length>1)return bestMoves[Math.floor(Math.random()*bestMoves.length)];
  return bestMoves[0]||moves[Math.floor(Math.random()*moves.length)];
}
function updateChessStatus() {
  const count=document.getElementById("moveCount");
  if(count)count.textContent=Math.ceil(moveHistory.length/2)+" moves";
  if(!matchFinished)statusElement.textContent=aiThinking?"Computer is thinking…":currentTurn==="w"?"Your move — White":"Computer to move — Black";
}
render=function(){sourceRender();updateChessStatus()};
checkGameEnd=function(){
  const legal=legalChessMoves(currentTurn);
  if(legal.length)return false;
  matchFinished=true;
  statusElement.textContent=isKingInCheck(currentTurn)?(currentTurn==="w"?"Checkmate — computer wins":"Checkmate — you win"):"Draw — stalemate";
  return true;
};
handleClick=function(event){
  if(aiThinking||matchFinished||currentTurn!=="w"||pendingPromotion)return;
  humanHandleClick(event);
};
finalizeMove=function(...args){
  sourceFinalizeMove(...args);
  if(currentTurn==="b"&&!matchFinished){aiThinking=true;updateChessStatus();clearTimeout(aiTimer);aiTimer=setTimeout(playComputerMove,300)}
};
const sourceShowPromotion=showPromotion;
showPromotion=function(){
  if(pendingPromotion&&pendingPromotion.color==="b"){
    const promotion={...pendingPromotion};board[promotion.r][promotion.c]="bq";promotionModal.classList.add("hidden");pendingPromotion=null;
    finalizeMove("bq",promotion.from?.[0]??1,promotion.from?.[1]??promotion.c,promotion.r,promotion.c);
    render();checkGameEnd();return;
  }
  sourceShowPromotion();
};
function playComputerMove(){
  if(matchFinished||currentTurn!=="b"){aiThinking=false;return}
  const move=chooseComputerMove();
  if(!move){aiThinking=false;checkGameEnd();return}
  aiThinking=false;
  makeMove(move.fr,move.fc,move.tr,move.tc);
  if(pendingPromotion&&pendingPromotion.color==="b"){pendingPromotion.from=[move.fr,move.fc];showPromotion();return}
  render();if(!checkGameEnd())updateChessStatus();
}
function undoChessTurn(){
  clearTimeout(aiTimer);aiThinking=false;matchFinished=false;
  if(pendingPromotion){pendingPromotion=null;promotionModal.classList.add("hidden")}
  const plies=currentTurn==="w"&&moveHistory.length>=2?2:moveHistory.length?1:0;
  for(let i=0;i<plies;i++)undoMove();
  moveTextLog.splice(-plies,plies);
  historyElement.innerHTML=moveTextLog.map((move,index)=>`${index%2===0?Math.floor(index/2)+1+'. ':''}${move}`).join('<br>');
  render();checkGameEnd();updateChessStatus();
}
undoBtn.onclick=undoChessTurn;
document.getElementById("newGameBtn").addEventListener("click",()=>{clearTimeout(aiTimer);aiThinking=false;matchFinished=false;pendingPromotion=null;moveTextLog.length=0;promotionModal.classList.add("hidden");initGame();render();updateChessStatus()});
document.getElementById("difficulty").addEventListener("change",updateChessStatus);
