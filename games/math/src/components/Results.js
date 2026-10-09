import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import MathExpression from './MathExpression';
import { ACHIEVEMENTS } from '../utils/achievements';

// ── Styled Components ────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex; flex-direction: column; gap: 1.5rem;
  animation: ${fadeIn} 0.25s ease;
`;

const ScoreSection = styled.div`
  text-align: center; padding: 1rem 0;
`;

const GradeText = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${p => p.theme.primary};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
`;

const BigScore = styled.div`
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: ${p => {
    if (p.$pct >= 80) return p.theme.success;
    if (p.$pct >= 50) return p.theme.primary;
    return p.theme.error;
  }};
`;

const ScoreDetail = styled.div`
  font-size: 0.95rem;
  color: ${p => p.theme.textSecondary};
  margin-top: 0.25rem;
`;

const Message = styled.div`
  font-size: 1.1rem;
  color: ${p => p.theme.text};
  margin-top: 0.5rem;
`;

const StatRow = styled.div`
  display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;
`;

const Stat = styled.div`
  text-align: center; padding: 0.75rem 1rem;
  background: ${p => p.theme.bg}; border-radius: 8px; min-width: 80px;
`;

const StatNumber = styled.div`font-size: 1.25rem; font-weight: 700; color: ${p => p.theme.text};`;
const StatLabel = styled.div`
  font-size: 0.7rem; color: ${p => p.theme.textSecondary};
  text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.125rem;
`;

const XPSection = styled.div`
  background: ${p => p.theme.primaryBg};
  border-radius: 10px;
  padding: 1rem 1.25rem;
  text-align: center;
`;

const XPAmount = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${p => p.theme.primary};
`;

const XPLabel = styled.div`
  font-size: 0.75rem;
  color: ${p => p.theme.textSecondary};
  margin-top: 0.125rem;
`;

const LevelUpBadge = styled.div`
  display: inline-block;
  background: ${p => p.theme.primary};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-top: 0.5rem;
`;

const AchievementRow = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem;
`;

const AchievementLabel = styled.div`
  font-size: 0.75rem; text-transform: uppercase;
  letter-spacing: 0.05em; color: ${p => p.theme.textSecondary};
  font-weight: 600; text-align: center;
`;

const pop = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

const AchievementCard = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: ${p => p.theme.card};
  border: 2px solid ${p => p.theme.primary};
  border-radius: 10px;
  animation: ${pop} 0.4s ease;
`;

const AchIcon = styled.span`font-size: 1.5rem;`;
const AchText = styled.div`flex: 1;`;
const AchName = styled.div`font-weight: 700; font-size: 0.9rem; color: ${p => p.theme.text};`;
const AchDesc = styled.div`font-size: 0.75rem; color: ${p => p.theme.textSecondary};`;

const Divider = styled.hr`border: none; border-top: 1px solid ${p => p.theme.border};`;

const BreakdownSection = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`;

const BreakdownLabel = styled.div`
  font-size: 0.75rem; text-transform: uppercase;
  letter-spacing: 0.05em; color: ${p => p.theme.textSecondary};
  font-weight: 600;
`;

const BreakdownBar = styled.div`display: flex; gap: 0.5rem; align-items: center;`;
const BarLabel = styled.div`font-size: 0.8rem; color: ${p => p.theme.text}; min-width: 100px; font-weight: 500;`;
const BarTrack = styled.div`flex: 1; height: 8px; background: ${p => p.theme.border}; border-radius: 4px; overflow: hidden;`;
const BarFill = styled.div`
  height: 100%;
  background: ${p => p.$pct >= 70 ? p.theme.success : p.$pct >= 40 ? p.theme.primary : p.theme.error};
  width: ${p => p.$pct}%;
  border-radius: 4px;
  transition: width 0.5s ease;
`;
const BarPct = styled.div`font-size: 0.75rem; color: ${p => p.theme.textSecondary}; min-width: 36px; text-align: right;`;

const ReviewToggle = styled.button`
  background: none;
  border: 1px solid ${p => p.theme.border};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  color: ${p => p.theme.textSecondary};
  font-family: inherit;
  transition: all 0.15s ease;
  align-self: center;
  &:hover { background: ${p => p.theme.hover}; color: ${p => p.theme.text}; }
`;

const ReviewList = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`;

const ReviewItem = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.625rem 0.75rem; border-radius: 8px;
  background: ${p => p.$correct ? p.theme.successBg : p.theme.errorBg};
  font-size: 0.875rem;
`;

const ReviewStatus = styled.span`
  font-size: 0.875rem; font-weight: 700;
  color: ${p => p.$correct ? p.theme.success : p.theme.error};
  min-width: 18px; text-align: center;
`;

const ReviewQuestion = styled.span`flex: 1; color: ${p => p.theme.text};`;

const ReviewAnswer = styled.span`
  color: ${p => p.theme.textSecondary};
  font-size: 0.8rem; text-align: right; white-space: nowrap;
`;

const RestartButton = styled.button`
  background: ${p => p.theme.primary}; color: white; border: none;
  padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.9375rem;
  font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: inherit;
  &:hover { background: ${p => p.theme.primaryHover}; }
  &:active { transform: scale(0.98); }
`;

// ── Helpers ──────────────────────────────────────────────

const TYPE_LABELS = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  exponent: 'Exponents',
  squareRoot: 'Square Roots',
  fraction: 'Fractions',
  percentage: 'Percentages',
  orderOfOps: 'Order of Ops',
};

