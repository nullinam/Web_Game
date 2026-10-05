/** Original grid simulation: independent of Phaser so maze and game rules can be checked directly. */
export type Direction = 0 | 1 | 2 | 3;
export const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const WALL = 0, FLOOR = 1, HOME = 2, GATE = 3;
export type Maze = {
  size: number; tiles: Uint8Array; pellets: Uint8Array; tunnelRow: number;
  playerSpawn: number; ghostSpawns: number[]; gate: number; fruitCell: number;
};
export type Actor = { cell: number; next: number; progress: number; dir: Direction; spawn: number };
export type Ghost = Actor & { id: number; mode: "normal" | "waiting" | "eyes"; releaseMs: number };
export type GameState = "ready" | "playing" | "dying" | "lost" | "won";

export function seededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function neighbor(maze: Maze, cell: number, direction: Direction, ghost = false): number {
  const size = maze.size, x = cell % size, y = Math.floor(cell / size);
  let nx = x + DIRECTIONS[direction][0], ny = y + DIRECTIONS[direction][1];
  if (y === maze.tunnelRow && ny === y && (nx < 0 || nx >= size)) nx = (nx + size) % size;
  if (nx < 0 || nx >= size || ny < 0 || ny >= size) return -1;
  const next = ny * size + nx, tile = maze.tiles[next];
  return tile === FLOOR || (ghost && (tile === HOME || tile === GATE)) ? next : -1;
}

export function distances(maze: Maze, start: number, ghost = false): Int16Array {
  const result = new Int16Array(maze.tiles.length).fill(-1), queue = [start];
  result[start] = 0;
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    for (let d = 0; d < 4; d++) {
      const next = neighbor(maze, cell, d as Direction, ghost);
      if (next >= 0 && result[next] < 0) { result[next] = result[cell] + 1; queue.push(next); }
    }
  }
  return result;
}

export function generateMaze(size: number, seed: number): Maze {
  if (![19, 25, 31].includes(size)) throw new Error("Supported maze sizes are 19, 25, and 31.");
  const random = seededRandom(seed), tiles = new Uint8Array(size * size), middle = Math.floor(size / 2);
  const carve = (x: number, y: number) => { tiles[y * size + x] = FLOOR; tiles[y * size + size - 1 - x] = FLOOR; };
  const visited = new Set<number>([size + 1]), stack = [[1, 1]];
  carve(1, 1);
  // Carve a maze in the left half, mirror it, then add loops and the central spine.
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = DIRECTIONS.map(([dx, dy]) => [x + dx * 2, y + dy * 2])
      .filter(([nx, ny]) => nx > 0 && nx <= middle && ny > 0 && ny < size - 1 && !visited.has(ny * size + nx));
    if (!options.length) { stack.pop(); continue; }
    const [nx, ny] = options[Math.floor(random() * options.length)];
    carve((x + nx) / 2, (y + ny) / 2); carve(nx, ny);
    visited.add(ny * size + nx); stack.push([nx, ny]);
  }
  for (let y = 1; y < size - 1; y++) {
    carve(middle, y); carve(1, y);
    if (y % 2) { carve(middle - 1, y); carve(middle + 1, y); }
  }
  for (let x = 1; x < size - 1; x++) { carve(x, 1); carve(x, size - 2); }
  for (let y = 2; y < size - 2; y++) for (let x = 2; x < middle; x++) {
    const cell = y * size + x;
    if (tiles[cell] || random() > 0.30) continue;
    const joinsHorizontal = tiles[cell - 1] === FLOOR && tiles[cell + 1] === FLOOR;
    const joinsVertical = tiles[cell - size] === FLOOR && tiles[cell + size] === FLOOR;
    if (joinsHorizontal !== joinsVertical) carve(x, y);
  }
  const tunnelRow = middle % 2 ? middle : middle + 1;
  for (let x = 0; x < size; x++) tiles[tunnelRow * size + x] = FLOOR;
  // Ghost-only home with one gate. A walkable ring keeps the maze connected around it.
  for (let y = tunnelRow - 2; y <= tunnelRow + 2; y++) for (let x = middle - 3; x <= middle + 3; x++) {
    if (y === tunnelRow - 2 || y === tunnelRow + 2 || x === middle - 3 || x === middle + 3) tiles[y * size + x] = FLOOR;
  }
  for (let y = tunnelRow - 1; y <= tunnelRow + 1; y++) for (let x = middle - 2; x <= middle + 2; x++)
    tiles[y * size + x] = y === tunnelRow && Math.abs(x - middle) <= 1 ? HOME : WALL;
  const gate = (tunnelRow - 1) * size + middle;
  tiles[gate] = GATE;
  const playerSpawn = (size - 2) * size + middle;
  const maze: Maze = { size, tiles, tunnelRow, playerSpawn, gate, fruitCell: (tunnelRow + 2) * size + middle,
    ghostSpawns: [tunnelRow * size + middle, tunnelRow * size + middle - 1, tunnelRow * size + middle + 1, tunnelRow * size + middle],
    pellets: new Uint8Array(size * size) };
  const reachable = distances(maze, playerSpawn);
  for (let cell = 0; cell < tiles.length; cell++) {
    if (tiles[cell] !== FLOOR) continue;
    if (reachable[cell] < 0) { tiles[cell] = WALL; continue; }
    maze.pellets[cell] = 1;
  }
  maze.pellets[playerSpawn] = 0;
  maze.pellets[tunnelRow * size] = 0;
  maze.pellets[tunnelRow * size + size - 1] = 0;
  for (const cell of [size + 1, size + size - 2, (size - 2) * size + 1, (size - 2) * size + size - 2]) maze.pellets[cell] = 2;
  return maze;
}

