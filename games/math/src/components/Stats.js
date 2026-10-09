import React from 'react';
import styled from 'styled-components';
import { getProfile, getHistory, getOpStats, clearHistory, xpForLevel, resetAll } from '../utils/storage';

// ── Styled Components ────────────────────────────────────

const Container = styled.div`display: flex; flex-direction: column; gap: 1.5rem;`;

const Empty = styled.div`
  text-align: center; color: ${p => p.theme.textSecondary};
  padding: 2rem 0; font-size: 0.9rem;
`;

const LevelSection = styled.div`
  text-align: center;
  padding: 1rem;
  background: ${p => p.theme.primaryBg};
  border-radius: 12px;
`;

const LevelNumber = styled.div`
  font-size: 2rem; font-weight: 800; color: ${p => p.theme.primary};
`;

const LevelLabel = styled.div`
  font-size: 0.75rem; color: ${p => p.theme.textSecondary};
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-top: 0.125rem;
`;

const XPBar = styled.div`
  margin-top: 0.75rem;
  display: flex; align-items: center; gap: 0.5rem;
`;

const XPTrack = styled.div`
  flex: 1; height: 8px; background: ${p => p.theme.border};
  border-radius: 4px; overflow: hidden;
`;

const XPFill = styled.div`
  height: 100%; background: ${p => p.theme.primary};
  width: ${p => p.$pct}%; border-radius: 4px;
  transition: width 0.5s ease;
`;

const XPText = styled.div`
  font-size: 0.7rem; color: ${p => p.theme.textSecondary};
  min-width: 80px; text-align: right;
`;

const SummaryGrid = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
`;

const SummaryCard = styled.div`
  text-align: center; padding: 0.75rem;
  background: ${p => p.theme.bg}; border-radius: 8px;
`;

const SummaryNumber = styled.div`font-size: 1.5rem; font-weight: 700; color: ${p => p.theme.text};`;

const SummaryLabel = styled.div`
  font-size: 0.65rem; color: ${p => p.theme.textSecondary};
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-top: 0.125rem;
`;

const SectionTitle = styled.div`
  font-size: 0.75rem; text-transform: uppercase;
  letter-spacing: 0.06em; color: ${p => p.theme.textSecondary};
  font-weight: 600;
`;

const Divider = styled.hr`
  border: none; border-top: 1px solid ${p => p.theme.border};
`;

const BreakdownRow = styled.div`display: flex; align-items: center; gap: 0.5rem;`;
const BreakdownLabel = styled.div`
  font-size: 0.8rem; color: ${p => p.theme.text};
  min-width: 110px; font-weight: 500;
`;
const BreakdownTrack = styled.div`
  flex: 1; height: 8px; background: ${p => p.theme.border};
  border-radius: 4px; overflow: hidden;
`;
const BreakdownFill = styled.div`
  height: 100%;
  background: ${p => p.$pct >= 70 ? p.theme.success : p.$pct >= 40 ? p.theme.primary : p.theme.error};
  width: ${p => p.$pct}%; border-radius: 4px;
`;
const BreakdownPct = styled.div`
  font-size: 0.75rem; color: ${p => p.theme.textSecondary};
  min-width: 36px; text-align: right;
`;

const HistoryItem = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid ${p => p.theme.border};
  &:last-child { border-bottom: none; }
`;

const HistoryScore = styled.div`
  font-size: 1.1rem; font-weight: 700; min-width: 48px;
  color: ${p => {
    if (p.$pct >= 80) return p.theme.success;
    if (p.$pct >= 50) return p.theme.primary;
    return p.theme.error;
  }};
`;

const HistoryDetail = styled.div`flex: 1;`;
const HistoryMain = styled.div`font-size: 0.875rem; color: ${p => p.theme.text};`;
const HistorySub = styled.div`font-size: 0.75rem; color: ${p => p.theme.textSecondary};`;

const ModeBadge = styled.span`
  background: ${p => p.theme.bg};
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 0.375rem;
  color: ${p => p.theme.primary};
`;

const ButtonRow = styled.div`
  display: flex; gap: 0.5rem; flex-wrap: wrap;
`;

