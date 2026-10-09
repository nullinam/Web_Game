import React, { useState } from 'react';
import styled from 'styled-components';

// ── Styled Components ────────────────────────────────────

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const SectionLabel = styled.div`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${p => p.theme.textSecondary};
  font-weight: 600;
  margin-bottom: 0.125rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${p => p.theme.text};
`;

const Hint = styled.span`
  font-size: 0.8rem;
  color: ${p => p.theme.textSecondary};
  font-weight: 400;
`;

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Slider = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: ${p => p.theme.border};
  outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: ${p => p.theme.primary};
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  &::-moz-range-thumb {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: ${p => p.theme.primary};
    cursor: pointer;
    border: 2px solid white;
  }
`;

const SliderValue = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${p => p.theme.primary};
  min-width: 3ch;
  text-align: center;
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: ${p => p.$disabled ? 'default' : 'pointer'};
  padding: 0.5rem 0.75rem;
  border: 1px solid ${p => p.theme.border};
  border-radius: 8px;
  transition: all 0.15s ease;
  user-select: none;
  opacity: ${p => p.$disabled ? 0.5 : 1};
  &:hover { background: ${p => p.$disabled ? 'transparent' : p.theme.hover}; }
`;

const ToggleSwitch = styled.div`
  width: 36px; height: 20px;
  border-radius: 10px;
  background: ${p => p.$on ? p.theme.primary : p.theme.border};
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${p => p.$on ? '18px' : '2px'};
    width: 16px; height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s ease;
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const ToggleText = styled.div`flex: 1;`;
const ToggleLabel = styled.div`font-size: 0.875rem; font-weight: 500; color: ${p => p.theme.text};`;
const ToggleHint = styled.div`font-size: 0.75rem; color: ${p => p.theme.textSecondary}; margin-top: 0.125rem;`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${p => p.theme.border};
  margin: 0.25rem 0;
`;

const ModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`;

const ModeCard = styled.button`
  background: ${p => p.$active ? p.theme.primaryBg : p.theme.bg};
  border: 2px solid ${p => p.$active ? p.theme.primary : p.theme.border};
  border-radius: 10px;
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  &:hover { border-color: ${p => p.theme.primary}; }
`;

const ModeName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${p => p.theme.text};
`;

const ModeDesc = styled.div`
  font-size: 0.7rem;
  color: ${p => p.theme.textSecondary};
  margin-top: 0.125rem;
`;

const PresetRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PresetChip = styled.button`
  background: ${p => p.theme.bg};
  color: ${p => p.theme.textSecondary};
  border: 1px solid ${p => p.theme.border};
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  &:hover {
    background: ${p => p.theme.primaryBg};
    color: ${p => p.theme.primary};
    border-color: ${p => p.theme.primary};
  }
`;

const StartButton = styled.button`
  background: ${p => p.theme.primary};
  color: white;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 0.5rem;
  font-family: inherit;
  &:hover { background: ${p => p.theme.primaryHover}; }
  &:active { transform: scale(0.98); }
`;

// ── Presets ──────────────────────────────────────────────

const PRESETS = [
  { label: 'Easy Warmup', difficulty: 2, numQuestions: 10, cats: { arithmetic: true } },
  { label: 'Times Tables', difficulty: 3, numQuestions: 20, cats: { arithmetic: false, multDiv: true } },
  { label: 'All Rounder', difficulty: 5, numQuestions: 15, cats: { arithmetic: true, multDiv: true, exponents: true, fractions: true, percentages: true, orderOps: true } },
  { label: 'Expert', difficulty: 8, numQuestions: 20, cats: { arithmetic: true, multDiv: true, exponents: true, fractions: true, percentages: true, orderOps: true } },
];

const MODES = [
  { id: 'classic', name: 'Classic', desc: 'Fixed questions, at your pace' },
  { id: 'speed', name: 'Speed Round', desc: 'Race the clock' },
  { id: 'endless', name: 'Endless', desc: 'Keep going until 3 wrong' },
  { id: 'daily', name: 'Daily Challenge', desc: 'Same quiz for everyone today' },
];

// ── Component ────────────────────────────────────────────

