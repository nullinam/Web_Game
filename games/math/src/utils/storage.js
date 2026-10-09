// Centralized localStorage management for the Math Quiz app

const KEYS = {
  PROFILE: 'mqg_profile',
  HISTORY: 'mqg_history',
  ACHIEVEMENTS: 'mqg_achievements',
  DARK_MODE: 'mqg_darkMode',
  OP_STATS: 'mqg_opStats',
};

const DEFAULT_PROFILE = {
  xp: 0,
  level: 1,
  bestStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  totalQuizzes: 0,
  dailyDatesCompleted: [],
};

// ── Profile ──────────────────────────────────────────────

export function getProfile() {
  const data = localStorage.getItem(KEYS.PROFILE);
  return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : { ...DEFAULT_PROFILE };
}

export function saveProfile(profile) {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// ── History ──────────────────────────────────────────────

export function getHistory() {
  const data = localStorage.getItem(KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
}

export function addHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > 100) history.length = 100;
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(KEYS.HISTORY);
}

// ── Achievements ─────────────────────────────────────────

export function getUnlockedAchievements() {
  const data = localStorage.getItem(KEYS.ACHIEVEMENTS);
  return data ? JSON.parse(data) : {};
}

export function unlockAchievement(id) {
  const achievements = getUnlockedAchievements();
  if (!achievements[id]) {
    achievements[id] = { unlockedAt: new Date().toISOString() };
    localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    return true;
  }
  return false;
}

// ── Operation Stats ──────────────────────────────────────

export function getOpStats() {
  const data = localStorage.getItem(KEYS.OP_STATS);
  return data ? JSON.parse(data) : {};
}

export function updateOpStats(type, correct) {
  const stats = getOpStats();
  if (!stats[type]) stats[type] = { correct: 0, total: 0 };
  stats[type].total++;
  if (correct) stats[type].correct++;
  localStorage.setItem(KEYS.OP_STATS, JSON.stringify(stats));
}

// ── Theme ────────────────────────────────────────────────

export function getDarkMode() {
  const data = localStorage.getItem(KEYS.DARK_MODE);
  return data ? JSON.parse(data) : false;
}

export function setDarkModeStorage(value) {
  localStorage.setItem(KEYS.DARK_MODE, JSON.stringify(value));
}

// ── XP & Leveling ────────────────────────────────────────

export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function getLevelFromXP(totalXP) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

export function calculateXP(results, config) {
  let xp = 0;
  const difficulty = config.difficulty || 5;

  // Base XP: 10 × difficulty per correct answer
  xp += results.score * (10 * difficulty);

  // Streak bonus
  if (results.maxStreak > 2) {
    xp += Math.min(results.maxStreak * 5, 100);
  }

  // Perfect quiz bonus
  if (results.percentage === 100 && results.total >= 5) {
    xp += 50 * difficulty;
  }

  // Mode multipliers
  if (config.mode === 'speed') xp = Math.floor(xp * 1.25);
  if (config.mode === 'endless') xp = Math.floor(xp * 1.5);

  return xp;
}

// ── Reset ────────────────────────────────────────────────

export function resetAll() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
