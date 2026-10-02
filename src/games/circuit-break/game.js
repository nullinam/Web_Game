const DIRECTIONS = ["N", "E", "S", "W"];
const DELTA = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const OPPOSITE = { N: "S", E: "W", S: "N", W: "E" };
const SHAPE_LIBRARY = [
  ["N", "E"], ["E", "S"], ["S", "W"], ["W", "N"], // elbows
  ["N", "S"], ["E", "W"], // straight pipes
  ["N", "E", "W"], ["N", "E", "S"], ["E", "S", "W"], ["N", "S", "W"], // T pipes
  ["N", "E", "S", "W"], // cross pipe
];
const SIZE_KEY = "playground.circuit-break.size.v1";
const BASE_OBSTACLES = { 5: 2, 6: 4, 7: 7, 8: 11 };
const TERMINAL_COUNTS = { 5: [1, 1], 6: [1, 2], 7: [2, 1], 8: [2, 2] };

function rotatePorts(ports, turns) {
  return ports.map((port) => DIRECTIONS[(DIRECTIONS.indexOf(port) + turns) % 4]);
}

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function terminalRows(size, count, side) {
  if (count === 1) return [Math.floor(size / 2)];
  if (side === "source") return [1, size - 2];
  return [Math.floor(size / 3), Math.ceil((size * 2) / 3)];
}

function cellKey(row, col, size) { return row * size + col; }

function neighborIndex(index, direction, size) {
  const row = Math.floor(index / size) + DELTA[direction][0];
  const col = index % size + DELTA[direction][1];
  if (row < 0 || row >= size || col < 0 || col >= size) return -1;
  return cellKey(row, col, size);
}

