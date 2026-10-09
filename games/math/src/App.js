import React, { useState, useEffect, useCallback } from 'react';
import styled, { ThemeProvider, createGlobalStyle, keyframes } from 'styled-components';
import QuizSetup from './components/QuizSetup';
import QuizGame from './components/QuizGame';
import Results from './components/Results';
import Stats from './components/Stats';
import Achievements from './components/Achievements';
import {
  getProfile, saveProfile, addHistory, getUnlockedAchievements,
  unlockAchievement, updateOpStats, getDarkMode, setDarkModeStorage,
  getLevelFromXP, calculateXP,
} from './utils/storage';
import { checkNewAchievements } from './utils/achievements';

// ── Themes ───────────────────────────────────────────────

const themes = {
  light: {
    bg: '#f8fafc', card: '#ffffff', border: '#e2e8f0',
    text: '#1e293b', textSecondary: '#64748b',
    primary: '#2563eb', primaryBg: '#eff6ff', primaryHover: '#1d4ed8',
    success: '#16a34a', successBg: '#f0fdf4',
    error: '#dc2626', errorBg: '#fef2f2',
    inputBg: '#ffffff', inputBorder: '#d1d5db', inputFocus: '#2563eb',
    headerBg: '#ffffff', hover: '#f1f5f9',
  },
  dark: {
    bg: '#0f172a', card: '#1e293b', border: '#334155',
    text: '#f1f5f9', textSecondary: '#94a3b8',
    primary: '#3b82f6', primaryBg: '#1e3a5f', primaryHover: '#60a5fa',
    success: '#4ade80', successBg: '#14532d',
    error: '#f87171', errorBg: '#7f1d1d',
    inputBg: '#1e293b', inputBorder: '#475569', inputFocus: '#3b82f6',
    headerBg: '#1e293b', hover: '#334155',
  },
};

// ── Global Style ─────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  body {
    background: ${p => p.theme.bg};
    color: ${p => p.theme.text};
    transition: background 0.2s ease, color 0.2s ease;
  }
`;

// ── Layout ───────────────────────────────────────────────

const Layout = styled.div`min-height: 100vh; display: flex; flex-direction: column;`;

const Header = styled.header`
  background: ${p => p.theme.headerBg};
  border-bottom: 1px solid ${p => p.theme.border};
  padding: 0 1.5rem; height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 50;
`;

const Logo = styled.span`
  font-weight: 700; font-size: 1.125rem;
  color: ${p => p.theme.text}; letter-spacing: -0.025em;
`;

const LevelBadge = styled.span`
  font-size: 0.7rem;
  background: ${p => p.theme.primaryBg};
  color: ${p => p.theme.primary};
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 700;
  margin-left: 0.5rem;
`;

const Nav = styled.div`display: flex; gap: 0.25rem; align-items: center;`;

const NavButton = styled.button`
  background: ${p => p.$active ? p.theme.primaryBg : 'transparent'};
  color: ${p => p.$active ? p.theme.primary : p.theme.textSecondary};
  font-weight: ${p => p.$active ? '600' : '500'};
  border: none; padding: 0.375rem 0.75rem; border-radius: 6px;
  font-size: 0.875rem; cursor: pointer; transition: all 0.15s ease;
  font-family: inherit;
  &:hover {
    background: ${p => p.$active ? p.theme.primaryBg : p.theme.hover};
    color: ${p => p.$active ? p.theme.primary : p.theme.text};
  }
`;

const ThemeToggle = styled.button`
  background: transparent; border: 1px solid ${p => p.theme.border};
  border-radius: 6px; width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: ${p => p.theme.textSecondary};
  font-size: 1rem; transition: all 0.15s ease; margin-left: 0.5rem;
  &:hover { background: ${p => p.theme.hover}; color: ${p => p.theme.text}; }
`;

const Main = styled.main`
  flex: 1; max-width: 580px; width: 100%;
  margin: 0 auto; padding: 2rem 1rem;
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageCard = styled.div`
  background: ${p => p.theme.card};
  border: 1px solid ${p => p.theme.border};
  border-radius: 12px; padding: 2rem;
  animation: ${fadeIn} 0.2s ease;
`;

const PageTitle = styled.h2`
  font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;
  letter-spacing: -0.025em; color: ${p => p.theme.text};
`;

// ── App Component ────────────────────────────────────────