function QuizSetup({ onStartQuiz }) {
  const [mode, setMode] = useState('classic');
  const [difficulty, setDifficulty] = useState(3);
  const [numQuestions, setNumQuestions] = useState(10);
  const [speedTime, setSpeedTime] = useState(60);
  const [cats, setCats] = useState({
    arithmetic: true,
    multDiv: false,
    exponents: false,
    fractions: false,
    percentages: false,
    orderOps: false,
  });
  const [allowNegatives, setAllowNegatives] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const isDaily = mode === 'daily';
  const isMultDivForced = difficulty >= 4;
  const isSqrtExpForced = difficulty >= 6;

  const effectiveCats = isDaily
    ? { arithmetic: true, multDiv: true, exponents: true, fractions: true, percentages: true, orderOps: true }
    : {
        ...cats,
        multDiv: isMultDivForced || cats.multDiv,
        exponents: isSqrtExpForced || cats.exponents,
        allowNegatives,
      };

  const toggleCat = (key) => setCats(prev => ({ ...prev, [key]: !prev[key] }));

  const applyPreset = (preset) => {
    setMode('classic');
    setDifficulty(preset.difficulty);
    setNumQuestions(preset.numQuestions);
    setCats({ arithmetic: false, multDiv: false, exponents: false, fractions: false, percentages: false, orderOps: false, ...preset.cats });
  };

  const getDifficultyLabel = (lv) => {
    if (lv <= 2) return 'Easy';
    if (lv <= 4) return 'Medium';
    if (lv <= 7) return 'Hard';
    return 'Expert';
  };

  const handleStart = () => {
    onStartQuiz({
      mode,
      difficulty: isDaily ? 5 : difficulty,
      numQuestions: mode === 'classic' ? numQuestions : 0,
      speedTime: mode === 'speed' ? speedTime : 0,
      categories: effectiveCats,
      timerEnabled: mode === 'classic' ? timerEnabled : false,
      timePerQuestion: timerEnabled ? timePerQuestion : 0,
    });
  };

  return (
    <Form>
      {/* Mode Selection */}
      <FieldGroup>
        <SectionLabel>Game Mode</SectionLabel>
        <ModeGrid>
          {MODES.map(m => (
            <ModeCard key={m.id} $active={mode === m.id} onClick={() => setMode(m.id)}>
              <ModeName>{m.name}</ModeName>
              <ModeDesc>{m.desc}</ModeDesc>
            </ModeCard>
          ))}
        </ModeGrid>
      </FieldGroup>

      {/* Quick Presets */}
      {!isDaily && (
        <FieldGroup>
          <SectionLabel>Quick Presets</SectionLabel>
          <PresetRow>
            {PRESETS.map(p => (
              <PresetChip key={p.label} onClick={() => applyPreset(p)}>
                {p.label}
              </PresetChip>
            ))}
          </PresetRow>
        </FieldGroup>
      )}

      <Divider />

      {/* Difficulty */}
      {!isDaily && (
        <FieldGroup>
          <Label>Difficulty <Hint>&mdash; {getDifficultyLabel(difficulty)}</Hint></Label>
          <SliderRow>
            <Slider type="range" min="1" max="10" value={difficulty}
              onChange={e => setDifficulty(parseInt(e.target.value))} />
            <SliderValue>{difficulty}</SliderValue>
          </SliderRow>
        </FieldGroup>
      )}

      {/* Questions (Classic only) */}
      {mode === 'classic' && (
        <FieldGroup>
          <Label>Questions</Label>
          <SliderRow>
            <Slider type="range" min="5" max="50" step="5" value={numQuestions}
              onChange={e => setNumQuestions(parseInt(e.target.value))} />
            <SliderValue>{numQuestions}</SliderValue>
          </SliderRow>
        </FieldGroup>
      )}

      {/* Speed Time (Speed only) */}
      {mode === 'speed' && (
        <FieldGroup>
          <Label>Time Limit</Label>
          <SliderRow>
            <Slider type="range" min="30" max="180" step="15" value={speedTime}
              onChange={e => setSpeedTime(parseInt(e.target.value))} />
            <SliderValue>{speedTime}s</SliderValue>
          </SliderRow>
        </FieldGroup>
      )}

      <Divider />

      {/* Operation Categories */}
      {!isDaily && (
        <FieldGroup>
          <SectionLabel>Operations</SectionLabel>

          <Toggle $disabled={true}>
            <HiddenInput type="checkbox" checked={effectiveCats.arithmetic} readOnly />
            <ToggleSwitch $on={effectiveCats.arithmetic} />
            <ToggleText>
              <ToggleLabel>Addition &amp; Subtraction</ToggleLabel>
              <ToggleHint>Always included</ToggleHint>
            </ToggleText>
          </Toggle>

          <Toggle $disabled={isMultDivForced}>
            <HiddenInput type="checkbox" checked={effectiveCats.multDiv} disabled={isMultDivForced}
              onChange={() => toggleCat('multDiv')} />
            <ToggleSwitch $on={effectiveCats.multDiv} />
            <ToggleText>
              <ToggleLabel>Multiplication &amp; Division</ToggleLabel>
              {isMultDivForced && <ToggleHint>Required at difficulty 4+</ToggleHint>}
            </ToggleText>
          </Toggle>

          <Toggle $disabled={isSqrtExpForced}>
            <HiddenInput type="checkbox" checked={effectiveCats.exponents} disabled={isSqrtExpForced}
              onChange={() => toggleCat('exponents')} />
            <ToggleSwitch $on={effectiveCats.exponents} />
            <ToggleText>
              <ToggleLabel>Exponents &amp; Roots</ToggleLabel>
              {isSqrtExpForced && <ToggleHint>Required at difficulty 6+</ToggleHint>}
            </ToggleText>
          </Toggle>

          <Toggle>
            <HiddenInput type="checkbox" checked={cats.fractions} onChange={() => toggleCat('fractions')} />
            <ToggleSwitch $on={cats.fractions} />
            <ToggleText>
              <ToggleLabel>Fractions</ToggleLabel>
              <ToggleHint>Fraction multiplication and more</ToggleHint>
            </ToggleText>
          </Toggle>

          <Toggle>
            <HiddenInput type="checkbox" checked={cats.percentages} onChange={() => toggleCat('percentages')} />
            <ToggleSwitch $on={cats.percentages} />
            <ToggleText>
              <ToggleLabel>Percentages</ToggleLabel>
              <ToggleHint>"What is X% of Y?"</ToggleHint>
            </ToggleText>
          </Toggle>

          <Toggle>
            <HiddenInput type="checkbox" checked={cats.orderOps} onChange={() => toggleCat('orderOps')} />
            <ToggleSwitch $on={cats.orderOps} />
            <ToggleText>
              <ToggleLabel>Order of Operations</ToggleLabel>
              <ToggleHint>Multi-step PEMDAS problems</ToggleHint>
            </ToggleText>
          </Toggle>

          <Toggle>
            <HiddenInput type="checkbox" checked={allowNegatives} onChange={() => setAllowNegatives(!allowNegatives)} />
            <ToggleSwitch $on={allowNegatives} />
            <ToggleText>
              <ToggleLabel>Allow Negative Answers</ToggleLabel>
            </ToggleText>
          </Toggle>
        </FieldGroup>
      )}

      {/* Timer (Classic only) */}
      {mode === 'classic' && (
        <>
          <Divider />
          <FieldGroup>
            <Toggle>
              <HiddenInput type="checkbox" checked={timerEnabled} onChange={() => setTimerEnabled(!timerEnabled)} />
              <ToggleSwitch $on={timerEnabled} />
              <ToggleText>
                <ToggleLabel>Timed Mode</ToggleLabel>
                <ToggleHint>Time limit per question</ToggleHint>
              </ToggleText>
            </Toggle>
            {timerEnabled && (
              <div style={{ paddingLeft: '0.25rem' }}>
                <Label>Seconds per question</Label>
                <SliderRow>
                  <Slider type="range" min="5" max="120" step="5" value={timePerQuestion}
                    onChange={e => setTimePerQuestion(parseInt(e.target.value))} />
                  <SliderValue>{timePerQuestion}s</SliderValue>
                </SliderRow>
              </div>
            )}
          </FieldGroup>
        </>
      )}

      {isDaily && (
        <FieldGroup>
          <SectionLabel>Daily Challenge</SectionLabel>
          <Hint>10 questions, difficulty 5, all operation types. Same for everyone today!</Hint>
        </FieldGroup>
      )}

      <StartButton onClick={handleStart}>
        {isDaily ? "Start Today's Challenge" : mode === 'speed' ? 'Start Speed Round' : mode === 'endless' ? 'Start Endless Mode' : 'Start Quiz'}
      </StartButton>
    </Form>
  );
}

export default QuizSetup;