function isWalkableConnected(size, obstacles) {
  const start = Array.from({ length: size * size }, (_, index) => index).find((index) => !obstacles.has(index));
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    for (const direction of DIRECTIONS) {
      const next = neighborIndex(current, direction, size);
      if (next >= 0 && !obstacles.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  return seen.size === size * size - obstacles.size;
}

function makeMazeTree(size, obstacles) {
  const start = Math.floor(Math.random() * size * size);
  if (obstacles.has(start)) return makeMazeTree(size, obstacles);
  const seen = new Set([start]);
  const tree = new Map(Array.from({ length: size * size }, (_, index) => [index, []]));
  const stack = [start];
  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = shuffled(DIRECTIONS.map((direction) => ({ direction, index: neighborIndex(current, direction, size) }))
      .filter(({ index }) => index >= 0 && !obstacles.has(index) && !seen.has(index)));
    if (!options.length) { stack.pop(); continue; }
    const { direction, index: next } = options[0];
    seen.add(next);
    tree.get(current).push({ index: next, direction });
    tree.get(next).push({ index: current, direction: OPPOSITE[direction] });
    stack.push(next);
  }
  return tree;
}

function getTreePath(tree, start, target) {
  const parent = new Map([[start, null]]);
  const queue = [start];
  while (queue.length && !parent.has(target)) {
    const current = queue.shift();
    for (const edge of tree.get(current)) {
      if (!parent.has(edge.index)) { parent.set(edge.index, { index: current, direction: edge.direction }); queue.push(edge.index); }
    }
  }
  if (!parent.has(target)) return [];
  const path = [];
  let current = target;
  while (current !== start) {
    const step = parent.get(current);
    path.push({ from: step.index, to: current, direction: step.direction });
    current = step.index;
  }
  return path.reverse();
}

function activePorts(tile) { return tile ? rotatePorts(tile.ports, tile.turns) : []; }

export function getPoweredPipes(board, size, sources) {
  const reached = new Set();
  const queue = [];
  for (const source of sources) {
    const sourceIndex = cellKey(source.row, source.col, size);
    if (activePorts(board[sourceIndex]).includes(source.side)) {
      reached.add(sourceIndex);
      queue.push(sourceIndex);
    }
  }
  while (queue.length) {
    const current = queue.shift();
    for (const direction of activePorts(board[current])) {
      const next = neighborIndex(current, direction, size);
      if (next >= 0 && board[next] && !reached.has(next) && activePorts(board[next]).includes(OPPOSITE[direction])) {
        reached.add(next);
        queue.push(next);
      }
    }
  }
  return reached;
}

export function createCircuitLevel(size, level) {
  if (![5, 6, 7, 8].includes(size) || !Number.isInteger(level) || level < 1) throw new RangeError("Choose a board from 5×5 to 8×8 and a level of 1 or higher.");
  const [sourceCount, outputCount] = TERMINAL_COUNTS[size];
  const sources = terminalRows(size, sourceCount, "source").map((row) => ({ row, col: 0, side: "W", kind: "power" }));
  const outputs = terminalRows(size, outputCount, "output").map((row) => ({ row, col: size - 1, side: "E", kind: "output" }));
  const terminalCells = new Set([...sources, ...outputs].map(({ row, col }) => cellKey(row, col, size)));
  const obstacleCount = Math.min(BASE_OBSTACLES[size] + Math.min(level - 1, 3), Math.floor(size * size * 0.24));
  let board;
  let obstacles;

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidates = shuffled(Array.from({ length: size * size }, (_, index) => index).filter((index) => !terminalCells.has(index)));
    obstacles = new Set(candidates.slice(0, obstacleCount));
    if (!isWalkableConnected(size, obstacles)) continue;

    const tree = makeMazeTree(size, obstacles);
    const network = new Map();
    const addPort = (index, direction) => {
      if (!network.has(index)) network.set(index, new Set());
      network.get(index).add(direction);
    };
    const terminals = [...sources, ...outputs];
    const root = cellKey(terminals[0].row, terminals[0].col, size);
    for (const terminal of terminals) {
      const terminalIndex = cellKey(terminal.row, terminal.col, size);
      for (const edge of getTreePath(tree, root, terminalIndex)) {
        addPort(edge.from, edge.direction);
        addPort(edge.to, OPPOSITE[edge.direction]);
      }
      addPort(terminalIndex, terminal.side);
    }

    board = Array.from({ length: size * size }, (_, index) => {
      if (obstacles.has(index)) return null;
      const solution = network.has(index)
        ? [...network.get(index)]
        : SHAPE_LIBRARY[Math.floor(Math.random() * SHAPE_LIBRARY.length)];
      const turns = Math.floor(Math.random() * 4);
      return { ports: solution, turns, isNetwork: network.has(index) };
    });

    // Start every puzzle dark: source tiles must face away from the power terminals.
    if (sources.some((source) => activePorts(board[cellKey(source.row, source.col, size)]).includes(source.side))) continue;
    if (outputs.every((output) => getPoweredPipes(board, size, sources).has(cellKey(output.row, output.col, size)))) continue;
    break;
  }

  if (!board || sources.some((source) => activePorts(board[cellKey(source.row, source.col, size)]).includes(source.side))) {
    return createCircuitLevel(size, level);
  }
  const pipeCount = board.filter(Boolean).length;
  return {
    size, level, board, sources, outputs, obstacles,
    obstacleCount,
    maxMoves: pipeCount * 3,
    timeLimit: 180 + (size - 5) * 60,
    routeTileCount: board.filter((tile) => tile?.isNetwork).length,
  };
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function pipeSvg(ports) {
  const points = { N: "50 50, 50 4", E: "50 50, 96 50", S: "50 50, 50 96", W: "50 50, 4 50" };
  const paths = ports.map((port) => `<polyline points="${points[port]}" />`).join("");
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g>${paths}<circle cx="50" cy="50" r="7" /></g></svg>`;
}

function bestKey(size) { return `playground.circuit-break.best.${size}.v1`; }

export function mountCircuitBreak(root, { onComplete }) {
  const savedSize = Number(localStorage.getItem(SIZE_KEY));
  let size = [5, 6, 7, 8].includes(savedSize) ? savedSize : 8;
  let levelNumber = 1;
  let level;
  let moves = 0;
  let timeLeft = level.timeLimit;
  let finished = false;
  let timerId;

  root.innerHTML = `<div class="circuit-game">
    <div class="circuit-game-top"><div class="eyebrow"><i class="status-dot"></i> CIRCUIT CHALLENGE</div><label class="circuit-size-label">BOARD <select data-size aria-label="Choose circuit board size">${[5, 6, 7, 8].map((value) => `<option value="${value}" ${value === size ? "selected" : ""}>${value} × ${value}</option>`).join("")}</select></label></div>
    <div class="circuit-title-row"><div><h2>Circuit Break <span data-level>LEVEL 01</span></h2><p>Power every core. Keep the grid alive.</p></div><div class="circuit-best">BEST <strong data-best>—</strong></div></div>
    <div class="circuit-objectives" data-objectives></div>
    <div class="circuit-hud"><div><span>MOVES LEFT</span><strong data-moves></strong></div><div><span>TIME LEFT</span><strong data-time></strong></div><div class="circuit-flow" data-flow><i></i> Grid offline</div></div>
    <div class="circuit-board-wrap"><div class="circuit-board" role="grid" aria-label="Circuit puzzle board"></div></div>
    <div class="circuit-rules"><span><kbd>CLICK</kbd> rotate clockwise</span><span><kbd>R</kbd> restart level</span><span class="circuit-local-note">Score saves on this device</span></div>
    <div class="circuit-result" data-result hidden></div>
  </div>`;

  const boardElement = root.querySelector(".circuit-board");
  const movesElement = root.querySelector("[data-moves]");
  const timeElement = root.querySelector("[data-time]");
  const flowElement = root.querySelector("[data-flow]");
  const objectivesElement = root.querySelector("[data-objectives]");
  const resultElement = root.querySelector("[data-result]");
  const bestElement = root.querySelector("[data-best]");
  const levelElement = root.querySelector("[data-level]");
  const timerValue = (seconds) => formatTime(Math.max(0, seconds));

  function renderObjectives() {
    const sources = level.sources.map((source, index) => `<span class="objective source-objective" data-source="${index}"><i>ϟ</i> POWER ${index + 1}</span>`).join("");
    const outputs = level.outputs.map((output, index) => `<span class="objective output-objective" data-output="${index}"><i>◉</i> CORE ${index + 1}</span>`).join("");
    objectivesElement.innerHTML = `<div class="objective-terminals">${sources}${outputs}</div><span class="obstacle-count">⬚ ${level.obstacleCount} obstacles</span>`;
  }

  function renderBoard() {
    boardElement.style.setProperty("--board-size", level.size);
    boardElement.innerHTML = level.board.map((tile, index) => {
      if (!tile) return `<div class="circuit-obstacle" role="gridcell" aria-label="Blocked tile"><span>×</span></div>`;
      const source = level.sources.find((terminal) => cellKey(terminal.row, terminal.col, size) === index);
      const outputIndex = level.outputs.findIndex((terminal) => cellKey(terminal.row, terminal.col, size) === index);
      const terminalClass = source ? " source-tile" : outputIndex >= 0 ? " output-tile" : "";
      const marker = source ? `<span class="terminal-marker source-marker">ϟ</span>` : outputIndex >= 0 ? `<span class="terminal-marker output-marker">${outputIndex + 1}</span>` : "";
      return `<button class="circuit-tile${terminalClass}" role="gridcell" data-tile="${index}" aria-label="${source ? "Power source" : outputIndex >= 0 ? `Core ${outputIndex + 1}` : "Pipe"}; click to rotate clockwise">${marker}${pipeSvg(activePorts(tile))}</button>`;
    }).join("");
    movesElement.textContent = `${level.maxMoves - moves} / ${level.maxMoves}`;
    timeElement.textContent = timerValue(timeLeft);
    levelElement.textContent = `LEVEL ${String(levelNumber).padStart(2, "0")}`;
    bestElement.textContent = `${Number(localStorage.getItem(bestKey(size))) || 0} pts`;
    renderObjectives();
    updatePower();
  }

  function finish(won, reason = "") {
    if (finished) return;
    finished = true;
    clearInterval(timerId);
    const timeBonus = Math.max(0, Math.floor(timeLeft / 3));
    const moveBonus = Math.max(0, Math.floor((level.maxMoves - moves) / 2));
    const points = won ? 100 + (size - 5) * 60 + levelNumber * 15 + timeBonus + moveBonus : 0;
    if (won) {
      const key = bestKey(size);
      const previous = Number(localStorage.getItem(key)) || 0;
      localStorage.setItem(key, String(Math.max(previous, points)));
      bestElement.textContent = `${Math.max(previous, points)} pts`;
      resultElement.innerHTML = `<div><span>ALL CORES ONLINE</span><strong>+${points} points</strong><small>${moves} / ${level.maxMoves} moves used · ${timerValue(timeLeft)} left · ${level.routeTileCount} connected pipes</small></div><button class="circuit-play-again" data-circuit="next">Next level ↗</button>`;
      onComplete(points);
    } else {
      resultElement.innerHTML = `<div><span>GRID SHUTDOWN</span><strong>${reason}</strong><small>Level ${String(levelNumber).padStart(2, "0")} · ${moves} moves used</small></div><button class="circuit-play-again" data-circuit="retry">Retry level ↻</button>`;
    }
    resultElement.hidden = false;
    flowElement.classList.toggle("failed", !won);
    flowElement.innerHTML = won ? "<i>✓</i> All cores powered" : "<i>×</i> Grid offline";
  }

  function updatePower() {
    const powered = getPoweredPipes(level.board, size, level.sources);
    boardElement.querySelectorAll("[data-tile]").forEach((button) => {
      button.classList.toggle("powered", powered.has(Number(button.dataset.tile)));
    });
    level.sources.forEach((source, index) => {
      const tileIndex = cellKey(source.row, source.col, size);
      objectivesElement.querySelector(`[data-source="${index}"]`)?.classList.toggle("online", powered.has(tileIndex));
    });
    level.outputs.forEach((output, index) => {
      const tileIndex = cellKey(output.row, output.col, size);
      objectivesElement.querySelector(`[data-output="${index}"]`)?.classList.toggle("online", powered.has(tileIndex) && activePorts(level.board[tileIndex]).includes(output.side));
    });
    const poweredOutputs = level.outputs.filter((output) => {
      const index = cellKey(output.row, output.col, size);
      return powered.has(index) && activePorts(level.board[index]).includes(output.side);
    }).length;
    const won = poweredOutputs === level.outputs.length;
    flowElement.classList.toggle("connected", won);
    flowElement.innerHTML = won ? "<i>✓</i> All cores online" : `<i></i> ${powered.size ? `${powered.size} pipes powered` : "Grid offline"} · ${poweredOutputs}/${level.outputs.length} cores`;
    if (won) finish(true);
  }

  function stopTimer() { clearInterval(timerId); }

  function startLevel(nextLevel = levelNumber) {
    stopTimer();
    levelNumber = nextLevel;
    level = createCircuitLevel(size, levelNumber);
    moves = 0;
    timeLeft = level.timeLimit;
    finished = false;
    resultElement.hidden = true;
    flowElement.classList.remove("failed", "connected");
    renderBoard();
    timerId = window.setInterval(() => {
      if (finished) return;
      timeLeft -= 1;
      timeElement.textContent = timerValue(timeLeft);
      if (timeLeft <= 0) finish(false, "Time expired");
    }, 1000);
  }

  boardElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tile]");
    if (!button || finished) return;
    const index = Number(button.dataset.tile);
    level.board[index].turns = (level.board[index].turns + 1) % 4;
    moves += 1;
    renderBoard();
    if (!finished && moves >= level.maxMoves) finish(false, "Move limit reached");
  });

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-circuit]")?.dataset.circuit;
    if (action === "next") startLevel(levelNumber + 1);
    if (action === "retry") startLevel(levelNumber);
  });
  root.querySelector("[data-size]").addEventListener("change", (event) => {
    size = Number(event.target.value);
    localStorage.setItem(SIZE_KEY, String(size));
    startLevel(1);
  });

  const onKey = (event) => {
    if (event.key.toLowerCase() === "r" && root.isConnected && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) startLevel(levelNumber);
  };
  document.addEventListener("keydown", onKey);
  startLevel(1);

  return () => {
    stopTimer();
    document.removeEventListener("keydown", onKey);
  };
}
