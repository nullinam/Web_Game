
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LanguageConfig, WordObject, InterfaceLanguage, KeyMapping, LessonMode } from '../types';
import { toKeystrokes, UI_STRINGS, NUMBER_ROW, TYPING_CODES } from '../constants';
import VirtualKeyboard from './VirtualKeyboard';
import { PenkoMascot } from './PenkoMascot';
import { audioService } from '../services/audioService';
import { multiplayerService, MultiplayerPlayer } from '../services/multiplayerService';

interface GameEngineProps {
  language: LanguageConfig;
  showHands: boolean;
  uiLanguage: InterfaceLanguage;
  lessonMode: LessonMode;
  seed: number; // Same seed => same words, so multiplayer peers race identical sessions
  onGameOver: (score: number, wpm: number) => void;
  onExit: () => void;
}

type MascotPose = 'idle' | 'talk' | 'hurt';

const WORDS_PER_SESSION = 30;
const HOME_ROW_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];

// Home-row rhythm drills, written as QWERTY positions and translated to each layout's characters
const QWERTY_HOME_CODES: Record<string, string> = {
  a: 'KeyA', s: 'KeyS', d: 'KeyD', f: 'KeyF', g: 'KeyG', h: 'KeyH', j: 'KeyJ', k: 'KeyK', l: 'KeyL', ';': 'Semicolon'
};
const HOME_ROW_PATTERNS = [
  'fjdksla;', 'ffjjddkk', 'dksla;fj', 'asdf', 'jkl;', 'fdsa', ';lkj', 'salad', 'glass', 'flask',
  'ash', 'ask', 'glad', 'fall', 'add', 'sad', 'has', 'lad', 'dash'
];

// Small deterministic PRNG (mulberry32)
const createRng = (seed: number) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Finds the key producing `char`, preferring the unshifted layer. */
const findKey = (mappings: KeyMapping[], char: string | undefined): { code: string; shift: boolean } | null => {
  if (char === undefined) return null;
  if (char === ' ') return { code: 'Space', shift: false };
  const base = mappings.find(m => m.char === char);
  if (base) return { code: base.code, shift: false };
  const shifted = mappings.find(m => m.shiftChar === char);
  return shifted ? { code: shifted.code, shift: true } : null;
};

/** Every key that produces `char` - some layouts put the same character on two keys. */
const findAllKeys = (mappings: KeyMapping[], char: string): { code: string; shift: boolean }[] => [
  ...(char === ' ' ? [{ code: 'Space', shift: false }] : []),
  ...mappings.filter(m => m.char === char).map(m => ({ code: m.code, shift: false })),
  ...mappings.filter(m => m.shiftChar === char).map(m => ({ code: m.code, shift: true }))
];

