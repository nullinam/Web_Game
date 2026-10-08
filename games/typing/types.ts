
export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  LEADERBOARD,
  VICTORY
}

export enum Language {
  KOREAN = 'KOREAN',
  RUSSIAN = 'RUSSIAN',
  UKRAINIAN = 'UKRAINIAN',
  JAPANESE_KANA = 'JAPANESE_KANA',
  CHINESE_BOPOMOFO = 'CHINESE_BOPOMOFO',
  ENGLISH = 'ENGLISH',
  SPANISH = 'SPANISH',
  FRENCH = 'FRENCH',
  GERMAN = 'GERMAN',
  ITALIAN = 'ITALIAN',
  PORTUGUESE = 'PORTUGUESE',
  TURKISH = 'TURKISH',
  ARABIC = 'ARABIC',
  HEBREW = 'HEBREW'
}

export enum InterfaceLanguage {
  ENGLISH = 'EN',
  SPANISH = 'ES',
  FRENCH = 'FR',
  GERMAN = 'DE',
  ITALIAN = 'IT',
  PORTUGUESE = 'PT',
  RUSSIAN = 'RU',
  KOREAN = 'KO',
  JAPANESE = 'JA',
  CHINESE = 'ZH',
  ARABIC = 'AR',
  HEBREW = 'HE'
}

export type LessonMode = 'all' | 'home' | 'no-shift';

export interface KeyMapping {
  code: string; // DOM Level 3 code (e.g., 'KeyQ')
  char: string; // The target character (e.g., 'ㅂ')
  label: string; // Display label on keyboard (e.g., 'Q')
  shiftChar?: string; // Character produced when shift is held
}

export interface LanguageConfig {
  id: Language;
  name: string;
  description: string;
  mappings: KeyMapping[];
  sampleWords: string[];
  isRTL?: boolean;
}

export interface WordObject {
  id: string;
  text: string; // The full text to type (for Korean, this becomes the decomposed Jamo sequence)
  display: string; // The original text for display (e.g. the full Hangul block)
  typed: string; // The part correctly typed so far
  isCompleted: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  wpm: number;
  date: number;
  languageId: Language;
}

export interface ManualContent {
  welcomeTitle: string;
  welcomeText: string;
  howToPlayTitle: string;
  howToPlaySteps: string[];
  tipsTitle: string;
  tipsSteps: string[];
  footerInfo: string;
}