function App() {
  const [view, setView] = useState('setup');
  const [quizConfig, setQuizConfig] = useState({});
  const [results, setResults] = useState({});
  const [darkMode, setDarkMode] = useState(() => getDarkMode());
  const [profile, setProfile] = useState(() => getProfile());

  useEffect(() => {
    setDarkModeStorage(darkMode);
  }, [darkMode]);

  const startQuiz = useCallback((config) => {
    setQuizConfig(config);
    setView('playing');
  }, []);

  const finishQuiz = useCallback((finalResults) => {
    // 1. Calculate XP
    const xpEarned = calculateXP(finalResults, quizConfig);

    // 2. Update profile
    const prof = getProfile();
    const levelBefore = prof.level;
    prof.xp += xpEarned;
    prof.level = getLevelFromXP(prof.xp);
    prof.totalQuizzes++;
    prof.totalCorrect += finalResults.score;
    prof.totalAnswered += finalResults.total;
    if (finalResults.maxStreak > prof.bestStreak) {
      prof.bestStreak = finalResults.maxStreak;
    }
    if (quizConfig.mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      if (!prof.dailyDatesCompleted) prof.dailyDatesCompleted = [];
      if (!prof.dailyDatesCompleted.includes(today)) {
        prof.dailyDatesCompleted.push(today);
      }
    }
    saveProfile(prof);
    setProfile(prof);

    // 3. Update operation stats
    if (finalResults.answers) {
      finalResults.answers.forEach(a => {
        if (a.type) updateOpStats(a.type, a.correct);
      });
    }

    // 4. Check achievements
    const unlocked = getUnlockedAchievements();
    const quizResultForAchievements = {
      ...finalResults,
      difficulty: quizConfig.difficulty || 5,
      mode: quizConfig.mode,
    };
    const newAchievements = checkNewAchievements(prof, quizResultForAchievements, unlocked);
    newAchievements.forEach(id => unlockAchievement(id));

    // 5. Add to history
    addHistory({
      date: new Date().toISOString(),
      score: finalResults.score,
      total: finalResults.total,
      percentage: finalResults.percentage,
      difficulty: quizConfig.difficulty || 5,
      timeSpent: finalResults.timeSpent || 0,
      mode: quizConfig.mode,
    });

    // 6. Set results with extra data
    setResults({
      ...finalResults,
      xpEarned,
      newAchievements,
      levelBefore,
      levelAfter: prof.level,
      difficulty: quizConfig.difficulty || 5,
      mode: quizConfig.mode,
    });

    setView('results');
  }, [quizConfig]);

  const resetQuiz = useCallback(() => {
    setView('setup');
    setQuizConfig({});
    setResults({});
    setProfile(getProfile()); // refresh profile display
  }, []);

  const theme = darkMode ? themes.dark : themes.light;
  const isQuizView = view === 'setup' || view === 'playing' || view === 'results';

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Layout>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Logo>Math Quiz</Logo>
            <LevelBadge>Lv. {profile.level}</LevelBadge>
          </div>
          <Nav>
            <NavButton
              $active={isQuizView}
              onClick={view !== 'playing' ? resetQuiz : undefined}
            >
              Quiz
            </NavButton>
            <NavButton $active={view === 'stats'} onClick={() => setView('stats')}>
              Stats
            </NavButton>
            <NavButton $active={view === 'achievements'} onClick={() => setView('achievements')}>
              Achievements
            </NavButton>
            <ThemeToggle onClick={() => setDarkMode(d => !d)} title="Toggle theme">
              {darkMode ? '\u2600' : '\u263E'}
            </ThemeToggle>
          </Nav>
        </Header>
        <Main>
          {view === 'setup' && (
            <PageCard>
              <PageTitle>New Quiz</PageTitle>
              <QuizSetup onStartQuiz={startQuiz} />
            </PageCard>
          )}
          {view === 'playing' && (
            <QuizGame config={quizConfig} onFinish={finishQuiz} onReset={resetQuiz} />
          )}
          {view === 'results' && (
            <PageCard>
              <Results results={results} onReset={resetQuiz} />
            </PageCard>
          )}
          {view === 'stats' && (
            <PageCard>
              <PageTitle>Statistics</PageTitle>
              <Stats />
            </PageCard>
          )}
          {view === 'achievements' && (
            <PageCard>
              <PageTitle>Achievements</PageTitle>
              <Achievements />
            </PageCard>
          )}
        </Main>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
