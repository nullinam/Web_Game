const SIZE = 5;
const SOURCE = { row: 2, col: 0 };
const TARGET = { row: 2, col: SIZE - 1 };
const DIRECTIONS = ["N", "E", "S", "W"];
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const OPPOSITE = { N: "S", E: "W", S: "N", W: "E" };
const BEST_KEY = "playground.circuit-break.best.v1";
const SHAPES = ["NE", "ES", "SW", "WN", "NS", "EW"];

const route = [
  [2, 0], [2, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3], [3, 4], [2, 4],
];

function rotatePorts(ports, turns) {
  return ports.map((port) => DIRECTIONS[(DIRECTIONS.indexOf(port) + turns) % 4]);
}

function makeBoard() {
  const path = new Map();
  route.forEach(([row, col], index) => {
    const ports = [];
    if (index === 0) ports.push("W");
    else {
      const [prevRow, prevCol] = route[index - 1];
      ports.push(Object.keys(DELTA).find((key) => row + DELTA[key][0] === prevRow && col + DELTA[key][1] === prevCol));
    }
    if (index === route.length - 1) ports.push("E");
    else {
      const [nextRow, nextCol] = route[index + 1];
      ports.push(Object.keys(DELTA).find((key) => row + DELTA[key][0] === nextRow && col + DELTA[key][1] === nextCol));
    }
    path.set(`${row}-${col}`, ports);
  });

  let board;
  do {
    board = Array.from({ length: SIZE * SIZE }, (_, index) => {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const solution = path.get(`${row}-${col}`) || SHAPES[Math.floor(Math.random() * SHAPES.length)].split("");
      const turns = Math.floor(Math.random() * 4);
      const symmetricStraight = solution.length === 2 && DIRECTIONS.indexOf(solution[0]) % 2 === DIRECTIONS.indexOf(solution[1]) % 2;
      return { row, col, ports: solution, turns: symmetricStraight ? turns % 2 * 2 : turns };
    });
  } while (findPowered(board).has(TARGET.row * SIZE + TARGET.col) && activePorts(board[TARGET.row * SIZE + TARGET.col]).includes("E"));
  return board;
}

function activePorts(tile) { return rotatePorts(tile.ports, tile.turns); }

