import Phaser from "phaser";
import type { Run } from "./run";
import { PacmanEngine, WALL, GATE, actorPosition, DIRECTIONS, type Actor, type Direction, type Ghost } from "./pacman-engine";

const W = 1000, H = 680;
const COLORS = [0xf06762, 0xeb97c5, 0x64cfde, 0xf5b56a];
const BEST_KEY = "little-puzzles:pacman:best";

class PacmanScene extends Phaser.Scene {
  static firstRun: Run;
  private run!: Run;
  private engine!: PacmanEngine;
  private board!: Phaser.GameObjects.Graphics;
  private dots!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Graphics;
  private effects!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private dotsText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlayCopy!: Phaser.GameObjects.Text;
  private best = 0;
  private cell = 20;
  private ox = 250;
  private oy = 103;
  private lastRemaining = -1;
  private lastStats = "";
  private notified = false;
  private hintPath: number[] = [];
  private hintMs = 0;

  constructor() { super({ key: "pacman" }); }
  init(data?: Run) {
    this.run = data?.size ? data : PacmanScene.firstRun;
    this.engine = new PacmanEngine(this.run.size, this.run.seed, this.run.level);
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);
    this.cell = 500 / this.run.size;
    this.ox = (W - this.cell * this.run.size) / 2;
    this.oy = 106;
    this.lastRemaining = -1; this.lastStats = ""; this.notified = false;
    this.hintPath = []; this.hintMs = 0;
  }
  create() {
    this.board = this.add.graphics();
    this.dots = this.add.graphics();
    this.actors = this.add.graphics();
    this.effects = this.add.graphics();
    this.drawBoard();
    this.drawLabels();
    const overlayBackground = this.add.graphics().fillStyle(0x07101c, 0.93).fillRoundedRect(-180, -55, 360, 110, 16);
    overlayBackground.lineStyle(1, 0xb8d3ff, 0.45).strokeRoundedRect(-180, -55, 360, 110, 16);
    this.overlayTitle = this.add.text(0, -19, "READY", { fontFamily: "Arial", fontSize: "25px", fontStyle: "bold", color: "#ffe09a", letterSpacing: 3 }).setOrigin(0.5);
    this.overlayCopy = this.add.text(0, 19, "Arrows or WASD to move", { fontFamily: "Arial", fontSize: "12px", color: "#c0c9de" }).setOrigin(0.5);
    this.overlay = this.add.container(W / 2, this.oy + 250, [overlayBackground, this.overlayTitle, this.overlayCopy]);
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.key(event));
    const handleVisibility = () => {
      if (document.hidden && (this.engine.state === "playing" || this.engine.state === "ready")) {
        this.engine.paused = true;
        this.render();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener("visibilitychange", handleVisibility));
    const canvas = this.game.canvas;
    canvas.setAttribute("aria-label", "Pacman maze. Use arrow keys or WASD to move, P to pause, and R to restart.");
    canvas.setAttribute("role", "img");
    this.render();
  }
  update(_time: number, delta: number) {
    this.engine.tick(delta);
    if (!this.engine.paused) this.hintMs = Math.max(0, this.hintMs - delta);
    this.render();
    if (this.engine.state === "won" && !this.notified) { this.notified = true; this.run.onSolved?.(this.engine.score); }
  }
  private key(event: KeyboardEvent) {
    if (event.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === " " && event.target instanceof HTMLElement && event.target.tagName === "BUTTON") return;
    if (key === "r") { event.preventDefault(); this.run.onRestart?.(); return; }
    if (key === "p" || key === " ") {
      if (this.engine.state === "lost" || this.engine.state === "won") return;
      event.preventDefault(); this.engine.togglePause(); this.render(); return;
    }
    const direction: Record<string, Direction> = { arrowup: 0, w: 0, arrowright: 1, d: 1, arrowdown: 2, s: 2, arrowleft: 3, a: 3 };
    if (direction[key] !== undefined && this.engine.state !== "won" && this.engine.state !== "lost") {
      event.preventDefault(); this.engine.requestDirection(direction[key]);
    }
  }
  getScore() { return this.engine.score; }
  hint() {
    this.hintPath = this.engine.hintRoute(); this.hintMs = 6000;
    this.engine.message = "Hint: follow the gold trail to a power pellet";
    this.render();
  }
  lifeline() { this.engine.useFreeze(); this.render(); }

  private center(cell: number) { return { x: this.ox + (cell % this.run.size + 0.5) * this.cell, y: this.oy + (Math.floor(cell / this.run.size) + 0.5) * this.cell }; }
  private label(x: number, y: number, text: string, size: number, color = "#a8b6c9", bold = false) {
    return this.add.text(x, y, text, { fontFamily: "Arial", fontSize: size + "px", color, fontStyle: bold ? "bold" : "normal", lineSpacing: 6 });
  }
  private drawBoard() {
    const g = this.board, size = this.run.size, tiles = this.engine.maze.tiles;
    g.fillStyle(0x0c1522).fillRect(0, 0, W, H);
    g.fillStyle(0x152744, 0.55).fillRoundedRect(this.ox - 16, this.oy - 16, 532, 532, 17);
    g.fillStyle(0x020711).fillRoundedRect(this.ox - 9, this.oy - 9, 518, 518, 12);
    g.lineStyle(1, 0x6597dd, 0.3).strokeRoundedRect(this.ox - 13, this.oy - 13, 526, 526, 15);
    for (let cell = 0; cell < tiles.length; cell++) {
      const x = cell % size, y = Math.floor(cell / size), px = this.ox + x * this.cell, py = this.oy + y * this.cell;
      if (tiles[cell] === GATE) { g.lineStyle(3, 0xe493c3, 0.9).lineBetween(px, py + this.cell * 0.55, px + this.cell, py + this.cell * 0.55); continue; }
      if (tiles[cell] !== WALL) continue;
      g.fillStyle(0x0a1740).fillRect(px, py, this.cell, this.cell);
      for (let direction = 0; direction < 4; direction++) {
        const nx = x + DIRECTIONS[direction][0], ny = y + DIRECTIONS[direction][1];
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && tiles[ny * size + nx] === WALL) continue;
        const inset = this.cell * 0.10;
        const edges = [[px + inset, py + inset, px + this.cell - inset, py + inset],
          [px + this.cell - inset, py + inset, px + this.cell - inset, py + this.cell - inset],
          [px + inset, py + this.cell - inset, px + this.cell - inset, py + this.cell - inset],
          [px + inset, py + inset, px + inset, py + this.cell - inset]];
        const [x1, y1, x2, y2] = edges[direction];
        g.lineStyle(5, 0x235ae2, 0.18).lineBetween(x1, y1, x2, y2);
        g.lineStyle(1.7, 0x3c7cf8, 1).lineBetween(x1, y1, x2, y2);
      }
    }
    g.fillStyle(0x142135).fillRoundedRect(35, 157, 179, 259, 14);
    g.lineStyle(1, 0x8eaddc, 0.2).strokeRoundedRect(35, 157, 179, 259, 14);
    g.fillStyle(0x142135).fillRoundedRect(788, 157, 177, 410, 14);
    g.lineStyle(1, 0x8eaddc, 0.2).strokeRoundedRect(788, 157, 177, 410, 14);
  }
  private drawLabels() {
    this.label(40, 34, "PACMAN", 32, "#ffda73", true);
    this.label(42, 76, "ARCADE ROOM  /  MAZE " + String(this.run.level).padStart(3, "0"), 10, "#859ab8", true);
    this.label(52, 177, "SCORE", 10, "#99adc9", true);
    this.scoreText = this.label(52, 198, "000000", 30, "#f4eddc", true);
    this.label(52, 254, "PERSONAL BEST", 10, "#99adc9", true);
    this.bestText = this.label(52, 275, String(this.best), 22, "#c5d5ee", true);
    this.label(52, 331, "LIVES", 10, "#99adc9", true);
    this.label(45, 442, "10  dot\n50  power pellet\n200+  ghost combo", 12, "#a6b8cd");
    this.dotsText = this.label(45, 534, "", 12, "#f0e2bf", true);
    this.powerText = this.label(45, 559, "", 12, "#83d8e5", true);
    this.label(807, 177, "HOW TO PLAY", 11, "#e2d3b6", true);
    this.label(807, 209, "Arrows / WASD\nMove through the maze\n\nP / Space\nPause and resume\n\nR / Restart\nRetry this same maze", 12, "#bcc9d9");
    this.label(807, 379, "FOUR GHOSTS", 10, "#99adc9", true);
    const names = ["Red  /  pursues you", "Pink  /  ambushes ahead", "Blue  /  closes in", "Orange  /  roams nearby"];
    names.forEach((name, i) => this.label(825, 408 + i * 27, name, 10, ["#f28982", "#eeb6d4", "#91d8e3", "#e9bf8c"][i]));
    this.label(807, 532, "Clear every dot to advance.", 10, "#b9c9dc");
    this.messageText = this.label(W / 2, 636, "", 12, "#c6d4e6", true).setOrigin(0.5);
  }
  private drawDots() {
    this.dots.clear();
    this.engine.pellets.forEach((value, cell) => {
      if (value !== 1) return;
      const p = this.center(cell);
      this.dots.fillStyle(0xf5ddb4, 0.95).fillCircle(p.x, p.y, Math.max(1.5, this.cell * 0.075));
    });
    this.lastRemaining = this.engine.remaining;
  }
  private drawPlayer(x: number, y: number, actor: Actor, lifeIcon = false) {
    const g = this.actors, death = this.engine.state === "dying" && !lifeIcon;
    const progress = death ? 1 - this.engine.deathMs / 800 : 0;
    const radius = this.cell * (lifeIcon ? 0.35 : 0.41) * (1 - progress * 0.8);
    const direction = lifeIcon ? 1 : actor.dir;
    const angle = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][direction];
    const mouth = death ? 0.15 + progress * 2.8 : 0.12 + (Math.sin(this.time.now / 70) + 1) * 0.19;
    g.fillStyle(0xf5c543, 0.13).fillCircle(x, y, radius * 1.65);
    g.fillStyle(0xffd966, 1).beginPath().moveTo(x, y).arc(x, y, radius, angle + mouth, angle + Math.PI * 2 - mouth, false).closePath().fillPath();
    if (!death) g.fillStyle(0xfff3c1, 0.5).fillCircle(x - radius * 0.25, y - radius * 0.48, radius * 0.13);
  }
  private drawGhost(x: number, y: number, ghost: Ghost) {
    const g = this.actors, r = this.cell * 0.39;
    const frightened = this.engine.powerMs > 0 && ghost.mode === "normal";
    if (ghost.mode !== "eyes") {
      const flash = frightened && this.engine.powerMs < 1800 && Math.floor(this.time.now / 150) % 2;
      const color = frightened ? flash ? 0xcce8ff : 0x416bda : COLORS[ghost.id];
      g.fillStyle(color, 0.08).fillCircle(x, y, r * 1.6);
      g.fillStyle(color, 1).beginPath().moveTo(x - r, y + r).lineTo(x - r, y)
        .arc(x, y, r, Math.PI, 0, false).lineTo(x + r, y + r);
      for (let i = 0; i < 4; i++) g.lineTo(x + r - i * r * 0.5 - r * 0.25, y + r * 0.61).lineTo(x + r - (i + 1) * r * 0.5, y + r);
      g.closePath().fillPath();
    }
    if (frightened) {
      g.fillStyle(0xf1f1eb).fillCircle(x - r * 0.35, y - r * 0.08, r * 0.14).fillCircle(x + r * 0.35, y - r * 0.08, r * 0.14);
      g.lineStyle(1.5, 0xf1f1eb, 1).beginPath().moveTo(x - r * 0.55, y + r * 0.4);
      for (let i = 0; i < 5; i++) g.lineTo(x - r * 0.55 + i * r * 0.27, y + r * (i % 2 ? 0.29 : 0.4));
      g.strokePath();
    } else {
      const [dx, dy] = DIRECTIONS[ghost.dir];
      for (const sign of [-1, 1]) {
        g.fillStyle(0xf0f5fa).fillEllipse(x + sign * r * 0.36, y - r * 0.09, r * 0.5, r * 0.65);
        g.fillStyle(0x26395f).fillCircle(x + sign * r * 0.36 + dx * r * 0.11, y - r * 0.09 + dy * r * 0.13, r * 0.14);
      }
    }
    if (this.engine.freezeMs > 0 && ghost.mode !== "eyes") g.lineStyle(1.5, 0xb5e8ff, 0.8).strokeCircle(x, y, r * 1.3);
  }
  private drawActor(actor: Actor, draw: (x: number, y: number) => void) {
    const p = actorPosition(this.engine.maze, actor);
    const x = this.ox + (p.x + 0.5) * this.cell, y = this.oy + (p.y + 0.5) * this.cell;
    draw(x, y);
    if (p.x > this.run.size - 1) draw(x - this.run.size * this.cell, y);
    if (p.x < 0) draw(x + this.run.size * this.cell, y);
  }
  private render() {
    const e = this.engine, g = this.actors;
    if (this.lastRemaining !== e.remaining) this.drawDots();
    g.clear(); this.effects.clear();
    e.pellets.forEach((value, cell) => {
      if (value !== 2) return;
      const p = this.center(cell), alpha = 0.65 + Math.sin(this.time.now / 160) * 0.25;
      g.fillStyle(0xffd9b0, 0.12).fillCircle(p.x, p.y, this.cell * 0.45);
      g.fillStyle(0xffe2bb, alpha).fillCircle(p.x, p.y, this.cell * 0.23);
    });
    if (e.fruitMs > 0) {
      const p = this.center(e.maze.fruitCell), r = this.cell * 0.16;
      g.lineStyle(2, 0x74bb85).lineBetween(p.x - r, p.y, p.x + r, p.y - r * 1.8).lineBetween(p.x + r, p.y, p.x + r, p.y - r * 1.8);
      g.fillStyle(0xf16a74).fillCircle(p.x - r, p.y, r).fillCircle(p.x + r, p.y, r);
      g.fillStyle(0xffd1c1, 0.75).fillCircle(p.x - r * 1.3, p.y - r * 0.4, r * 0.3);
    }
    e.ghosts.forEach((ghost) => this.drawActor(ghost, (x, y) => this.drawGhost(x, y, ghost)));
    if (!e.invulnerableMs || e.state !== "playing" || Math.floor(this.time.now / 100) % 2)
      this.drawActor(e.player, (x, y) => this.drawPlayer(x, y, e.player));
    for (let i = 0; i < e.lives; i++) this.drawPlayer(62 + i * 39, 377, e.player, true);
    COLORS.forEach((color, i) => g.fillStyle(color, 1).fillCircle(813, 414 + i * 27, 4));
    if (this.hintMs > 0 && this.hintPath.length) {
      const fx = this.effects;
      fx.lineStyle(2, 0xffe19e, 0.65);
      this.hintPath.forEach((cell, i) => {
        if (!i) return;
        const a = this.center(this.hintPath[i - 1]), b = this.center(cell);
        if (Math.abs(a.x - b.x) < this.cell * 2) fx.lineBetween(a.x, a.y, b.x, b.y);
      });
      const target = this.center(this.hintPath[this.hintPath.length - 1]);
      fx.lineStyle(2, 0xffe19e, 0.8).strokeCircle(target.x, target.y, this.cell * 0.4);
    }
    if (e.score > this.best) { this.best = e.score; localStorage.setItem(BEST_KEY, String(this.best)); }
    this.scoreText.setText(String(e.score).padStart(6, "0")); this.bestText.setText(this.best.toLocaleString());
    this.dotsText.setText(e.remaining + " DOTS LEFT");
    const powerLeft = e.pellets.reduce((count, value) => count + Number(value === 2), 0);
    this.powerText.setText(e.freezeMs > 0 ? "FREEZE  " + (e.freezeMs / 1000).toFixed(1) + "s" : e.powerMs > 0 ? "POWER  " + (e.powerMs / 1000).toFixed(1) + "s" : powerLeft + " POWER PELLETS LEFT");
    this.messageText.setText(e.message);
    const showOverlay = e.paused || e.state === "ready" || e.state === "lost" || e.state === "won";
    this.overlay.setVisible(showOverlay);
    if (showOverlay) {
      this.overlayTitle.setText(e.paused ? "PAUSED" : e.state === "ready" ? "READY" : e.state === "lost" ? "GAME OVER" : "MAZE CLEARED");
      this.overlayCopy.setText(e.paused ? "Press P or Space to resume" : e.state === "ready" ? "Arrows / WASD · starting in " + Math.ceil(e.readyMs / 1000) : e.state === "lost" ? "Press R or click Restart to retry" : "Every dot collected · next maze unlocked");
    }
    const stats = { score: e.score, best: this.best, lives: e.lives, remaining: e.remaining, total: e.totalPellets,
      powerSeconds: Math.ceil(e.powerMs / 1000), state: e.paused ? "paused" : e.state };
    const key = JSON.stringify(stats);
    if (key !== this.lastStats) { this.lastStats = key; this.run.onStats?.(stats); }
  }
}

export function mountPacmanScene(parent: HTMLElement, run: Run) {
  PacmanScene.firstRun = run;
  return new Phaser.Game({ type: Phaser.AUTO, parent, width: W, height: H, backgroundColor: "#0c1522",
    antialias: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [PacmanScene], render: { antialias: true, roundPixels: true } });
}
