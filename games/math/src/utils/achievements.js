// Achievement definitions and unlock checking

export const ACHIEVEMENTS = [
  { id: 'first_quiz',      name: 'First Steps',    desc: 'Complete your first quiz',            icon: '\uD83C\uDFAF' },
  { id: 'perfect',         name: 'Perfect Score',   desc: 'Get 100% on any quiz',                icon: '\u2B50' },
  { id: 'streak_5',        name: 'On Fire',         desc: 'Get a 5-answer streak',               icon: '\uD83D\uDD25' },
  { id: 'streak_10',       name: 'Unstoppable',     desc: 'Get a 10-answer streak',              icon: '\uD83D\uDCA5' },
  { id: 'streak_20',       name: 'Legendary',       desc: 'Get a 20-answer streak',              icon: '\uD83D\uDC51' },
  { id: 'speed_demon',     name: 'Speed Demon',     desc: 'Average under 5s per question',       icon: '\u26A1' },
  { id: 'quizzes_10',      name: 'Regular',         desc: 'Complete 10 quizzes',                 icon: '\uD83D\uDCDA' },
  { id: 'quizzes_50',      name: 'Dedicated',       desc: 'Complete 50 quizzes',                 icon: '\uD83C\uDFC6' },
  { id: 'quizzes_100',     name: 'Centurion',       desc: 'Complete 100 quizzes',                icon: '\uD83D\uDCAF' },
  { id: 'level_5',         name: 'Rising Star',     desc: 'Reach Level 5',                       icon: '\uD83C\uDF1F' },
  { id: 'level_10',        name: 'Math Wizard',     desc: 'Reach Level 10',                      icon: '\uD83E\uDDD9' },
  { id: 'level_25',        name: 'Grandmaster',     desc: 'Reach Level 25',                      icon: '\uD83C\uDF93' },
  { id: 'hard_perfect',    name: 'No Calculator',   desc: 'Perfect score on difficulty 8+',      icon: '\uD83E\uDDE0' },
  { id: 'daily_7',         name: 'Daily Devotee',   desc: 'Complete 7 daily challenges',         icon: '\uD83D\uDCC5' },
  { id: 'xp_1000',         name: 'XP Hunter',       desc: 'Earn 1,000 total XP',                icon: '\uD83D\uDCB0' },
  { id: 'xp_10000',        name: 'XP Legend',       desc: 'Earn 10,000 total XP',               icon: '\uD83D\uDC8E' },
  { id: 'endless_20',      name: 'Survivor',        desc: 'Answer 20+ in Endless mode',         icon: '\uD83D\uDEE1\uFE0F' },
  { id: 'speed_round_20',  name: 'Lightning',       desc: 'Answer 20+ in Speed Round',          icon: '\uD83C\uDF29\uFE0F' },
];

/**
 * Check which achievements should be newly unlocked based on current state.
 * @param {Object} profile - Current user profile (after update)
 * @param {Object} quizResult - Results from the just-completed quiz
 * @param {Object} unlockedSet - Currently unlocked achievements { [id]: { unlockedAt } }
 * @returns {string[]} Array of newly unlocked achievement IDs
 */
export function checkNewAchievements(profile, quizResult, unlockedSet) {
  const newly = [];

  function check(id, condition) {
    if (!unlockedSet[id] && condition) newly.push(id);
  }

  // Completion milestones
  check('first_quiz',   profile.totalQuizzes >= 1);
  check('quizzes_10',   profile.totalQuizzes >= 10);
  check('quizzes_50',   profile.totalQuizzes >= 50);
  check('quizzes_100',  profile.totalQuizzes >= 100);

  // Perfect scores
  check('perfect',       quizResult.percentage === 100);
  check('hard_perfect',  quizResult.percentage === 100 && quizResult.difficulty >= 8);

  // Streaks
  check('streak_5',  quizResult.maxStreak >= 5);
  check('streak_10', quizResult.maxStreak >= 10);
  check('streak_20', quizResult.maxStreak >= 20);

  // Speed
  if (quizResult.timeSpent && quizResult.total > 0) {
    check('speed_demon', (quizResult.timeSpent / quizResult.total) < 5);
  }

  // Levels
  check('level_5',  profile.level >= 5);
  check('level_10', profile.level >= 10);
  check('level_25', profile.level >= 25);

  // XP
  check('xp_1000',  profile.xp >= 1000);
  check('xp_10000', profile.xp >= 10000);

  // Mode-specific
  check('endless_20',      quizResult.mode === 'endless' && quizResult.score >= 20);
  check('speed_round_20',  quizResult.mode === 'speed'   && quizResult.score >= 20);

  // Daily
  check('daily_7', (profile.dailyDatesCompleted || []).length >= 7);

  return newly;
}
