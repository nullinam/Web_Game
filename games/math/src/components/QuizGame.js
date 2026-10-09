import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import MathExpression from './MathExpression';
import QuizGenerator from '../utils/quizGenerator';

// ── Styled Components ────────────────────────────────────

const Container = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;

const TopBar = styled.div`
  background: ${p => p.theme.card};
  border: 1px solid ${p => p.theme.border};
  border-radius: 12px;
  padding: 0.875rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TopBarLeft = styled.div`
  font-size: 0.875rem; color: ${p => p.theme.textSecondary}; font-weight: 500;
  span { color: ${p => p.theme.text}; font-weight: 700; }
`;

const TopBarRight = styled.div`
  display: flex; gap: 0.75rem; align-items: center;
  font-size: 0.8rem; color: ${p => p.theme.textSecondary};
`;

const Badge = styled.span`
  background: ${p => p.$color || p.theme.primaryBg};
  color: ${p => p.$textColor || p.theme.primary};
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
`;

const Timer = styled.span`
  color: ${p => p.$urgent ? p.theme.error : p.theme.textSecondary};
  font-weight: 600; font-variant-numeric: tabular-nums;
`;

const LivesRow = styled.div`
  display: flex; gap: 0.125rem; font-size: 1.1rem;
`;

const ProgressTrack = styled.div`
  width: 100%; height: 4px;
  background: ${p => p.theme.border};
  border-radius: 2px; overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${p => p.theme.primary};
  width: ${p => p.$pct}%;
  transition: width 0.3s ease;
  border-radius: 2px;
`;

const QuestionCard = styled.div`
  background: ${p => p.theme.card};
  border: 1px solid ${p => p.theme.border};
  border-radius: 12px;
  padding: 2.5rem 2rem;
  text-align: center;
`;

const QuestionLabel = styled.div`
  font-size: 0.75rem; text-transform: uppercase;
  letter-spacing: 0.05em; color: ${p => p.theme.textSecondary};
  margin-bottom: 1rem; font-weight: 600;
`;

const QuestionText = styled.div`
  font-size: 2rem; font-weight: 600; color: ${p => p.theme.text};
  min-height: 56px; display: flex; align-items: center; justify-content: center;
`;

const InputRow = styled.div`display: flex; gap: 0.5rem;`;

const AnswerInput = styled.input`
  flex: 1; padding: 0.75rem 1rem; font-size: 1.125rem; font-family: inherit;
  border: 2px solid ${p => p.theme.inputBorder}; border-radius: 8px;
  background: ${p => p.theme.inputBg}; color: ${p => p.theme.text};
  text-align: center; outline: none; transition: border-color 0.15s ease;
  &:focus { border-color: ${p => p.theme.inputFocus}; }
  &:disabled { opacity: 0.5; }
  &::placeholder { color: ${p => p.theme.textSecondary}; }
`;

const Btn = styled.button`
  padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9375rem;
  font-weight: 600; cursor: pointer; transition: all 0.15s ease;
  border: none; font-family: inherit;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:active:not(:disabled) { transform: scale(0.98); }
`;

const SubmitBtn = styled(Btn)`
  background: ${p => p.theme.primary}; color: white;
  &:hover:not(:disabled) { background: ${p => p.theme.primaryHover}; }
`;

const SkipBtn = styled(Btn)`
  background: transparent; color: ${p => p.theme.textSecondary};
  border: 1px solid ${p => p.theme.border};
  &:hover:not(:disabled) { background: ${p => p.theme.hover}; color: ${p => p.theme.text}; }
`;

const ActionRow = styled.div`display: flex; gap: 0.5rem;`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Feedback = styled.div`
  padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600;
  font-size: 0.875rem; animation: ${slideIn} 0.15s ease;
  background: ${p => p.$correct ? p.theme.successBg : p.theme.errorBg};
  color: ${p => p.$correct ? p.theme.success : p.theme.error};
`;

const XPGain = styled.span`
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: ${p => p.theme.primary};
  font-weight: 700;
`;

const QuitBtn = styled.button`
  background: none; border: none; color: ${p => p.theme.textSecondary};
  font-size: 0.8rem; cursor: pointer; padding: 0.25rem;
  font-family: inherit; text-align: center;
  &:hover { color: ${p => p.theme.text}; text-decoration: underline; }
`;

const KeyHint = styled.div`
  text-align: center;
  font-size: 0.7rem;
  color: ${p => p.theme.textSecondary};
  opacity: 0.6;