const DangerButton = styled.button`
  background: none;
  border: 1px solid ${p => p.theme.border};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  color: ${p => p.theme.textSecondary};
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  &:hover { background: ${p => p.theme.errorBg}; color: ${p => p.theme.error}; border-color: transparent; }
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

function formatRelativeDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatTime(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const MODE_LABELS = {
  classic: 'Classic',
  speed: 'Speed',
  endless: 'Endless',
  daily: 'Daily',
};

// ── Component ────────────────────────────────────────────

function Stats() {
  const profile = getProfile();
  const history = getHistory();
  const opStats = getOpStats();

  const nextLevelXP = xpForLevel(profile.level + 1);
  const currentLevelXP = xpForLevel(profile.level);
  const xpProgress = nextLevelXP > currentLevelXP
    ? ((profile.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100;

  const accuracy = profile.totalAnswered > 0
    ? Math.round((profile.totalCorrect / profile.totalAnswered) * 100)
    : 0;

  const handleClearHistory = () => {
    if (window.confirm('Clear quiz history? This cannot be undone.')) {
      clearHistory();
      window.location.reload();
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Reset ALL data including XP, achievements, and history? This cannot be undone.')) {
      resetAll();
      window.location.reload();
    }
  };

  if (history.length === 0 && profile.totalQuizzes === 0) {
    return (
      <Container>
        <Empty>No quizzes completed yet. Take a quiz to see your stats here.</Empty>
      </Container>
    );
  }

  return (
    <Container>
      {/* Level & XP */}
      <LevelSection>
        <LevelNumber>Level {profile.level}</LevelNumber>
        <LevelLabel>{profile.xp.toLocaleString()} Total XP</LevelLabel>
        <XPBar>
          <XPTrack><XPFill $pct={Math.min(100, xpProgress)} /></XPTrack>
          <XPText>{profile.xp - currentLevelXP} / {nextLevelXP - currentLevelXP}</XPText>
        </XPBar>
      </LevelSection>

      {/* Lifetime Stats */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryNumber>{profile.totalQuizzes}</SummaryNumber>
          <SummaryLabel>Quizzes</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryNumber>{accuracy}%</SummaryNumber>
          <SummaryLabel>Accuracy</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryNumber>{profile.bestStreak}</SummaryNumber>
          <SummaryLabel>Best Streak</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryNumber>{profile.totalCorrect}</SummaryNumber>
          <SummaryLabel>Correct</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryNumber>{profile.totalAnswered}</SummaryNumber>
          <SummaryLabel>Answered</SummaryLabel>
        </SummaryCard>
        <SummaryCard>
          <SummaryNumber>{(profile.dailyDatesCompleted || []).length}</SummaryNumber>
          <SummaryLabel>Dailies</SummaryLabel>
        </SummaryCard>
      </SummaryGrid>

      {/* Operation Accuracy */}
      {Object.keys(opStats).length > 0 && (
        <>
          <Divider />
          <SectionTitle>Accuracy by Operation</SectionTitle>
          {Object.entries(opStats)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([type, { correct, total }]) => {
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
              return (
                <BreakdownRow key={type}>
                  <BreakdownLabel>{TYPE_LABELS[type] || type}</BreakdownLabel>
                  <BreakdownTrack><BreakdownFill $pct={pct} /></BreakdownTrack>
                  <BreakdownPct>{pct}% ({correct}/{total})</BreakdownPct>
                </BreakdownRow>
              );
            })}
        </>
      )}

      {/* Recent History */}
      <Divider />
      <SectionTitle>Recent Quizzes</SectionTitle>
      <div>
        {history.slice(0, 20).map((h, i) => (
          <HistoryItem key={i}>
            <HistoryScore $pct={h.percentage}>{h.percentage}%</HistoryScore>
            <HistoryDetail>
              <HistoryMain>
                {h.score}/{h.total} correct &mdash; Difficulty {h.difficulty}
                {h.mode && h.mode !== 'classic' && (
                  <ModeBadge>{MODE_LABELS[h.mode] || h.mode}</ModeBadge>
                )}
              </HistoryMain>
              <HistorySub>
                {formatRelativeDate(h.date)}
                {h.timeSpent ? ` \u00B7 ${formatTime(h.timeSpent)}` : ''}
              </HistorySub>
            </HistoryDetail>
          </HistoryItem>
        ))}
      </div>

      {/* Danger Zone */}
      <Divider />
      <ButtonRow>
        <DangerButton onClick={handleClearHistory}>Clear history</DangerButton>
        <DangerButton onClick={handleResetAll}>Reset all data</DangerButton>
      </ButtonRow>
    </Container>
  );
}

export default Stats;