export function actorPosition(maze: Maze, actor: Actor) {
  const x = actor.cell % maze.size, y = Math.floor(actor.cell / maze.size);
  if (actor.cell === actor.next) return { x, y };
  return { x: x + DIRECTIONS[actor.dir][0] * actor.progress, y: y + DIRECTIONS[actor.dir][1] * actor.progress };
}

export class PacmanEngine {
  readonly maze: Maze;
  readonly player: Actor;
  readonly ghosts: Ghost[];
  readonly pellets: Uint8Array;
  readonly totalPellets: number;
  state: GameState = "ready";
  paused = false;
  score = 0;
  lives = 3;
  remaining: number;
  elapsedMs = 0;
  powerMs = 0;
  freezeMs = 0;
  invulnerableMs = 0;
  readyMs = 1200;
  deathMs = 0;
  fruitMs = 0;
  message = "READY · clear every dot";
  ghostChain = 0;
  private requested: Direction = 3;
  private random: () => number;
  private fruitTriggers = 0;
  private readonly level: number;

  constructor(size: number, seed: number, level = 1) {
    this.maze = generateMaze(size, seed);
    this.pellets = this.maze.pellets.slice();
    this.remaining = this.totalPellets = this.pellets.reduce((count, value) => count + Number(value > 0), 0);
    this.level = level;
    this.random = seededRandom(seed ^ 0x5f3759df);
    this.player = this.makeActor(this.maze.playerSpawn);
    this.ghosts = this.maze.ghostSpawns.map((spawn, id) => ({ ...this.makeActor(spawn), id, mode: "waiting", releaseMs: 700 + id * 1800 }));
  }
  private makeActor(spawn: number): Actor { return { cell: spawn, next: spawn, progress: 0, dir: 3, spawn }; }
  requestDirection(direction: Direction) {
    this.requested = direction;
    // A reversal should respond immediately, including halfway along a corridor.
    if (this.player.cell !== this.player.next && direction === (this.player.dir + 2) % 4) {
      [this.player.cell, this.player.next] = [this.player.next, this.player.cell];
      this.player.progress = 1 - this.player.progress;
      this.player.dir = direction;
    }
  }
  togglePause() {
    if (this.state === "lost" || this.state === "won") return;
    this.paused = !this.paused;
  }
  useFreeze() { if (this.state !== "lost" && this.state !== "won") { this.freezeMs = 4000; this.message = "Ghosts frozen for 4 seconds"; } }