const buildSessionWords = (language: LanguageConfig, lessonMode: LessonMode, seed: number): WordObject[] => {
  const random = createRng(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

  const isCharAllowed = (char: string) => {
    const key = findKey(language.mappings, char);
    if (!key) return false;
    if (lessonMode === 'home' && !HOME_ROW_CODES.includes(key.code)) return false;
    if (lessonMode === 'no-shift' && key.shift) return false;
    return true;
  };

  const vocabulary = language.sampleWords.filter(word =>
    [...toKeystrokes(language.id, word)].every(isCharAllowed)
  );

  // Fallback drills built from whichever keys the lesson allows
  const availableChars = language.mappings
    .flatMap(m => [m.char, m.shiftChar])
    .filter((c): c is string => !!c && c.length === 1 && isCharAllowed(c));

  const homeRowChar = (qwertyChar: string) =>
    language.mappings.find(m => m.code === QWERTY_HOME_CODES[qwertyChar])?.char ?? '';

  const generateDrillWord = (index: number) => {
    if (lessonMode === 'home') {
      const drill = [...HOME_ROW_PATTERNS[index % HOME_ROW_PATTERNS.length]].map(homeRowChar).join('');
      if (drill) return drill;
    }
    if (availableChars.length === 0) return 'penko';
    const len = Math.floor(random() * 3) + 3; // 3-5 chars
    return Array.from({ length: len }, () => pick(availableChars)).join('');
  };

  return Array.from({ length: WORDS_PER_SESSION }, (_, i) => {
    // Mix vocabulary words and key drills if vocab exists
    const display = vocabulary.length > 0 && random() > 0.4 ? pick(vocabulary) : generateDrillWord(i);
    return {
      id: `w-${i}`,
      text: toKeystrokes(language.id, display),
      display,
      typed: '',
      isCompleted: false
    };
  });
};

const calcWpm = (typedChars: number, startTime: number | null, now = Date.now()) => {
  if (!startTime) return 0;
  const minutes = (now - startTime) / 60000;
  return minutes > 0 ? Math.round((typedChars / 5) / minutes) : 0;
};

const wordSizeClass = (length: number) =>
  length <= 6 ? 'text-3xl sm:text-4xl lg:text-7xl 2xl:text-8xl' :
  length <= 10 ? 'text-2xl sm:text-3xl lg:text-6xl 2xl:text-7xl' :
  'text-xl sm:text-2xl lg:text-5xl 2xl:text-6xl';

const GameEngine: React.FC<GameEngineProps> = ({ language, showHands, uiLanguage, lessonMode, seed, onGameOver, onExit }) => {
  const ui = UI_STRINGS[uiLanguage];

  const [words, setWords] = useState<WordObject[]>(() => buildSessionWords(language, lessonMode, seed));
  const [score, setScore] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [, setClock] = useState(0); // re-render once a second so live WPM keeps moving

  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [mascotPose, setMascotPose] = useState<MascotPose>('idle');
  const [flash, setFlash] = useState<{ kind: 'success' | 'error'; nonce: number } | null>(null);
  const [multiplayers, setMultiplayers] = useState<MultiplayerPlayer[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  // Refs mirror state so rapid key presses always see the latest values
  const wordsRef = useRef(words);
  const scoreRef = useRef(0);
  const typedCharsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const timersRef = useRef<{ press?: number; flash?: number; gameOver?: number }>({});
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Regenerate when the language, lesson or match seed changes
  useEffect(() => {
    const fresh = buildSessionWords(language, lessonMode, seed);
    wordsRef.current = fresh;
    scoreRef.current = 0;
    typedCharsRef.current = 0;
    startTimeRef.current = null;
    finishedRef.current = false;
    setWords(fresh);
    setScore(0);
    setTypedChars(0);
    setStartTime(null);
    inputRef.current?.focus();
  }, [language, lessonMode, seed]);

  // Clear pending timers on unmount (e.g. quitting right after the last word)
  useEffect(() => () => {
    const timers = timersRef.current;
    window.clearTimeout(timers.press);
    window.clearTimeout(timers.flash);
    window.clearTimeout(timers.gameOver);
  }, []);

  useEffect(() => {
    if (!startTime) return;
    const interval = window.setInterval(() => { if (!(window as Window & { gameHubPaused?: boolean }).gameHubPaused) setClock(c => c + 1); }, 1000);
    return () => window.clearInterval(interval);
  }, [startTime]);

  // Track multiplayer presence updates
  useEffect(() => multiplayerService.subscribe(setMultiplayers), []);

  const activeWordIndex = words.findIndex(w => !w.isCompleted);
  const safeActiveIndex = activeWordIndex === -1 ? words.length : activeWordIndex;
  const activeWord = words[activeWordIndex] as WordObject | undefined;
  const nextChar = activeWord?.text[activeWord.typed.length];
  const nextKey = findKey(language.mappings, nextChar);

  const showNumberRow = useMemo(
    () => words.some(w => [...w.text].some(c => NUMBER_ROW.includes(findKey(language.mappings, c)?.code ?? ''))),
    [words, language]
  );

  // Sync local typing updates to remote peers
  useEffect(() => {
    if (!multiplayerService.getSession()) return;
    const total = words.reduce((sum, w) => sum + w.text.length, 0);
    const done = words.reduce((sum, w) => sum + w.typed.length, 0);
    multiplayerService.updateLocalProgress(
      total > 0 ? Math.round((done / total) * 100) : 0,
      calcWpm(typedChars, startTime),
      score,
      activeWordIndex === -1 && words.length > 0
    );
  }, [words, typedChars, score, startTime, activeWordIndex]);

  const showPressed = (code: string) => {
    setLastPressed(code);
    window.clearTimeout(timersRef.current.press);
    timersRef.current.press = window.setTimeout(() => setLastPressed(null), 150);
  };

  const showFlash = (kind: 'success' | 'error') => {
    setFlash({ kind, nonce: Date.now() });
    setMascotPose(kind === 'success' ? 'talk' : 'hurt');
    window.clearTimeout(timersRef.current.flash);
    timersRef.current.flash = window.setTimeout(() => {
      setFlash(null);
      setMascotPose('idle');
    }, kind === 'success' ? 300 : 500);
  };

  // Unified input processing logic
  const processInput = (code: string, key: string | null, isShift: boolean, isVirtualTap: boolean) => {
    if (finishedRef.current) return;

    const current = wordsRef.current;
    const activeIndex = current.findIndex(w => !w.isCompleted);
    if (activeIndex === -1) return;

    audioService.playKey();
    showPressed(code);

    const word = current[activeIndex];
    const needed = word.text[word.typed.length];

    // 1. Physical keyboard already set to the target layout: the produced character matches
    // 2. Otherwise match by key position; virtual taps ignore shift for a better touch experience
    const isCorrect =
      (!isVirtualTap && key === needed) ||
      findAllKeys(language.mappings, needed).some(k => k.code === code && (isVirtualTap || k.shift === isShift));

    if (!isCorrect) {
      audioService.playError();
      scoreRef.current = Math.max(0, scoreRef.current - 5);
      setScore(scoreRef.current);
      showFlash('error');
      return;
    }

    const typed = word.typed + needed;
    const isWordComplete = typed === word.text;
    const next = [...current];
    next[activeIndex] = { ...word, typed, isCompleted: isWordComplete };
    wordsRef.current = next;
    setWords(next);

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      setStartTime(startTimeRef.current);
    }
    typedCharsRef.current += 1;
    setTypedChars(typedCharsRef.current);
    scoreRef.current += 10 + (isWordComplete ? 50 : 0);
    setScore(scoreRef.current);

    if (isWordComplete) audioService.playSuccess();
    showFlash('success');

    if (isWordComplete && activeIndex === next.length - 1) {
      finishedRef.current = true;
      const finalScore = scoreRef.current;
      const finalWpm = calcWpm(typedCharsRef.current, startTimeRef.current);
      // Small delay to let the user see the last success
      timersRef.current.gameOver = window.setTimeout(() => onGameOverRef.current(finalScore, finalWpm), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onExit();
      return;
    }
    // Leave browser/OS shortcuts alone (AltGr reports as Ctrl+Alt on Windows, so allow it)
    if (e.metaKey || ((e.ctrlKey || e.altKey) && !e.getModifierState('AltGraph'))) return;

    if (e.code.startsWith('Shift')) {
      showPressed(e.code);
      return;
    }
    // Backspace, Tab, Enter, arrows, function keys... are not part of the drill.
    // Tab/Enter must not move focus to (and then press) the QUIT button.
    if (!TYPING_CODES.has(e.code)) {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Backspace') e.preventDefault();
      return;
    }

    e.preventDefault();
    if (e.repeat) return;
    processInput(e.code, e.key, e.shiftKey, false);
  };

  const handleVirtualTap = (code: string) => {
    // For virtual taps, key char is null (we rely on code match), shift is ignored/auto-handled
    processInput(code, null, false, true);
  };

  const localId = multiplayerService.getLocalId();
  const hint = nextChar === ' ' ? ui.space : nextChar;

  return (
    <div className="flex flex-col h-full w-full bg-[#05070d] overflow-hidden relative" onClick={() => inputRef.current?.focus()}>

      <input
        ref={inputRef}
        className="opacity-0 absolute top-0 left-0 h-0 w-0"
        onKeyDown={handleKeyDown}
        autoFocus
        readOnly
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="none"
        aria-label={language.name}
        onBlur={(e) => {
          const input = e.target;
          window.setTimeout(() => input.isConnected && input.focus(), 10);
        }}
      />

      {/* Screen Vignette Red Error Flash */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-all duration-150 ${
        flash?.kind === 'error'
          ? 'shadow-[inset_0_0_60px_rgba(239,68,68,0.4)] border border-red-500/30'
          : 'shadow-none'
      }`} />

      {/* 🎛️ Unified Arcade Bezel (Center Dashboard) */}
      <header className="flex-none relative z-40 px-2 sm:px-4 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-6 short:pt-1">
        <div className="glass-panel mx-auto w-full max-w-2xl lg:max-w-4xl 2xl:max-w-6xl p-2 sm:p-4 lg:px-6 short:py-1 rounded-2xl flex items-center justify-between gap-2 sm:gap-4 shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-cyan-500/20">
          {/* Mascot Sidecar */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="flex-none bg-slate-950/60 p-1 sm:p-1.5 rounded-xl border border-cyan-500/20 drop-shadow-[0_4px_8px_rgba(34,211,238,0.25)]">
              <PenkoMascot pose={mascotPose} size={56} className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 short:w-8 short:h-8" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="hidden sm:block short:hidden text-[9px] lg:text-xs font-retro text-cyan-400 animate-pulse uppercase tracking-wider">PENKO RACER</span>
              <span className="text-white font-vt323 text-base sm:text-lg lg:text-3xl font-bold truncate">{language.name}</span>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="flex flex-none items-center gap-3 sm:gap-8 lg:gap-12">
            <div className="text-center">
              <div className="text-[8px] sm:text-[9px] lg:text-xs font-retro text-slate-500 uppercase">{ui.score}</div>
              <div className="text-xl sm:text-2xl lg:text-5xl font-vt323 font-bold text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] tabular-nums">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] sm:text-[9px] lg:text-xs font-retro text-slate-500 uppercase">{ui.wpm}</div>
              <div className="text-xl sm:text-2xl lg:text-5xl font-vt323 font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] tabular-nums">
                {calcWpm(typedChars, startTime)}
              </div>
            </div>
          </div>

          {/* Beveled Exit Button */}
          <button
            onClick={onExit}
            className="flex-none px-2.5 sm:px-4 lg:px-6 py-1.5 lg:py-2.5 bg-red-950/40 border border-red-500/30 hover:bg-red-900 hover:text-white text-red-300 font-retro text-[8px] sm:text-[9px] lg:text-xs rounded-lg transition-all transform active:scale-95"
          >
            {ui.quit}
          </button>
        </div>
      </header>

      {/* Main Game Area: the word track is centred in whatever height is left over */}
      <main className="flex-1 min-h-0 relative flex items-center overflow-hidden [--card-w:clamp(11rem,62vw,17.5rem)] lg:[--card-w:clamp(17.5rem,30vw,32rem)] [--gap:1.5rem] sm:[--gap:2.5rem] lg:[--gap:3.5rem]">

        {/* Retro Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{
               backgroundImage: 'linear-gradient(to right, #22d3ee 1px, transparent 1px), linear-gradient(to bottom, #22d3ee 1px, transparent 1px)',
               backgroundSize: '60px 60px',
               transform: 'perspective(400px) rotateX(15deg) scale(1.1)'
             }}>
        </div>

        {/* Word Track */}
        <div className="ml-[50%] flex items-end transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform"
             style={{ transform: `translateX(calc(-1 * (var(--gap) / 2 + var(--card-w) / 2 + ${safeActiveIndex} * (var(--card-w) + var(--gap)))))` }}>

           {words.map((word, idx) => {
             const isActive = idx === activeWordIndex;
             const isDone = word.isCompleted;
             const cardFlash = isActive ? flash?.kind : undefined;

             return (
               <div key={word.id}
                    className={`
                      relative flex-shrink-0 transition-all duration-300 flex flex-col justify-end w-[var(--card-w)] mx-[calc(var(--gap)/2)]
                      ${isActive ? 'z-10' : 'opacity-30 grayscale blur-[2px]'}
                      ${isDone ? '!opacity-0 scale-90 translate-y-4 pointer-events-none' : ''}
                    `}
               >
                 {/* Floating Target Hint (Attached to Card) */}
                 <div className="h-10 sm:h-12 lg:h-16 short:h-8 flex justify-center items-start">
                   {isActive && nextChar !== undefined && (
                     <div className="animate-bounce-slow flex items-center gap-2 lg:gap-3 bg-amber-500 text-slate-950 px-3.5 lg:px-5 py-0.5 lg:py-1 rounded-full border border-amber-400 shadow-md">
                       <span className="font-retro text-[9px] lg:text-xs">{ui.typeHint}:</span>
                       <span className="text-xl lg:text-4xl leading-tight font-bold">{hint}</span>
                     </div>
                   )}
                 </div>

                 <div
                   key={isActive ? flash?.nonce : undefined}
                   className={`
                    h-[clamp(4.5rem,20dvh,9rem)] lg:h-[clamp(9rem,24dvh,16rem)] rounded-2xl lg:rounded-3xl border flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6
                    transition-all duration-200
                    ${cardFlash === 'success' ? '!border-green-400 !bg-green-950/20 !shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-success' :
                      cardFlash === 'error' ? '!border-red-500 !bg-red-950/30 !shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-shake' :
                      isActive ? 'bg-slate-900/60 border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.15)]' : 'bg-slate-950/40 border-slate-900'}
                  `}>
                    {/* Main Text */}
                    <div className={`${wordSizeClass(word.text.length)} font-bold tracking-wider text-center leading-tight break-all`} dir={language.isRTL ? "rtl" : "ltr"}>
                        <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{word.typed}</span>
                        <span className={`inline-block border-b-2 min-w-[0.6em] ${cardFlash === 'error' ? "text-red-400 border-red-500 animate-pulse" : "text-white border-amber-400 bg-white/10 rounded px-1"}`}>
                            {word.text.slice(word.typed.length, word.typed.length + 1)}
                        </span>
                        <span className="text-slate-500">
                            {word.text.slice(word.typed.length + 1)}
                        </span>
                    </div>

                    {/* Original word when the keystrokes differ (Hangul syllables, voiced kana, accents) */}
                    {word.display !== word.text && (
                       <div className="text-base sm:text-lg lg:text-3xl text-slate-400 mt-1 sm:mt-2 lg:mt-3" dir={language.isRTL ? "rtl" : "ltr"}>
                          {word.display}
                       </div>
                    )}
                 </div>
               </div>
             );
           })}
        </div>
      </main>

      {/* Opponent Progress Tracks in Multiplayer */}
      {multiplayers.length > 1 && (
        <div className="flex-none bg-slate-950/60 border-t border-cyan-500/10 px-3 sm:px-6 py-2 sm:py-3 w-full flex flex-col gap-1.5 z-30 relative backdrop-blur-md max-h-[22dvh] overflow-y-auto custom-scrollbar">
           <div className="text-[9px] font-retro text-cyan-400/80 uppercase tracking-widest text-center md:text-left">{ui.liveRacers}</div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
             {multiplayers.map(p => {
               const isLocal = p.id === localId;
               return (
                 <div key={p.id} className={`flex items-center justify-between px-2 py-1.5 rounded-xl border ${isLocal ? 'border-cyan-500/25 bg-cyan-950/20' : 'border-slate-800 bg-slate-950/40'}`}>
                    <div className="flex items-center gap-2 flex-none">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-retro text-[9px] text-slate-200 uppercase">{p.name} {isLocal && `(${ui.you})`}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end ml-4">
                       <div className="w-full max-w-[6rem] bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                       </div>
                       <span className="font-vt323 text-cyan-300 text-xs w-14 text-right flex-none">{p.isFinished ? '🏁 ' : ''}{p.wpm} {ui.wpm}</span>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {/* Bottom Keyboard Area */}
      <div className="flex-none bg-[#05070d]/80 border-t border-cyan-500/10 backdrop-blur-md relative z-30 w-full flex justify-center pt-1 sm:pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-4">
         <div className="w-full max-w-5xl lg:max-w-6xl 2xl:max-w-[90rem]">
            <VirtualKeyboard
                mappings={language.mappings}
                activeKeyCode={nextKey?.code ?? null}
                lastPressedCode={lastPressed}
                needsShift={nextKey?.shift ?? false}
                showHands={showHands}
                showNumberRow={showNumberRow}
                spaceLabel={ui.space}
                onKeyTap={handleVirtualTap}
            />
         </div>
      </div>
    </div>
  );
};

export default GameEngine;
