import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { GameState, Language, LeaderboardEntry, InterfaceLanguage, LessonMode } from './types';
import { LANGUAGES, SORTED_LANGUAGES, UI_STRINGS } from './constants';
import GameEngine from './components/GameEngine';
import Leaderboard from './components/Leaderboard';
import Manual from './components/Manual';
import PenkoMascot from './components/PenkoMascot';
import { multiplayerService, MatchSettings } from './services/multiplayerService';

// QR generation/scanning is only needed once someone opens multiplayer
const MultiplayerDialog = lazy(() => import('./components/MultiplayerDialog'));

const STORAGE_KEY = 'penko_leaderboard';
const SETTINGS_KEY = 'penko_settings';

// Language names for UI dropdown
const INTERFACE_LANGUAGE_NAMES: Record<InterfaceLanguage, string> = {
  [InterfaceLanguage.ENGLISH]: 'English',
  [InterfaceLanguage.SPANISH]: 'Español',
  [InterfaceLanguage.FRENCH]: 'Français',
  [InterfaceLanguage.GERMAN]: 'Deutsch',
  [InterfaceLanguage.ITALIAN]: 'Italiano',
  [InterfaceLanguage.PORTUGUESE]: 'Português',
  [InterfaceLanguage.RUSSIAN]: 'Русский',
  [InterfaceLanguage.KOREAN]: '한국어',
  [InterfaceLanguage.JAPANESE]: '日本語',
  [InterfaceLanguage.CHINESE]: '中文',
  [InterfaceLanguage.ARABIC]: 'العربية',
  [InterfaceLanguage.HEBREW]: 'עברית'
};

const LEVEL_LABELS: Record<InterfaceLanguage, { title: string, home: string, noShift: string, all: string }> = {
  [InterfaceLanguage.ENGLISH]: { title: "LESSON LEVEL", home: "Level 1: Home Row Only", noShift: "Level 2: Basic Keys (No Shift)", all: "Level 3: Full Keyboard" },
  [InterfaceLanguage.SPANISH]: { title: "NIVEL DE LECCIÓN", home: "Nivel 1: Solo Fila Central", noShift: "Nivel 2: Teclas Básicas (Sin Shift)", all: "Nivel 3: Teclado Completo" },
  [InterfaceLanguage.FRENCH]: { title: "NIVEAU DE LEÇON", home: "Niveau 1: Rangée Milieu", noShift: "Niveau 2: Touches de Base (Sans Shift)", all: "Niveau 3: Clavier Complet" },
  [InterfaceLanguage.GERMAN]: { title: "LEKTIONSSTUFE", home: "Stufe 1: Nur Mittlere Reihe", noShift: "Stufe 2: Basis-Tasten (Ohne Shift)", all: "Stufe 3: Tastatur Komplett" },
  [InterfaceLanguage.ITALIAN]: { title: "LIVELLO DELLA LEZIONE", home: "Livello 1: Solo Riga Centrale", noShift: "Livello 2: Tasti Base (Senza Shift)", all: "Livello 3: Tastiera Completa" },
  [InterfaceLanguage.PORTUGUESE]: { title: "NÍVEL DE LIÇÃO", home: "Nível 1: Apenas Linha Central", noShift: "Nível 2: Teclas Básicas (Sem Shift)", all: "Nível 3: Teclado Completo" },
  [InterfaceLanguage.RUSSIAN]: { title: "УРОВЕНЬ УРОКА", home: "Уровень 1: Только средний ряд", noShift: "Уровень 2: Базовые клавиши (Без Shift)", all: "Уровень 3: Полная клавиатура" },
  [InterfaceLanguage.KOREAN]: { title: "레슨 단계", home: "1단계: 기본 중간 줄만", noShift: "2단계: 기본 키 (Shift 없음)", all: "3단계: 전체 키보드" },
  [InterfaceLanguage.JAPANESE]: { title: "レッスンレベル", home: "レベル1: ホームポジションのみ", noShift: "レベル2: 基本キー (Shiftなし)", all: "レベル3: フルキーボード" },
  [InterfaceLanguage.CHINESE]: { title: "课程级别", home: "级别 1: 仅中排键", noShift: "级别 2: 基础键 (无 Shift)", all: "级别 3: 完整键盘" },
  [InterfaceLanguage.ARABIC]: { title: "مستوى الدرس", home: "المستوى 1: صف الارتكاز فقط", noShift: "المستوى 2: المفاتيح الأساسية (بدون Shift)", all: "المستوى 3: لوحة المفاتيح كاملة" },
  [InterfaceLanguage.HEBREW]: { title: "רמת שיעור", home: "שלב 1: שורת בית בלבד", noShift: "שלב 2: מקשים בסיסיים (בלי Shift)", all: "שלב 3: מקלדת מלאה" }
};