function getGrade(pct, diff) {
  const adjusted = pct + (diff - 5) * 2;
  if (adjusted >= 98) return 'S';
  if (adjusted >= 90) return 'A';
  if (adjusted >= 75) return 'B';
  if (adjusted >= 60) return 'C';
  if (adjusted >= 40) return 'D';
  return 'F';
}

function getMessage(pct) {
  if (pct === 100) return 'Perfect score!';
  if (pct >= 90) return 'Excellent work!';
  if (pct >= 80) return 'Great job!';
  if (pct >= 70) return 'Good effort!';
  if (pct >= 50) return 'Not bad, keep practicing!';
  return "Keep at it, you'll improve!";
}

function formatTime(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Component ────────────────────────────────────────────

function Results({ results, onReset }) {
  const [showReview, setShowReview] = useState(false);

  const {
    score, total, percentage, answers = [], maxStreak = 0,
    timeSpent, xpEarned = 0, newAchievements = [],
    levelBefore = 1, levelAfter = 1, mode, difficulty = 5,
  } = results;

  const skippedCount = answers.filter(a => a.skipped).length;
  const wrongCount = answers.filter(a => !a.correct && !a.skipped).length;
  const grade = getGrade(percentage, difficulty);
  const leveledUp = levelAfter > levelBefore;

  // Breakdown by operation type
  const typeStats = {};
  answers.forEach(a => {
    if (!a.type) return;
    if (!typeStats[a.type]) typeStats[a.type] = { correct: 0, total: 0 };
    typeStats[a.type].total++;
    if (a.correct) typeStats[a.type].correct++;
  });

  const achievementDetails = newAchievements
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter(Boolean);

  const modeLabel = mode === 'speed' ? 'Speed Round' : mode === 'endless' ? 'Endless' : mode === 'daily' ? 'Daily Challenge' : 'Classic';

  return (
    <Container>
      <ScoreSection>
        <GradeText>Grade: {grade}</GradeText>
        <BigScore $pct={percentage}>{percentage}%</BigScore>
        <ScoreDetail>
          {score} of {total} correct
          {mode && ` \u00B7 ${modeLabel}`}
        </ScoreDetail>
        <Message>{getMessage(percentage)}</Message>
      </ScoreSection>

      <StatRow>
        <Stat><StatNumber>{score}</StatNumber><StatLabel>Correct</StatLabel></Stat>
        <Stat><StatNumber>{wrongCount}</StatNumber><StatLabel>Wrong</StatLabel></Stat>
        {skippedCount > 0 && <Stat><StatNumber>{skippedCount}</StatNumber><StatLabel>Skipped</StatLabel></Stat>}
        <Stat><StatNumber>{maxStreak}</StatNumber><StatLabel>Best Streak</StatLabel></Stat>
        {timeSpent ? <Stat><StatNumber>{formatTime(timeSpent)}</StatNumber><StatLabel>Time</StatLabel></Stat> : null}
        {timeSpent && total > 0 ? (
          <Stat>
            <StatNumber>{(timeSpent / total).toFixed(1)}s</StatNumber>
            <StatLabel>Avg/Question</StatLabel>
          </Stat>
        ) : null}
      </StatRow>

      {/* XP Earned */}
      <XPSection>
        <XPAmount>+{xpEarned} XP</XPAmount>
        <XPLabel>Experience earned</XPLabel>
        {leveledUp && <LevelUpBadge>Level Up! Lv. {levelAfter}</LevelUpBadge>}
      </XPSection>

      {/* New Achievements */}
      {achievementDetails.length > 0 && (
        <AchievementRow>
          <AchievementLabel>Achievements Unlocked!</AchievementLabel>
          {achievementDetails.map(a => (
            <AchievementCard key={a.id}>
              <AchIcon>{a.icon}</AchIcon>
              <AchText>
                <AchName>{a.name}</AchName>
                <AchDesc>{a.desc}</AchDesc>
              </AchText>
            </AchievementCard>
          ))}
        </AchievementRow>
      )}

      {/* Accuracy by operation type */}
      {Object.keys(typeStats).length > 1 && (
        <>
          <Divider />
          <BreakdownSection>
            <BreakdownLabel>Accuracy by Type</BreakdownLabel>
            {Object.entries(typeStats).map(([type, { correct: c, total: t }]) => {
              const pct = t > 0 ? Math.round((c / t) * 100) : 0;
              return (
                <BreakdownBar key={type}>
                  <BarLabel>{TYPE_LABELS[type] || type}</BarLabel>
                  <BarTrack><BarFill $pct={pct} /></BarTrack>
                  <BarPct>{pct}%</BarPct>
                </BreakdownBar>
              );
            })}
          </BreakdownSection>
        </>
      )}

      {/* Review answers */}
      {answers.length > 0 && (
        <>
          <Divider />
          <ReviewToggle onClick={() => setShowReview(!showReview)}>
            {showReview ? 'Hide' : 'Review'} answers
          </ReviewToggle>

          {showReview && (
            <ReviewList>
              {answers.map((a, i) => (
                <ReviewItem key={i} $correct={a.correct}>
                  <ReviewStatus $correct={a.correct}>
                    {a.correct ? '\u2713' : a.skipped ? '\u2014' : '\u2717'}
                  </ReviewStatus>
                  <ReviewQuestion>
                    <MathExpression expression={a.question} />
                  </ReviewQuestion>
                  <ReviewAnswer>
                    {a.skipped ? 'skipped' : `You: ${a.userAnswer}`}
                    {' \u2192 '}{a.correctAnswer}
                  </ReviewAnswer>
                </ReviewItem>
              ))}
            </ReviewList>
          )}
        </>
      )}

      <Divider />
      <RestartButton onClick={onReset}>New Quiz</RestartButton>
    </Container>
  );
}

export default Results;
