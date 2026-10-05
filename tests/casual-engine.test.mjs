import test from "node:test";
import assert from "node:assert/strict";
import { ANSWERS, DICTIONARY, evaluateGuess, WordleEngine, MemoryEngine, ColorEngine, TypingEngine } from "../src/games/casual/engine.ts";

test("Wordle has 500+ distinct valid answers and does not repeat before its library cycles", () => {
  assert.ok(ANSWERS.length > 500);
  assert.equal(new Set(ANSWERS).size, ANSWERS.length);
  assert.ok(ANSWERS.every(word => /^[A-Z]{5}$/.test(word) && DICTIONARY.has(word)));
  const stages = Array.from({ length: ANSWERS.length }, (_, i) => new WordleEngine(i + 1).answer);
  assert.equal(new Set(stages).size, ANSWERS.length);
  assert.equal(new WordleEngine(1).answer, new WordleEngine(ANSWERS.length + 1).answer);
});
test("Wordle duplicate letters consume only available copies after exact matches", () => {
  assert.deepEqual(evaluateGuess("ALLEY", "APPLE"), ["correct", "present", "absent", "present", "absent"]);
  assert.deepEqual(evaluateGuess("GEESE", "SPEED"), ["absent", "present", "correct", "present", "absent"]);
});
test("Wordle rejects invalid guesses without using an attempt, wins and loses explicitly", () => {
  const game = new WordleEngine(1);
  assert.equal(game.submit("ZZZZZ"), false); assert.equal(game.guesses.length, 0);
  const wrong = ANSWERS.find(word => word !== game.answer);
  for (let i = 0; i < 6; i++) assert.equal(game.submit(wrong), true);
  assert.equal(game.state, "lost"); assert.equal(game.submit(game.answer), false);
  const retry = new WordleEngine(1); assert.equal(retry.answer, game.answer);
  retry.submit(retry.answer); assert.equal(retry.state, "won"); assert.ok(retry.score > 0);
});
test("Wordle hint reveals a new position; the extra guess can be added only once", () => {
  const game = new WordleEngine(6); game.hint(); game.hint(); assert.equal(game.revealed.size, 2);
  for (const [position, letter] of game.revealed) assert.equal(letter, game.answer[position]);
  game.lifeline(); game.lifeline(); assert.equal(game.maxAttempts, 7);
});
test("Memory decks have exactly two of every symbol and 500+ repeatable arrangements per size", () => {
  for (const size of [4, 5, 6]) {
    const layouts = new Set();
    for (let seed = 1; seed <= 600; seed++) {
      const game = new MemoryEngine(size, seed), counts = new Map();
      for (const card of game.cards) counts.set(card.symbol, (counts.get(card.symbol) || 0) + 1);
      assert.equal(game.cards.length, game.pairs * 2); assert.ok([...counts.values()].every(count => count === 2));
      const layout = game.cards.map(card => card.symbol).join("|"); layouts.add(layout);
      assert.equal(layout, new MemoryEngine(size, seed).cards.map(card => card.symbol).join("|"));
    }
    assert.ok(layouts.size > 500);
  }
});
test("Memory disallows a double-click match and blocks additional flips during a mismatch", () => {
  const game = new MemoryEngine(4, 7); game.select(0); game.select(0); assert.equal(game.moves, 0);
  const different = game.cards.findIndex(card => card.symbol !== game.cards[0].symbol);
  game.select(different); assert.equal(game.moves, 1); assert.equal(game.pending, 850);
  const selected = [...game.selected]; game.select(2); assert.deepEqual(game.selected, selected);
  game.tick(850); assert.deepEqual(game.selected, []);
});
test("Memory can be fully solved within its budget and cannot skip failure", () => {
  const game = new MemoryEngine(6, 1);
  for (let i = 0; i < game.cards.length; i++) if (!game.cards[i].matched) {
    const other = game.cards.findIndex((card, j) => j !== i && !card.matched && card.symbol === game.cards[i].symbol);
    game.select(i); game.select(other);
  }
  assert.equal(game.state, "won"); assert.equal(game.moves, game.pairs); assert.ok(game.score > 0);
  const losing = new MemoryEngine(4, 2), different = losing.cards.findIndex(card => card.symbol !== losing.cards[0].symbol);
  for (let i = 0; i < losing.maxMoves; i++) { losing.select(0); losing.select(different); losing.tick(850); }
  assert.equal(losing.state, "lost");
});
test("Memory peek and hints expire and never count as matches", () => {
  const game = new MemoryEngine(5, 9); game.hint();
  assert.equal(game.cards[game.hintCards[0]].symbol, game.cards[game.hintCards[1]].symbol);
  game.lifeline(); game.select(0); assert.deepEqual(game.selected, []);
  game.tick(2500); assert.equal(game.peekMs, 0); assert.equal(game.hintMs, 0); assert.equal(game.matches, 0);
});
test("Color Match answers by ink, applies streak bonuses, and loses three lives", () => {
  const game = new ColorEngine(8, 3, 1);
  for (let i = 0; i < 15; i++) game.answer(game.ink);
  assert.equal(game.score, 235); assert.equal(game.accuracy, 100);
  for (let i = 0; i < 3; i++) game.answer((game.ink + 1) % 8);
  assert.equal(game.lives, 0); assert.equal(game.state, "lost");
});
test("Color Match timeouts are always wrong, including when the last button is the correct ink", () => {
  const game = new ColorEngine(8, 15, 1); game.ink = 7;
  game.tick(game.limit); assert.equal(game.correct, 0); assert.equal(game.wrong, 1); assert.equal(game.lives, 2);
});
test("Color Match freeze holds both clocks and only a completed surviving round wins", () => {
  const game = new ColorEngine(4, 1, 1), question = game.questionMs;
  game.lifeline(); game.tick(5000); assert.equal(game.remaining, 60000); assert.equal(game.questionMs, question);
  game.answer(game.ink); game.remaining = 100; game.tick(100); assert.equal(game.state, "won");
  const retry = new ColorEngine(4, 1, 1); assert.equal(retry.word, new ColorEngine(4, 1, 1).word);
});
test("Color Match has 500+ valid deterministic prompt sequences for each palette", () => {
  for (const size of [4, 6, 8]) {
    const sequences = new Set();
    for (let seed = 1; seed <= 600; seed++) {
      const game = new ColorEngine(size, seed, 1), sequence = [];
      for (let i = 0; i < 20; i++) { assert.ok(game.ink >= 0 && game.ink < size && game.word >= 0 && game.word < size); sequence.push(`${game.word}:${game.ink}`); game.answer(game.ink); }
      sequences.add(sequence.join("|"));
    }
    assert.ok(sequences.size > 500);
  }
});
test("Typing matches the lowest duplicate, counts standard WPM, and tracks errors", () => {
  const game = new TypingEngine(20, 1, 1); game.elapsed = 60000;
  game.words = [{ id: 1, text: "hello", x: 0, y: .2, boss: false }, { id: 2, text: "hello", x: 0, y: .7, boss: false }];
  assert.equal(game.submit("hello"), true); assert.equal(game.words[0].id, 1); assert.equal(game.wpm, 1);
  assert.equal(game.submit("wrong", true), false); assert.equal(game.accuracy, 50);
});
test("Typing only wins on its target and cannot advance after missed lives", () => {
  const game = new TypingEngine(20, 2, 1);
  for (let i = 0; i < 20; i++) { if (!game.words.length) game.spawn(); game.submit(game.words[0].text); }
  assert.equal(game.state, "won"); assert.equal(game.correct, 20);
  const lost = new TypingEngine(20, 2, 1); lost.words = [{ id: 1, text: "architecture", x: 0, y: .999, boss: true }];
  lost.tick(100); assert.equal(lost.lives, 1); lost.words = [{ id: 2, text: "word", x: 0, y: .999, boss: false }]; lost.tick(100);
  assert.equal(lost.state, "lost"); assert.equal(lost.submit("word"), false);
});
test("Typing freeze suspends falling and spawning without stopping its WPM clock", () => {
  const game = new TypingEngine(30, 1, 1), first = game.words[0];
  game.lifeline(); game.tick(3000); assert.equal(first.y, 0); assert.equal(game.nextId, 1); assert.equal(game.elapsed, 3000);
  game.tick(100); assert.ok(first.y > 0);
});
test("Typing has 500+ repeatable word and lane sequences", () => {
  const sequences = new Set();
  for (let seed = 1; seed <= 600; seed++) {
    const game = new TypingEngine(20, seed, 1), retry = new TypingEngine(20, seed, 1);
    for (let i = 0; i < 20; i++) { game.spawn(); retry.spawn(); }
    assert.deepEqual(game.words, retry.words); assert.ok(game.words.every(word => /^[a-z]+$/.test(word.text)));
    sequences.add(game.words.map(word => `${word.text}:${word.x.toFixed(4)}`).join("|"));
  }
  assert.ok(sequences.size > 500);
});