const LESSON_MODES: LessonMode[] = ['home', 'no-shift', 'all'];

interface Settings {
  uiLang: InterfaceLanguage;
  selectedLang: Language;
  showHands: boolean;
  lessonMode: LessonMode;
  mpName: string;
}

const DEFAULT_SETTINGS: Settings = {
  uiLang: InterfaceLanguage.ENGLISH,
  selectedLang: Language.ENGLISH,
  showHands: true,
  lessonMode: 'all',
  mpName: 'PNK'
};

// Storage can be unavailable (private mode, blocked site data) - the game must still work
const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / access errors
  }
};

const loadSettings = (): Settings => {
  const saved = readJson<Partial<Settings>>(SETTINGS_KEY) ?? {};
  const isOneOf = <T,>(values: T[], value: unknown): value is T => values.includes(value as T);
  return {
    uiLang: isOneOf(Object.values(InterfaceLanguage), saved.uiLang) ? saved.uiLang : DEFAULT_SETTINGS.uiLang,
    selectedLang: isOneOf(SORTED_LANGUAGES, saved.selectedLang) ? saved.selectedLang : DEFAULT_SETTINGS.selectedLang,
    showHands: typeof saved.showHands === 'boolean' ? saved.showHands : DEFAULT_SETTINGS.showHands,
    lessonMode: isOneOf(LESSON_MODES, saved.lessonMode) ? saved.lessonMode : DEFAULT_SETTINGS.lessonMode,
    mpName: typeof saved.mpName === 'string' ? saved.mpName.slice(0, 3) : DEFAULT_SETTINGS.mpName
  };
};

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

// Read (and strip) a shared ?room=CODE multiplayer link once at startup
const takeRoomFromUrl = (): string | undefined => {
  const url = new URL(window.location.href);
  const room = url.searchParams.get('room');
  if (!room) return undefined;
  url.searchParams.delete('room');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  return room;
};

// Read at module load (not in a state initializer, which StrictMode runs twice)
const ROOM_FROM_URL = takeRoomFromUrl();

