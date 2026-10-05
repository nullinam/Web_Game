import Phaser from "phaser";
import type { Run } from "./run";
import type { GameController } from "../controller";

const W = 900, H = 620, R = 7, PY = H - 72;
type Brick = { x: number; y: number; width: number; hp: number; max: number; type: string; image: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };
type Ball = { x: number; y: number; vx: number; vy: number; image: Phaser.GameObjects.Image };
type Drop = { x: number; y: number; type: string; image: Phaser.GameObjects.Image };
const FRAMES: Record<string, number> = { green: 0, blue: 1, red: 2, yellow: 3, pink: 4, purple: 5, armored: 6, glass: 8, wood: 18, rock: 48 };
const BEST = "little-puzzles:breakout:best";

/** Elemental mechanics adapted from the supplied reference into the shared lifecycle. */
class BreakoutScene extends Phaser.Scene {
  initial: Run; run: Run;
  bricks: Brick[] = []; balls: Ball[] = []; drops: Drop[] = [];
  paddle: Phaser.GameObjects.Image; ship: Phaser.GameObjects.Image;
  ink: Phaser.GameObjects.Graphics; hud: Phaser.GameObjects.Text; status: Phaser.GameObjects.Text; overlay: Phaser.GameObjects.Text;
  keys: Record<string, Phaser.Input.Keyboard.Key>;
  rng = 1; score = 0; best = 0; lives = 3; total = 0; px = W / 2;
  pointerX: number | null = null; paddleWidth = 108; wide = 0; floor = 0; slow = 0; fast = 0; stun = 0; invulnerable = 0; hintTime = 0;
  docked = true; manualPaused = false; externalPaused = false; state = "playing"; elapsed = 0; shipType = 0;
  message = "Move the paddle, then click or press Space to launch";
  constructor(initial: Run) { super("breakout"); this.initial = initial; }
  init(run?: Run) { this.run = run ?? this.initial; }
  preload() {
    const base = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL + "games/breakout/";
    this.load.spritesheet("breakout-tiles", base + "tiles.png", { frameWidth: 16, frameHeight: 16, margin: 1, spacing: 2 });
    this.load.spritesheet("breakout-ships", base + "ships.png", { frameWidth: 16, frameHeight: 16 });
    for (const name of ["new-mountainbg", "icebergbg", "volcano"]) this.load.image("breakout-" + name, base + name + ".png");
  }
  random() { this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0; return this.rng / 4294967296; }
  create() {
    this.rng = this.run.seed >>> 0 || 1; this.bricks = []; this.balls = []; this.drops = [];
    this.score = 0; this.lives = 3; this.elapsed = 0; this.px = W / 2; this.pointerX = null;
    this.wide = this.floor = this.slow = this.fast = this.stun = this.invulnerable = this.hintTime = 0;
    this.docked = true; this.manualPaused = false; this.externalPaused = false; this.state = "playing";
    this.message = "Move the paddle, then click or press Space to launch";
    this.best = Number(localStorage.getItem(BEST) || 0);
    const theme = (this.run.level - 1) % 3;
    this.shipType = (this.run.level - 1) % 6;
    this.cameras.main.setBackgroundColor(["#182f47", "#193a47", "#2b1720"][theme]);
    this.add.image(W / 2, H / 2, "breakout-" + ["new-mountainbg", "icebergbg", "volcano"][theme]).setDisplaySize(W, H).setAlpha(0.5);
    this.add.rectangle(W / 2, H / 2, W, H, 0x060e1b, 0.4);
    this.ink = this.add.graphics().setDepth(10);
    this.paddle = this.add.image(this.px, PY, "breakout-tiles", 10).setDisplaySize(108, 38).setDepth(8);
    this.ship = this.add.image(this.px, PY + 14, "breakout-ships", this.shipType).setScale(2.6).setDepth(7);
    const themeName = ["MOUNTAIN", "ICE", "LAVA"][theme];
    this.hud = this.add.text(24, 17, "", { fontFamily: "monospace", fontSize: "19px", color: "#fff0cf" }).setDepth(15);
    this.status = this.add.text(W - 24, 20, themeName, { fontFamily: "monospace", fontSize: "12px", color: "#c2d5df", align: "right" }).setOrigin(1, 0).setDepth(15);
    this.add.text(W / 2, H - 17, "MOUSE / A D / ← → move   CLICK / SPACE launch   P pause   R restart", { fontFamily: "monospace", fontSize: "11px", color: "#e2e9eb" }).setOrigin(0.5).setDepth(15);
    this.overlay = this.add.text(W / 2, H / 2, "", { fontFamily: "monospace", fontSize: "26px", color: "#fff3dd", backgroundColor: "#07101bdd", align: "center", padding: { x: 22, y: 20 } }).setOrigin(0.5).setDepth(30).setVisible(false);
    const columns = this.run.size, rows = 5 + Math.min(2, Math.floor((this.run.level - 1) / 5)), gap = 7;
    const width = (W - 110 - gap * (columns - 1)) / columns;
    const choices = ["wood", "glass", "wood", "green", "blue", "red", "yellow", "purple", "armored", "rock"];
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      if (row > 0 && this.random() < 0.16) continue;
      // Colored blocks have effects; neutral bricks keep hazards and multiball readable.
      const value = this.random();
      let type = choices[Math.floor(this.random() * choices.length)];
      if (value < 0.55) type = theme === 1 ? "glass" : "wood";
      if (type === "pink") type = "wood";
      if (row === 0 && col === Math.floor(columns / 2)) type = "pink";
      const hp = type === "armored" ? 5 : type === "rock" ? 2 : 1;
      const x = 55 + width / 2 + col * (width + gap), y = 106 + row * 35;
      const image = this.add.image(x, y, "breakout-tiles", FRAMES[type]).setDisplaySize(width, 27);
      const label = this.add.text(x, y, hp > 1 ? String(hp) : "", { fontSize: "12px", color: "#ffffff", stroke: "#172534", strokeThickness: 3 }).setOrigin(0.5);
      this.bricks.push({ x, y, width, hp, max: hp, type, image, label });
    }
    this.total = this.bricks.length;
    this.addBall(this.px, PY - 18, 0, 0);
    this.keys = this.input.keyboard!.addKeys("LEFT,RIGHT,A,D,SPACE,P,R") as Record<string, Phaser.Input.Keyboard.Key>;
    const pause = (e: KeyboardEvent) => { if (!e.repeat && !this.externalPaused && this.state === "playing") { this.manualPaused = !this.manualPaused; this.publish(); } };
    const restart = (e: KeyboardEvent) => { if (!e.repeat && !this.externalPaused) this.run.onRestart?.(); };
    this.input.keyboard!.on("keydown-P", pause); this.input.keyboard!.on("keydown-R", restart);
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => { this.pointerX = p.x; });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => { if (p.leftButtonDown()) this.launch(); });
    const blur = () => { if (this.state === "playing" && !this.externalPaused) { this.manualPaused = true; this.publish(); } };
    window.addEventListener("blur", blur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("blur", blur);
      this.input.keyboard?.off("keydown-P", pause); this.input.keyboard?.off("keydown-R", restart);
      this.input.removeAllListeners("pointermove"); this.input.removeAllListeners("pointerdown");
    });
    this.publish();
  }
  speed() { return Math.min(570, 320 + this.run.level * 10 + (this.total - this.bricks.length) * 1.9) * (this.slow > 0 ? 0.75 : this.fast > 0 ? 1.15 : 1); }
  addBall(x: number, y: number, vx: number, vy: number) { this.balls.push({ x, y, vx, vy, image: this.add.image(x, y, "breakout-tiles", 11).setDisplaySize(22, 22).setDepth(9) }); }
  launch() {
    if (!this.docked || this.manualPaused || this.externalPaused || this.state !== "playing") return;
    const angle = (this.random() > 0.5 ? 1 : -1) * 0.3;
    for (const b of this.balls) { b.vx = this.speed() * Math.sin(angle); b.vy = -this.speed() * Math.cos(angle); }
    this.docked = false; this.message = "Clear every brick. Catch powers; dodge falling hazards."; this.publish();
  }
  drop(x: number, y: number, type: string) {
    const frame = ({ grow: 12, shrink: 13, slow: 14, fast: 15, fire: 42, stun: 3, beam: 5, ice: 47 } as Record<string, number>)[type];
    this.drops.push({ x, y, type, image: this.add.image(x, y, "breakout-tiles", frame).setDisplaySize(22, 22).setDepth(9) });
  }
  hit(brick: Brick) {
    brick.hp--;
    this.score += 5;
    if (brick.hp > 0) { brick.label.setText(String(brick.hp)); brick.image.setTint(0xc7d2d8); return; }
    this.bricks.splice(this.bricks.indexOf(brick), 1); brick.label.destroy(); brick.image.destroy();
    this.score += brick.type === "armored" ? 50 : brick.type === "rock" ? 30 : 20;
    if (!this.bricks.length) { this.finish(true); return; }
    if (brick.type === "green") { this.floor = 5; this.message = "Leaf barrier catches balls for five seconds"; }
    if (brick.type === "blue" && this.balls.length < 3) { const speed = this.speed(); this.addBall(brick.x, brick.y + 24, speed * 0.5, speed * 0.866); this.message = "Multiball! A life is lost only when every ball falls."; }
    if (brick.type === "red") this.drop(brick.x, brick.y, (this.run.level - 1) % 3 === 1 ? "ice" : "fire");
    if (brick.type === "yellow") this.drop(brick.x, brick.y, "stun");
    if (brick.type === "purple") this.drop(brick.x, brick.y, "beam");
    if (brick.type === "pink") { this.lives = Math.min(5, this.lives + 1); this.message = "Heart brick grants a life (maximum five)"; }
    if (this.random() < 0.1) this.drop(brick.x, brick.y, ["grow", "shrink", "slow", "fast"][Math.floor(this.random() * 4)]);
  }
  hurt() {
    if (this.invulnerable > 0) return;
    this.lives--; this.invulnerable = 1.3;
    if (!this.lives) this.finish(false); else this.message = "Hazard hit! Watch the falling red and purple objects.";
  }
  finish(won: boolean) {
    if (this.state !== "playing") return;
    this.state = won ? "won" : "lost";
    if (won) this.score += this.lives * 100 + Math.max(0, 300 - Math.floor(this.elapsed));
    this.message = won ? "Every brick cleared" : "No lives left — restart to retry";
    this.publish(); if (won) this.run.onSolved?.(this.score);
  }
  hint() { if (this.canPlay()) { this.hintTime = 5; this.message = "Gold marker estimates where the descending ball will land; brick hits change its path."; this.publish(); } }
  lifeline() { if (this.canPlay()) { this.wide = Math.max(this.wide, 12); this.message = "Wide paddle active for twelve seconds"; this.publish(); } }
  canPlay() { return this.state === "playing" && !this.manualPaused && !this.externalPaused; }
  getScore() { return this.score; }
  publish() {
    if (this.score > this.best) { this.best = this.score; localStorage.setItem(BEST, String(this.best)); }
    this.hud.setText(`SCORE ${this.score}    BEST ${this.best}`);
    const shipName = ["BASE", "VANU: LASER IMMUNE", "ORB", "SNOWFLAKE: ICE IMMUNE", "LIGHTNING: STUN IMMUNE", "FIREBALL: FIRE IMMUNE"][this.shipType];
    this.status.setText(`${["MOUNTAIN", "ICE", "LAVA"][(this.run.level - 1) % 3]} · ${this.bricks.length} BRICKS\n${this.lives} LIVES · ${this.balls.length} BALLS${this.wide > 0 ? ` · WIDE ${Math.ceil(this.wide)}s` : ""}\n${shipName}`);
    const paused = this.manualPaused || this.externalPaused;
    this.overlay.setVisible(paused || this.state !== "playing");
    this.overlay.setText(paused ? "PAUSED\nP to continue" : this.state === "won" ? "BOARD CLEARED" : "GAME OVER\nRestart to try again");
    this.run.onStats?.({ score: this.score, best: this.best, lives: this.lives, remaining: this.bricks.length, total: this.total, powerSeconds: this.wide, state: paused ? "paused" : this.state, progress: `${this.lives} lives · ${this.bricks.length} bricks left`, message: paused ? "Paused" : this.message, canHelp: this.canPlay() });
  }
  moveBall(ball: Ball, dt: number) {
    const velocity = Math.hypot(ball.vx, ball.vy), target = this.speed();
    if (velocity) { ball.vx *= target / velocity; ball.vy *= target / velocity; }
    // Small physics steps keep the ball from skipping narrow bricks or the paddle.
    const steps = Math.max(1, Math.ceil(target * dt / 4)), step = dt / steps;
    for (let n = 0; n < steps && this.state === "playing"; n++) {
      const oldX = ball.x, oldY = ball.y;
      ball.x += ball.vx * step; ball.y += ball.vy * step;
      if (ball.x < 22 + R) { ball.x = 22 + R; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - 22 - R) { ball.x = W - 22 - R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < 61 + R) { ball.y = 61 + R; ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && oldY + R <= PY && ball.y + R >= PY && Math.abs(ball.x - this.px) <= this.paddleWidth / 2 + R) {
        const offset = Phaser.Math.Clamp((ball.x - this.px) / (this.paddleWidth / 2), -1, 1);
        const angle = offset * 1.05;
        ball.y = PY - R - 1; ball.vx = target * Math.sin(angle); ball.vy = -target * Math.cos(angle);
        if (Math.abs(ball.vx) < 25) ball.vx = offset < 0 ? -25 : 25;
      }
      if (this.floor > 0 && ball.vy > 0 && ball.y > H - 43) { ball.y = H - 43; ball.vy = -Math.abs(ball.vy); }
      const brick = this.bricks.find(b => Math.abs(ball.x - b.x) < b.width / 2 + R && Math.abs(ball.y - b.y) < 13.5 + R);
      if (brick) {
        const vertical = oldY <= brick.y - 13.5 - R || oldY >= brick.y + 13.5 + R;
        if (vertical) { ball.vy *= -1; ball.y = oldY; } else { ball.vx *= -1; ball.x = oldX; }
        this.hit(brick);
      }
    }
    ball.image.setPosition(ball.x, ball.y);
  }
  update(_time: number, delta: number) {
    if (!this.canPlay()) return;
    const dt = Math.min(delta / 1000, 0.05); this.elapsed += dt;
    for (const key of ["wide", "floor", "slow", "fast", "stun", "invulnerable", "hintTime"] as const) this[key] = Math.max(0, this[key] - dt);
    this.paddleWidth = this.wide > 0 ? 160 : 108;
    const direction = Number(this.keys.RIGHT.isDown || this.keys.D.isDown) - Number(this.keys.LEFT.isDown || this.keys.A.isDown);
    if (direction) this.pointerX = null;
    if (!this.stun) this.px = Phaser.Math.Clamp(direction ? this.px + direction * 600 * dt : this.pointerX ?? this.px, 22 + this.paddleWidth / 2, W - 22 - this.paddleWidth / 2);
    this.paddle.setPosition(this.px, PY).setDisplaySize(this.paddleWidth, 38).setTint(this.stun > 0 ? 0xffdc65 : 0xffffff);
    this.ship.setPosition(this.px, PY + 14).setFrame(this.shipType + (direction < 0 ? 10 : direction > 0 ? 20 : 0));
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.launch();
    if (this.docked) { this.balls[0].x = this.px; this.balls[0].y = PY - 18; this.balls[0].image.setPosition(this.px, PY - 18); }
    else {
      for (const ball of [...this.balls]) { this.moveBall(ball, dt); if (this.state !== "playing") return; }
      this.balls = this.balls.filter(ball => { if (ball.y > H + R) { ball.image.destroy(); return false; } return true; });
      if (!this.balls.length) {
        this.lives--; this.drops.forEach(d => d.image.destroy()); this.drops = [];
        if (!this.lives) { this.finish(false); return; }
        this.docked = true; this.addBall(this.px, PY - 18, 0, 0); this.message = "Ball lost — click or press Space to launch again";
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i]; drop.y += dt * (drop.type === "beam" ? 220 : 125); drop.image.setPosition(drop.x, drop.y);
      let remove = drop.y > H;
      if (Math.abs(drop.y - PY) < 17 && Math.abs(drop.x - this.px) < this.paddleWidth / 2 + 10) {
        remove = true;
        if (drop.type === "grow") { this.wide = 10; this.message = "Grow power caught — wider paddle"; }
        if (drop.type === "shrink") { this.wide = 0; this.message = "Shrink cancels the wide-paddle effect"; }
        if (drop.type === "slow") { this.slow = 8; this.fast = 0; this.message = "Slow ball active for eight seconds"; }
        if (drop.type === "fast") { this.fast = 6; this.slow = 0; this.message = "Fast ball — stay alert for six seconds"; }
        // Reference ship skins also grant immunity to their matching element.
        if (drop.type === "stun" && this.shipType !== 4) { this.stun = 0.7; this.message = "Electric hit briefly stuns your paddle"; }
        if ((drop.type === "fire" && this.shipType !== 5) || (drop.type === "ice" && this.shipType !== 3) || (drop.type === "beam" && this.shipType !== 1)) this.hurt();
      }
      if (remove) { drop.image.destroy(); this.drops.splice(i, 1); }
      if (this.state !== "playing") return;
    }
    this.ink.clear().lineStyle(2, 0xd6e4ed, 0.28).strokeRect(22, 60, W - 44, H - 99);
    if (this.floor > 0) this.ink.lineStyle(5, 0x84cb6b).lineBetween(22, H - 38, W - 22, H - 38);
    if (this.hintTime > 0) {
      const b = this.balls.find(ball => ball.vy > 0) ?? this.balls[0];
      let x = b.x;
      if (b.vy > 0) {
        const span = W - 44 - R * 2, left = 22 + R;
        const raw = b.x + b.vx * Math.max(0, (PY - R - b.y) / b.vy) - left;
        const wrapped = ((raw % (2 * span)) + 2 * span) % (2 * span);
        x = left + (wrapped > span ? 2 * span - wrapped : wrapped);
      }
      this.ink.lineStyle(2, 0xffdc72).strokeCircle(x, PY - 5, 15);
      this.ink.lineStyle(1, 0xffdc72, 0.4).lineBetween(b.x, b.y, x, PY - 5);
    }
    this.publish();
  }
}

export function mountBreakout(parent: HTMLElement, initial: Run): GameController {
  const scene = new BreakoutScene(initial); let paused = false;
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: W, height: H, backgroundColor: "#182f47", scene: [scene], scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
  scene.events.on(Phaser.Scenes.Events.CREATE, () => { if (paused) { scene.externalPaused = true; scene.publish(); scene.scene.pause(); } });
  return {
    restart(run) { scene.scene.start("breakout", run); },
    pause() { paused = true; if (scene.scene.isActive()) { scene.externalPaused = true; scene.publish(); scene.scene.pause(); } },
    resume() { paused = false; scene.externalPaused = false; if (scene.scene.isPaused()) scene.scene.resume(); if (scene.paddle) scene.publish(); },
    hint: () => scene.hint(), lifeline: () => scene.lifeline(), getScore: () => scene.getScore(), destroy: () => game.destroy(true),
  };
}
