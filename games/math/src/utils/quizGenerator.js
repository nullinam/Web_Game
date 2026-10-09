/**
 * Enhanced Quiz Generator
 * Supports: arithmetic, mult/div, exponents/roots, fractions, percentages, order of operations
 * Includes seeded random for daily challenges
 */

class QuizGenerator {
  constructor() {
    this._seed = null;
  }

  // ── Seeded PRNG (mulberry32) ───────────────────────────

  setSeed(seed) {
    this._seed = seed | 0;
  }

  clearSeed() {
    this._seed = null;
  }

  random() {
    if (this._seed !== null) {
      this._seed |= 0;
      this._seed = (this._seed + 0x6D2B79F5) | 0;
      let t = Math.imul(this._seed ^ (this._seed >>> 15), 1 | this._seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return Math.random();
  }

  randInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  weightedChoice(choices, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this.random() * total;
    for (let i = 0; i < choices.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return choices.length - 1;
  }

  gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
  }

  // ── Main Generator ────────────────────────────────────

  generateQuestion(difficulty, categories = {}) {
    const {
      arithmetic = true,
      multDiv = false,
      exponents = false,
      fractions = false,
      percentages = false,
      orderOps = false,
      allowNegatives = false,
    } = categories;

    difficulty = Math.max(1, Math.min(10, difficulty));

    // Build generator pool with weights
    const gens = [];
    const wts = [];

    if (arithmetic) {
      gens.push(() => this.genArithmetic(difficulty, allowNegatives));
      wts.push(Math.max(1, 8 - difficulty));
    }
    if (multDiv || difficulty >= 4) {
      gens.push(() => this.genMultDiv(difficulty));
      wts.push(Math.min(8, difficulty));
    }
    if (exponents || difficulty >= 6) {
      gens.push(() => this.genExponent(difficulty));
      wts.push(Math.max(1, difficulty - 3));
      gens.push(() => this.genSqrt(difficulty));
      wts.push(Math.max(1, difficulty - 3));
    }
    if (fractions) {
      gens.push(() => this.genFraction(difficulty));
      wts.push(Math.min(6, difficulty));
    }
    if (percentages) {
      gens.push(() => this.genPercentage(difficulty));
      wts.push(Math.min(5, difficulty));
    }
    if (orderOps && difficulty >= 2) {
      gens.push(() => this.genOrderOfOps(difficulty));
      wts.push(Math.min(7, difficulty));
    }

    // Fallback
    if (gens.length === 0) {
      gens.push(() => this.genArithmetic(difficulty, false));
      wts.push(1);
    }

    const idx = this.weightedChoice(gens, wts);
    try {
      return gens[idx]();
    } catch {
      return this.genArithmetic(difficulty, false);
    }
  }

  // ── Arithmetic (+, -) ─────────────────────────────────

  genArithmetic(diff, allowNeg) {
    const max = diff <= 3 ? diff * 15 : diff <= 6 ? diff * 40 : diff * 80;
    let a = this.randInt(1, max);
    let b = this.randInt(1, max);

    if (this.random() > 0.5) {
      return { question: `${a} + ${b}`, answer: a + b, type: 'addition' };
    } else {
      if (!allowNeg && a < b) [a, b] = [b, a];
      return { question: `${a} - ${b}`, answer: a - b, type: 'subtraction' };
    }
  }

  // ── Multiplication & Division ─────────────────────────

  genMultDiv(diff) {
    if (this.random() > 0.45) {
      let a, b;
      if (diff <= 3) { a = this.randInt(2, 10); b = this.randInt(2, 10); }
      else if (diff <= 6) { a = this.randInt(3, diff * 8); b = this.randInt(3, diff * 6); }
      else { a = this.randInt(5, diff * 12); b = this.randInt(5, diff * 10); }
      return { question: `${a} \\times ${b}`, answer: a * b, type: 'multiplication' };
    } else {
      let div, mul;
      if (diff <= 3) { div = this.randInt(2, 8); mul = this.randInt(1, 10); }
      else if (diff <= 6) { div = this.randInt(3, 15); mul = this.randInt(2, 20); }
      else { div = this.randInt(7, 30); mul = this.randInt(5, 50); }
      return { question: `${div * mul} \\div ${div}`, answer: mul, type: 'division' };
    }
  }

  // ── Exponents ─────────────────────────────────────────

  genExponent(diff) {
    let base, exp;
    if (diff <= 4) { base = this.randInt(2, 8); exp = this.randInt(2, 3); }
    else if (diff <= 7) { base = this.randInt(3, 12); exp = this.randInt(2, 4); }
    else { base = this.randInt(4, 15); exp = this.randInt(2, 5); }
    while (Math.pow(base, exp) > 500000) base = Math.max(2, base - 1);
    return { question: `${base}^{${exp}}`, answer: Math.pow(base, exp), type: 'exponent' };
  }

  // ── Square Roots ──────────────────────────────────────

  genSqrt(diff) {
    let base;
    if (diff <= 4) base = this.randInt(2, 12);
    else if (diff <= 7) base = this.randInt(4, 25);
    else base = this.randInt(8, 50);
    return { question: `\\sqrt{${base * base}}`, answer: base, type: 'squareRoot' };
  }

  // ── Fractions ─────────────────────────────────────────

  genFraction(diff) {
    const denoms = diff <= 4 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 8, 10];
    const d = denoms[this.randInt(0, denoms.length - 1)];
    const n = this.randInt(1, d - 1);
    const maxMult = diff <= 4 ? 5 : diff <= 7 ? 8 : 12;
    const mult = this.randInt(1, maxMult) * d; // ensures integer answer
    const answer = (n * mult) / d;

    if (this.random() > 0.5 && diff >= 4) {
      // "What is n/d of mult?" phrased as multiplication
      return { question: `\\frac{${n}}{${d}} \\times ${mult}`, answer, type: 'fraction' };
    } else {
      return { question: `\\frac{${n}}{${d}} \\times ${mult}`, answer, type: 'fraction' };
    }
  }

  // ── Percentages ───────────────────────────────────────

  genPercentage(diff) {
    const percents = diff <= 3
      ? [10, 20, 25, 50]
      : diff <= 6
        ? [5, 10, 15, 20, 25, 30, 50, 75]
        : [5, 8, 12, 15, 20, 25, 30, 40, 50, 60, 75];

    const pct = percents[this.randInt(0, percents.length - 1)];
    const factor = 100 / this.gcd(pct, 100);
    const multiplier = this.randInt(1, Math.max(1, Math.floor(diff * 2)));
    const base = factor * multiplier;
    const answer = (pct * base) / 100;

    return { question: `${pct}\\%\\text{ of }${base}`, answer, type: 'percentage' };
  }

  // ── Order of Operations ───────────────────────────────

  genOrderOfOps(diff) {
    if (diff <= 4) {
      const a = this.randInt(1, 10);
      const b = this.randInt(2, 8);
      const c = this.randInt(2, 8);
      if (this.random() > 0.5) {
        return { question: `${a} + ${b} \\times ${c}`, answer: a + b * c, type: 'orderOfOps' };
      } else {
        return { question: `${a} \\times ${b} + ${c}`, answer: a * b + c, type: 'orderOfOps' };
      }
    } else if (diff <= 7) {
      const a = this.randInt(2, 12);
      const b = this.randInt(2, 10);
      const c = this.randInt(2, 8);
      const templates = [
        { q: `(${a} + ${b}) \\times ${c}`, ans: (a + b) * c },
        { q: `${c} \\times ${a} - ${b}`, ans: c * a - b },
        { q: `${a} + ${b} \\times ${c}`, ans: a + b * c },
        { q: `${a} \\times ${b} - ${c}`, ans: a * b - c },
      ];
      const t = templates[this.randInt(0, templates.length - 1)];
      return { question: t.q, answer: t.ans, type: 'orderOfOps' };
    } else {
      const a = this.randInt(3, 15);
      const b = this.randInt(2, 12);
      const c = this.randInt(2, 8);
      const d = this.randInt(1, 6);
      const templates = [
        { q: `(${a} + ${b}) \\times ${c} - ${d}`, ans: (a + b) * c - d },
        { q: `${a} \\times (${b} - ${d}) + ${c}`, ans: a * (b - d) + c },
        { q: `${c} \\times ${a} + ${b} \\times ${d}`, ans: c * a + b * d },
        { q: `(${a} - ${d}) \\times (${b} + ${c})`, ans: (a - d) * (b + c) },
      ];
      // only pick templates with positive answers
      const valid = templates.filter(t => t.ans >= 0);
      const t = valid.length > 0 ? valid[this.randInt(0, valid.length - 1)] : templates[0];
      return { question: t.q, answer: t.ans, type: 'orderOfOps' };
    }
  }

  // ── Quiz Generation ───────────────────────────────────

  generateQuiz(difficulty, numQuestions, categories = {}) {
    const questions = [];
    for (let i = 0; i < numQuestions; i++) {
      questions.push(this.generateQuestion(difficulty, categories));
    }
    return { questions };
  }

  generateSingleQuestion(difficulty, categories = {}) {
    return this.generateQuestion(difficulty, categories);
  }

  generateDailyQuiz(date) {
    const dateStr = date.toISOString().split('T')[0];
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
      seed = (seed * 31 + dateStr.charCodeAt(i)) | 0;
    }
    this.setSeed(seed);

    const categories = {
      arithmetic: true, multDiv: true, exponents: true,
      fractions: true, percentages: true, orderOps: true,
    };
    const quiz = this.generateQuiz(5, 10, categories);
    this.clearSeed();
    return quiz;
  }

  checkAnswer(userAnswer, correctAnswer) {
    const tolerance = 0.01;
    return {
      correct: Math.abs(userAnswer - correctAnswer) < tolerance,
      correctAnswer,
    };
  }
}

export default QuizGenerator;
