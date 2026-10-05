import test from "node:test";
import assert from "node:assert/strict";
import { generateMaze, distances, neighbor, actorPosition, PacmanEngine, FLOOR, HOME } from "../src/games/phaser/pacman-engine.ts";

function quietGame() {
  const game = new PacmanEngine(19, 123, 1);
  game.state = "playing";
  game.ghosts.forEach((ghost) => { ghost.releaseMs = 1e9; });
  return game;
}
function place(game, x, y, dir = 1) {
  const cell = y * game.maze.size + x;
  Object.assign(game.player, { cell, next: cell, progress: 0, dir });
  game.requestDirection(dir);
}

test("1,500 seeded mazes have reachable dots, four power pellets, and an accessible ghost gate", () => {
  for (const size of [19, 25, 31]) for (let seed = 1; seed <= 500; seed++) {
    const maze = generateMaze(size, seed), reachable = distances(maze, maze.playerSpawn);
    assert.equal(maze.pellets.filter((value) => value === 2).length, 4);
    assert.equal(maze.tiles[maze.playerSpawn], FLOOR);
    for (let cell = 0; cell < maze.tiles.length; cell++)
      if (maze.tiles[cell] === FLOOR || maze.pellets[cell]) assert.ok(reachable[cell] >= 0, "unreachable cell: " + size + "/" + seed + "/" + cell);
    const ghostReachable = distances(maze, maze.playerSpawn, true);
    for (const spawn of maze.ghostSpawns) { assert.equal(maze.tiles[spawn], HOME); assert.ok(ghostReachable[spawn] >= 0); }
  }
});

test("maze generation is repeatable and produces more than 500 distinct layouts", () => {
  const maze = generateMaze(25, 941);
  assert.deepEqual(maze.tiles, generateMaze(25, 941).tiles);
  const layouts = new Set();
  for (let seed = 1; seed <= 600; seed++) layouts.add(Array.from(generateMaze(25, seed).tiles).join(""));
  assert.ok(layouts.size > 500, "Only " + layouts.size + " unique layouts.");
});

test("the side tunnel wraps both ways and the player cannot enter the ghost gate", () => {
  const maze = generateMaze(25, 31), left = maze.tunnelRow * maze.size, right = left + maze.size - 1;
  assert.equal(neighbor(maze, left, 3), right);
  assert.equal(neighbor(maze, right, 1), left);
  assert.equal(neighbor(maze, maze.gate - maze.size, 2), -1);
  assert.equal(neighbor(maze, maze.gate - maze.size, 2, true), maze.gate);
});

test("a buffered turn happens at the next intersection without jumping across a wall", () => {
  const game = quietGame(), size = game.maze.size;
  place(game, size - 3, size - 2);
  game.tick(80);
  const before = actorPosition(game.maze, game.player);
  game.requestDirection(0);
  assert.deepEqual(actorPosition(game.maze, game.player), before);
  game.tick(80); game.tick(80);
  assert.equal(game.player.dir, 0);
  assert.equal(game.player.cell, (size - 2) * size + size - 2);
  assert.equal(game.player.next, (size - 3) * size + size - 2);
});

test("reversing halfway through a corridor preserves position and immediately changes direction", () => {
  const game = quietGame();
  place(game, 10, 17); game.tick(80);
  const before = actorPosition(game.maze, game.player);
  game.requestDirection(3);
  const after = actorPosition(game.maze, game.player);
  assert.ok(Math.abs(after.x - before.x) < 1e-8);
  assert.equal(after.y, before.y);
  game.tick(60);
  assert.ok(actorPosition(game.maze, game.player).x < before.x);
});

test("a dot scores once even when the player doubles back over the same tile", () => {
  const game = quietGame();
  place(game, 1, 17);
  const remaining = game.remaining;
  game.tick(100); game.tick(100);
  assert.equal(game.score, 10);
  assert.equal(game.remaining, remaining - 1);
  game.requestDirection(3); game.tick(100);
  assert.equal(game.score, 10);
});