  tick(deltaMs: number) {
    if (this.paused || this.state === "lost" || this.state === "won") return;
    // Small steps keep collisions reliable when actors cross between tile centres.
    for (let remaining = Math.min(100, Math.max(0, deltaMs)); remaining > 0;) {
      const step = Math.min(8, remaining); remaining -= step;
      this.step(step);
      if (["lost", "won"].includes(this.state)) break;
    }
  }
  private step(delta: number) {
    if (this.state === "ready") {
      this.readyMs -= delta;
      if (this.readyMs <= 0) { this.state = "playing"; this.message = "Eat dots · power pellets turn the tables"; }
      return;
    }
    if (this.state === "dying") {
      this.deathMs -= delta;
      if (this.deathMs <= 0) {
        if (this.lives <= 0) { this.state = "lost"; this.message = "GAME OVER · press R or click Restart"; }
        else this.respawn();
      }
      return;
    }
    this.elapsedMs += delta;
    const oldPower = this.powerMs, oldFreeze = this.freezeMs;
    this.powerMs = Math.max(0, this.powerMs - delta);
    this.freezeMs = Math.max(0, this.freezeMs - delta);
    if (oldPower > 0 && this.powerMs === 0) { this.ghostChain = 0; this.message = "Power ended · avoid the ghosts"; }
    if (oldFreeze > 0 && this.freezeMs === 0) this.message = "Ghosts are moving again";
    this.invulnerableMs = Math.max(0, this.invulnerableMs - delta);
    this.fruitMs = Math.max(0, this.fruitMs - delta);
    const playerSpeed = 5.2 + Math.min(1.4, (this.level - 1) * 0.07);
    this.advance(this.player, playerSpeed * delta / 1000, false, () => this.playerDirection(), () => this.collect());
    if (this.state !== "playing") return;
    if (this.freezeMs <= 0) for (const ghost of this.ghosts) {
      if (ghost.mode === "waiting") {
        ghost.releaseMs -= delta;
        if (ghost.releaseMs > 0) continue;
        ghost.mode = "normal";
      }
      const speed = ghost.mode === "eyes" ? 9 : this.powerMs > 0 ? 3.1 : 4.5 + Math.min(1.7, (this.level - 1) * 0.08);
      this.advance(ghost, speed * delta / 1000, true, () => this.ghostDirection(ghost), () => {
        if (ghost.mode === "eyes" && ghost.cell === ghost.spawn) { ghost.mode = "waiting"; ghost.releaseMs = 1700; }
      });
      if (this.state !== "playing") break;
    }
    this.collisions();
  }

