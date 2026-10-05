import { random, type State } from "./engine.ts";

export type SlideDirection = "up" | "right" | "down" | "left";
export type NumberTile = { id: number; index: number; value: number; merged: boolean; isNew: boolean };
export const SLIDE_DIRECTIONS: SlideDirection[] = ["up", "right", "down", "left"];

// Traverse each line from the edge it moves toward. Pair neighbors once, so a
// result tile cannot merge again during the same move (2,2,4 becomes 4,4).
export function slideTiles(tiles: NumberTile[], size: number, direction: SlideDirection) {
  const positions = new Map(tiles.map(tile => [tile.index, tile]));
  const result: NumberTile[] = [];
  let scoreGain = 0;
  for (let line = 0; line < size; line++) {
    const indices = Array.from({ length: size }, (_, offset) => direction === "left" ? line * size + offset : direction === "right" ? line * size + size - 1 - offset : direction === "up" ? offset * size + line : (size - 1 - offset) * size + line);
    const occupied = indices.map(index => positions.get(index)).filter((tile): tile is NumberTile => !!tile);
    let destination = 0;
    for (let i = 0; i < occupied.length; i++) {
      const tile = { ...occupied[i], index: indices[destination++], merged: false, isNew: false };
      if (occupied[i + 1]?.value === tile.value) { tile.value *= 2; tile.merged = true; scoreGain += tile.value; i++; }
      result.push(tile);
    }
  }
  const moved = result.length !== tiles.length || result.some(tile => positions.get(tile.index)?.id !== tile.id || positions.get(tile.index)?.value !== tile.value);
  return { tiles: result, moved, scoreGain };
}

export class Game2048Engine {
  size: number; rng: () => number; tiles: NumberTile[] = []; nextId = 0;
  state: State = "playing"; score = 0; moves = 0; elapsed = 0; animationMs = 0;
  hintMs = 0; hintDirection: SlideDirection | null = null; lifelineUsed = false;
  message = "Slide the whole board. Equal neighbors merge once per move. Reach 2048.";
  constructor(size: number, seed: number) {
    if (![3, 4, 5].includes(size)) throw new Error("2048 supports 3, 4, or 5 cells per side.");
    this.size = size; this.rng = random(seed); this.spawn(); this.spawn();
  }
  get highest() { return Math.max(0, ...this.tiles.map(tile => tile.value)); }
  spawn() {
    const occupied = new Set(this.tiles.map(tile => tile.index));
    const empty = Array.from({ length: this.size * this.size }, (_, i) => i).filter(i => !occupied.has(i));
    if (!empty.length) return;
    const index = empty[Math.floor(this.rng() * empty.length)];
    this.tiles.push({ id: this.nextId++, index, value: this.rng() < .1 ? 4 : 2, merged: false, isNew: true });
  }
  canMove() { return SLIDE_DIRECTIONS.some(direction => slideTiles(this.tiles, this.size, direction).moved); }
  move(direction: SlideDirection) {
    if (this.state !== "playing" || this.animationMs > 0) return false;
    const result = slideTiles(this.tiles, this.size, direction);
    if (!result.moved) { this.message = "Nothing moved. Try another direction."; if (!this.canMove()) { this.state = "lost"; this.message = "No moves remain. Restart to retry this challenge."; } return false; }
    this.tiles = result.tiles; this.score += result.scoreGain; this.moves++;
    this.hintDirection = null; this.hintMs = 0;
    this.spawn(); this.animationMs = 180;
    this.message = result.scoreGain ? `Merged tiles: +${result.scoreGain} points.` : "Board shifted. A new tile appeared.";
    // Resolve completion after the slide animation, before accepting more input.
    return true;
  }
  tick(ms: number) {
    if (this.state !== "playing") return;
    if (this.moves > 0) this.elapsed += ms;
    this.hintMs = Math.max(0, this.hintMs - ms);
    if (this.animationMs > 0) {
      this.animationMs = Math.max(0, this.animationMs - ms);
      if (!this.animationMs) {
        this.tiles.forEach(tile => { tile.merged = false; tile.isNew = false; });
        if (this.highest >= 2048) { this.state = "won"; this.message = "2048 reached! The next board is unlocked."; }
        else if (!this.canMove()) { this.state = "lost"; this.message = "No moves remain. Restart to retry the same board and tile sequence."; }
      }
    }
  }
  hint() {
    if (this.state !== "playing" || this.animationMs > 0) return;
    let best = -Infinity, suggestion: SlideDirection | null = null;
    for (const direction of SLIDE_DIRECTIONS) {
      const next = slideTiles(this.tiles, this.size, direction); if (!next.moved) continue;
      const empty = this.size * this.size - next.tiles.length;
      const max = Math.max(...next.tiles.map(tile => tile.value));
      const corners = [0, this.size - 1, this.size * (this.size - 1), this.size * this.size - 1];
      const cornerBonus = next.tiles.some(tile => tile.value === max && corners.includes(tile.index)) ? max * .2 : 0;
      const quality = empty * 100 + next.scoreGain * 2 + cornerBonus;
      if (quality > best) { best = quality; suggestion = direction; }
    }
    this.hintDirection = suggestion; this.hintMs = 4000;
    this.message = suggestion ? `Hint: try ${suggestion}. This favors space, merges, and a high corner tile; it does not guarantee a win.` : "No legal move remains.";
  }
  lifeline() {
    if (this.state !== "playing" || this.animationMs > 0 || this.lifelineUsed || this.tiles.length < 2) return;
    const lowest = [...this.tiles].sort((a, b) => a.value - b.value || a.index - b.index)[0];
    this.tiles = this.tiles.filter(tile => tile.id !== lowest.id); this.lifelineUsed = true;
    this.hintDirection = null; this.hintMs = 0;
    this.message = `Removed one ${lowest.value} tile. No points awarded; keep merging toward 2048.`;
  }
}
