import { REFERENCE_ANSWERS, EXTRA_GUESSES, MEMORY_SYMBOLS, TYPING_WORDS } from "./reference-data.ts";

// Extra everyday answers extend the supplied list beyond 500 distinct words.
const additional = `ABACK ABBEY ABBOT ABHOR ABIDE ABLED ABODE ABORT ABUSE ABYSS ACORN ACRID ACUTE AFFIX AFIRE AFOOT AGATE AGILE AGLOW AGONY AGORA AIDER ALGAE ALIBI AMASS AMBER AMBLE AMEND AMISS AMITY AMPLE AMUSE ANGEL ANIME ANKLE ANNEX ANNOY ANODE ANTIC ANVIL AORTA APHID APRON APTLY ARBOR ARDOR ARMOR AROMA ARROW ARSON ARTSY ASCOT ASHEN ATOLL ATONE ATTIC AUGUR AUNTY AVAIL AVERT AVIAN AXIAL AXIOM AZURE BACON BADGE BADLY BAGEL BAKER BALER BALMY BANAL BANJO BARGE BARON BASIL BASIN BASIS BATON BATTY BAYOU BEADY BEARD BEAST BEECH BEEFY BEFIT BEGET BELCH BELLE BELLY BENCH BERET BERRY BEVEL BIBLE BICEP BIDET BIGOT BILGE BINGE BIRTH BISON BITTY BLAST BLAZE BLEAK BLEED BLEEP BLIMP BLINK BLISS BLITZ BLOAT BLOND BLOOM BLOWN BLUER BLUFF BLUNT BLURB BLURT BLUSH BOAST BOBBY BONEY BONUS BOOTH BOOTY BORAX BORNE BOSOM BOTCH BOUND BOWEL BOXER BRACE BRAID BRAKE BRASH BRASS BRAVE BRAVO BRAWL BRAWN BREED BRIBE BRICK BRIDE BRINE BRINK BRISK BROIL BROOD BROOK BROOM BRUSH BRUTE BUDDY BUDGE BUGGY BUGLE BULGE BULKY BULLY BUNCH BURLY BURNT BURST BUSHY BUTTE CABIN CACAO CACHE CACTI CADDY CADET CAMEL CAMEO CANAL CANNY CANOE CANON CAPER CARAT CARGO CAROL CARVE CATER CAULK CAVIL CEDAR CELLO CHAFE CHAFF CHALK CHAMP CHANT CHARM CHEEK CHEER CHESS CHICK CHILI CHILL CHIMP CHIRP CHOCK CHOKE CHORE CHUCK CHURN CIDER CIGAR CINCH CIRCA CLACK CLAMP CLANG CLANK CLASH CLASP CLEFT CLERK CLICK CLIFF CLING CLOAK CLONE CLOTH CLOUT CLOVE CLOWN CLUCK CLUMP COCOA COLON COMET COMFY COMIC COMMA CONCH CORAL CORER CORNY COUCH COUPE COVET COWER COYLY CRACK CRAMP CRANK CRATE CRAWL CRAZE CREAK CREED CREEK CREEP CREPE CREPT CREST CRISP CROAK CRONY CROOK CRUMB CRUSH CRUST CUBIC CUMIN CURLY CURRY CURSE CURVE CYCLE DADDY DAISY DALLY DATUM DAUNT DEALT DEBIT DEBUG DECAL DECAY DECOR DECOY DEFER DEIGN DELTA DEMON DEMUR DENIM DENSE DEPOT DERBY DETOX DEVIL DIARY DICEY DIGIT DILLY DIMLY DINER DINGO DINGY DIODE DIRGE DIRTY DISCO DITCH DITTO DIVER DIZZY DODGE DOGMA DONOR DOWEL DOWRY DRAFT DRAIN DRAKE DRAMA DRANK DRAWL DRAWN DREAD DRESS DRIED DRIER DRIFT DRILL DROOP DROWN DRUID DRUNK DRYER DUMMY DUMPY DUNCE DUSKY DUSTY DUTCH DWARF DWELT EAGER EAGLE EASEL EATEN EBONY ECLAT EDICT EERIE EGRET EJECT ELBOW ELDER ELECT ELEGY ELFIN ELUDE EMAIL EMBER EMCEE ENDOW ENEMA ENSUE EPOCH EPOXY EQUIP ERASE ERECT ERUPT ESSAY ETHER ETHIC ETHOS EVADE EXALT EXCEL EXERT EXILE EXIST EXPEL EXTOL EXTRA EXULT FABLE FACET FAINT FAIRY FANCY FATAL FATTY FAUNA FEAST FECAL FEIGN FERRY FETAL FETCH FEVER FEWER FICUS FIERY FIFTH FIFTY FILER FILET FILLY FILMY FINCH FINER FIZZY FJORD FLAIR FLAKE FLAME FLANK FLARE FLASH FLASK FLEET FLESH FLICK FLIER FLING FLINT FLIRT FLOAT FLOCK FLOOD FLOOR FLORA FLOSS FLOUR FLOUT FLOWN FLUFF FLUID FLUKE FLUME FLUNG FLUSH FLUTE FOAMY FOCAL FOGGY FOLIO FOLLY FORAY FORGE FORGO FORTE FORTH FORTY FORUM FOUND FOYER FRAIL FRANK FRAUD FREAK FREED FREER FRIAR FRIED FRILL FRISK FROWN FUDGE FUGUE FULLY FUNGI FUNKY FUNNY FUZZY`.split(" ");
export const ANSWERS = [...new Set([...REFERENCE_ANSWERS, ...additional])].filter(w => /^[A-Z]{5}$/.test(w));
export const DICTIONARY = new Set([...ANSWERS, ...EXTRA_GUESSES]);
export type State = "playing" | "won" | "lost";
export function random(seed: number) {
  let value = seed >>> 0;
  return () => { value += 0x6d2b79f5; let n = Math.imul(value ^ value >>> 15, 1 | value); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
export function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export type LetterState = "correct" | "present" | "absent";
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const states: LetterState[] = Array(answer.length).fill("absent"), counts: Record<string, number> = {};
  for (const c of answer) counts[c] = (counts[c] || 0) + 1;
  for (let i = 0; i < answer.length; i++) if (guess[i] === answer[i]) { states[i] = "correct"; counts[guess[i]]--; }
  for (let i = 0; i < answer.length; i++) if (states[i] !== "correct" && counts[guess[i]] > 0) { states[i] = "present"; counts[guess[i]]--; }
  return states;
}
const answerOrder = shuffle(ANSWERS, random(0x57a4));
export class WordleEngine {
  answer: string; guesses: { word: string; states: LetterState[] }[] = []; state: State = "playing"; maxAttempts = 6;
  message = "Guess a five-letter word. Green = exact, amber = elsewhere, gray = absent.";
  revealed = new Map<number, string>(); lifelineUsed = false;
  constructor(level: number) { this.answer = answerOrder[(level - 1) % answerOrder.length]; }
  get score() { return this.state === "won" ? Math.max(100, 1200 - this.guesses.length * 130 - this.revealed.size * 70 - Number(this.lifelineUsed) * 80) : 0; }
  submit(word: string) {
    if (this.state !== "playing") return false;
    word = word.toUpperCase();
    if (!DICTIONARY.has(word)) { this.message = "Use a five-letter word in this game's offline dictionary."; return false; }
    this.guesses.push({ word, states: evaluateGuess(word, this.answer) });
    this.state = word === this.answer ? "won" : this.guesses.length >= this.maxAttempts ? "lost" : "playing";
    this.message = this.state === "won" ? "Word found!" : this.state === "lost" ? `The word was ${this.answer}. Restart to try this word again.` : "Use the letter feedback for your next guess.";
    return true;
  }
  hint() {
    const index = [...this.answer].findIndex((_, i) => !this.revealed.has(i) && !this.guesses.some(g => g.states[i] === "correct"));
    if (index >= 0) this.revealed.set(index, this.answer[index]);
    this.message = index >= 0 ? `Hint: letter ${index + 1} is ${this.answer[index]}.` : "All positions have already been discovered.";
  }
  lifeline() { if (!this.lifelineUsed && this.state === "playing") { this.maxAttempts++; this.lifelineUsed = true; this.message = "Extra guess added. You now have seven attempts."; } }
}
export class MemoryEngine {
  cards: { symbol: string; matched: boolean }[]; selected: number[] = []; state: State = "playing";
  moves = 0; matches = 0; elapsed = 0; pending = 0; peekMs = 0; hintMs = 0; hintCards: number[] = []; message = "Flip two cards to find a matching pair.";
  readonly pairs: number; readonly maxMoves: number;
  constructor(size: number, seed: number) {
    this.pairs = size === 4 ? 8 : size === 5 ? 10 : 18; this.maxMoves = this.pairs * 3;
    const rng = random(seed), symbols = shuffle(MEMORY_SYMBOLS, rng).slice(0, this.pairs);
    this.cards = shuffle(symbols.flatMap(symbol => [{ symbol, matched: false }, { symbol, matched: false }]), rng);
  }
  get score() { return this.state === "won" ? Math.max(100, this.pairs * 150 - this.moves * 25 - Math.floor(this.elapsed / 1000)) : 0; }
  select(index: number) {
    if (this.state !== "playing" || this.pending > 0 || this.peekMs > 0 || this.cards[index]?.matched || !this.cards[index] || this.selected.includes(index)) return;
    this.selected.push(index);
    if (this.selected.length < 2) return;
    this.moves++;
    if (this.cards[this.selected[0]].symbol === this.cards[index].symbol) {
      this.selected.forEach(i => this.cards[i].matched = true); this.selected = []; this.matches++; this.message = "Pair found!";
      if (this.matches === this.pairs) { this.state = "won"; this.message = "Every pair matched!"; }
      else if (this.moves >= this.maxMoves) this.lose();
    } else { this.pending = 850; this.message = "Different cards. Remember their positions."; }
  }
  tick(ms: number) {
    if (this.state !== "playing") return;
    this.elapsed += ms; this.peekMs = Math.max(0, this.peekMs - ms); this.hintMs = Math.max(0, this.hintMs - ms);
    if (this.pending > 0) { this.pending = Math.max(0, this.pending - ms); if (!this.pending) { this.selected = []; if (this.moves >= this.maxMoves) this.lose(); } }
  }
  private lose() { this.state = "lost"; this.message = "Move budget used. Restart to retry the same cards."; }
  hint() { const first = this.cards.findIndex(c => !c.matched); this.hintCards = first < 0 ? [] : [first, this.cards.findIndex((c, i) => i !== first && !c.matched && c.symbol === this.cards[first].symbol)]; this.hintMs = 1500; this.message = "Hint: the gold outlines mark a matching pair."; }
  lifeline() { this.peekMs = 2500; this.message = "Peek: remember the board before the cards turn back."; }
}
export const COLORS = [
  { label: "Red", color: "#e84052" }, { label: "Blue", color: "#3277e5" }, { label: "Green", color: "#239866" }, { label: "Yellow", color: "#b78308" },
  { label: "Purple", color: "#8746bd" }, { label: "Orange", color: "#d45e16" }, { label: "Pink", color: "#c83787" }, { label: "Black", color: "#17202d" },
];
export class ColorEngine {
  size: number; level: number;
  rng: () => number; state: State = "playing"; score = 0; lives = 3; correct = 0; wrong = 0; streak = 0;
  remaining = 60000; questionMs = 0; freezeMs = 0; hintMs = 0; word = 0; ink = 0; message = "Choose the ink color, not what the word says.";
  constructor(size: number, seed: number, level: number) { this.size = size; this.level = level; this.rng = random(seed); this.next(); }
  get limit() { return Math.max(1200, 3500 - (this.size - 4) * 200 - (this.level - 1) * 100); }
  get accuracy() { return this.correct + this.wrong ? Math.round(100 * this.correct / (this.correct + this.wrong)) : 100; }
  next() { this.word = Math.floor(this.rng() * this.size); this.ink = Math.floor(this.rng() * this.size); if (this.rng() < .8 && this.ink === this.word) this.ink = (this.ink + 1 + Math.floor(this.rng() * (this.size - 1))) % this.size; this.questionMs = this.limit; this.hintMs = 0; }
  answer(index: number) {
    if (this.state !== "playing" || index < 0 || index >= this.size) return;
    if (index === this.ink) { this.correct++; this.streak++; this.score += 10 + (this.streak % 15 === 0 ? 50 : this.streak % 10 === 0 ? 25 : this.streak % 5 === 0 ? 10 : 0); this.message = "Correct ink!"; }
    else { this.wrong++; this.streak = 0; this.lives--; this.message = `The ink was ${COLORS[this.ink].label}.`; }
    if (!this.lives) { this.state = "lost"; this.message += " No lives left. Restart this round."; } else this.next();
  }
  tick(ms: number) {
    if (this.state !== "playing") return;
    this.hintMs = Math.max(0, this.hintMs - ms);
    const frozen = Math.min(ms, this.freezeMs); this.freezeMs -= frozen; ms -= frozen;
    this.remaining = Math.max(0, this.remaining - ms); this.questionMs -= ms;
    if (!this.remaining) { this.state = this.correct > 0 ? "won" : "lost"; this.message = this.state === "won" ? "Round complete!" : "No answers scored. Restart to play the round."; }
    else if (this.questionMs <= 0) this.timeout();
  }
  timeout() { if (this.state !== "playing") return; this.wrong++; this.streak = 0; this.lives--; this.message = "Too slow!"; if (!this.lives) this.state = "lost"; else this.next(); }
  hint() { this.hintMs = this.questionMs; this.message = "Hint: the correct ink button has a gold outline."; }
  lifeline() { this.freezeMs = 5000; this.message = "Both clocks frozen for five seconds."; }
}
export type FallingWord = { id: number; text: string; x: number; y: number; boss: boolean };
export class TypingEngine {
  goal: number; level: number;
  rng: () => number; state: State = "playing"; score = 0; lives = 3; correct = 0; wrong = 0; streak = 0; chars = 0; elapsed = 0;
  words: FallingWord[] = []; spawnMs = 0; freezeMs = 0; hintMs = 0; hintId = -1; nextId = 0;
  message = "Type a falling word exactly. Enter submits; an exact match clears automatically.";
  constructor(goal: number, seed: number, level: number) { this.goal = goal; this.level = level; this.rng = random(seed); this.spawn(); }
  get wave() { return this.level + Math.floor(this.correct / 10); }
  get wpm() { return this.elapsed ? Math.round((this.chars / 5) / (this.elapsed / 60000)) : 0; }
  get accuracy() { return this.correct + this.wrong ? Math.round(100 * this.correct / (this.correct + this.wrong)) : 100; }
  spawn() {
    const boss = (this.nextId + 1) % 10 === 0;
    const pool = TYPING_WORDS.filter(w => boss ? w.length >= 8 : w.length <= Math.min(12, 5 + this.wave));
    this.words.push({ id: this.nextId++, text: pool[Math.floor(this.rng() * pool.length)], x: this.rng() * .7, y: 0, boss });
  }
  submit(value: string, manual = false) {
    if (this.state !== "playing") return false;
    const target = [...this.words].filter(w => w.text === value.trim().toLowerCase()).sort((a, b) => b.y - a.y)[0];
    if (!target) { if (manual && value.trim()) { this.wrong++; this.streak = 0; this.message = "No matching word on the board."; } return false; }
    this.words = this.words.filter(w => w.id !== target.id); this.correct++; this.chars += target.text.length; this.streak++;
    this.score += 10 + Math.max(0, target.text.length - 4) * 2 + (target.boss ? 40 : 0) + (this.streak % 20 === 0 ? 100 : this.streak % 10 === 0 ? 50 : this.streak % 5 === 0 ? 20 : 0);
    this.message = target.boss ? "Long word cleared! +40 bonus" : "Word cleared!";
    if (this.correct >= this.goal) { this.state = "won"; this.message = "Typing challenge complete!"; }
    return true;
  }
  tick(ms: number) {
    if (this.state !== "playing") return;
    this.elapsed += ms; this.hintMs = Math.max(0, this.hintMs - ms);
    const frozen = Math.min(ms, this.freezeMs); this.freezeMs -= frozen; ms -= frozen;
    this.spawnMs += ms;
    const interval = Math.max(800, 1900 - this.wave * 70);
    while (this.spawnMs >= interval) { this.spawnMs -= interval; this.spawn(); }
    for (const word of [...this.words]) {
      word.y += ms / 1000 * Math.min(.18, .065 + this.wave * .005) * (word.boss ? .85 : 1);
      if (word.y >= 1) { this.words = this.words.filter(w => w.id !== word.id); this.lives = Math.max(0, this.lives - (word.boss ? 2 : 1)); this.wrong++; this.streak = 0; this.message = `Missed ${word.text}.`; }
    }
    if (!this.lives) { this.state = "lost"; this.message = "No lives left. Restart this word sequence."; }
  }
  hint() { const nearest = [...this.words].sort((a, b) => b.y - a.y)[0]; this.hintId = nearest?.id ?? -1; this.hintMs = 4000; this.message = nearest ? `Focus on ${nearest.text}: it is closest to the bottom.` : "The next word is on its way."; }
  lifeline() { this.freezeMs = 3000; this.message = "Words and spawning frozen for three seconds."; }
}
