import Phaser from "phaser";
import type { Run } from "../phaser/run";
import type { GameController } from "../controller";

const W = 900, H = 620, BEST = "little-puzzles:space-invaders:best";
type Alien = { sprite: Phaser.GameObjects.Sprite; row: number; col: number };
type Shot = { sprite: Phaser.GameObjects.Image; enemy: boolean; speed: number };
type Cover = { x: number; y: number; hp: number };

/** Uses the supplied MIT sprite atlas; movement/collision are time-based. */
class InvadersScene extends Phaser.Scene {
  run: Run;
  initial: Run;
  aliens: Alien[] = [];
  shots: Shot[] = [];
  cover: Cover[] = [];
  hero: Phaser.GameObjects.Image;
  ufo: Phaser.GameObjects.Image | null = null;
  ink: Phaser.GameObjects.Graphics;
  scoreText: Phaser.GameObjects.Text;
  infoText: Phaser.GameObjects.Text;
  overlay: Phaser.GameObjects.Text;
  keys: Record<string, Phaser.Input.Keyboard.Key>;
  score = 0; best = 0; lives = 3; total = 0;
  clock = 0; marchClock = 0; shotClock = 0; fireClock = 0; ufoClock = 0;
  direction = 1; shield = 0; invulnerable = 0; hintSeconds = 0;
  manualPaused = false; externalPaused = false; state = "playing";
  rng = 1; alienFrame = 0; message = "Clear the formation before it reaches your ship";
  constructor(initial: Run) { super("invaders"); this.initial = initial; }
  init(run?: Run) { this.run = run ?? this.initial; }
  preload() {
    const base = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
    this.load.atlas("invader-reference", `${base}games/space-invaders/sprites.png`, `${base}games/space-invaders/sprites.json`);
  }
  random() { this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0; return this.rng / 4294967296; }
  create() {
    this.aliens = []; this.shots = []; this.cover = []; this.ufo = null;
    this.score = 0; this.lives = 3; this.clock = this.marchClock = this.shotClock = this.fireClock = 0;
    this.direction = 1; this.shield = this.invulnerable = this.hintSeconds = 0;
    this.manualPaused = this.externalPaused = false; this.state = "playing"; this.alienFrame = 0;
    this.message = "Clear the formation before it reaches your ship";
    this.rng = this.run.seed >>> 0 || 1;
    this.best = Number(localStorage.getItem(BEST) || 0);
    this.ufoClock = 14 + this.random() * 8;
    this.cameras.main.setBackgroundColor("#050706");
    this.ink = this.add.graphics();
    this.scoreText = this.add.text(25, 18, "", { fontFamily: "monospace", fontSize: "20px", color: "#c3ffc9" });
    this.infoText = this.add.text(W - 25, 22, "", { fontFamily: "monospace", fontSize: "13px", color: "#94bd99", align: "right" }).setOrigin(1, 0);
    this.add.text(W / 2, H - 19, "A / D or ← / → move   SPACE fires   P pauses   R restarts", { fontFamily: "monospace", fontSize: "12px", color: "#a6b7a8" }).setOrigin(0.5);
    this.overlay = this.add.text(W / 2, H / 2, "", { fontFamily: "monospace", fontSize: "27px", color: "#effff0", align: "center", backgroundColor: "#050706dd", padding: { x: 25, y: 20 } }).setOrigin(0.5).setDepth(20).setVisible(false);
    this.hero = this.add.image(W / 2, H - 64, "invader-reference", "hero").setScale(2.5).setTint(0xb4ffbd);
    const columns = this.run.size, gap = 54, startX = (W - (columns - 1) * gap) / 2;
    const rowStyles = [0, 1, 2, 3, 4];
    for (let i = rowStyles.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [rowStyles[i], rowStyles[j]] = [rowStyles[j], rowStyles[i]]; }
    for (let row = 0; row < 5; row++) {
      const offset = Math.floor(this.random() * 13) - 6;
      for (let col = 0; col < columns; col++) {
        const sprite = this.add.sprite(startX + col * gap + offset, 98 + row * 45, "invader-reference", `enemy${rowStyles[row]}0`).setScale(2.2);
        sprite.setData("type", rowStyles[row]);
        this.aliens.push({ sprite, row, col });
      }
    }
    this.total = this.aliens.length;
    // Four erodible bunkers with repeatable initial wear and a firing arch.
    for (let bunker = 0; bunker < 4; bunker++) {
      const x = 164 + bunker * 190;
      for (let row = 0; row < 5; row++) for (let col = 0; col < 9; col++) {
        if (row >= 3 && col >= 3 && col <= 5) continue;
        if (row === 0 && (col < 2 || col > 6)) continue;
        if (this.random() < 0.08) continue;
        this.cover.push({ x: x + col * 7, y: H - 146 + row * 7, hp: 2 });
      }
    }
    this.keys = this.input.keyboard!.addKeys("LEFT,RIGHT,A,D,SPACE,P,R") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-P", this.togglePause, this);
    const restart = (e: KeyboardEvent) => { if (!e.repeat && !this.externalPaused) this.run.onRestart?.(); };
    this.input.keyboard!.on("keydown-R", restart);
    const blur = () => { if (this.state === "playing" && !this.externalPaused) { this.manualPaused = true; this.publish(); } };
    window.addEventListener("blur", blur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("blur", blur);
      this.input.keyboard?.off("keydown-P", this.togglePause, this);
      this.input.keyboard?.off("keydown-R", restart);
    });
    this.publish(); this.drawCover();
  }
  togglePause(e?: KeyboardEvent) {
    if (e?.repeat || this.externalPaused || this.state !== "playing") return;
    this.manualPaused = !this.manualPaused; this.publish();
  }
  hint() {
    if (this.state !== "playing" || this.manualPaused || this.externalPaused) return;
    this.hintSeconds = 5; this.message = "Aim below the highlighted lowest alien. Watch the gaps in your bunkers."; this.publish();
  }
  lifeline() {
    if (this.state !== "playing" || this.manualPaused || this.externalPaused) return;
    this.shield = 4; this.message = "Shield protects your ship for four seconds"; this.publish();
  }
  getScore() { return this.score; }
  finish(won: boolean) {
    if (this.state !== "playing") return;
    this.state = won ? "won" : "lost";
    this.message = won ? "Formation cleared" : "Invasion reached your ship — restart to retry";
    if (won) this.score += 100 * this.lives;
    this.publish(); if (won) this.run.onSolved?.(this.score);
  }
  publish() {
    if (this.score > this.best) { this.best = this.score; localStorage.setItem(BEST, String(this.best)); }
    this.scoreText.setText(`SCORE ${String(this.score).padStart(5, "0")}    BEST ${this.best}`);
    this.infoText.setText(`LIVES ${this.lives}    ALIENS ${this.aliens.length}/${this.total}\n${this.shield > 0 ? `SHIELD ${this.shield.toFixed(1)}s` : "DEFEND THE LINE"}`);
    const paused = this.manualPaused || this.externalPaused;
    this.overlay.setVisible(paused || this.state !== "playing");
    this.overlay.setText(paused ? "PAUSED\nP to continue" : this.state === "won" ? "FORMATION CLEARED" : "GAME OVER\nRestart to try again");
    this.run.onStats?.({ score: this.score, best: this.best, lives: this.lives, remaining: this.aliens.length, total: this.total, powerSeconds: this.shield, state: paused ? "paused" : this.state, progress: `${this.lives} lives · ${this.aliens.length} aliens left`, message: paused ? "Paused" : this.message, canHelp: !paused && this.state === "playing" });
  }
  shoot(x: number, y: number, enemy: boolean) {
    const sprite = this.add.image(x, y, "invader-reference", enemy ? "laserEnemy" : "laser").setScale(1.8);
    this.shots.push({ sprite, enemy, speed: enemy ? 240 + Math.min(140, this.run.level * 8) : -620 });
  }
  explode(x: number, y: number) {
    const image = this.add.image(x, y, "invader-reference", "explode0").setScale(2.5);
    this.time.delayedCall(80, () => image.setFrame("explode1"));
    this.time.delayedCall(160, () => image.setFrame("explode2"));
    this.time.delayedCall(240, () => image.destroy());
  }
  drawCover() {
    this.ink.clear();
    this.ink.lineStyle(1, 0x608565, 0.8).lineBetween(24, H - 38, W - 24, H - 38);
    for (const c of this.cover) if (c.hp > 0) { this.ink.fillStyle(c.hp === 2 ? 0x7bcf8a : 0x3d8050).fillRect(c.x - 3, c.y - 3, 6, 6); }
    if (this.shield > 0) this.ink.lineStyle(2, 0x9defff, 0.9).strokeCircle(this.hero.x, this.hero.y, 29);
    if (this.hintSeconds > 0 && this.aliens.length) {
      const target = this.aliens.reduce((a, b) => a.sprite.y > b.sprite.y ? a : b);
      this.ink.lineStyle(2, 0xffdb70).strokeCircle(target.sprite.x, target.sprite.y, 24);
      this.ink.lineStyle(1, 0xffdb70, 0.4).lineBetween(target.sprite.x, target.sprite.y + 28, target.sprite.x, this.hero.y - 30);
    }
  }
  update(_time: number, delta: number) {
    if (this.externalPaused || this.manualPaused || this.state !== "playing") return;
    const dt = Math.min(delta / 1000, 0.05);
    this.clock += dt; this.marchClock += dt; this.shotClock += dt; this.fireClock -= dt; this.ufoClock -= dt;
    this.shield = Math.max(0, this.shield - dt); this.invulnerable = Math.max(0, this.invulnerable - dt); this.hintSeconds = Math.max(0, this.hintSeconds - dt);
    if (this.shield === 0 && this.hintSeconds === 0) this.message = "Clear the formation before it reaches your ship";
    const direction = Number(this.keys.RIGHT.isDown || this.keys.D.isDown) - Number(this.keys.LEFT.isDown || this.keys.A.isDown);
    this.hero.x = Phaser.Math.Clamp(this.hero.x + direction * 400 * dt, 28, W - 28);
    this.hero.setAlpha(this.invulnerable > 0 ? (Math.floor(this.clock * 10) % 2 ? 0.4 : 1) : 1);
    if (this.keys.SPACE.isDown && this.fireClock <= 0 && !this.shots.some(s => !s.enemy)) { this.shoot(this.hero.x, this.hero.y - 20, false); this.fireClock = 0.22; }
    const interval = Math.max(0.075, 0.65 * (this.aliens.length / this.total) - Math.min(0.2, this.run.level * 0.018));
    if (this.marchClock >= interval) {
      this.marchClock = 0; this.alienFrame = 1 - this.alienFrame;
      const bounce = this.aliens.some(a => a.sprite.x + this.direction * 16 < 28 || a.sprite.x + this.direction * 16 > W - 28);
      if (bounce) this.direction *= -1;
      for (const alien of this.aliens) {
        if (bounce) alien.sprite.y += 19; else alien.sprite.x += this.direction * 16;
        alien.sprite.setFrame(`enemy${alien.sprite.getData("type")}${this.alienFrame}`);
        if (alien.sprite.y >= this.hero.y - 27) { this.finish(false); return; }
        for (const cover of this.cover) if (Math.abs(cover.x - alien.sprite.x) < 18 && Math.abs(cover.y - alien.sprite.y) < 18) cover.hp = 0;
      }
    }
    if (this.shotClock > Math.max(0.35, 1.25 - this.run.level * 0.04) && this.aliens.length) {
      this.shotClock = 0;
      const columns = new Map<number, Alien>();
      for (const alien of this.aliens) if (!columns.has(alien.col) || columns.get(alien.col)!.sprite.y < alien.sprite.y) columns.set(alien.col, alien);
      const choices = [...columns.values()], source = choices[Math.floor(this.random() * choices.length)];
      this.shoot(source.sprite.x, source.sprite.y + 17, true);
    }
    if (!this.ufo && this.ufoClock <= 0) { this.ufo = this.add.image(-30, 65, "invader-reference", "spaceship").setScale(2.4).setTint(0xff7da0); this.ufoClock = 16 + this.random() * 12; }
    if (this.ufo) { this.ufo.x += dt * 100; if (this.ufo.x > W + 30) { this.ufo.destroy(); this.ufo = null; } }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i], s = shot.sprite;
      const previousY = s.y; s.y += shot.speed * dt;
      let consumed = s.y < -20 || s.y > H + 20;
      const near = (x: number, y: number, radius: number) => Math.abs(s.x - x) < radius && y >= Math.min(previousY, s.y) - radius && y <= Math.max(previousY, s.y) + radius;
      const cover = this.cover.find(c => c.hp > 0 && near(c.x, c.y, 6));
      if (cover) { cover.hp--; consumed = true; }
      if (!consumed && !shot.enemy) {
        const index = this.aliens.findIndex(a => near(a.sprite.x, a.sprite.y, 16));
        if (index >= 0) {
          const alien = this.aliens.splice(index, 1)[0];
          this.explode(alien.sprite.x, alien.sprite.y); alien.sprite.destroy(); this.score += 10; consumed = true;
          if (!this.aliens.length) { this.finish(true); s.destroy(); this.shots.splice(i, 1); return; }
        } else if (this.ufo && near(this.ufo.x, this.ufo.y, 19)) { this.explode(this.ufo.x, this.ufo.y); this.ufo.destroy(); this.ufo = null; this.score += 50 + Math.floor(this.random() * 4) * 50; consumed = true; }
      }
      if (!consumed && shot.enemy && near(this.hero.x, this.hero.y, 17)) {
        consumed = true;
        if (!this.shield && !this.invulnerable) {
          this.lives--; this.explode(this.hero.x, this.hero.y); this.invulnerable = 1.8;
          if (!this.lives) { this.finish(false); return; }
        }
      }
      if (consumed) { s.destroy(); this.shots.splice(i, 1); }
    }
    this.drawCover(); this.publish();
  }
}

export function mountInvaders(parent: HTMLElement, initial: Run): GameController {
  const scene = new InvadersScene(initial);
  let externallyPaused = false;
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: W, height: H, pixelArt: true, backgroundColor: "#050706", scene: [scene], scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
  // The break may begin before the atlas has loaded.
  scene.events.on(Phaser.Scenes.Events.CREATE, () => { if (externallyPaused) { scene.externalPaused = true; scene.publish(); scene.scene.pause(); } });
  return {
    restart(run) { scene.scene.start("invaders", run); },
    pause() { externallyPaused = true; if (scene.scene.isActive()) { scene.externalPaused = true; scene.publish(); scene.scene.pause(); } },
    resume() { externallyPaused = false; scene.externalPaused = false; if (scene.scene.isPaused()) scene.scene.resume(); if (scene.hero) scene.publish(); },
    hint: () => scene.hint(), lifeline: () => scene.lifeline(), getScore: () => scene.getScore(), destroy: () => game.destroy(true),
  };
}