  private advance(actor: Actor, amount: number, ghost: boolean, choose: () => Direction | null, arrive: () => void) {
    while (amount > 0 && this.state === "playing") {
      if (actor.cell === actor.next) {
        const direction = choose();
        if (direction === null) return;
        const next = neighbor(this.maze, actor.cell, direction, ghost);
        if (next < 0) return;
        actor.dir = direction; actor.next = next; actor.progress = 0;
      }
      const distance = Math.min(amount, 1 - actor.progress);
      actor.progress += distance; amount -= distance;
      if (actor.progress >= 1 - 1e-8) {
        actor.cell = actor.next; actor.progress = 0; arrive();
        if ("mode" in actor && (actor as Ghost).mode === "waiting") return;
      }
    }
  }
  private playerDirection(): Direction | null {
    if (neighbor(this.maze, this.player.cell, this.requested) >= 0) return this.requested;
    return neighbor(this.maze, this.player.cell, this.player.dir) >= 0 ? this.player.dir : null;
  }
  private nearestFloor(x: number, y: number) {
    let best = this.player.cell, distance = Infinity;
    for (let cell = 0; cell < this.maze.tiles.length; cell++) {
      if (this.maze.tiles[cell] !== FLOOR) continue;
      const value = Math.abs(cell % this.maze.size - x) + Math.abs(Math.floor(cell / this.maze.size) - y);
      if (value < distance) { best = cell; distance = value; }
    }
    return best;
  }
  private ghostDirection(ghost: Ghost): Direction | null {
    if (ghost.mode === "waiting") return null;
    const options: Direction[] = [];
    for (let d = 0; d < 4; d++) if (neighbor(this.maze, ghost.cell, d as Direction, true) >= 0) options.push(d as Direction);
    if (!options.length) return null;
    const forward = options.filter((d) => d !== (ghost.dir + 2) % 4);
    const candidates = ghost.mode === "eyes" || !forward.length ? options : forward;
    const playerDistances = distances(this.maze, this.player.cell, true);
    if (this.powerMs > 0 && ghost.mode === "normal") {
      return candidates.map((direction) => ({ direction, rank: playerDistances[neighbor(this.maze, ghost.cell, direction, true)] + this.random() * 0.1 }))
        .sort((a, b) => b.rank - a.rank)[0].direction;
    }
    const size = this.maze.size, px = this.player.cell % size, py = Math.floor(this.player.cell / size), [dx, dy] = DIRECTIONS[this.player.dir];
    const corners = [size + size - 2, size + 1, (size - 2) * size + size - 2, (size - 2) * size + 1];
    const scatter = this.elapsedMs < 7000 || (this.elapsedMs >= 27000 && this.elapsedMs < 34000);
    let target = this.player.cell;
    if (ghost.mode === "eyes") target = ghost.spawn;
    else if (scatter || (ghost.id === 3 && playerDistances[ghost.cell] < 8)) target = corners[ghost.id];
    else if (ghost.id === 1) target = this.nearestFloor(px + dx * 4, py + dy * 4);
    else if (ghost.id === 2) {
      const red = this.ghosts[0];
      target = this.nearestFloor((px + dx * 2) * 2 - red.cell % size, (py + dy * 2) * 2 - Math.floor(red.cell / size));
    }
    const route = distances(this.maze, target, true);
    return candidates.sort((a, b) => route[neighbor(this.maze, ghost.cell, a, true)] - route[neighbor(this.maze, ghost.cell, b, true)])[0];
  }
  private collect() {
    const cell = this.player.cell, value = this.pellets[cell];
    if (value) {
      this.pellets[cell] = 0; this.remaining--; this.score += value === 2 ? 50 : 10;
      if (value === 2) {
        this.powerMs = Math.max(4500, 7500 - (this.level - 1) * 100);
        this.ghostChain = 0; this.message = "POWER UP · chase the blue ghosts";
        for (const ghost of this.ghosts) if (ghost.mode === "normal") {
          const reverse = (ghost.dir + 2) % 4 as Direction;
          if (ghost.cell !== ghost.next) {
            [ghost.cell, ghost.next] = [ghost.next, ghost.cell]; ghost.progress = 1 - ghost.progress; ghost.dir = reverse;
          } else ghost.dir = reverse;
        }
      }
      const eaten = this.totalPellets - this.remaining;
      if ((this.fruitTriggers === 0 && eaten >= this.totalPellets / 3) || (this.fruitTriggers === 1 && eaten >= this.totalPellets * 2 / 3)) {
        this.fruitTriggers++; this.fruitMs = 12000; this.message = "BONUS CHERRIES · collect them before they disappear";
      }
    }
    if (this.fruitMs > 0 && cell === this.maze.fruitCell) {
      this.score += this.level < 3 ? 100 : this.level < 6 ? 300 : 500;
      this.fruitMs = 0; this.message = "Bonus cherries collected";
    }
    if (this.remaining === 0) { this.state = "won"; this.score += 500 + this.lives * 100; this.message = "MAZE CLEARED · continue when you are ready"; }
  }
  private collisions() {
    if (this.state !== "playing") return;
    const player = actorPosition(this.maze, this.player);
    for (const ghost of this.ghosts) {
      if (ghost.mode !== "normal") continue;
      const other = actorPosition(this.maze, ghost), rawX = Math.abs(player.x - other.x);
      const dx = Math.min(rawX, this.maze.size - rawX), dy = player.y - other.y;
      if (dx * dx + dy * dy > 0.45) continue;
      if (this.powerMs > 0) {
        ghost.mode = "eyes"; this.ghostChain++;
        const bonus = 200 * 2 ** Math.min(3, this.ghostChain - 1);
        this.score += bonus; this.message = "+" + bonus + " · ghost caught";
      } else if (this.invulnerableMs <= 0) {
        this.lives--; this.state = "dying"; this.deathMs = 800; this.powerMs = 0;
        this.message = this.lives ? "Caught · " + this.lives + " lives left" : "Last life lost";
        break;
      }
    }
  }
  private respawn() {
    Object.assign(this.player, this.makeActor(this.maze.playerSpawn));
    this.ghosts.forEach((ghost) => Object.assign(ghost, this.makeActor(ghost.spawn), { mode: "waiting", releaseMs: 700 + ghost.id * 1800 }));
    this.requested = 3; this.state = "ready"; this.readyMs = 1200; this.invulnerableMs = 1800;
    this.powerMs = 0; this.ghostChain = 0; this.message = "READY · dots and score are preserved";
  }

  hintRoute(): number[] {
    const routeDistances = distances(this.maze, this.player.cell);
    const targets = Array.from(this.pellets, (value, cell) => ({ value, cell }))
      .filter(({ value, cell }) => value && routeDistances[cell] >= 0);
    const power = targets.filter(({ value }) => value === 2);
    const target = (power.length ? power : targets).sort((a, b) => routeDistances[a.cell] - routeDistances[b.cell])[0]?.cell;
    if (target === undefined) return [];
    const route = [target];
    let cell = target;
    while (cell !== this.player.cell) {
      let nextCell = -1;
      for (let d = 0; d < 4; d++) {
        const next = neighbor(this.maze, cell, d as Direction);
        if (next >= 0 && routeDistances[next] === routeDistances[cell] - 1) { nextCell = next; break; }
      }
      if (nextCell < 0) return [];
      cell = nextCell; route.push(cell);
    }
    return route.reverse();
  }
}