function findPowered(board) {
  const startIndex = SOURCE.row * SIZE + SOURCE.col;
  const reached = new Set();
  const queue = [];
  if (activePorts(board[startIndex]).includes("W")) {
    reached.add(startIndex);
    queue.push(startIndex);
  }
  while (queue.length) {
    const current = queue.shift();
    const tile = board[current];
    for (const direction of activePorts(tile)) {
      const [dr, dc] = DELTA[direction];
      const row = tile.row + dr;
      const col = tile.col + dc;
      if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) continue;
      const nextIndex = row * SIZE + col;
      if (!reached.has(nextIndex) && activePorts(board[nextIndex]).includes(OPPOSITE[direction])) {
        reached.add(nextIndex);
        queue.push(nextIndex);
      }
    }
  }
  return reached;
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function pipeSvg(ports) {
  const points = { N: "50 50, 50 4", E: "50 50, 96 50", S: "50 50, 50 96", W: "50 50, 4 50" };
  const paths = ports.map((port) => `<polyline points="${points[port]}" />`).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g>${paths}<circle cx="50" cy="50" r="7" /></g></svg>`;
}

export function mountCircuitBreak(root, { onComplete }) {
  let board = makeBoard();
  let moves = 0;
  let elapsed = 0;
  let finished = false;
  let timerId;
  const best = Number(localStorage.getItem(BEST_KEY)) || null;

  root.innerHTML = `<div class="circuit-game">
    <div class="circuit-game-top"><span class="eyebrow"><i class="status-dot"></i> LIVE PUZZLE</span><button class="circuit-new" data-circuit="new">New board ↻</button></div>
    <div class="circuit-title-row"><div><h2>Circuit Break</h2><p>Rotate the pipes to power the receiver.</p></div><div class="circuit-best">BEST <strong>${best === null ? "—" : `${best} pts`}</strong></div></div>
    <div class="circuit-hud"><div><span>MOVES</span><strong data-moves>0</strong></div><div><span>TIME</span><strong data-time>00:00</strong></div><div class="circuit-flow" data-flow><i></i> Find the path</div></div>
    <div class="circuit-board-wrap"><div class="circuit-terminal source-terminal"><span>POWER</span><i>ϟ</i></div><div class="circuit-board" role="grid" aria-label="Circuit puzzle board">${board.map((tile, index) => `<button class="circuit-tile" role="gridcell" data-tile="${index}" aria-label="Pipe at row ${tile.row + 1}, column ${tile.col + 1}. Press to rotate clockwise.">${pipeSvg(activePorts(tile))}</button>`).join("")}</div><div class="circuit-terminal target-terminal"><span>CORE</span><i>◉</i></div></div>
    <div class="circuit-instructions"><span><kbd>CLICK</kbd> rotate pipe</span><span><kbd>R</kbd> new board</span><span class="circuit-local-note">Score saves on this device</span></div>
    <div class="circuit-result" data-result hidden></div>
  </div>`;

  const boardElement = root.querySelector(".circuit-board");
  const movesElement = root.querySelector("[data-moves]");
  const timeElement = root.querySelector("[data-time]");
  const flowElement = root.querySelector("[data-flow]");
  const resultElement = root.querySelector("[data-result]");

  function updatePower() {
    const powered = findPowered(board);
    boardElement.querySelectorAll("[data-tile]").forEach((button) => {
      button.classList.toggle("powered", powered.has(Number(button.dataset.tile)));
    });
    const won = powered.has(TARGET.row * SIZE + TARGET.col) && activePorts(board[TARGET.row * SIZE + TARGET.col]).includes("E");
    flowElement.classList.toggle("connected", won);
    flowElement.innerHTML = won ? "<i>✓</i> Power restored" : `<i></i> ${powered.size ? `${powered.size} pipe${powered.size === 1 ? "" : "s"} powered` : "Find the path"}`;
    if (won && !finished) finish();
  }

  function renderBoard() {
    boardElement.innerHTML = board.map((tile, index) => `<button class="circuit-tile" role="gridcell" data-tile="${index}" aria-label="Pipe at row ${tile.row + 1}, column ${tile.col + 1}. Press to rotate clockwise.">${pipeSvg(activePorts(tile))}</button>`).join("");
    movesElement.textContent = String(moves);
    updatePower();
  }

  function finish() {
    finished = true;
    clearInterval(timerId);
    const points = Math.max(25, 140 - moves * 4 - elapsed);
    const previousBest = Number(localStorage.getItem(BEST_KEY)) || 0;
    const nextBest = Math.max(previousBest, points);
    localStorage.setItem(BEST_KEY, String(nextBest));
    root.querySelector(".circuit-best strong").textContent = `${nextBest} pts`;
    resultElement.hidden = false;
    resultElement.innerHTML = `<div><span>GRID RESTORED</span><strong>+${points} points</strong><small>${moves} moves · ${formatTime(elapsed)}${points === nextBest && points > previousBest ? " · New best" : ""}</small></div><button class="circuit-play-again" data-circuit="new">Play again ↗</button>`;
    onComplete(points);
  }

  function reset() {
    board = makeBoard();
    moves = 0;
    elapsed = 0;
    finished = false;
    resultElement.hidden = true;
    timeElement.textContent = "00:00";
    renderBoard();
  }

  boardElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tile]");
    if (!button || finished) return;
    board[Number(button.dataset.tile)].turns = (board[Number(button.dataset.tile)].turns + 1) % 4;
    moves += 1;
    renderBoard();
  });

  root.addEventListener("click", (event) => { if (event.target.closest('[data-circuit="new"]')) reset(); });
  const onKey = (event) => {
    if (event.key.toLowerCase() === "r" && root.isConnected && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) reset();
  };
  document.addEventListener("keydown", onKey);
  timerId = window.setInterval(() => {
    if (finished || !root.isConnected) return;
    elapsed += 1;
    timeElement.textContent = formatTime(elapsed);
  }, 1000);
  updatePower();

  return () => {
    clearInterval(timerId);
    document.removeEventListener("keydown", onKey);
  };
}