const App: React.FC = () => {
  const [initialSettings] = useState(loadSettings);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedLang, setSelectedLang] = useState<Language>(initialSettings.selectedLang);
  const [uiLang, setUiLang] = useState<InterfaceLanguage>(initialSettings.uiLang);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const [stats, setStats] = useState({ score: 0, wpm: 0 });
  const [showHands, setShowHands] = useState(initialSettings.showHands);
  const [lessonMode, setLessonMode] = useState<LessonMode>(initialSettings.lessonMode);
  const [seed, setSeed] = useState(randomSeed);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = readJson<LeaderboardEntry[]>(STORAGE_KEY);
    return Array.isArray(saved) ? saved : [];
  });
  const [playerName, setPlayerName] = useState('');
  const [mpName, setMpName] = useState(initialSettings.mpName);
  const [pendingRoom, setPendingRoom] = useState(ROOM_FROM_URL);
  const [showMultiplayer, setShowMultiplayer] = useState(!!ROOM_FROM_URL && multiplayerService.isAvailable);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const ui = UI_STRINGS[uiLang];
  const isRTL = uiLang === InterfaceLanguage.ARABIC || uiLang === InterfaceLanguage.HEBREW;

  useEffect(() => {
    writeJson(SETTINGS_KEY, { uiLang, selectedLang, showHands, lessonMode, mpName });
  }, [uiLang, selectedLang, showHands, lessonMode, mpName]);

  useEffect(() => {
    document.documentElement.lang = uiLang.toLowerCase();
  }, [uiLang]);

  // Close the language dropdown on outside click or Escape
  useEffect(() => {
    if (!langDropdownOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setLangDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLangDropdownOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [langDropdownOpen]);

  const saveScore = () => {
    if (!playerName) return;

    const newEntry: LeaderboardEntry = {
      name: playerName.toUpperCase().slice(0, 3), // Arcade style 3 letters
      score: stats.score,
      wpm: stats.wpm,
      date: Date.now(),
      languageId: selectedLang
    };

    const updated = [...leaderboard, newEntry];
    setLeaderboard(updated);
    writeJson(STORAGE_KEY, updated);
    multiplayerService.cleanup();
    setGameState(GameState.LEADERBOARD);
  };

  const startGame = () => {
    multiplayerService.cleanup();
    setPlayerName('');
    setSeed(randomSeed());
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (score: number, wpm: number) => {
    setStats({ score, wpm });
    setGameState(GameState.GAME_OVER);
  };

  const toMenu = () => {
    setGameState(GameState.MENU);
    multiplayerService.cleanup();
  };

  // Everyone in the room plays the host's layout, lesson and word list
  const handleMatchStart = (settings: MatchSettings) => {
    setSelectedLang(settings.language);
    setLessonMode(settings.lessonMode);
    setSeed(settings.seed);
    setPlayerName('');
    setPendingRoom(undefined);
    setShowMultiplayer(false);
    setShowManual(false);
    setGameState(GameState.PLAYING);
  };

  const levelLabels = LEVEL_LABELS[uiLang];
  const lessonOptions: { mode: LessonMode; label: string }[] = [
    { mode: 'home', label: levelLabels.home },
    { mode: 'no-shift', label: levelLabels.noShift },
    { mode: 'all', label: levelLabels.all }
  ];

  return (
    <div className="h-full bg-slate-900 text-cyan-400 flex flex-col relative z-10 overflow-hidden">

      {/* Manual Overlay (handled independently) */}
      {showManual && (
        <Manual uiLanguage={uiLang} onClose={() => setShowManual(false)} />
      )}

      {/* Main Content Switch */}
      {gameState === GameState.PLAYING ? (
        <GameEngine
          language={LANGUAGES[selectedLang]}
          showHands={showHands}
          uiLanguage={uiLang}
          lessonMode={lessonMode}
          seed={seed}
          onGameOver={handleGameOver}
          onExit={toMenu}
        />
      ) : (
        /* Scrollable Container for Non-Game Views */
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar" dir={isRTL ? 'rtl' : 'ltr'}>
           <div className="min-h-full flex flex-col">

              {/* MENU VIEW */}
              {gameState === GameState.MENU && (
                <div className="flex-1 flex flex-col items-center px-3 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] space-y-5 md:space-y-8">

                  {/* Top Bar for UI Language */}
                  <div className="w-full max-w-4xl lg:max-w-5xl 2xl:max-w-6xl flex justify-end">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                        aria-haspopup="listbox"
                        aria-expanded={langDropdownOpen}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 border border-cyan-500/50 rounded text-sm font-bold text-cyan-300 hover:bg-slate-700 hover:border-cyan-400 transition-all shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        <span className="tracking-wide">{INTERFACE_LANGUAGE_NAMES[uiLang]}</span>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {langDropdownOpen && (
                        <div role="listbox" className="absolute end-0 mt-2 w-44 z-50 bg-slate-800 border border-cyan-500/50 rounded shadow-[4px_4px_0_rgba(0,0,0,0.5)] overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                          {Object.values(InterfaceLanguage).map((lang) => (
                            <button
                              key={lang}
                              role="option"
                              aria-selected={uiLang === lang}
                              onClick={() => {
                                setUiLang(lang);
                                setLangDropdownOpen(false);
                              }}
                              className={`w-full text-start px-3 py-2 text-base font-medium transition-colors ${
                                uiLang === lang
                                  ? 'bg-cyan-600 text-white'
                                  : 'text-cyan-300 hover:bg-slate-700 hover:text-cyan-100'
                              }`}
                            >
                              {INTERFACE_LANGUAGE_NAMES[lang]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logo Section */}
                  <div className="text-center flex flex-col items-center animate-mascot-idle relative">
                     <div className="mb-3 sm:mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-slate-900/60 p-2 rounded-2xl border border-cyan-500/20">
                        <PenkoMascot pose="idle" size={96} className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32" />
                     </div>
                     <h1 className="text-2xl min-[400px]:text-3xl sm:text-5xl md:text-7xl font-retro text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-cyan-600 glow-text mb-2 tracking-tight leading-tight" dir="ltr">
                      TYPING GAME
                     </h1>
                     <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-cyan-400/80 font-vt323 tracking-widest uppercase">
                       {ui.subtitle}
                     </p>
                  </div>

                  <div className="w-full max-w-4xl lg:max-w-5xl 2xl:max-w-6xl space-y-4 sm:space-y-6">
                    {/* Arcade-Style Language Selector */}
                    <div className="glass-panel p-3 sm:p-6 shadow-[0_0_30px_rgba(34,211,238,0.15)] rounded-2xl border border-cyan-500/20">
                      <h2 className="text-center text-xs sm:text-lg md:text-xl lg:text-2xl font-retro text-amber-400 uppercase mb-4 sm:mb-6 tracking-widest leading-relaxed animate-pulse">
                        {ui.selectLang}
                      </h2>

                      {/* Compact Grid */}
                      <div className="grid grid-cols-4 min-[480px]:grid-cols-5 md:grid-cols-7 gap-2 sm:gap-2.5 lg:gap-4 mb-4">
                        {SORTED_LANGUAGES.map((key) => {
                          const lang = LANGUAGES[key];
                          const isSelected = selectedLang === lang.id;

                          return (
                            <button
                              key={lang.id}
                              onClick={() => setSelectedLang(lang.id)}
                              aria-pressed={isSelected}
                              aria-label={lang.name}
                              className={`relative aspect-square p-1 sm:p-2 border-2 transition-all duration-200 rounded-xl flex flex-col items-center justify-center
                                ${isSelected
                                  ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 border-amber-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.6)] scale-105 font-bold'
                                  : 'bg-slate-950/60 border-slate-800 text-cyan-300 hover:border-cyan-500 hover:bg-slate-900/80 hover:text-white'
                                }`}
                            >
                              {/* Script Sample - Large */}
                              <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-6xl mb-1 lg:mb-2 font-vt323 leading-none ${isSelected ? 'text-slate-950 font-bold' : 'text-cyan-200 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]'}`}>
                                {lang.mappings[0]?.char || 'A'}
                              </div>

                              {/* Language Code - Small */}
                              <div className={`text-[8px] sm:text-[9px] lg:text-xs font-retro tracking-wider ${isSelected ? 'text-slate-950' : 'text-slate-500'}`}>
                                {lang.id.slice(0, 3)}
                              </div>

                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Language Name Display */}
                      <div className="text-center py-3 px-2 bg-slate-950/80 border border-cyan-500/20 rounded-xl">
                        <div className="font-retro text-amber-400 text-[10px] sm:text-sm lg:text-lg uppercase tracking-widest leading-relaxed">
                          ▶ {LANGUAGES[selectedLang].name} ◀
                        </div>
                      </div>
                    </div>

                    {/* Selected Language Info & Controls */}
                    <div className="glass-panel p-3 sm:p-6 rounded-2xl border border-cyan-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] space-y-4 sm:space-y-6">
                      {/* Language Description */}
                      <div className="p-3 sm:p-4 bg-slate-950/40 border border-cyan-500/10 rounded-xl text-center">
                        <p className="text-lg sm:text-xl lg:text-3xl text-slate-200 font-vt323 mb-3 leading-relaxed" dir="ltr">
                          {LANGUAGES[selectedLang].description}
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center opacity-95 mt-3">
                           {LANGUAGES[selectedLang].mappings.slice(0, 8).map(m => (
                             <span key={m.code} className="bg-slate-900/80 border border-cyan-500/10 px-2.5 sm:px-3 lg:px-4 py-1 text-base lg:text-2xl text-cyan-300 rounded-lg shadow-sm">{m.char}</span>
                           ))}
                           <span className="text-slate-500 px-2 py-1 font-retro text-[9px] flex items-center">...</span>
                        </div>
                      </div>

                      {/* Hand Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showHands}
                        className="w-full flex items-center justify-between gap-3 bg-slate-950/40 p-3 sm:p-4 rounded-xl border border-cyan-500/10 hover:bg-slate-900/60 transition duration-200"
                        onClick={() => setShowHands(!showHands)}
                      >
                         <span className="text-cyan-300 font-retro text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-start leading-relaxed">{ui.showHands}</span>
                         <div className={`flex-none w-12 h-6 rounded-full p-1 transition-colors duration-200 ${showHands ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-700'}`} dir="ltr">
                            <div className={`w-4 h-4 bg-slate-950 rounded-full shadow-md transform transition-transform duration-200 ${showHands ? 'translate-x-6' : 'translate-x-0'}`}></div>
                         </div>
                      </button>

                      {/* Lesson Level Selector */}
                      <div className="bg-slate-950/40 p-3 sm:p-4 rounded-xl border border-cyan-500/10">
                         <div className="text-cyan-300 font-retro text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider mb-3">
                            {levelLabels.title}
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                           {lessonOptions.map(({ mode, label }) => (
                             <button
                               key={mode}
                               onClick={() => setLessonMode(mode)}
                               aria-pressed={lessonMode === mode}
                               className={`px-3 py-2 lg:py-3 text-base lg:text-2xl font-vt323 tracking-wide border rounded-lg transition-all ${
                                 lessonMode === mode
                                   ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                                   : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50'
                               }`}
                             >
                               {label}
                             </button>
                           ))}
                         </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 sm:gap-3">
                         <button
                            onClick={startGame}
                            className="flex-1 min-w-0 py-4 lg:py-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-retro text-sm sm:text-lg lg:text-2xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] transform active:scale-[0.98] transition-all rounded-xl"
                          >
                            {ui.start}
                          </button>
                          {multiplayerService.isAvailable && (
                            <button
                              onClick={() => setShowMultiplayer(true)}
                              className="flex-none px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 text-xl lg:text-3xl shadow-lg transform active:scale-[0.98] transition-all rounded-xl"
                              title={ui.multiplayer}
                              aria-label={ui.multiplayer}
                            >
                              ⚔️
                            </button>
                          )}
                          <button
                            onClick={() => setGameState(GameState.LEADERBOARD)}
                            className="flex-none px-4 sm:px-6 lg:px-8 py-4 lg:py-6 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xl lg:text-3xl shadow-lg transform active:scale-[0.98] transition-all rounded-xl"
                            title={ui.leaderboard}
                            aria-label={ui.leaderboard}
                          >
                            🏆
                          </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm lg:text-lg text-slate-500 text-center flex flex-wrap justify-center gap-x-4 gap-y-1 items-center pb-2">
                     <span>{ui.offlineCapable}</span>
                     <span aria-hidden="true">•</span>
                     <button onClick={() => setShowManual(true)} className="underline hover:text-cyan-400 font-retro text-[9px] tracking-wider uppercase transition">
                        {ui.manual}
                     </button>
                  </div>
                </div>
              )}

              {/* GAME OVER VIEW */}
              {gameState === GameState.GAME_OVER && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/95 p-4 sm:p-6 md:p-8 text-center">

                  {/* Title */}
                  <h2 className="text-xl min-[400px]:text-2xl sm:text-4xl md:text-6xl font-retro text-cyan-400 glow-text mb-6 sm:mb-12 leading-relaxed">
                    {ui.sessionComplete}
                  </h2>

                  {/* Stats Panel */}
                  <form
                    className="w-full max-w-2xl bg-slate-800 border-4 border-cyan-600 shadow-[8px_8px_0_rgba(0,0,0,0.5)] p-4 sm:p-8 mb-6 sm:mb-8"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveScore();
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3 sm:gap-8 mb-6 sm:mb-8">
                      <div className="bg-slate-900/50 p-3 sm:p-6 border-2 border-amber-500/50 rounded min-w-0">
                        <p className="text-slate-400 text-base font-vt323 uppercase mb-2">{ui.score}</p>
                        <p className="text-2xl sm:text-4xl md:text-6xl text-amber-400 font-retro tabular-nums">{stats.score}</p>
                      </div>
                      <div className="bg-slate-900/50 p-3 sm:p-6 border-2 border-cyan-500/50 rounded min-w-0">
                        <p className="text-slate-400 text-base font-vt323 uppercase mb-2">{ui.wpm}</p>
                        <p className="text-2xl sm:text-4xl md:text-6xl text-cyan-400 font-retro tabular-nums">{stats.wpm}</p>
                      </div>
                    </div>

                    {/* Initials Input */}
                    <div className="border-t-2 border-slate-700 pt-4 sm:pt-6">
                       <label htmlFor="initials" className="block text-cyan-300 font-vt323 text-lg uppercase mb-3 sm:mb-4 tracking-wider">{ui.enterInitials}</label>
                       <input
                         id="initials"
                         autoFocus
                         maxLength={3}
                         value={playerName}
                         onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                         className="bg-black text-amber-400 font-retro text-2xl sm:text-3xl text-center w-44 sm:w-56 px-4 sm:px-6 py-3 sm:py-4 tracking-[0.3em] border-4 border-amber-600 focus:outline-none focus:border-amber-400 focus:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all"
                         placeholder="___"
                         autoComplete="off"
                         dir="ltr"
                       />
                    </div>
                  </form>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                    <button
                      onClick={saveScore}
                      disabled={!playerName}
                      className="px-5 sm:px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-retro text-xs sm:text-lg shadow-[4px_4px_0_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-none disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0_rgba(0,0,0,0.8)] transition-all"
                    >
                      {ui.save}
                    </button>
                    <button
                      onClick={startGame}
                      className="px-5 sm:px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-retro text-xs sm:text-lg shadow-[4px_4px_0_rgba(0,0,0,0.8)] active:translate-y-1 active:shadow-none transition-all"
                    >
                      {ui.skip}
                    </button>
                    <button
                      onClick={toMenu}
                      className="px-5 sm:px-8 py-3 border-2 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 font-retro text-xs sm:text-lg shadow-[4px_4px_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                    >
                      {ui.backToMenu}
                    </button>
                  </div>
                </div>
              )}

              {/* LEADERBOARD VIEW */}
              {gameState === GameState.LEADERBOARD && (
                <Leaderboard
                  entries={leaderboard}
                  currentLanguage={selectedLang}
                  uiLanguage={uiLang}
                  onClose={toMenu}
                />
              )}
            </div>
         </div>
       )}

       {/* Multiplayer Connection Dialog */}
       {showMultiplayer && (
         <Suspense fallback={null}>
           <MultiplayerDialog
             uiLanguage={uiLang}
             language={selectedLang}
             lessonMode={lessonMode}
             playerName={mpName}
             initialRoomId={pendingRoom}
             onPlayerNameChange={setMpName}
             onClose={() => {
               setShowMultiplayer(false);
               setPendingRoom(undefined);
               multiplayerService.cleanup();
             }}
             onMatchStart={handleMatchStart}
           />
         </Suspense>
       )}
     </div>
  );
};

export default App;