test("a power pellet enables ghost combos of 200 then 400 points", () => {
  const game = quietGame();
  place(game, 2, 17, 3);
  game.tick(100); game.tick(100);
  assert.equal(game.score, 50); assert.ok(game.powerMs > 0);
  game.freezeMs = 1000;
  Object.assign(game.ghosts[0], { cell: game.player.cell, next: game.player.cell, progress: 0, mode: "normal" });
  game.tick(8);
  assert.equal(game.ghosts[0].mode, "eyes"); assert.equal(game.score, 250);
  Object.assign(game.ghosts[1], { cell: game.player.cell, next: game.player.cell, progress: 0, mode: "normal" });
  game.tick(8);
  assert.equal(game.ghosts[1].mode, "eyes"); assert.equal(game.score, 650);
  assert.equal(game.lives, 3);
});

test("being caught costs one life and respawning preserves dots and score", () => {
  const game = quietGame();
  game.score = 270; game.freezeMs = 1000;
  const remaining = game.remaining;
  game.ghosts.forEach((ghost) => Object.assign(ghost, { cell: game.player.cell, next: game.player.cell, progress: 0, mode: "normal" }));
  game.tick(8);
  assert.equal(game.state, "dying"); assert.equal(game.lives, 2);
  for (let i = 0; i < 8; i++) game.tick(100);
  assert.equal(game.state, "ready"); assert.equal(game.lives, 2);
  assert.equal(game.score, 270); assert.equal(game.remaining, remaining);
});

test("the last life leads to game over without silently resetting the game", () => {
  const game = quietGame();
  game.lives = 1; game.score = 340; game.freezeMs = 1000;
  Object.assign(game.ghosts[0], { cell: game.player.cell, next: game.player.cell, progress: 0, mode: "normal" });
  game.tick(8);
  for (let i = 0; i < 8; i++) game.tick(100);
  assert.equal(game.state, "lost"); assert.equal(game.lives, 0); assert.equal(game.score, 340);
  game.tick(100);
  assert.equal(game.state, "lost");
});

test("clearing the final dot completes the maze and adds the life bonus", () => {
  const game = quietGame();
  game.pellets.fill(0); game.remaining = 1;
  game.pellets[17 * 19 + 2] = 1;
  place(game, 1, 17);
  game.tick(100); game.tick(100);
  assert.equal(game.state, "won"); assert.equal(game.remaining, 0); assert.equal(game.score, 810);
  game.tick(100); assert.equal(game.score, 810);
});

test("pause freezes movement, power duration, and score", () => {
  const game = quietGame();
  game.powerMs = 2000; game.togglePause();
  const position = actorPosition(game.maze, game.player);
  game.tick(100);
  assert.deepEqual(actorPosition(game.maze, game.player), position);
  assert.equal(game.powerMs, 2000); assert.equal(game.elapsedMs, 0);
  game.togglePause(); game.tick(100);
  assert.ok(game.powerMs < 2000);
});

test("the hint trail uses only legal steps and ends on an available power pellet", () => {
  const game = quietGame(), route = game.hintRoute();
  assert.equal(route[0], game.player.cell);
  assert.equal(game.pellets[route.at(-1)], 2);
  for (let i = 1; i < route.length; i++)
    assert.ok([0, 1, 2, 3].some((direction) => neighbor(game.maze, route[i - 1], direction) === route[i]));
});

test("the freeze lifeline holds ghosts in place while the player can still move", () => {
  const game = quietGame();
  game.ghosts[0].mode = "normal";
  const beforeGhost = actorPosition(game.maze, game.ghosts[0]), beforePlayer = actorPosition(game.maze, game.player);
  game.useFreeze(); game.tick(100);
  assert.deepEqual(actorPosition(game.maze, game.ghosts[0]), beforeGhost);
  assert.notDeepEqual(actorPosition(game.maze, game.player), beforePlayer);
  assert.ok(game.freezeMs < 4000);
});

test("power expiry clears the ghost combo and changes the player instruction", () => {
  const game = quietGame();
  game.powerMs = 20; game.ghostChain = 2;
  game.tick(30);
  assert.equal(game.powerMs, 0); assert.equal(game.ghostChain, 0);
  assert.match(game.message, /Power ended/);
});

test("caught ghost eyes find their way home and wait before rejoining the chase", () => {
  const game = quietGame(), ghost = game.ghosts[0];
  const cell = game.maze.size + 1;
  Object.assign(ghost, { cell, next: cell, progress: 0, mode: "eyes", dir: 1 });
  for (let step = 0; step < 150 && ghost.mode === "eyes"; step++) game.tick(100);
  assert.equal(ghost.mode, "waiting");
  assert.equal(ghost.cell, ghost.spawn);
  assert.ok(ghost.releaseMs > 0);
});