`;

// ── Component ────────────────────────────────────────────

function QuizGame({ config, onFinish, onReset }) {
  const mode = config.mode || 'classic';
  const isClassic = mode === 'classic' || mode === 'daily';
  const isSpeed = mode === 'speed';
  const isEndless = mode === 'endless';

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [xpGained, setXpGained] = useState(0);

  // Per-question timer (Classic timed)
  const [timeLeft, setTimeLeft] = useState(config.timePerQuestion || 0);
  const [timedOut, setTimedOut] = useState(false);

  // Speed round total timer
  const [speedTimeLeft, setSpeedTimeLeft] = useState(config.speedTime || 60);
  const [speedDone, setSpeedDone] = useState(false);

  // Endless lives
  const [lives, setLives] = useState(3);

  const startTime = useRef(Date.now());
  const inputRef = useRef(null);
  const processedRef = useRef(false);
  const [quizGenerator] = useState(() => new QuizGenerator());

  // Current question (works for all modes)
  const currentQ = questions[currentIdx];

  // ── Generate quiz on mount ─────────────────────────────

  useEffect(() => {
    let quizData;
    if (mode === 'daily') {
      quizData = quizGenerator.generateDailyQuiz(new Date());
    } else if (isClassic) {
      quizData = quizGenerator.generateQuiz(config.difficulty, config.numQuestions, config.categories);
    } else {
      // Speed & Endless: generate a large pool, we'll keep adding as needed
      quizData = quizGenerator.generateQuiz(config.difficulty, 100, config.categories);
    }
    setQuestions(quizData.questions);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-question timer (Classic timed mode) ────────────

  useEffect(() => {
    if (!config.timerEnabled || !isClassic || showFeedback || loading) return;
    setTimeLeft(config.timePerQuestion);
    setTimedOut(false);

    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(iv); setTimedOut(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [currentIdx, showFeedback, loading, config.timerEnabled, config.timePerQuestion, isClassic]);

  useEffect(() => {
    if (timedOut && !showFeedback) processAnswer(null, true);
  }, [timedOut]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Speed round timer ──────────────────────────────────

  useEffect(() => {
    if (!isSpeed || loading) return;
    const iv = setInterval(() => {
      setSpeedTimeLeft(prev => {
        if (prev <= 1) { clearInterval(iv); setSpeedDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isSpeed, loading]);

  useEffect(() => {
    if (speedDone) finishGame();
  }, [speedDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus input ────────────────────────────────────────

  useEffect(() => {
    processedRef.current = false;
  }, [currentIdx]);

  useEffect(() => {
    if (!showFeedback && !loading && inputRef.current) inputRef.current.focus();
  }, [currentIdx, showFeedback, loading]);

  // ── XP calculation per question ────────────────────────

  const calcQuestionXP = useCallback((correct, currentStreak) => {
    if (!correct) return 0;
    const diff = config.difficulty || 5;
    let xp = 10 * diff;
    xp += Math.min(currentStreak * 2, 20);
    if (isSpeed) xp = Math.floor(xp * 1.25);
    if (isEndless) xp = Math.floor(xp * 1.5);
    return xp;
  }, [config.difficulty, isSpeed, isEndless]);

  // ── Process answer ─────────────────────────────────────

  const processAnswer = useCallback((userVal, skipped = false) => {
    if (processedRef.current) return;
    processedRef.current = true;

    const q = questions[currentIdx];
    if (!q) return;

    let isCorrect = false;
    if (!skipped && userVal !== null && !isNaN(userVal)) {
      isCorrect = quizGenerator.checkAnswer(userVal, q.answer).correct;
    }

    const newStreak = isCorrect ? streak + 1 : 0;
    const newMaxStreak = Math.max(maxStreak, newStreak);
    const qXP = calcQuestionXP(isCorrect, newStreak);

    const newAnswer = {
      question: q.question,
      correctAnswer: q.answer,
      userAnswer: skipped ? null : userVal,
      correct: isCorrect,
      skipped,
      type: q.type,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);
    setStreak(newStreak);
    setMaxStreak(newMaxStreak);
    setXpGained(prev => prev + qXP);

    // Endless: lose a life on wrong/skip
    let newLives = lives;
    if (isEndless && !isCorrect) {
      newLives = lives - 1;
      setLives(newLives);
    }

    // Feedback message
    if (isCorrect) {
      setFeedback({ correct: true, message: 'Correct!', xp: qXP });
    } else if (skipped) {
      setFeedback({ correct: false, message: `Skipped \u2014 answer: ${q.answer}` });
    } else {
      setFeedback({ correct: false, message: `Incorrect \u2014 answer: ${q.answer}` });
    }
    setShowFeedback(true);

    // Short delay then advance
    const delay = isSpeed ? 600 : 1200;
    setTimeout(() => {
      // Check end conditions
      if (isEndless && newLives <= 0) {
        finishWithData(newScore, updatedAnswers, newMaxStreak);
        return;
      }
      if (isClassic && currentIdx + 1 >= questions.length) {
        finishWithData(newScore, updatedAnswers, newMaxStreak);
        return;
      }

      // Generate more questions if needed (Speed/Endless)
      if (!isClassic && currentIdx + 1 >= questions.length) {
        const moreQs = quizGenerator.generateQuiz(config.difficulty, 50, config.categories);
        setQuestions(prev => [...prev, ...moreQs.questions]);
      }

      setCurrentIdx(prev => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setFeedback(null);
    }, delay);
  }, [questions, currentIdx, answers, score, streak, maxStreak, lives, isClassic, isSpeed, isEndless, config, quizGenerator, calcQuestionXP]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Finish helpers ─────────────────────────────────────

  const finishWithData = useCallback((finalScore, finalAnswers, finalMaxStreak) => {
    const total = finalAnswers.length;
    onFinish({
      score: finalScore,
      total,
      percentage: total > 0 ? Math.round((finalScore / total) * 100) : 0,
      answers: finalAnswers,
      maxStreak: finalMaxStreak,
      timeSpent: Math.round((Date.now() - startTime.current) / 1000),
      mode,
      difficulty: config.difficulty || 5,
      xpEarned: xpGained,
    });
  }, [onFinish, mode, config.difficulty, xpGained]);

  const finishGame = useCallback(() => {
    finishWithData(score, answers, maxStreak);
  }, [score, answers, maxStreak, finishWithData]);

  // ── Handlers ───────────────────────────────────────────

  const submitAnswer = () => {
    if (!userAnswer.trim() || showFeedback) return;
    processAnswer(parseFloat(userAnswer));
  };

  const skipQuestion = () => {
    if (showFeedback) return;
    processAnswer(null, true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !showFeedback && userAnswer.trim()) submitAnswer();
    if (e.key === 'Tab' && !showFeedback) { e.preventDefault(); skipQuestion(); }
    if (e.key === 'Escape') onReset();
  };

  // ── Render ─────────────────────────────────────────────

  if (loading) return null;
  if (!currentQ) return <div>Failed to generate quiz.</div>;

  const pct = isClassic
    ? (currentIdx / questions.length) * 100
    : 0; // no progress bar for speed/endless

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Container>
      <TopBar>
        <TopBarLeft>
          {isClassic && <><span>{currentIdx + 1}</span> / {questions.length}</>}
          {isSpeed && <>Questions: <span>{currentIdx + 1}</span></>}
          {isEndless && <>Question <span>{currentIdx + 1}</span></>}
        </TopBarLeft>
        <TopBarRight>
          {streak > 1 && <Badge>{streak} streak</Badge>}
          {isEndless && (
            <LivesRow>
              {[...Array(3)].map((_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>{'\u2764\uFE0F'}</span>
              ))}
            </LivesRow>
          )}
          {isSpeed && <Timer $urgent={speedTimeLeft <= 10}>{formatTime(speedTimeLeft)}</Timer>}
          {config.timerEnabled && isClassic && (
            <Timer $urgent={timeLeft <= 5}>{timeLeft}s</Timer>
          )}
          <Badge $color={score > 0 ? undefined : 'transparent'} $textColor={undefined}>
            {score} pts
          </Badge>
        </TopBarRight>
      </TopBar>

      {isClassic && (
        <ProgressTrack>
          <ProgressFill $pct={pct} />
        </ProgressTrack>
      )}

      <QuestionCard>
        <QuestionLabel>
          {currentQ.type === 'percentage' ? 'Calculate' : 'Solve'}
        </QuestionLabel>
        <QuestionText>
          <MathExpression expression={currentQ.question} />
        </QuestionText>
      </QuestionCard>

      <InputRow>
        <AnswerInput
          ref={inputRef}
          type="number"
          step="any"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your answer"
          disabled={showFeedback}
        />
      </InputRow>

      <ActionRow>
        <SubmitBtn onClick={submitAnswer} disabled={showFeedback || !userAnswer.trim()}>
          Submit
        </SubmitBtn>
        <SkipBtn onClick={skipQuestion} disabled={showFeedback}>
          Skip
        </SkipBtn>
      </ActionRow>

      {showFeedback && feedback && (
        <Feedback $correct={feedback.correct}>
          {feedback.message}
          {feedback.xp > 0 && <XPGain>+{feedback.xp} XP</XPGain>}
        </Feedback>
      )}

      <KeyHint>Enter = submit &middot; Tab = skip &middot; Esc = quit</KeyHint>
      <QuitBtn onClick={onReset}>Quit quiz</QuitBtn>
    </Container>
  );
}

export default QuizGame;
